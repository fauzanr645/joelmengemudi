import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { sendNotificationToUser, sendNotificationToRole } from "@/lib/push-notification"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get("branchId")
    const studentId = searchParams.get("studentId")

    const where: any = {}
    if (branchId && branchId !== "ALL") where.branchId = branchId
    if (studentId) where.studentId = studentId

    const userRole = (session.user as any).role
    if (userRole === "CUSTOMER_SERVICE") {
      where.branchId = (session.user as any).branchId
    } else if (userRole === "STUDENT") {
      where.studentId = session.user.id
    } else if (branchId && branchId !== "ALL") {
      where.branchId = branchId
    }

    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, email: true, phone: true } },
        course: true,
        branch: { select: { name: true } },
        schedules: {
          include: {
            instructor: { select: { name: true } },
            vehicle: { select: { brand: true, plateNumber: true } },
            attendance: true,
          },
          orderBy: { date: "asc" },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
            confirmedAt: true,
            bankName: true,
            notes: true,
          },
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { payments: true, schedules: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(enrollments)
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = (session.user as any).role
    if (!["OWNER", "CUSTOMER_SERVICE"].includes(userRole)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const targetBranchId =
      userRole === "CUSTOMER_SERVICE"
        ? (session.user as any).branchId
        : body.branchId || (session.user as any).branchId

    // Fetch Course details to know session count and duration
    const course = await prisma.course.findUnique({
      where: { id: body.courseId },
    })

    if (!course) {
      return NextResponse.json({ error: "Kursus tidak ditemukan" }, { status: 404 })
    }

    // Create Enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: body.studentId,
        courseId: body.courseId,
        branchId: targetBranchId,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        notes: body.notes,
      },
      include: {
        student: { select: { name: true } },
        course: { select: { name: true, price: true, sessions: true, duration: true } },
      },
    })

    // Automatic Schedule Generation Logic
    // Find all active instructors in the branch matching course transmission, along with their dedicated vehicle
    const branchInstructors = await prisma.user.findMany({
      where: {
        role: "INSTRUCTOR",
        branchId: targetBranchId,
        isActive: true,
        ...(course.courseType === "MANUAL"
          ? { specialization: { in: ["MANUAL", "BOTH"] } }
          : course.courseType === "AUTOMATIC"
          ? { specialization: { in: ["AUTOMATIC", "BOTH"] } }
          : {}),
      },
      include: {
        assignedVehicle: true,
      },
    })

    // Timing calculations
    const hoursPerSession = Math.max(1, Math.round(course.duration / course.sessions))
    const startHourNum = parseInt((body.startTime || "08:00").split(":")[0], 10)
    const endHourNum = startHourNum + hoursPerSession
    const startTimeStr = `${startHourNum.toString().padStart(2, "0")}:00`
    const endTimeStr = `${endHourNum.toString().padStart(2, "0")}:00`

    const intervalDays = body.intervalDays ? parseInt(body.intervalDays, 10) : 2
    const baseStartDate = new Date(body.startDate)

    const isOverlapping = (start1: string, end1: string, start2: string, end2: string) => {
      return start1 < end2 && end1 > start2
    }

    const schedulesToCreate = []

    for (let i = 0; i < course.sessions; i++) {
      const sessionDate = new Date(baseStartDate.getTime() + i * intervalDays * 86400000)
      const startOfDay = new Date(sessionDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(sessionDate)
      endOfDay.setHours(23, 59, 59, 999)

      // Get all existing schedules on this day
      const existingDaySchedules = await prisma.schedule.findMany({
        where: {
          branchId: targetBranchId,
          date: { gte: startOfDay, lte: endOfDay },
          status: { not: "CANCELLED" },
        },
      })

      // Pick non-conflicting instructor
      let selectedInstructor = null
      if (body.instructorId) {
        const preferred = branchInstructors.find(inst => inst.id === body.instructorId)
        const hasConflict = preferred && existingDaySchedules.some(
          s => s.instructorId === preferred.id && isOverlapping(startTimeStr, endTimeStr, s.startTime, s.endTime)
        )
        if (preferred && !hasConflict) {
          selectedInstructor = preferred
        }
      }

      if (!selectedInstructor) {
        selectedInstructor = branchInstructors.find(inst =>
          !existingDaySchedules.some(s => s.instructorId === inst.id && isOverlapping(startTimeStr, endTimeStr, s.startTime, s.endTime))
        ) || branchInstructors[0]
      }

      // The vehicle is strictly the selected instructor's dedicated vehicle!
      const dedicatedVehicleId = selectedInstructor?.assignedVehicle?.id || null

      let lessonType: "THEORY" | "PRACTICE" | "EXAM" = "PRACTICE"
      if (course.sessions > 1 && i === 0) {
        lessonType = "THEORY"
      } else if (i === course.sessions - 1) {
        lessonType = "EXAM"
      }

      if (selectedInstructor) {
        schedulesToCreate.push({
          enrollmentId: enrollment.id,
          instructorId: selectedInstructor.id,
          courseId: course.id,
          branchId: targetBranchId,
          vehicleId: dedicatedVehicleId,
          date: sessionDate,
          startTime: startTimeStr,
          endTime: endTimeStr,
          lessonType,
          status: "SCHEDULED" as const,
          notes: `Sesi ${i + 1} dari ${course.sessions} (${hoursPerSession} Jam Latihan)`,
        })
      }
    }

    if (schedulesToCreate.length > 0) {
      await prisma.schedule.createMany({
        data: schedulesToCreate,
      })
    }

    // Automatically create SimApplication if the course package includes SIM
    if (course.name.toUpperCase().includes("SIM")) {
      const existingSim = await prisma.simApplication.findFirst({
        where: { studentId: body.studentId, simType: "SIM_A" },
      })
      if (!existingSim) {
        const studentUser = await prisma.user.findUnique({ where: { id: body.studentId } })
        if (studentUser) {
          await prisma.simApplication.create({
            data: {
              simType: "SIM_A",
              price: 0,
              fullName: studentUser.name,
              phone: studentUser.phone || "",
              address: studentUser.address || null,
              status: "SUBMITTED",
              paymentStatus: "CONFIRMED",
              notes: `Termasuk dalam paket kursus: ${course.name}`,
              studentId: body.studentId,
              branchId: targetBranchId,
            },
          })
        }
      }
    }

    // Kirim notifikasi penting ke Perangkat Siswa, Instruktur, dan Owner
    try {
      // 1. Notif ke Siswa
      await sendNotificationToUser(body.studentId, {
        title: "Pendaftaran Kursus Dikonfirmasi! 🚗",
        message: `Selamat! Anda resmi terdaftar pada ${course.name}. ${course.sessions} sesi jadwal latihan Anda telah disusun.`,
        type: "ENROLLMENT",
        link: "/student/schedules",
      })

      // 2. Notif ke Instruktur yang ditugaskan
      const assignedInstructors = Array.from(new Set(schedulesToCreate.map((s) => s.instructorId)))
      for (const instId of assignedInstructors) {
        await sendNotificationToUser(instId, {
          title: "Siswa Baru & Jadwal Latihan Ditugaskan",
          message: `Anda ditugaskan mendampingi siswa ${enrollment.student.name} untuk kursus ${course.name}.`,
          type: "SCHEDULE",
          link: "/instructor/schedules",
        })
      }

      // 3. Notif ke Owner
      await sendNotificationToRole("OWNER", null, {
        title: "Pendaftaran Siswa Baru Masuk",
        message: `${enrollment.student.name} mendaftar paket ${course.name}.`,
        type: "ENROLLMENT",
        link: "/owner/students",
      })
    } catch (notifErr) {
      console.warn("Failed to dispatch enrollment notification:", notifErr)
    }

    return NextResponse.json(enrollment, { status: 201 })
  } catch (error) {
    console.error("Error creating enrollment:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
