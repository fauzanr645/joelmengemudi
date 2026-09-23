import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const branches = await prisma.branch.findMany({
      include: {
        _count: {
          select: {
            users: true,
            courses: true,
            vehicles: true,
            enrollments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(branches)
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const branch = await prisma.branch.create({
      data: {
        name: body.name,
        address: body.address,
        phone: body.phone,
        email: body.email,
        city: body.city,
      },
    })

    return NextResponse.json(branch, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
