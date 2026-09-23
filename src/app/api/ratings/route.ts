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
    const instructorId = searchParams.get("instructorId")
    const branchId = searchParams.get("branchId")
    const studentId = searchParams.get("studentId")

    const userRole = (session.user as any).role
    const where: any = {}

    // Role-based restrictions
    if (userRole === "CUSTOMER_SERVICE") {
      where.branchId = (session.user as any).branchId
    } else if (userRole === "INSTRUCTOR") {
      where.instructorId = session.user.id
    } else if (userRole === "STUDENT") {
      where.studentId = session.user.id
    } else if (userRole === "OWNER") {
      if (branchId && branchId !== "ALL") {
        where.branchId = branchId
      }
    }

    if (instructorId) where.instructorId = instructorId
    if (studentId) where.studentId = studentId

    const ratings = await prisma.instructorRating.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, phone: true } },
        instructor: { select: { id: true, name: true, specialization: true } },
        branch: { select: { id: true, name: true } },
        schedule: {
          select: {
            id: true,
            date: true,
            startTime: true,
            endTime: true,
            lessonType: true,
            course: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(ratings)
  } catch (error) {
    console.error("Error fetching ratings:", error)
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
    if (userRole !== "STUDENT") {
      return NextResponse.json(
        { error: "Hanya siswa yang dapat memberikan rating dan ulasan kepada instruktur" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { scheduleId, rating, review } = body

    if (!scheduleId || !rating) {
      return NextResponse.json(
        { error: "ID jadwal dan nilai bintang rating (1-5) wajib diisi" },
        { status: 400 }
      )
    }

    const numericRating = Math.max(1, Math.min(5, Math.round(Number(rating))))

    // Verify schedule belongs to this student and is completed
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        enrollment: true,
        instructor: true,
        rating: true,
      },
    })

    if (!schedule) {
      return NextResponse.json({ error: "Sesi jadwal tidak ditemukan" }, { status: 404 })
    }

    if (schedule.enrollment.studentId !== session.user.id) {
      return NextResponse.json(
        { error: "Anda tidak berhak memberi rating pada sesi siswa lain" },
        { status: 403 }
      )
    }

    // Check if rating already exists for this schedule
    if (schedule.rating) {
      // Update existing rating
      const updated = await prisma.instructorRating.update({
        where: { id: schedule.rating.id },
        data: {
          rating: numericRating,
          review: review ? review.trim() : null,
        },
      })
      return NextResponse.json(updated)
    }

    // Create new rating
    const newRating = await prisma.instructorRating.create({
      data: {
        rating: numericRating,
        review: review ? review.trim() : null,
        studentId: session.user.id,
        instructorId: schedule.instructorId,
        scheduleId: schedule.id,
        branchId: schedule.branchId,
      },
    })

    return NextResponse.json(newRating, { status: 201 })
  } catch (error) {
    console.error("Error creating rating:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
