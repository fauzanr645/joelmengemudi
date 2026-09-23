import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { hash } from "bcryptjs"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const currentUserRole = (session.user as any).role
    const currentUserId = session.user.id

    // IDOR Protection: Siswa hanya dapat melihat profil mereka sendiri
    if (currentUserRole === "STUDENT" && currentUserId !== id) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 })
    }

    const user = await prisma.user.findUnique({
      where: { id },
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
        branch: { select: { name: true, city: true } },
        licenseNumber: true,
        specialization: true,
        createdAt: true,
        enrollments: {
          include: {
            course: true,
            branch: { select: { name: true } },
            payments: true,
            schedules: { orderBy: { date: "asc" } },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })
    }

    // CS hanya dapat mengakses profil pengguna di cabangnya
    if (currentUserRole === "CUSTOMER_SERVICE" && user.branchId !== (session.user as any).branchId) {
      return NextResponse.json({ error: "Akses ditolak: Pengguna di luar cabang Anda" }, { status: 403 })
    }

    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const currentUserRole = (session.user as any).role
    const currentUserId = session.user.id

    const targetUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!targetUser) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })
    }

    // IDOR Protection: Siswa & Instruktur hanya boleh mengedit profil mereka sendiri
    if ((currentUserRole === "STUDENT" || currentUserRole === "INSTRUCTOR") && currentUserId !== id) {
      return NextResponse.json({ error: "Akses ditolak: Anda tidak memiliki izin mengedit akun ini" }, { status: 403 })
    }

    // CS Protection: CS hanya boleh mengedit siswa/instruktur di cabangnya dan tidak boleh mengedit akun Owner
    if (currentUserRole === "CUSTOMER_SERVICE") {
      if (targetUser.role === "OWNER" || targetUser.role === "CUSTOMER_SERVICE" && currentUserId !== id) {
        return NextResponse.json({ error: "Akses ditolak: CS tidak dapat mengubah akun ini" }, { status: 403 })
      }
      if (targetUser.branchId !== (session.user as any).branchId) {
        return NextResponse.json({ error: "Akses ditolak: Pengguna berada di cabang berbeda" }, { status: 403 })
      }
    }

    // Check unique email if email is being changed
    if (body.email && body.email !== targetUser.email) {
      const existingEmail = await prisma.user.findFirst({
        where: {
          email: body.email,
          NOT: { id },
        },
      })
      if (existingEmail) {
        return NextResponse.json(
          { error: "Email sudah digunakan oleh akun lain." },
          { status: 400 }
        )
      }
    }

    const updateData: any = {
      name: body.name,
      email: body.email,
      phone: body.phone,
      gender: body.gender,
      address: body.address,
    }

    // Role, Branch, Status, License hanya boleh diubah oleh CS/Owner yang berwenang
    if (currentUserRole === "OWNER") {
      if (body.role) updateData.role = body.role
      if (body.branchId !== undefined) updateData.branchId = body.branchId
      if (body.isActive !== undefined) updateData.isActive = body.isActive
      if (body.licenseNumber !== undefined) updateData.licenseNumber = body.licenseNumber
      if (body.specialization !== undefined) updateData.specialization = body.specialization
    } else if (currentUserRole === "CUSTOMER_SERVICE") {
      if (body.isActive !== undefined) updateData.isActive = body.isActive
      if (body.licenseNumber !== undefined) updateData.licenseNumber = body.licenseNumber
      if (body.specialization !== undefined) updateData.specialization = body.specialization
    }

    if (body.password && body.password.trim() !== "") {
      if (body.password.length < 6) {
        return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 })
      }
      updateData.password = await hash(body.password, 12)
    }

    // Remove undefined fields
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) delete updateData[key]
    })

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
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
        licenseNumber: true,
        specialization: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
