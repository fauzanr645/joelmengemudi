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

    const where: any = {}
    if (branchId) where.branchId = branchId

    const userRole = (session.user as any).role
    if (userRole === "CUSTOMER_SERVICE" || userRole === "INSTRUCTOR") {
      where.branchId = (session.user as any).branchId
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true, city: true } },
        instructor: { select: { id: true, name: true, phone: true, specialization: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(vehicles)
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
    if (userRole !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const vehicle = await prisma.vehicle.create({
      data: {
        plateNumber: body.plateNumber,
        brand: body.brand,
        model: body.model,
        year: body.year,
        transmission: body.transmission,
        branchId: body.branchId,
      },
    })

    return NextResponse.json(vehicle, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
