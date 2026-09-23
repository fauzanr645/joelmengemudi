import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { hash } from "bcryptjs"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")
    const branchId = searchParams.get("branchId")

    const where: any = {}
    if (role) where.role = role
    if (branchId) where.branchId = branchId

    // CS can only see users in their branch
    const userRole = (session.user as any).role
    if (userRole === "CUSTOMER_SERVICE") {
      where.branchId = (session.user as any).branchId
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        gender: true,
        address: true,
        isActive: true,
        branchId: true,
        branch: { select: { name: true } },
        licenseNumber: true,
        specialization: true,
        createdAt: true,
        assignedVehicle: {
          select: {
            id: true,
            plateNumber: true,
            brand: true,
            model: true,
            year: true,
            transmission: true,
            isActive: true,
          },
        },
        receivedRatings: {
          select: {
            id: true,
            rating: true,
            review: true,
            createdAt: true,
            student: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(users)
  } catch (error) {
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

    // Check if email exists
    const existing = await prisma.user.findUnique({ where: { email: body.email } })
    if (existing) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 })
    }

    const hashedPassword = await hash(body.password, 12)

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        password: hashedPassword,
        role: body.role,
        gender: body.gender,
        address: body.address,
        branchId:
          userRole === "CUSTOMER_SERVICE"
            ? (session.user as any).branchId
            : body.branchId || (session.user as any).branchId,
        licenseNumber: body.licenseNumber,
        specialization: body.specialization,
      },
    })

    return NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
