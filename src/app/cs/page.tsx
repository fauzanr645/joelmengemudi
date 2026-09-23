import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { StatCard } from "@/components/ui/stat-card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import Link from "next/link"
import {
  GraduationCap,
  Calendar,
  CreditCard,
  BookOpen,
  AlertTriangle,
  ArrowRight,
  UserPlus,
  Clock,
  CheckCircle2,
} from "lucide-react"

export default async function CSDashboard() {
  const session = await auth()
  const branchId = (session?.user as any)?.branchId
  const branchName = (session?.user as any)?.branchName || "Semua Cabang"

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const [
    studentCount,
    activeEnrollments,
    todaySchedules,
    pendingPayments,
    totalRevenue,
    recentPayments,
    todayScheduleList,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT", branchId: branchId || undefined, isActive: true } }),
    prisma.enrollment.count({ where: { branchId: branchId || undefined, status: "ACTIVE" } }),
    prisma.schedule.count({
      where: {
        branchId: branchId || undefined,
        date: { gte: todayStart, lte: todayEnd },
      },
    }),
    prisma.payment.count({
      where: {
        enrollment: branchId ? { branchId } : undefined,
        status: "PENDING",
      },
    }),
    prisma.payment.aggregate({
      where: {
        enrollment: branchId ? { branchId } : undefined,
        status: "CONFIRMED",
      },
      _sum: { amount: true },
    }),
    prisma.payment.findMany({
      where: {
        enrollment: branchId ? { branchId } : undefined,
        status: "PENDING",
      },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        student: { select: { name: true, phone: true } },
        enrollment: { include: { course: { select: { name: true } } } },
      },
    }),
    prisma.schedule.findMany({
      where: {
        branchId: branchId || undefined,
        date: { gte: todayStart, lte: todayEnd },
      },
      take: 4,
      orderBy: { startTime: "asc" },
      include: {
        enrollment: { include: { student: { select: { name: true } } } },
        instructor: { select: { name: true } },
        course: { select: { name: true } },
        vehicle: { select: { brand: true, plateNumber: true } },
      },
    }),
  ])

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 text-white overflow-hidden shadow-xl border border-slate-700/50">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-72 h-72 bg-[#7ADA3A]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#7ADA3A]/20 border border-[#7ADA3A]/30 text-[#7ADA3A] text-xs font-semibold">
              <span>Pelayanan Cabang: {branchName}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Halo, {session?.user?.name || "Customer Service"}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm font-normal max-w-xl">
              Kelola pendaftaran siswa baru, verifikasi jadwal latihan, dan konfirmasi bukti pembayaran kursus hari ini.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/cs/enrollments"
              className="px-4 py-2.5 rounded-xl bg-[#7ADA3A] text-slate-950 font-bold text-xs hover:bg-[#68c62f] transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus size={16} />
              <span>Daftarkan Siswa Baru</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <StatCard
          title="Siswa Terdaftar"
          value={studentCount}
          icon={<GraduationCap size={22} />}
          description="Siswa di cabang Anda"
          badgeText="Siswa Aktif"
          badgeVariant="brand"
        />
        <StatCard
          title="Kursus Berjalan"
          value={activeEnrollments}
          icon={<BookOpen size={22} />}
          description="Paket sedang aktif"
          badgeText="Aktif"
          badgeVariant="success"
        />
        <StatCard
          title="Jadwal Hari Ini"
          value={todaySchedules}
          icon={<Calendar size={22} />}
          description="Sesi latihan hari ini"
          badgeText={todaySchedules > 0 ? `${todaySchedules} Sesi` : "Kosong"}
          badgeVariant="info"
        />
        <StatCard
          title="Verifikasi Pembayaran"
          value={pendingPayments}
          icon={<AlertTriangle size={22} />}
          description="Menunggu persetujuan CS"
          badgeText={pendingPayments > 0 ? "Perlu Dicek" : "Semua Lunas"}
          badgeVariant={pendingPayments > 0 ? "warning" : "success"}
        />
      </div>

      {/* Grid Content: Pending Payments & Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Payments */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900">Pembayaran Perlu Verifikasi</h3>
              <p className="text-xs text-slate-400 mt-0.5">Bukti transfer dari siswa yang menunggu konfirmasi</p>
            </div>
            <Link
              href="/cs/payments"
              className="text-xs font-semibold text-[#2e6015] hover:underline flex items-center gap-1"
            >
              <span>Kelola Semua</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="space-y-3">
            {recentPayments.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400 font-medium">
                <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2 opacity-60" />
                <p>Tidak ada pembayaran pending saat ini.</p>
              </div>
            ) : (
              recentPayments.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:border-[#7ADA3A]/50 transition-colors flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-bold text-xs text-slate-900">{p.student.name}</p>
                    <p className="text-[11px] text-slate-500">{p.enrollment.course.name}</p>
                    <p className="text-xs font-extrabold text-[#2e5e15] mt-1">
                      {formatCurrency(p.amount)}
                    </p>
                  </div>
                  <Link
                    href="/cs/payments"
                    className="px-3 py-1.5 rounded-xl bg-[#7ADA3A] text-slate-900 font-bold text-xs hover:bg-[#6ecb30] transition-colors shadow-2xs shrink-0"
                  >
                    Verifikasi
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Today's Schedule Live Feed */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900">Jadwal Sesi Hari Ini</h3>
              <p className="text-xs text-slate-400 mt-0.5">Siswa & instruktur yang sedang atau akan berlatih</p>
            </div>
            <Link
              href="/cs/schedules"
              className="text-xs font-semibold text-[#2e6015] hover:underline flex items-center gap-1"
            >
              <span>Semua Jadwal</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="space-y-3">
            {todayScheduleList.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400 font-medium">
                <Calendar size={32} className="mx-auto text-slate-300 mb-2" />
                <p>Tidak ada sesi latihan terjadwal untuk hari ini.</p>
              </div>
            ) : (
              todayScheduleList.map((s) => (
                <div
                  key={s.id}
                  className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/70 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="px-2.5 py-1.5 rounded-xl bg-slate-900 text-[#7ADA3A] font-mono text-xs font-bold shrink-0">
                      {s.startTime}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900">{s.enrollment.student.name}</p>
                      <p className="text-[11px] text-slate-500">
                        Instruktur: {s.instructor.name} • {s.vehicle?.brand || "Mobil"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="brand">{s.course.name.split("-")[0]}</Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
