"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import Link from "next/link"
import { BookOpen, Calendar, ArrowRight, Building2, CheckCircle2 } from "lucide-react"

interface Enrollment {
  id: string
  status: string
  startDate: string
  course: { name: string; courseType: string; duration: number; sessions: number; price: number }
  branch: { name: string }
  _count: { schedules: number; payments: number }
}

export default function StudentCoursesPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])

  useEffect(() => {
    fetch("/api/enrollments").then((r) => r.json()).then(setEnrollments)
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Kursus Mengemudi Saya</h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
          Daftar paket pelatihan mengemudi joelmengemudi yang sedang atau pernah Anda ikuti
        </p>
      </div>

      {enrollments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
          <BookOpen size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="font-bold text-slate-700 text-sm">Anda belum terdaftar di kursus manapun.</p>
          <p className="text-xs text-slate-400 mt-1">Silakan hubungi Customer Service cabang untuk pendaftaran.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enrollments.map((enrollment) => {
            const percent = Math.min(
              100,
              Math.round((enrollment._count.schedules / enrollment.course.sessions) * 100)
            )

            return (
              <div
                key={enrollment.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:shadow-sm hover:border-[#7ADA3A]/50 transition-all space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-[#2e6015] bg-[#7ADA3A]/20 px-2.5 py-0.5 rounded-lg">
                        {enrollment.course.courseType === "MANUAL" ? "Manual" : "Matic"}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                        <Building2 size={12} />
                        {enrollment.branch.name}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-base text-slate-900">{enrollment.course.name}</h3>
                  </div>

                  <Badge variant={enrollment.status === "ACTIVE" ? "brand" : "success"} dot>
                    {enrollment.status === "ACTIVE" ? "Aktif" : "Selesai"}
                  </Badge>
                </div>

                <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/60 grid grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Mulai Latihan</span>
                    <span className="font-bold text-slate-800">{formatDate(enrollment.startDate)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Durasi</span>
                    <span className="font-bold text-slate-800">{enrollment.course.duration} Jam ({enrollment.course.sessions} Sesi)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Biaya Kursus</span>
                    <span className="font-bold text-[#285413]">{formatCurrency(enrollment.course.price)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Sesi Terjadwal</span>
                    <span className="font-bold text-slate-800">{enrollment._count.schedules} Sesi</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Progres Latihan:</span>
                    <span className="font-extrabold text-[#2a5714]">{percent}% Selesai</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#7ADA3A] to-[#5cb82a] rounded-full transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">
                    {enrollment._count.schedules} dari {enrollment.course.sessions} Sesi
                  </span>
                  <Link
                    href="/student/schedules"
                    className="text-xs font-bold text-[#2e5e15] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Lihat Jadwal Saya</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
