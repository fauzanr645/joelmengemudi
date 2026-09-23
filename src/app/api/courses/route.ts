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
    const courseType = searchParams.get("courseType")
    const activeOnly = searchParams.get("activeOnly") === "true"

    const where: any = {}
    if (activeOnly) where.isActive = true
    if (courseType) where.courseType = courseType

    const userRole = (session.user as any).role
    if (userRole === "CUSTOMER_SERVICE" || userRole === "INSTRUCTOR") {
      where.branchId = (session.user as any).branchId
    } else if (userRole === "OWNER" && branchId && branchId !== "ALL") {
      where.branchId = branchId
    } else if (branchId && branchId !== "ALL") {
      where.branchId = branchId
    }

    const courses = await prisma.course.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true, city: true } },
        _count: { select: { enrollments: true, schedules: true } },
      },
      orderBy: [{ branchId: "asc" }, { price: "asc" }, { createdAt: "desc" }],
    })

    return NextResponse.json(courses)
  } catch (error) {
    console.error("Error fetching courses:", error)
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

    if (!body.name || !body.price || !body.duration || !body.sessions) {
      return NextResponse.json(
        { error: "Nama paket, harga, durasi jam, dan jumlah sesi wajib diisi." },
        { status: 400 }
      )
    }

    const course = await prisma.course.create({
      data: {
        name: body.name.trim(),
        description: body.description ? body.description.trim() : null,
        courseType: body.courseType || "MANUAL",
        duration: Number(body.duration),
        sessions: Number(body.sessions),
        price: Number(body.price),
        branchId: targetBranchId,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      },
      include: {
        branch: { select: { id: true, name: true, city: true } },
      },
    })

    return NextResponse.json(course, { status: 201 })
  } catch (error) {
    console.error("Error creating course:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
