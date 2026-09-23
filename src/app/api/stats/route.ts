import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = (session.user as any).role
    if (!["OWNER", "CUSTOMER_SERVICE"].includes(userRole)) {
      return NextResponse.json(
        { error: "Akses ditolak: Hanya Owner dan Customer Service yang dapat mengakses ringkasan statistik." },
        { status: 403 }
      )
    }

    const branchId = (session.user as any).branchId

    let where: any = {}
    if (userRole === "CUSTOMER_SERVICE" && branchId) {
      where.branchId = branchId
    }

    const [
      totalBranches,
      totalStudents,
      totalInstructors,
      totalEnrollments,
      activeEnrollments,
      totalPayments,
      pendingPayments,
      confirmedPayments,
      totalSchedules,
      completedSchedules,
      totalVehicles,
    ] = await Promise.all([
      prisma.branch.count({ where: { isActive: true } }),
      prisma.user.count({ where: { ...where, role: "STUDENT", isActive: true } }),
      prisma.user.count({ where: { ...where, role: "INSTRUCTOR", isActive: true } }),
      prisma.enrollment.count({ where }),
      prisma.enrollment.count({ where: { ...where, status: "ACTIVE" } }),
      prisma.payment.count({ where: branchId ? { enrollment: { branchId } } : {} }),
      prisma.payment.count({ where: { ...(branchId ? { enrollment: { branchId } } : {}), status: "PENDING" } }),
      prisma.payment.aggregate({
        where: { ...(branchId ? { enrollment: { branchId } } : {}), status: "CONFIRMED" },
        _sum: { amount: true },
      }),
      prisma.schedule.count({ where }),
      prisma.schedule.count({ where: { ...where, status: "COMPLETED" } }),
      prisma.vehicle.count({ where: { ...where, isActive: true } }),
    ])

    return NextResponse.json({
      totalBranches,
      totalStudents,
      totalInstructors,
      totalEnrollments,
      activeEnrollments,
      totalPayments,
      pendingPayments,
      totalRevenue: confirmedPayments._sum.amount || 0,
      totalSchedules,
      completedSchedules,
      totalVehicles,
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
