import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

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
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        branch: { select: { id: true, name: true, city: true } },
        _count: { select: { enrollments: true, schedules: true } },
      },
    })

    if (!course) {
      return NextResponse.json({ error: "Paket kursus tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json(course)
  } catch (error) {
    console.error("Error fetching course detail:", error)
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

    const userRole = (session.user as any).role
    if (!["OWNER", "CUSTOMER_SERVICE"].includes(userRole)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name.trim()
    if (body.description !== undefined) updateData.description = body.description ? body.description.trim() : null
    if (body.courseType !== undefined) updateData.courseType = body.courseType
    if (body.duration !== undefined) updateData.duration = Number(body.duration)
    if (body.sessions !== undefined) updateData.sessions = Number(body.sessions)
    if (body.price !== undefined) updateData.price = Number(body.price)
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive)
    if (body.branchId !== undefined && userRole === "OWNER") updateData.branchId = body.branchId

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: updateData,
      include: {
        branch: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(updatedCourse)
  } catch (error) {
    console.error("Error updating course:", error)
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
    if (userRole !== "OWNER") {
      return NextResponse.json({ error: "Hanya Owner yang dapat menghapus paket kursus" }, { status: 403 })
    }

    const { id } = await params
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        _count: { select: { enrollments: true } },
      },
    })

    if (!course) {
      return NextResponse.json({ error: "Paket kursus tidak ditemukan" }, { status: 404 })
    }

    // If already has student enrollments, soft-delete by setting isActive = false
    if (course._count.enrollments > 0) {
      const updated = await prisma.course.update({
        where: { id },
        data: { isActive: false },
      })
      return NextResponse.json({
        message: "Paket kursus memiliki riwayat siswa, status diubah menjadi Nonaktif.",
        course: updated,
      })
    }

    // If no enrollments, safe to delete
    await prisma.course.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Paket kursus berhasil dihapus." })
  } catch (error) {
    console.error("Error deleting course:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
