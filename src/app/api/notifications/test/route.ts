import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { sendNotificationToUser } from "@/lib/push-notification"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate Limit: Maksimal 5 tes per menit per pengguna
    const limit = checkRateLimit(`test-notif:${session.user.id}`, 5, 60_000)
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan uji coba notifikasi. Harap tunggu 1 menit." },
        { status: 429 }
      )
    }

    const roleName = (session.user as any).role || "PENGGUNA"

    const notification = await sendNotificationToUser(session.user.id, {
      title: "Uji Notifikasi joelmengemudi Berhasil! 🚗",
      message: `Halo ${session.user.name || "Pengguna"}, perangkat Anda berhasil terhubung dengan sistem notifikasi ${roleName}.`,
      type: "SYSTEM",
      link: "/",
    })

    return NextResponse.json({
      success: true,
      message: "Notifikasi uji coba berhasil dikirim ke perangkat Anda!",
      notification,
    })
  } catch (error) {
    console.error("POST /api/notifications/test error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
