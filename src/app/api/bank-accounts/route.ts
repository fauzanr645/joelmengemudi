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
    const userRole = (session.user as any).role
    const activeOnly = searchParams.get("activeOnly") === "true" || userRole !== "OWNER"

    const where: any = {}
    if (activeOnly) {
      where.isActive = true
    }

    const accounts = await prisma.bankAccount.findMany({
      where,
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json(accounts)
  } catch (error) {
    console.error("Error fetching bank accounts:", error)
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
      return NextResponse.json({ error: "Hanya Owner yang dapat menambahkan rekening" }, { status: 403 })
    }

    const body = await request.json()
    if (!body.bankName || !body.accountNumber || !body.accountName) {
      return NextResponse.json({ error: "Nama bank, nomor rekening, dan atas nama wajib diisi" }, { status: 400 })
    }

    const account = await prisma.bankAccount.create({
      data: {
        bankName: body.bankName.trim(),
        accountNumber: body.accountNumber.trim(),
        accountName: body.accountName.trim(),
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      },
    })

    return NextResponse.json(account, { status: 201 })
  } catch (error) {
    console.error("Error creating bank account:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
