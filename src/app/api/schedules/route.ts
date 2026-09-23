import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get("branchId")
    const instructorId = searchParams.get("instructorId")
    const enrollmentId = searchParams.get("enrollmentId")
    const allBranches = searchParams.get("allBranches") === "true"
    const dateStr = searchParams.get("date")

    const where: any = {}
    if (branchId && branchId !== "ALL") where.branchId = branchId
    if (instructorId) where.instructorId = instructorId
    if (enrollmentId) where.enrollmentId = enrollmentId

    const userRole = (session.user as any).role
    // Strict branch isolation: CS can ONLY see schedules from their assigned branch
    if (userRole === "CUSTOMER_SERVICE") {
      where.branchId = (session.user as any).branchId
    } else if (userRole === "INSTRUCTOR") {
      where.instructorId = session.user.id
    } else if (userRole === "STUDENT") {
      where.enrollment = { studentId: session.user.id }
    } else if (userRole === "OWNER" && branchId && branchId !== "ALL") {
      where.branchId = branchId
    }

    if (dateStr) {
      const d = new Date(dateStr)
      const startOfDay = new Date(d.setHours(0, 0, 0, 0))
      const endOfDay = new Date(d.setHours(23, 59, 59, 999))
      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      }
    }

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        enrollment: {
          include: { student: { select: { id: true, name: true, phone: true } } },
        },
        instructor: { select: { id: true, name: true, phone: true, specialization: true, branchId: true } },
        course: { select: { name: true, courseType: true, duration: true, sessions: true } },
        vehicle: { select: { id: true, plateNumber: true, brand: true, model: true } },
        branch: { select: { id: true, name: true, city: true } },
        attendance: true,
        rating: true,
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    })

    return NextResponse.json(schedules)
  } catch (error) {
    console.error(error)
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
    const scheduleDate = new Date(body.date)
    const startTime = body.startTime
    const endTime = body.endTime
    const instructorId = body.instructorId

    // Find the instructor's dedicated vehicle automatically
    let resolvedVehicleId = body.vehicleId || null
    if (instructorId) {
      const instructorWithCar = await prisma.user.findUnique({
        where: { id: instructorId },
        include: { assignedVehicle: true },
      })
      if (instructorWithCar?.assignedVehicle) {
        resolvedVehicleId = instructorWithCar.assignedVehicle.id
      }
    }

    // Date bounds for same day query
    const startOfDay = new Date(scheduleDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(scheduleDate)
    endOfDay.setHours(23, 59, 59, 999)

    // Helper to check time overlap
    // Overlap if (newStartTime < existingEndTime) AND (newEndTime > existingStartTime)
    const isOverlapping = (start1: string, end1: string, start2: string, end2: string) => {
      return start1 < end2 && end1 > start2
    }

    // 1. Check Instructor Conflict
    if (instructorId) {
      const existingInstructorSchedules = await prisma.schedule.findMany({
        where: {
          instructorId,
          date: { gte: startOfDay, lte: endOfDay },
          status: { not: "CANCELLED" },
        },
        include: {
          instructor: { select: { name: true } },
          enrollment: { include: { student: { select: { name: true } } } },
        },
      })

      const conflict = existingInstructorSchedules.find(s =>
        isOverlapping(startTime, endTime, s.startTime, s.endTime)
      )

      if (conflict) {
        return NextResponse.json(
          {
            error: `Jadwal Bentrok! Instruktur ${conflict.instructor.name} sudah memiliki jadwal dengan siswa ${conflict.enrollment.student.name} pada jam ${conflict.startTime} - ${conflict.endTime}.`,
          },
          { status: 400 }
        )
      }
    }

    // 2. Check Vehicle Conflict
    if (resolvedVehicleId) {
      const existingVehicleSchedules = await prisma.schedule.findMany({
        where: {
          vehicleId: resolvedVehicleId,
          date: { gte: startOfDay, lte: endOfDay },
          status: { not: "CANCELLED" },
        },
        include: {
          vehicle: { select: { brand: true, plateNumber: true } },
          instructor: { select: { name: true } },
        },
      })

      const vehicleConflict = existingVehicleSchedules.find(s =>
        isOverlapping(startTime, endTime, s.startTime, s.endTime)
      )

      if (vehicleConflict) {
        return NextResponse.json(
          {
            error: `Jadwal Bentrok! Kendaraan ${vehicleConflict.vehicle?.brand} (${vehicleConflict.vehicle?.plateNumber}) sedang digunakan instruktur ${vehicleConflict.instructor.name} pada jam ${vehicleConflict.startTime} - ${vehicleConflict.endTime}.`,
          },
          { status: 400 }
        )
      }
    }

    const schedule = await prisma.schedule.create({
      data: {
        enrollmentId: body.enrollmentId,
        instructorId: body.instructorId,
        courseId: body.courseId,
        branchId: userRole === "CUSTOMER_SERVICE" ? (session.user as any).branchId : (body.branchId || (session.user as any).branchId),
        vehicleId: resolvedVehicleId,
        date: scheduleDate,
        startTime: body.startTime,
        endTime: body.endTime,
        lessonType: body.lessonType,
        notes: body.notes,
      },
    })

    return NextResponse.json(schedule, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
