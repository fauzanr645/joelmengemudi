import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { StatCard } from "@/components/ui/stat-card"
import { Badge } from "@/components/ui/badge"
import { formatDate, getWhatsAppLink } from "@/lib/utils"
import Link from "next/link"
import {
  Calendar,
  GraduationCap,
  ClipboardList,
  CheckCircle2,
  Clock,
  Car,
  MessageSquare,
  ArrowRight,
} from "lucide-react"

export default async function InstructorDashboard() {
  const session = await auth()
  const instructorId = session?.user?.id

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [
    todaySchedules,
    totalStudents,
    completedSessions,
    upcomingSchedules,
    todayScheduleList,
  ] = await Promise.all([
    prisma.schedule.count({ where: { instructorId, date: { gte: today, lt: tomorrow } } }),
    prisma.schedule.groupBy({
      by: ["enrollmentId"],
      where: { instructorId },
    }),
    prisma.schedule.count({ where: { instructorId, status: "COMPLETED" } }),
    prisma.schedule.count({ where: { instructorId, status: "SCHEDULED", date: { gte: today } } }),
    prisma.schedule.findMany({
      where: { instructorId, date: { gte: today, lt: tomorrow } },
      include: {
        enrollment: { include: { student: { select: { name: true, phone: true } } } },
        course: { select: { name: true, courseType: true } },
        vehicle: { select: { plateNumber: true, brand: true, model: true } },
        attendance: true,
      },
      orderBy: { startTime: "asc" },
    }),
  ])

  return (
    <div className="space-y-6">
      {/* Mobile-Friendly Hero Card */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 text-white overflow-hidden shadow-xl border border-slate-700/50">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-72 h-72 bg-[#7ADA3A]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#7ADA3A]/20 border border-[#7ADA3A]/30 text-[#7ADA3A] text-xs font-semibold">
            <span>Portal Instruktur Mengemudi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Semangat Mengajar, {session?.user?.name || "Instruktur"}!
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm font-normal max-w-xl">
            Hari ini Anda memiliki {todaySchedules} sesi latihan mengemudi. Pastikan armada mobil dalam kondisi prima.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <StatCard
          title="Jadwal Hari Ini"
          value={todaySchedules}
          icon={<Calendar size={22} />}
          description={todaySchedules > 0 ? "Siap dilatih" : "Tidak ada jadwal"}
          badgeText={todaySchedules > 0 ? "Aktif" : "Bebas"}
          badgeVariant="brand"
        />
        <StatCard
          title="Total Siswa Didik"
          value={totalStudents.length}
          icon={<GraduationCap size={22} />}
          description="Siswa di bawah bimbingan"
          badgeText="Siswa"
          badgeVariant="info"
        />
        <StatCard
          title="Sesi Selesai"
          value={completedSessions}
          icon={<CheckCircle2 size={22} />}
          description="Total jam sukses dilatih"
          badgeText="Selesai"
          badgeVariant="success"
        />
        <StatCard
          title="Jadwal Mendatang"
          value={upcomingSchedules}
          icon={<ClipboardList size={22} />}
          description="Sesi terjadwal berikutnya"
          badgeText="Terjadwal"
          badgeVariant="brand"
        />
      </div>

      {/* Today's Schedule Cards (Mobile-first) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-base text-slate-900">Jadwal Sesi Hari Ini</h2>
            <p className="text-xs text-slate-400 mt-0.5">{formatDate(today)}</p>
          </div>
          <Link
            href="/instructor/evaluations"
            className="text-xs font-semibold text-[#2e6015] hover:underline flex items-center gap-1"
          >
            <span>Beri Penilaian</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="space-y-3">
          {todayScheduleList.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 font-medium">
              <Calendar size={36} className="mx-auto text-slate-300 mb-2" />
              <p>Tidak ada jadwal latihan untuk hari ini. Selamat beristirahat!</p>
            </div>
          ) : (
            todayScheduleList.map((schedule) => {
              const waMsg = `Halo Kak ${schedule.enrollment.student.name}, saya Instruktur ${session?.user?.name} dari joelmengemudi. Mengingatkan jadwal latihan kita hari ini jam ${schedule.startTime} - ${schedule.endTime}. Sampai jumpa!`
              const waUrl = getWhatsAppLink(schedule.enrollment.student.phone, waMsg)

              return (
                <div
                  key={schedule.id}
                  className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:border-[#7ADA3A]/50 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-2 rounded-xl bg-slate-900 text-[#7ADA3A] font-mono font-bold text-xs shrink-0 shadow-2xs">
                        {schedule.startTime} - {schedule.endTime}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{schedule.enrollment.student.name}</h4>
                        <p className="text-xs text-slate-500 font-medium">
                          {schedule.course.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#7ADA3A]/20 text-[#254d0d] border border-[#7ADA3A]/30">
                        {schedule.lessonType === "THEORY" ? "Teori" : schedule.lessonType === "PRACTICE" ? "Praktik" : "Ujian"}
                      </span>

                      {schedule.enrollment.student.phone && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-2xs"
                        >
                          <MessageSquare size={13} />
                          <span>Chat Siswa</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Car size={14} className="text-slate-400" />
                      <span>{schedule.vehicle ? `${schedule.vehicle.brand} ${schedule.vehicle.model} (${schedule.vehicle.plateNumber})` : "Belum ada mobil"}</span>
                    </div>

                    <div>
                      {schedule.attendance ? (
                        <span className="font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-lg text-xs">
                          Sudah Dinilai ({schedule.attendance.score}/100)
                        </span>
                      ) : (
                        <Link
                          href="/instructor/evaluations"
                          className="font-bold text-[#2e6015] hover:underline"
                        >
                          Isi Penilaian →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
