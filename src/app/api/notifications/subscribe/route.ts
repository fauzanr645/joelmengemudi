import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { endpoint, keys, userAgent } = body

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: "Data subscription Web Push tidak lengkap" },
        { status: 400 }
      )
    }

    // Upsert subscription: update keys jika endpoint sudah ada, atau buat baru
    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: {
        userId: session.user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: userAgent || null,
      },
      update: {
        userId: session.user.id,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: userAgent || null,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: "Perangkat berhasil didaftarkan untuk notifikasi Web Push!",
      subscriptionId: subscription.id,
    })
  } catch (error) {
    console.error("POST /api/notifications/subscribe error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { endpoint } = body

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint tidak disertakan" }, { status: 400 })
    }

    await prisma.pushSubscription.deleteMany({
      where: {
        endpoint,
        userId: session.user.id,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Perangkat berhasil di-unsubscribe dari notifikasi",
    })
  } catch (error) {
    console.error("DELETE /api/notifications/subscribe error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
