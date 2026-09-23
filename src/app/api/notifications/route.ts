import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.notification.count({
        where: { userId: session.user.id, isRead: false },
      }),
    ])

    return NextResponse.json({
      notifications,
      unreadCount,
    })
  } catch (error) {
    console.error("GET /api/notifications error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    if (body.all) {
      // Mark all as read for current user
      await prisma.notification.updateMany({
        where: { userId: session.user.id, isRead: false },
        data: { isRead: true },
      })
      return NextResponse.json({ success: true, message: "Semua notifikasi ditandai dibaca" })
    }

    if (body.id) {
      // Mark single notification as read
      await prisma.notification.updateMany({
        where: { id: body.id, userId: session.user.id },
        data: { isRead: true },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Parameter tidak valid" }, { status: 400 })
  } catch (error) {
    console.error("PUT /api/notifications error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const clearRead = searchParams.get("clearRead")

    if (clearRead === "true") {
      await prisma.notification.deleteMany({
        where: { userId: session.user.id, isRead: true },
      })
      return NextResponse.json({ success: true, message: "Notifikasi terbaca dibersihkan" })
    }

    if (id) {
      await prisma.notification.deleteMany({
        where: { id, userId: session.user.id },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Parameter tidak valid" }, { status: 400 })
  } catch (error) {
    console.error("DELETE /api/notifications error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
