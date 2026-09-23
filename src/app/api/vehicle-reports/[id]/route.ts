import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { sendNotificationToUser, sendNotificationToRole } from "@/lib/push-notification"

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
    if (!["OWNER", "CUSTOMER_SERVICE"].includes(userRole)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { status, estimatedCost, actualCost, repairNotes } = body

    const updateData: any = {}
    if (status !== undefined) {
      updateData.status = status
      if (status === "RESOLVED") {
        updateData.resolvedAt = new Date()
      }
    }
    if (estimatedCost !== undefined) updateData.estimatedCost = Number(estimatedCost)
    if (actualCost !== undefined) updateData.actualCost = Number(actualCost)
    if (repairNotes !== undefined) updateData.repairNotes = repairNotes ? repairNotes.trim() : null

    const updated = await prisma.vehicleReport.update({
      where: { id },
      data: updateData,
      include: {
        vehicle: true,
        instructor: { select: { name: true, phone: true } },
        branch: { select: { name: true } },
      },
    })

    // If resolved, ensure vehicle is active
    if (status === "RESOLVED" && updated.vehicleId) {
      await prisma.vehicle.update({
        where: { id: updated.vehicleId },
        data: { isActive: true },
      })
    } else if ((status === "IN_REPAIR" || status === "APPROVED") && updated.vehicleId) {
      // While in repair, can mark as temporarily inactive if critical
      if (updated.severity === "HIGH" || updated.severity === "EMERGENCY") {
        await prisma.vehicle.update({
          where: { id: updated.vehicleId },
          data: { isActive: false },
        })
      }
    }

    // Kirim notifikasi ke Instruktur yang melaporkan dan ke Owner jika status berubah
    try {
      const statusLabelsText: Record<string, string> = {
        PENDING_APPROVAL: "Diajukan ke Owner untuk Persetujuan Anggaran",
        APPROVED: "Disetujui oleh Owner & Siap Masuk Bengkel",
        IN_REPAIR: "Sedang Dikerjakan di Bengkel",
        RESOLVED: "Selesai Diperbaiki & Mobil Siap Digunakan Kembali",
        REJECTED: "Ditolak / Belum Disetujui",
      }

      if (status) {
        await sendNotificationToUser(updated.instructorId, {
          title: `Perbaikan Mobil ${updated.vehicle.brand} (${updated.vehicle.plateNumber})`,
          message: `Status terkini: ${statusLabelsText[status] || status}. ${repairNotes ? `Catatan: ${repairNotes}` : ""}`,
          type: "VEHICLE_REPORT",
          link: "/instructor/vehicle-reports",
        })

        if (status === "PENDING_APPROVAL") {
          await sendNotificationToRole("OWNER", null, {
            title: `Pengajuan Servis Mobil [${updated.branch.name}]`,
            message: `CS mengajukan persetujuan servis untuk mobil ${updated.vehicle.brand} (${updated.vehicle.plateNumber}): "${updated.issueTitle}".`,
            type: "VEHICLE_REPORT",
            link: "/owner/vehicle-reports",
          })
        }
      }
    } catch (notifErr) {
      console.warn("Failed to dispatch vehicle report update notification:", notifErr)
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating vehicle report:", error)
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
      return NextResponse.json({ error: "Hanya Owner yang dapat menghapus laporan kendala" }, { status: 403 })
    }

    const { id } = await params
    await prisma.vehicleReport.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Laporan kendala kendaraan berhasil dihapus" })
  } catch (error) {
    console.error("Error deleting vehicle report:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
