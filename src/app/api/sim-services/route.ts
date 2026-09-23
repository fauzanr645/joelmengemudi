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
    const simType = searchParams.get("simType")
    const branchId = searchParams.get("branchId")
    const userRole = (session.user as any).role

    const where: any = {}

    if (userRole === "STUDENT") {
      where.studentId = session.user.id

      // Auto-sync SIM A application if student is enrolled in a course package with "+ SIM"
      const simEnrollment = await prisma.enrollment.findFirst({
        where: {
          studentId: session.user.id,
          course: {
            name: { contains: "SIM", mode: "insensitive" },
          },
        },
        include: {
          course: true,
          student: true,
        },
        orderBy: { createdAt: "desc" },
      })

      if (simEnrollment) {
        const existingSim = await prisma.simApplication.findFirst({
          where: {
            studentId: session.user.id,
            simType: "SIM_A",
          },
        })

        if (!existingSim) {
          await prisma.simApplication.create({
            data: {
              simType: "SIM_A",
              price: 0,
              fullName: simEnrollment.student.name,
              phone: simEnrollment.student.phone || "",
              address: simEnrollment.student.address || null,
              status: "SUBMITTED",
              paymentStatus: "CONFIRMED",
              notes: `Termasuk dalam paket kursus: ${simEnrollment.course.name}`,
              studentId: session.user.id,
              branchId: simEnrollment.branchId,
            },
          })
        }
      }
    } else if (userRole === "CUSTOMER_SERVICE") {
      where.branchId = (session.user as any).branchId
    } else if (userRole === "OWNER") {
      if (branchId && branchId !== "ALL") {
        where.branchId = branchId
      }
    }

    if (status && status !== "ALL") where.status = status
    if (simType && simType !== "ALL") where.simType = simType

    const applications = await prisma.simApplication.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, email: true, phone: true } },
        branch: { select: { id: true, name: true, city: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(applications)
  } catch (error) {
    console.error("Error fetching SIM applications:", error)
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

    const simType = body.simType === "SIM_C" ? "SIM_C" : "SIM_A"
    const price = simType === "SIM_A" ? 700000 : 625000

    let studentId = session.user.id
    let branchId = (session.user as any).branchId

    if (userRole === "CUSTOMER_SERVICE" || userRole === "OWNER") {
      if (body.studentId) studentId = body.studentId
      if (body.branchId) branchId = body.branchId
    }

    // Get student details if missing
    const studentUser = await prisma.user.findUnique({
      where: { id: studentId },
    })

    if (!studentUser) {
      return NextResponse.json({ error: "Data siswa tidak ditemukan" }, { status: 404 })
    }

    if (!branchId) {
      branchId = studentUser.branchId || (await prisma.branch.findFirst())?.id
    }

    const application = await prisma.simApplication.create({
      data: {
        simType,
        price,
        fullName: body.fullName || studentUser.name,
        nik: body.nik || null,
        phone: body.phone || studentUser.phone || "",
        address: body.address || studentUser.address || null,
        ktpPhoto: body.ktpPhoto || null,
        medicalDoc: body.medicalDoc || null,
        status: "SUBMITTED",
        paymentStatus: body.transferProof ? "PENDING" : (body.paymentStatus || "PENDING"),
        bankName: body.bankName || null,
        accountName: body.accountName || null,
        accountNumber: body.accountNumber || null,
        transferProof: body.transferProof || null,
        notes: body.notes || `Pengajuan ${simType === "SIM_A" ? "SIM A Mobil (Rp 700.000)" : "SIM C Motor (Rp 625.000)"}`,
        studentId,
        branchId: branchId!,
      },
      include: {
        student: { select: { name: true, email: true } },
        branch: { select: { name: true } },
      },
    })

    // Kirim notifikasi ke CS Cabang dan Owner
    try {
      await sendNotificationToRole("CUSTOMER_SERVICE", branchId, {
        title: `Pengajuan Layanan SIM Baru (${simType === "SIM_A" ? "SIM A" : "SIM C"}) 🪪`,
        message: `Siswa ${application.fullName} mengajukan pembuatan ${simType === "SIM_A" ? "SIM A Mobil" : "SIM C Motor"}. Menunggu verifikasi berkas.`,
        type: "SIM_SERVICE",
        link: "/cs/sim-services",
      })
      await sendNotificationToRole("OWNER", null, {
        title: `Pengajuan SIM Baru [${application.branch.name}]`,
        message: `${application.fullName} mengajukan ${simType === "SIM_A" ? "SIM A (Rp 700rb)" : "SIM C (Rp 625rb)"}.`,
        type: "SIM_SERVICE",
        link: "/owner/sim-services",
      })
    } catch (notifErr) {
      console.warn("Failed to dispatch SIM application notification:", notifErr)
    }

    return NextResponse.json(application, { status: 201 })
  } catch (error) {
    console.error("Error creating SIM application:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
