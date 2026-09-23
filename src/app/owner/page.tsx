import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { StatCard } from "@/components/ui/stat-card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import Link from "next/link"
import {
  Building2,
  Users,
  GraduationCap,
  CreditCard,
  Car,
  BookOpen,
  UserCheck,
  ArrowRight,
  TrendingUp,
} from "lucide-react"

interface RecentEnrollment {
  id: string
  status: string
  createdAt: Date
  student: { name: string; email: string }
  course: { name: string; price: number }
  branch: { name: string; city: string }
}

export default async function OwnerDashboard() {
  const session = await auth()

  const [
    branchCount,
    studentCount,
    instructorCount,
    csCount,
    vehicleCount,
    activeEnrollments,
    pendingPayments,
    totalRevenue,
  ] = await Promise.all([
    prisma.branch.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: "STUDENT", isActive: true } }),
    prisma.user.count({ where: { role: "INSTRUCTOR", isActive: true } }),
    prisma.user.count({ where: { role: "CUSTOMER_SERVICE", isActive: true } }),
    prisma.vehicle.count({ where: { isActive: true } }),
    prisma.enrollment.count({ where: { status: "ACTIVE" } }),
    prisma.payment.count({ where: { status: "PENDING" } }),
    prisma.payment.aggregate({
      where: { status: "CONFIRMED" },
      _sum: { amount: true },
    }),
  ])

  const recentEnrollments = (await prisma.enrollment.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
    include: {
      student: { select: { name: true, email: true } },
      course: { select: { name: true, price: true } },
      branch: { select: { name: true, city: true } },
    },
  })) as unknown as RecentEnrollment[]

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 text-white overflow-hidden shadow-xl border border-slate-700/50">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-72 h-72 bg-[#7ADA3A]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#7ADA3A]/20 border border-[#7ADA3A]/30 text-[#7ADA3A] text-xs font-semibold">
              <span>Portal Eksekutif joelmengemudi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Selamat Datang, {session?.user?.name || "Owner"}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm font-normal max-w-xl">
              Memantau aktivitas operasional di {branchCount} cabang resmi joelmengemudi secara terpusat dan real-time.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/owner/branches"
              className="px-4 py-2.5 rounded-xl bg-[#7ADA3A] text-slate-950 font-bold text-xs hover:bg-[#68c62f] transition-all shadow-md active:scale-95 flex items-center gap-1.5"
            >
              <Building2 size={16} />
              <span>Kelola Cabang</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Row 1 Stats: Core Assets */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp size={14} className="text-[#5cb82a]" />
            <span>Kapasitas & Sumber Daya</span>
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          <StatCard
            title="Total Cabang"
            value={branchCount}
            icon={<Building2 size={22} />}
            description="Aktif beroperasi"
            badgeText="Cabang Resmi"
            badgeVariant="brand"
          />
          <StatCard
            title="Total Siswa"
            value={studentCount}
            icon={<GraduationCap size={22} />}
            description="Terdaftar di sistem"
            badgeText="Siswa Aktif"
            badgeVariant="success"
          />
          <StatCard
            title="Total Instruktur"
            value={instructorCount}
            icon={<UserCheck size={22} />}
            description="Tersertifikasi SIM-A"
            badgeText="Pengajar"
            badgeVariant="brand"
          />
          <StatCard
            title="Customer Service"
            value={csCount}
            icon={<Users size={22} />}
            description="Staff pelayanan cabang"
            badgeText="Petugas CS"
            badgeVariant="info"
          />
        </div>
      </div>

      {/* Row 2 Stats: Operational & Financial */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <CreditCard size={14} className="text-[#5cb82a]" />
            <span>Aktivitas & Keuangan</span>
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          <StatCard
            title="Armada Kendaraan"
            value={vehicleCount}
            icon={<Car size={22} />}
            description="Manual & Matic"
            badgeText="Siap Latihan"
            badgeVariant="brand"
          />
          <StatCard
            title="Kursus Berjalan"
            value={activeEnrollments}
            icon={<BookOpen size={22} />}
            description="Sedang proses latihan"
            badgeText="Aktif"
            badgeVariant="success"
          />
          <StatCard
            title="Pembayaran Pending"
            value={pendingPayments}
            icon={<CreditCard size={22} />}
            description="Menunggu verifikasi CS"
            badgeText={pendingPayments > 0 ? "Perlu Tindakan" : "Lunas"}
            badgeVariant={pendingPayments > 0 ? "warning" : "success"}
          />
          <StatCard
            title="Total Pendapatan"
            value={formatCurrency(totalRevenue._sum.amount || 0)}
            icon={<CreditCard size={22} />}
            description="Pembayaran terkonfirmasi"
            badgeText="Penerimaan"
            badgeVariant="brand"
          />
        </div>
      </div>

      {/* Recent Enrollments Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
          <div>
            <h3 className="font-bold text-base text-slate-900">Pendaftaran Siswa Terbaru</h3>
            <p className="text-xs text-slate-500 mt-0.5">Siswa yang baru mendaftar kursus di semua cabang</p>
          </div>
          <Link
            href="/owner/students"
            className="text-xs font-semibold text-[#2e6015] hover:text-[#244b0c] hover:underline flex items-center gap-1"
          >
            <span>Semua Siswa</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3.5">Siswa</th>
                <th className="px-5 py-3.5">Paket Kursus</th>
                <th className="px-5 py-3.5">Cabang</th>
                <th className="px-5 py-3.5">Tanggal Daftar</th>
                <th className="px-5 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {recentEnrollments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-sm">
                    Belum ada pendaftaran siswa.
                  </td>
                </tr>
              ) : (
                recentEnrollments.map((en) => (
                  <tr key={en.id} className="hover:bg-[#7ADA3A]/5 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-800">{en.student.name}</p>
                      <p className="text-xs text-slate-400 font-normal">{en.student.email}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-slate-700">{en.course.name}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {en.branch.name}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {formatDate(en.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Badge
                        variant={
                          en.status === "ACTIVE"
                            ? "brand"
                            : en.status === "COMPLETED"
                            ? "success"
                            : "default"
                        }
                        dot
                      >
                        {en.status === "ACTIVE" ? "Aktif" : en.status === "COMPLETED" ? "Selesai" : en.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
