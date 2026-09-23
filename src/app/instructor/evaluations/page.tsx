"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { ClipboardCheck, CheckCircle2, XCircle, User, Calendar, Clock } from "lucide-react"
import { formatDate, cn } from "@/lib/utils"

interface Schedule {
  id: string
  date: string
  startTime: string
  endTime: string
  lessonType: string
  status: string
  enrollment: { student: { id: string; name: string } }
  course: { name: string }
  attendance: { isPresent: boolean; score: number | null; feedback: string | null } | null
}

export default function EvaluationsPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [selected, setSelected] = useState<Schedule | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({ isPresent: true, score: 80, feedback: "" })

  const fetchSchedules = async () => {
    const res = await fetch("/api/schedules")
    const data = await res.json()
    setSchedules(data)
  }

  useEffect(() => { fetchSchedules() }, [])

  const openEvaluation = (schedule: Schedule) => {
    setSelected(schedule)
    setForm({
      isPresent: schedule.attendance?.isPresent ?? true,
      score: schedule.attendance?.score ?? 80,
      feedback: schedule.attendance?.feedback ?? "",
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    setIsLoading(true)
    try {
      await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduleId: selected.id,
          studentId: selected.enrollment.student.id,
          ...form,
          score: form.isPresent ? Number(form.score) : 0,
        }),
      })
      setIsModalOpen(false)
      fetchSchedules()
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const getScoreGrade = (score: number) => {
    if (score >= 85) return { label: "Sangat Baik (A)", color: "text-emerald-700 bg-emerald-100" }
    if (score >= 70) return { label: "Baik (B)", color: "text-green-700 bg-[#7ADA3A]/25" }
    if (score >= 60) return { label: "Cukup (C)", color: "text-amber-700 bg-amber-100" }
    return { label: "Perlu Latihan Tambahan (D)", color: "text-rose-700 bg-rose-100" }
  }

  const columns = [
    {
      key: "date",
      label: "Waktu Sesi",
      render: (item: Schedule) => (
        <div>
          <p className="font-bold text-slate-900">{formatDate(item.date)}</p>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <Clock size={11} /> {item.startTime} - {item.endTime}
          </p>
        </div>
      ),
    },
    {
      key: "student",
      label: "Siswa",
      render: (item: Schedule) => (
        <span className="font-bold text-slate-900">{item.enrollment.student.name}</span>
      ),
    },
    {
      key: "course",
      label: "Kursus",
      render: (item: Schedule) => (
        <span className="text-xs font-medium text-slate-600">{item.course.name}</span>
      ),
    },
    {
      key: "type",
      label: "Jenis",
      render: (item: Schedule) => (
        <Badge variant={item.lessonType === "PRACTICE" ? "brand" : item.lessonType === "EXAM" ? "purple" : "default"}>
          {item.lessonType === "THEORY" ? "Teori" : item.lessonType === "PRACTICE" ? "Praktik" : "Ujian"}
        </Badge>
      ),
    },
    {
      key: "evaluation",
      label: "Hasil Penilaian",
      render: (item: Schedule) => (
        item.attendance ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant={item.attendance.isPresent ? "success" : "danger"} dot>
                {item.attendance.isPresent ? "Hadir" : "Absen"}
              </Badge>
              {item.attendance.score !== null && (
                <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-[#7ADA3A]/20 text-[#244b0c]">
                  {item.attendance.score}/100
                </span>
              )}
            </div>
            {item.attendance.feedback && (
              <p className="text-[11px] text-slate-500 italic truncate max-w-xs">
                "{item.attendance.feedback}"
              </p>
            )}
          </div>
        ) : (
          <Badge variant="warning" dot>
            Belum Dinilai
          </Badge>
        )
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Penilaian & Evaluasi Siswa</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Berikan nilai kecakapan mengemudi dan catatan evaluasi untuk setiap sesi latihan
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={schedules}
        searchable
        searchPlaceholder="Cari nama siswa atau sesi..."
        emptyMessage="Belum ada sesi latihan yang membutuhkan penilaian."
        actions={(item: Schedule) => (
          <Button
            size="sm"
            variant={item.attendance ? "outline" : "primary"}
            onClick={() => openEvaluation(item)}
            className="text-xs font-bold"
          >
            <ClipboardCheck size={14} className="mr-1" />
            <span>{item.attendance ? "Edit Nilai" : "Beri Nilai"}</span>
          </Button>
        )}
      />

      {/* Modal Evaluasi */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Penilaian Sesi: ${selected?.enrollment.student.name || ""}`}
        subtitle={`${selected ? formatDate(selected.date) : ""} (${selected?.startTime} - ${selected?.endTime})`}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Kehadiran Radio Buttons */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Status Kehadiran Siswa
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, isPresent: true })}
                className={cn(
                  "p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer",
                  form.isPresent
                    ? "bg-[#7ADA3A]/20 border-[#7ADA3A] text-slate-900 font-bold shadow-2xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                )}
              >
                <CheckCircle2 size={18} className={form.isPresent ? "text-[#386E1B]" : "text-slate-400"} />
                <div>
                  <p className="text-xs font-bold">Siswa Hadir</p>
                  <p className="text-[10px] text-slate-500 font-normal">Mengikuti sesi latihan</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, isPresent: false })}
                className={cn(
                  "p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer",
                  !form.isPresent
                    ? "bg-rose-50 border-rose-400 text-rose-900 font-bold shadow-2xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                )}
              >
                <XCircle size={18} className={!form.isPresent ? "text-rose-600" : "text-slate-400"} />
                <div>
                  <p className="text-xs font-bold">Tidak Hadir</p>
                  <p className="text-[10px] text-slate-500 font-normal">Tanpa keterangan / absen</p>
                </div>
              </button>
            </div>
          </div>

          {form.isPresent && (
            <>
              {/* Score Input with Grade Indicator */}
              <div className="space-y-2 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Nilai Kecakapan (0 - 100)
                  </label>
                  <span className={cn("text-xs font-bold px-2.5 py-0.5 rounded-lg", getScoreGrade(form.score).color)}>
                    {getScoreGrade(form.score).label}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={form.score}
                    onChange={(e) => setForm({ ...form, score: Number(e.target.value) })}
                    className="w-full accent-[#7ADA3A] h-2 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <div className="w-16 text-center font-black text-xl text-slate-900 bg-white border border-slate-200 rounded-xl py-1 shadow-2xs">
                    {form.score}
                  </div>
                </div>
              </div>

              {/* Feedback Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Catatan Evaluasi / Masukan untuk Siswa
                </label>
                <textarea
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#7ADA3A] focus:ring-2 focus:ring-[#7ADA3A]/20 transition-all"
                  rows={3}
                  value={form.feedback}
                  onChange={(e) => setForm({ ...form, feedback: e.target.value })}
                  placeholder="Contoh: Penguasaan kopling sudah halus, perhatikan spion kanan saat hendak berpindah jalur."
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading} className="bg-[#7ADA3A] text-slate-900 font-bold hover:bg-[#68c62f]">
              Simpan Penilaian
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
