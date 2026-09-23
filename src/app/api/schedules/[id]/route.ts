import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const schedule = await prisma.schedule.update({
      where: { id },
      data: {
        date: body.date ? new Date(body.date) : undefined,
        startTime: body.startTime,
        endTime: body.endTime,
        lessonType: body.lessonType,
        status: body.status,
        instructorId: body.instructorId,
        vehicleId: body.vehicleId,
        notes: body.notes,
      },
    })

    return NextResponse.json(schedule)
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
