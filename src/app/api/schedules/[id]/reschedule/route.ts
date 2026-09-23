import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { sendNotificationToUser, sendNotificationToRole } from "@/lib/push-notification"
import { formatDate } from "@/lib/utils"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const role = (session.user as any).role

    const schedule = await prisma.schedule.findUnique({
      where: { id },
      include: { enrollment: true },
    })

    if (!schedule) {
      return NextResponse.json({ error: "Jadwal tidak ditemukan" }, { status: 404 })
    }

    // Permission check
    if (role === "STUDENT" && schedule.enrollment.studentId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (role === "INSTRUCTOR" && schedule.instructorId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const requestedDate = new Date(body.requestedDate)
    const requestedStartTime = body.requestedStartTime || "08:00"
    const requestedEndTime = body.requestedEndTime || "10:00"

    const updated = await prisma.schedule.update({
      where: { id },
      data: {
        rescheduleStatus: "PENDING",
        rescheduleRequestedBy: role,
        requestedDate,
        requestedStartTime,
        requestedEndTime,
        rescheduleReason: body.reason || null,
        rescheduleRejectionReason: null,
      },
      include: {
        enrollment: { include: { student: { select: { id: true, name: true } } } },
        instructor: { select: { id: true, name: true } },
      },
    })

    // Kirim notifikasi pengajuan ubah jadwal
    try {
      if (role === "STUDENT") {
        await sendNotificationToRole("CUSTOMER_SERVICE", schedule.branchId, {
          title: "Pengajuan Ubah Jadwal dari Siswa 📅",
          message: `Siswa ${updated.enrollment.student.name} mengajukan reschedule ke tanggal ${formatDate(requestedDate)} jam ${requestedStartTime}.`,
          type: "RESCHEDULE",
          link: "/cs/schedules",
        })
        await sendNotificationToUser(updated.instructorId, {
          title: "Siswa Mengajukan Ubah Jadwal",
          message: `Siswa ${updated.enrollment.student.name} meminta pindah jadwal latihan. Menunggu verifikasi CS.`,
          type: "RESCHEDULE",
          link: "/instructor/schedules",
        })
      } else if (role === "INSTRUCTOR") {
        await sendNotificationToRole("CUSTOMER_SERVICE", schedule.branchId, {
          title: "Pengajuan Ubah Jadwal dari Instruktur",
          message: `Instruktur ${updated.instructor.name} mengajukan reschedule untuk siswa ${updated.enrollment.student.name}.`,
          type: "RESCHEDULE",
          link: "/cs/schedules",
        })
        await sendNotificationToUser(updated.enrollment.studentId, {
          title: "Pemberitahuan Jadwal Latihan",
          message: `Instruktur Anda mengajukan penyesuaian jadwal latihan. Sedang dikoordinasikan oleh Customer Service.`,
          type: "RESCHEDULE",
          link: "/student/schedules",
        })
      }
    } catch (notifErr) {
      console.warn("Failed to dispatch reschedule request notification:", notifErr)
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error requesting reschedule:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const role = (session.user as any).role
    if (!["OWNER", "CUSTOMER_SERVICE"].includes(role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { action, rejectionReason, instructorId, vehicleId } = body

    const schedule = await prisma.schedule.findUnique({
      where: { id },
      include: {
        instructor: { select: { name: true } },
        vehicle: { select: { brand: true, plateNumber: true } },
        enrollment: { include: { student: { select: { name: true } } } },
      },
    })

    if (!schedule) {
      return NextResponse.json({ error: "Jadwal tidak ditemukan" }, { status: 404 })
    }

    if (action === "REJECT") {
      const updated = await prisma.schedule.update({
        where: { id },
        data: {
          rescheduleStatus: "REJECTED",
          rescheduleRejectionReason: rejectionReason || "Ditolak oleh Customer Service",
        },
      })

      try {
        await sendNotificationToUser(schedule.enrollment.studentId, {
          title: "Pengajuan Ubah Jadwal Belum Disetujui ⚠️",
          message: `Permintaan reschedule belum disetujui: ${rejectionReason || "Waktu atau instruktur tidak tersedia"}.`,
          type: "RESCHEDULE",
          link: "/student/schedules",
        })
        await sendNotificationToUser(schedule.instructorId, {
          title: "Pengajuan Ubah Jadwal Ditolak",
          message: `Permintaan reschedule untuk siswa ${schedule.enrollment.student.name} tidak disetujui CS.`,
          type: "RESCHEDULE",
          link: "/instructor/schedules",
        })
      } catch (notifErr) {
        console.warn("Failed to dispatch reschedule reject notification:", notifErr)
      }

      return NextResponse.json(updated)
    }

    if (action === "APPROVE") {
      const targetDate = body.requestedDate ? new Date(body.requestedDate) : (schedule.requestedDate || schedule.date)
      const targetStartTime = body.requestedStartTime || schedule.requestedStartTime || schedule.startTime
      const targetEndTime = body.requestedEndTime || schedule.requestedEndTime || schedule.endTime
      const targetInstructorId = instructorId || schedule.instructorId

      // Vehicle is strictly the instructor's dedicated vehicle
      const targetInstructor = await prisma.user.findUnique({
        where: { id: targetInstructorId },
        include: { assignedVehicle: true },
      })
      const targetVehicleId = targetInstructor?.assignedVehicle?.id || schedule.vehicleId

      const startOfDay = new Date(targetDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(targetDate)
      endOfDay.setHours(23, 59, 59, 999)

      const isOverlapping = (start1: string, end1: string, start2: string, end2: string) => {
        return start1 < end2 && end1 > start2
      }

      // Check Instructor Conflict
      if (targetInstructorId) {
        const instConflicts = await prisma.schedule.findMany({
          where: {
            id: { not: id },
            instructorId: targetInstructorId,
            date: { gte: startOfDay, lte: endOfDay },
            status: { not: "CANCELLED" },
          },
          include: {
            instructor: { select: { name: true } },
            enrollment: { include: { student: { select: { name: true } } } },
          },
        })

        const instOverlap = instConflicts.find(s => isOverlapping(targetStartTime, targetEndTime, s.startTime, s.endTime))
        if (instOverlap) {
          return NextResponse.json(
            {
              error: `Tidak dapat menyetujui! Instruktur ${instOverlap.instructor.name} sudah ada jadwal dengan siswa ${instOverlap.enrollment.student.name} pada jam ${instOverlap.startTime} - ${instOverlap.endTime}. Pilih instruktur lain atau ubah jam/tanggal.`,
            },
            { status: 400 }
          )
        }
      }

      // Check Vehicle Conflict
      if (targetVehicleId) {
        const vehConflicts = await prisma.schedule.findMany({
          where: {
            id: { not: id },
            vehicleId: targetVehicleId,
            date: { gte: startOfDay, lte: endOfDay },
            status: { not: "CANCELLED" },
          },
          include: {
            vehicle: { select: { brand: true, plateNumber: true } },
          },
        })

        const vehOverlap = vehConflicts.find(s => isOverlapping(targetStartTime, targetEndTime, s.startTime, s.endTime))
        if (vehOverlap) {
          return NextResponse.json(
            {
              error: `Tidak dapat menyetujui! Kendaraan ${vehOverlap.vehicle?.brand} (${vehOverlap.vehicle?.plateNumber}) sedang digunakan pada jam ${vehOverlap.startTime} - ${vehOverlap.endTime}. Pilih kendaraan lain.`,
            },
            { status: 400 }
          )
        }
      }

      const updated = await prisma.schedule.update({
        where: { id },
        data: {
          date: targetDate,
          startTime: targetStartTime,
          endTime: targetEndTime,
          instructorId: targetInstructorId,
          vehicleId: targetVehicleId || null,
          status: "RESCHEDULED",
          rescheduleStatus: "APPROVED",
        },
      })

      try {
        await sendNotificationToUser(schedule.enrollment.studentId, {
          title: "Perubahan Jadwal Latihan Disetujui! 📅",
          message: `Jadwal latihan baru Anda: ${formatDate(targetDate)} jam ${targetStartTime} - ${targetEndTime}. Harap hadir tepat waktu.`,
          type: "RESCHEDULE",
          link: "/student/schedules",
        })
        await sendNotificationToUser(targetInstructorId, {
          title: "Jadwal Latihan Baru Diperbarui 📅",
          message: `Sesi latihan siswa ${schedule.enrollment.student.name} dijadwalkan ulang pada ${formatDate(targetDate)} jam ${targetStartTime} - ${targetEndTime}.`,
          type: "RESCHEDULE",
          link: "/instructor/schedules",
        })
      } catch (notifErr) {
        console.warn("Failed to dispatch reschedule approve notification:", notifErr)
      }

      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: "Aksi tidak valid" }, { status: 400 })
  } catch (error) {
    console.error("Error approving/rejecting reschedule:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
