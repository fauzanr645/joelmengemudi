import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

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
    if (userRole !== "OWNER") {
      return NextResponse.json({ error: "Hanya Owner yang dapat mengubah rekening" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const updateData: any = {}
    if (body.bankName !== undefined) updateData.bankName = body.bankName.trim()
    if (body.accountNumber !== undefined) updateData.accountNumber = body.accountNumber.trim()
    if (body.accountName !== undefined) updateData.accountName = body.accountName.trim()
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive)

    const updated = await prisma.bankAccount.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating bank account:", error)
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
      return NextResponse.json({ error: "Hanya Owner yang dapat menghapus rekening" }, { status: 403 })
    }

    const { id } = await params
    await prisma.bankAccount.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: "Rekening berhasil dihapus" })
  } catch (error) {
    console.error("Error deleting bank account:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
