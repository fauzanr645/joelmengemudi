import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { sendNotificationToUser, sendNotificationToRole } from "@/lib/push-notification"
import { formatDate } from "@/lib/utils"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const application = await prisma.simApplication.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, name: true, email: true, phone: true } },
        branch: { select: { id: true, name: true, city: true } },
      },
    })

    if (!application) {
      return NextResponse.json({ error: "Pengajuan SIM tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json(application)
  } catch (error) {
    console.error("Error fetching SIM application detail:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(
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
    const userRole = (session.user as any).role

    const existing = await prisma.simApplication.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: "Pengajuan SIM tidak ditemukan" }, { status: 404 })
    }

    const updateData: any = {}

    // Student updates: can upload payment proof or change contact
    if (userRole === "STUDENT") {
      if (existing.studentId !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }

      if (body.transferProof !== undefined) {
        updateData.transferProof = body.transferProof
        updateData.paymentStatus = "PENDING"
      }
      if (body.bankName !== undefined) updateData.bankName = body.bankName
      if (body.accountName !== undefined) updateData.accountName = body.accountName
      if (body.accountNumber !== undefined) updateData.accountNumber = body.accountNumber
      if (body.fullName !== undefined) updateData.fullName = body.fullName
      if (body.nik !== undefined) updateData.nik = body.nik
      if (body.phone !== undefined) updateData.phone = body.phone
      if (body.address !== undefined) updateData.address = body.address
      if (body.ktpPhoto !== undefined) updateData.ktpPhoto = body.ktpPhoto
      if (body.medicalDoc !== undefined) updateData.medicalDoc = body.medicalDoc
    }

    // CS & Owner updates: can verify, schedule satpas, confirm payment, complete, or reject
    if (userRole === "CUSTOMER_SERVICE" || userRole === "OWNER") {
      if (body.status !== undefined) updateData.status = body.status
      if (body.paymentStatus !== undefined) updateData.paymentStatus = body.paymentStatus
      if (body.satpasDate !== undefined) {
        updateData.satpasDate = body.satpasDate ? new Date(body.satpasDate) : null
      }
      if (body.notes !== undefined) updateData.notes = body.notes
      if (body.rejectionReason !== undefined) updateData.rejectionReason = body.rejectionReason
      if (body.nik !== undefined) updateData.nik = body.nik
      if (body.phone !== undefined) updateData.phone = body.phone
      if (body.fullName !== undefined) updateData.fullName = body.fullName
      if (body.transferProof !== undefined) updateData.transferProof = body.transferProof
    }

    const updated = await prisma.simApplication.update({
      where: { id },
      data: updateData,
      include: {
        student: { select: { id: true, name: true, phone: true } },
        branch: { select: { name: true } },
      },
    })

    // Kirim notifikasi penting ke perangkat
    try {
      if (userRole === "STUDENT" && body.transferProof) {
        // Notif ke CS Cabang bahwa siswa mengirim bukti transfer
        await sendNotificationToRole("CUSTOMER_SERVICE", existing.branchId, {
          title: "Bukti Transfer Layanan SIM Masuk 💳",
          message: `Siswa ${updated.fullName} mengirimkan bukti pembayaran untuk layanan ${updated.simType === "SIM_A" ? "SIM A" : "SIM C"}.`,
          type: "SIM_SERVICE",
          link: "/cs/sim-services",
        })
      }

      if (userRole === "CUSTOMER_SERVICE" || userRole === "OWNER") {
        if (body.status === "SCHEDULED_SATPAS" && updated.satpasDate) {
          await sendNotificationToUser(updated.studentId, {
            title: "Jadwal Ujian Satpas Ditetapkan! 📅",
            message: `Jadwal keberangkatan ke Satpas Polresta Anda ditetapkan pada tanggal ${formatDate(updated.satpasDate)}. Harap hadir di cabang tepat waktu.`,
            type: "SIM_SERVICE",
            link: "/student/sim-services",
          })
        } else if (body.status === "VERIFIED") {
          await sendNotificationToUser(updated.studentId, {
            title: "Berkas Pengajuan SIM Diverifikasi Lengkap ✅",
            message: `Customer Service telah memverifikasi kelengkapan berkas Anda. Menunggu jadwal pelaksanaan di Satpas.`,
            type: "SIM_SERVICE",
            link: "/student/sim-services",
          })
        } else if (body.status === "COMPLETED") {
          await sendNotificationToUser(updated.studentId, {
            title: "Selamat! SIM Resmi Anda Telah Selesai Dicetak! 🏆",
            message: `SIM resmi Anda telah selesai diproses. Silakan koordinasi dengan Customer Service cabang untuk pengambilan fisik SIM.`,
            type: "SIM_SERVICE",
            link: "/student/sim-services",
          })
        } else if (body.status === "REJECTED") {
          await sendNotificationToUser(updated.studentId, {
            title: "Berkas Pengajuan SIM Perlu Perbaikan ⚠️",
            message: `Pengajuan SIM belum disetujui: ${updated.rejectionReason || "Dokumen belum lengkap"}. Silakan perbaiki melalui aplikasi.`,
            type: "SIM_SERVICE",
            link: "/student/sim-services",
          })
        }
      }
    } catch (notifErr) {
      console.warn("Failed to dispatch SIM update notification:", notifErr)
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating SIM application:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = (session.user as any).role
    if (userRole !== "OWNER" && userRole !== "CUSTOMER_SERVICE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { id } = await params
    await prisma.simApplication.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Pengajuan SIM berhasil dihapus" })
  } catch (error) {
    console.error("Error deleting SIM application:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
