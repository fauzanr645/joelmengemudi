import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = (session.user as any).role
    // Instruktur tidak memiliki hak akses data pembayaran
    if (userRole === "INSTRUCTOR") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get("branchId")
    const status = searchParams.get("status")

    const where: any = {}
    if (status) where.status = status

    if (userRole === "CUSTOMER_SERVICE") {
      where.enrollment = { branchId: (session.user as any).branchId }
    } else if (userRole === "STUDENT") {
      where.studentId = session.user.id
    } else if (branchId && branchId !== "ALL") {
      where.enrollment = { branchId }
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, email: true, phone: true } },
        enrollment: {
          include: {
            course: { select: { name: true, price: true, courseType: true } },
            branch: { select: { name: true } },
            payments: {
              select: {
                id: true,
                amount: true,
                status: true,
                createdAt: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(payments)
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
    const body = await request.json()

    // Siswa hanya boleh membuat tagihan / pembayaran untuk dirinya sendiri
    const targetStudentId = userRole === "STUDENT" ? session.user.id : (body.studentId || session.user.id)

    // Validasi enrollmentId milik siswa bersangkutan
    if (userRole === "STUDENT" && body.enrollmentId) {
      const enrollment = await prisma.enrollment.findUnique({
        where: { id: body.enrollmentId },
      })
      if (!enrollment || enrollment.studentId !== session.user.id) {
        return NextResponse.json({ error: "Pendaftaran tidak valid atau bukan milik Anda" }, { status: 403 })
      }
    }

    const payment = await prisma.payment.create({
      data: {
        studentId: targetStudentId,
        enrollmentId: body.enrollmentId,
        amount: Number(body.amount),
        bankName: body.bankName,
        accountName: body.accountName,
        accountNumber: body.accountNumber,
        transferProof: body.transferProof,
        notes: body.notes,
      },
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
