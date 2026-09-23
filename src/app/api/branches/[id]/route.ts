import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        users: { select: { id: true, name: true, role: true, email: true, phone: true, isActive: true } },
        courses: true,
        vehicles: true,
        _count: { select: { enrollments: true } },
      },
    })

    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 })
    }

    return NextResponse.json(branch)
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const branch = await prisma.branch.update({
      where: { id },
      data: {
        name: body.name,
        address: body.address,
        phone: body.phone,
        email: body.email,
        city: body.city,
        isActive: body.isActive,
      },
    })

    return NextResponse.json(branch)
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    await prisma.branch.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ message: "Branch deactivated" })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
