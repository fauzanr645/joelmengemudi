import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { sendNotificationToUser, sendNotificationToRole } from "@/lib/push-notification"
import { formatCurrency } from "@/lib/utils"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, name: true, email: true, phone: true } },
        enrollment: {
          include: {
            course: true,
            branch: { select: { name: true } },
          },
        },
      },
    })

    if (!payment) {
      return NextResponse.json({ error: "Data pembayaran tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json(payment)
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = (session.user as any).role
    const { id } = await params
    const body = await request.json()

    const existingPayment = await prisma.payment.findUnique({
      where: { id },
      include: { enrollment: true },
    })

    if (!existingPayment) {
      return NextResponse.json({ error: "Data pembayaran tidak ditemukan" }, { status: 404 })
    }

    // 1. Jika pengguna adalah SISWA (Membayar tagihan / mengunggah bukti transfer)
    if (userRole === "STUDENT") {
      if (existingPayment.studentId !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }

      const updateData: any = {}
      if (body.transferProof !== undefined) updateData.transferProof = body.transferProof
      if (body.bankName !== undefined) updateData.bankName = body.bankName
      if (body.accountName !== undefined) updateData.accountName = body.accountName
      if (body.accountNumber !== undefined) updateData.accountNumber = body.accountNumber
      if (body.amount !== undefined) updateData.amount = Number(body.amount)
      if (body.notes !== undefined) updateData.notes = body.notes

      // Pastikan status tetap PENDING menunggu verifikasi CS
      updateData.status = "PENDING"
      updateData.rejectionReason = null

      const updated = await prisma.payment.update({
        where: { id },
        data: updateData,
        include: { student: { select: { name: true } }, enrollment: true },
      })

      // Notifikasi ke CS Cabang & Owner bahwa ada bukti transfer masuk
      try {
        await sendNotificationToRole("CUSTOMER_SERVICE", existingPayment.enrollment.branchId, {
          title: "Bukti Transfer Pembayaran Masuk 💳",
          message: `Siswa ${updated.student.name} mengunggah bukti transfer sebesar ${formatCurrency(updated.amount)}. Menunggu verifikasi.`,
          type: "PAYMENT",
          link: "/cs/payments",
        })
        await sendNotificationToRole("OWNER", null, {
          title: "Pembayaran Kursus Masuk",
          message: `Pembayaran ${formatCurrency(updated.amount)} dari ${updated.student.name} menunggu konfirmasi CS.`,
          type: "PAYMENT",
          link: "/owner",
        })
      } catch (notifErr) {
        console.warn("Failed to send payment submission notification:", notifErr)
      }

      return NextResponse.json(updated)
    }

    // 2. Jika pengguna adalah CS atau OWNER (Verifikasi, Tolak, atau Update Tagihan)
    if (["OWNER", "CUSTOMER_SERVICE"].includes(userRole)) {
      const updateData: any = {}

      if (body.status !== undefined) {
        updateData.status = body.status
        if (body.status === "CONFIRMED") {
          updateData.confirmedBy = session.user.id
          updateData.confirmedAt = new Date()
          updateData.rejectionReason = null
        } else if (body.status === "REJECTED") {
          updateData.rejectionReason = body.rejectionReason || "Bukti transfer tidak valid"
        }
      }

      // CS bisa mengubah detail tagihan sebelum dibayar
      if (body.amount !== undefined) updateData.amount = Number(body.amount)
      if (body.notes !== undefined) updateData.notes = body.notes
      if (body.bankName !== undefined) updateData.bankName = body.bankName

      const updated = await prisma.payment.update({
        where: { id },
        data: updateData,
        include: { student: { select: { id: true, name: true } } },
      })

      // Notifikasi ke Siswa & Owner saat pembayaran diverifikasi atau ditolak
      try {
        if (body.status === "CONFIRMED") {
          await sendNotificationToUser(existingPayment.studentId, {
            title: "Pembayaran Anda Dikonfirmasi! ✅",
            message: `Pembayaran sebesar ${formatCurrency(updated.amount)} telah resmi diverifikasi oleh Customer Service. Terima kasih!`,
            type: "PAYMENT",
            link: "/student/payments",
          })
          if (userRole === "CUSTOMER_SERVICE") {
            await sendNotificationToRole("OWNER", null, {
              title: "Kas Masuk: Pembayaran Dikonfirmasi",
              message: `Pembayaran ${formatCurrency(updated.amount)} siswa ${updated.student.name} dikonfirmasi oleh CS.`,
              type: "PAYMENT",
              link: "/owner",
            })
          }
        } else if (body.status === "REJECTED") {
          await sendNotificationToUser(existingPayment.studentId, {
            title: "Pembayaran Perlu Perbaikan ⚠️",
            message: `Bukti transfer Anda belum disetujui: ${updated.rejectionReason}. Silakan kirim ulang bukti transfer yang jelas.`,
            type: "PAYMENT",
            link: "/student/payments",
          })
        }
      } catch (notifErr) {
        console.warn("Failed to send payment status notification:", notifErr)
      }

      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  } catch (error) {
    console.error("Error updating payment:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = (session.user as any).role
    if (!["OWNER", "CUSTOMER_SERVICE"].includes(userRole)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { id } = await params
    await prisma.payment.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: "Tagihan berhasil dihapus" })
  } catch (error) {
    console.error("Error deleting payment:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
