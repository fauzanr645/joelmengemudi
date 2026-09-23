import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { StatCard } from "@/components/ui/stat-card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import Link from "next/link"
import {
  BookOpen,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  Car,
  User,
  ArrowRight,
  RefreshCw,
} from "lucide-react"

export default async function StudentDashboard() {
  const session = await auth()
  const studentId = session?.user?.id

  const [
    enrollments,
    totalSchedules,
    completedSchedules,
    pendingPayments,
    upcomingSchedules,
  ] = await Promise.all([
    prisma.enrollment.count({ where: { studentId, status: "ACTIVE" } }),
    prisma.schedule.count({ where: { enrollment: { studentId } } }),
    prisma.schedule.count({ where: { enrollment: { studentId }, status: "COMPLETED" } }),
    prisma.payment.count({ where: { studentId, status: "PENDING" } }),
    prisma.schedule.findMany({
      where: {
        enrollment: { studentId },
        status: "SCHEDULED",
        date: { gte: new Date() },
      },
      take: 4,
      orderBy: { date: "asc" },
      include: {
        instructor: { select: { name: true } },
        course: { select: { name: true } },
        vehicle: { select: { plateNumber: true, brand: true, model: true } },
      },
    }),
  ])

  const completionPercent =
    totalSchedules > 0 ? Math.round((completedSchedules / totalSchedules) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Mobile-Friendly Welcome Card */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 text-white overflow-hidden shadow-xl border border-slate-700/50">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-72 h-72 bg-[#7ADA3A]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#7ADA3A]/20 border border-[#7ADA3A]/30 text-[#7ADA3A] text-xs font-semibold">
            <span>Portal Siswa joelmengemudi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Selamat Datang, {session?.user?.name || "Siswa"}!
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm font-normal max-w-xl">
            Pantau perkembangan kursus mengemudi Anda dan jadwal sesi latihan berikutnya secara mudah dari HP Anda.
          </p>

          {/* Progress Bar in Banner */}
          <div className="pt-3 max-w-md">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Progres Kursus Anda:</span>
              <span className="text-[#7ADA3A] font-extrabold">{completionPercent}% Selesai</span>
            </div>
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#7ADA3A] to-[#5cb82a] rounded-full transition-all duration-300"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <StatCard
          title="Kursus Aktif"
          value={enrollments}
          icon={<BookOpen size={22} />}
          description="Paket latihan Anda"
          badgeText="Aktif"
          badgeVariant="brand"
        />
        <StatCard
          title="Total Sesi"
          value={totalSchedules}
          icon={<Calendar size={22} />}
          description="Durasi 2 jam/sesi"
          badgeText={`${totalSchedules} Sesi`}
          badgeVariant="info"
        />
        <StatCard
          title="Sesi Selesai"
          value={completedSchedules}
          icon={<CheckCircle2 size={22} />}
          description="Sudah dilatih & dinilai"
          badgeText="Lulus"
          badgeVariant="success"
        />
        <StatCard
          title="Tagihan Pending"
          value={pendingPayments}
          icon={<CreditCard size={22} />}
          description="Menunggu verifikasi transfer"
          badgeText={pendingPayments > 0 ? "Pending" : "Lunas"}
          badgeVariant={pendingPayments > 0 ? "warning" : "success"}
        />
      </div>

      {/* Upcoming Schedules (Mobile Cards) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-base text-slate-900">Jadwal Sesi Mendatang</h2>
            <p className="text-xs text-slate-400 mt-0.5">Sesi latihan Anda berikutnya bersama instruktur</p>
          </div>
          <Link
            href="/student/schedules"
            className="text-xs font-semibold text-[#2e6015] hover:underline flex items-center gap-1"
          >
            <span>Semua Jadwal</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="space-y-3">
          {upcomingSchedules.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 font-medium">
              <Calendar size={36} className="mx-auto text-slate-300 mb-2" />
              <p>Belum ada sesi latihan terjadwal mendatang.</p>
            </div>
          ) : (
            upcomingSchedules.map((schedule) => (
              <div
                key={schedule.id}
                className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:border-[#7ADA3A]/50 transition-all space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-2 rounded-xl bg-slate-900 text-[#7ADA3A] font-mono font-bold text-xs shrink-0">
                      {schedule.startTime} - {schedule.endTime}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{formatDate(schedule.date)}</h4>
                      <p className="text-xs text-slate-500 font-medium">{schedule.course.name}</p>
                    </div>
                  </div>

                  <Link
                    href="/student/schedules"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#2e5e15] hover:underline self-start sm:self-auto"
                  >
                    <RefreshCw size={12} />
                    <span>Ajukan Reschedule</span>
                  </Link>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <User size={13} className="text-slate-400" />
                    <span>Instruktur: <strong>{schedule.instructor.name}</strong></span>
                  </div>

                  {schedule.vehicle && (
                    <div className="flex items-center gap-1.5">
                      <Car size={13} className="text-slate-400" />
                      <span>{schedule.vehicle.brand} ({schedule.vehicle.plateNumber})</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
