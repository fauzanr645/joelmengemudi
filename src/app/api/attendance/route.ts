import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { sendNotificationToUser } from "@/lib/push-notification"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = (session.user as any).role
    if (userRole !== "INSTRUCTOR") {
      return NextResponse.json({ error: "Hanya Instruktur yang dapat mengisi presensi dan evaluasi" }, { status: 403 })
    }

    const body = await request.json()

    // Verifikasi kepemilikan jadwal: instruktur hanya boleh menilai jadwal miliknya sendiri
    const schedule = await prisma.schedule.findUnique({
      where: { id: body.scheduleId },
      include: {
        enrollment: true,
        instructor: { select: { name: true } },
      },
    })

    if (!schedule) {
      return NextResponse.json({ error: "Jadwal tidak ditemukan" }, { status: 404 })
    }

    if (schedule.instructorId !== session.user.id) {
      return NextResponse.json({ error: "Akses ditolak: Anda bukan instruktur yang ditugaskan pada sesi ini" }, { status: 403 })
    }

    const targetStudentId = schedule.enrollment.studentId
    
    // Check if attendance exists
    const existing = await prisma.attendance.findUnique({
      where: { scheduleId: body.scheduleId },
    })

    let attendanceRecord

    if (existing) {
      attendanceRecord = await prisma.attendance.update({
        where: { scheduleId: body.scheduleId },
        data: {
          isPresent: body.isPresent,
          score: body.score !== undefined ? Number(body.score) : existing.score,
          feedback: body.feedback,
        },
      })
    } else {
      attendanceRecord = await prisma.attendance.create({
        data: {
          scheduleId: body.scheduleId,
          studentId: targetStudentId,
          isPresent: body.isPresent,
          score: body.score !== undefined ? Number(body.score) : null,
          feedback: body.feedback,
        },
      })
    }

    // Update schedule status to COMPLETED if present
    if (body.isPresent) {
      await prisma.schedule.update({
        where: { id: body.scheduleId },
        data: { status: "COMPLETED" },
      })

      // Kirim notifikasi ke siswa bahwa sesi telah selesai & dievaluasi
      try {
        await sendNotificationToUser(targetStudentId, {
          title: "Sesi Latihan Mengemudi Selesai 🎯",
          message: `Instruktur ${schedule.instructor.name} telah menyelesaikan sesi latihan Anda.${
            body.score !== undefined ? ` Nilai performa: ${body.score}/100.` : ""
          } ${body.feedback ? `Catatan: "${body.feedback}"` : ""}`,
          type: "SCHEDULE",
          link: "/student/schedules",
        })
      } catch (notifErr) {
        console.warn("Failed to dispatch attendance notification:", notifErr)
      }
    }

    return NextResponse.json(attendanceRecord, { status: existing ? 200 : 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
