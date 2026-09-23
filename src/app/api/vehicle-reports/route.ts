import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { sendNotificationToRole } from "@/lib/push-notification"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const branchId = searchParams.get("branchId")
    const userRole = (session.user as any).role

    const where: any = {}

    if (userRole === "CUSTOMER_SERVICE") {
      where.branchId = (session.user as any).branchId
    } else if (userRole === "INSTRUCTOR") {
      where.instructorId = session.user.id
    } else if (userRole === "OWNER") {
      if (branchId && branchId !== "ALL") {
        where.branchId = branchId
      }
    }

    if (status && status !== "ALL") {
      where.status = status
    }

    const reports = await prisma.vehicleReport.findMany({
      where,
      include: {
        vehicle: { select: { id: true, brand: true, model: true, plateNumber: true, transmission: true } },
        instructor: { select: { id: true, name: true, phone: true } },
        branch: { select: { id: true, name: true, city: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(reports)
  } catch (error) {
    console.error("Error fetching vehicle reports:", error)
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
    if (userRole !== "INSTRUCTOR" && userRole !== "CUSTOMER_SERVICE") {
      return NextResponse.json({ error: "Hanya Instruktur atau CS yang dapat melaporkan kendala mobil" }, { status: 403 })
    }

    const body = await request.json()
    const { issueTitle, description, severity, vehicleId } = body

    if (!issueTitle || !description) {
      return NextResponse.json({ error: "Judul masalah dan deskripsi kendala wajib diisi" }, { status: 400 })
    }

    let targetVehicleId = vehicleId
    let instructorId = session.user.id

    if (userRole === "INSTRUCTOR") {
      // Find the instructor's dedicated vehicle
      const instWithCar = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { assignedVehicle: true },
      })
      if (instWithCar?.assignedVehicle) {
        targetVehicleId = instWithCar.assignedVehicle.id
      }
    }

    if (!targetVehicleId) {
      return NextResponse.json({ error: "Unit kendaraan tidak ditemukan untuk instruktur ini" }, { status: 400 })
    }

    const targetVehicle = await prisma.vehicle.findUnique({
      where: { id: targetVehicleId },
    })

    if (!targetVehicle) {
      return NextResponse.json({ error: "Kendaraan tidak valid" }, { status: 404 })
    }

    const report = await prisma.vehicleReport.create({
      data: {
        issueTitle: issueTitle.trim(),
        description: description.trim(),
        severity: severity || "MEDIUM",
        status: "REPORTED",
        vehicleId: targetVehicle.id,
        instructorId: userRole === "INSTRUCTOR" ? session.user.id : (body.instructorId || session.user.id),
        branchId: targetVehicle.branchId,
      },
      include: {
        vehicle: true,
        instructor: { select: { name: true } },
        branch: { select: { name: true } },
      },
    })

    // Kirim notifikasi ke CS Cabang dan Owner
    try {
      await sendNotificationToRole("CUSTOMER_SERVICE", targetVehicle.branchId, {
        title: "Kendala Mobil Dilaporkan 🛠️",
        message: `Instruktur ${report.instructor.name} melaporkan kendala pada mobil ${report.vehicle.brand} (${report.vehicle.plateNumber}): "${issueTitle}".`,
        type: "VEHICLE_REPORT",
        link: "/cs/vehicle-reports",
      })
      await sendNotificationToRole("OWNER", null, {
        title: "Laporan Kendala Armada Mobil Baru",
        message: `[${report.branch.name}] ${report.vehicle.brand} (${report.vehicle.plateNumber}): "${issueTitle}" (${severity}).`,
        type: "VEHICLE_REPORT",
        link: "/owner/vehicle-reports",
      })
    } catch (notifErr) {
      console.warn("Failed to dispatch vehicle report notification:", notifErr)
    }

    return NextResponse.json(report, { status: 201 })
  } catch (error) {
    console.error("Error creating vehicle report:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
