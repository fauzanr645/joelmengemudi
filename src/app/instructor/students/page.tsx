"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { GraduationCap, MessageSquare, Award, Clock } from "lucide-react"
import { getWhatsAppLink } from "@/lib/utils"

interface StudentData {
  studentName: string
  studentPhone?: string | null
  courseName: string
  totalSchedules: number
  completedSchedules: number
  averageScore: number
}

export default function InstructorStudentsPage() {
  const [schedules, setSchedules] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/schedules").then((r) => r.json()).then(setSchedules)
  }, [])

  // Group by student
  const studentMap = new Map<string, StudentData>()
  schedules.forEach((s: any) => {
    const key = s.enrollment?.student?.name || "Siswa"
    if (!studentMap.has(key)) {
      studentMap.set(key, {
        studentName: key,
        studentPhone: s.enrollment?.student?.phone || null,
        courseName: s.course?.name || "Kursus Mengemudi",
        totalSchedules: 0,
        completedSchedules: 0,
        averageScore: 0,
      })
    }
    const data = studentMap.get(key)!
    data.totalSchedules++
    if (s.status === "COMPLETED") data.completedSchedules++
    if (s.attendance?.score) {
      const prev = data.averageScore
      data.averageScore = prev === 0 ? s.attendance.score : (prev + s.attendance.score) / 2
    }
  })

  const students = Array.from(studentMap.values())

  const columns = [
    {
      key: "studentName",
      label: "Siswa Bimbingan",
      render: (item: StudentData) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-200/60">
            <GraduationCap size={18} />
          </div>
          <div>
            <p className="font-bold text-slate-900">{item.studentName}</p>
            <p className="text-xs text-slate-400 font-medium">{item.courseName}</p>
          </div>
        </div>
      ),
    },
    {
      key: "progress",
      label: "Kemajuan Belajar",
      render: (item: StudentData) => {
        const percent = item.totalSchedules > 0 ? Math.round((item.completedSchedules / item.totalSchedules) * 100) : 0
        return (
          <div className="space-y-1 w-36">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#274f13]">
                {item.completedSchedules}/{item.totalSchedules} Sesi
              </span>
              <span className="text-slate-400 font-medium text-[11px]">{percent}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#7ADA3A] to-[#5cb82a] rounded-full"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        )
      },
    },
    {
      key: "averageScore",
      label: "Rata-Rata Nilai",
      render: (item: StudentData) =>
        item.averageScore > 0 ? (
          <span className="inline-flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-lg bg-[#7ADA3A]/20 text-[#254d0d] border border-[#7ADA3A]/40">
            <Award size={12} className="text-[#3c7717]" />
            <span>{Math.round(item.averageScore)}/100</span>
          </span>
        ) : (
          <span className="text-xs text-slate-400">Belum ada evaluasi</span>
        ),
    },
    {
      key: "contact",
      label: "Kontak Siswa",
      render: (item: StudentData) =>
        item.studentPhone ? (
          <a
            href={getWhatsAppLink(item.studentPhone, `Halo Kak ${item.studentName}, bagaimana kabar latihan mengemudinya?`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-2xs"
          >
            <MessageSquare size={13} />
            <span>WhatsApp</span>
          </a>
        ) : (
          <span className="text-xs text-slate-400">-</span>
        ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Daftar Siswa Bimbingan</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Pantau kemajuan sesi latihan dan rata-rata evaluasi siswa yang Anda latih
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={students}
        searchable
        searchPlaceholder="Cari nama siswa..."
        emptyMessage="Belum ada siswa yang ditugaskan kepada Anda."
      />
    </div>
  )
}
