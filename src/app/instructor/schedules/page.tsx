"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Modal } from "@/components/ui/modal"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { formatDate, cn } from "@/lib/utils"
import { RefreshCw, Edit3, CheckCircle2 } from "lucide-react"

interface Schedule {
  id: string
  date: string
  startTime: string
  endTime: string
  lessonType: string
  status: string
  rescheduleStatus?: string
  rescheduleRequestedBy?: string
  requestedDate?: string
  requestedStartTime?: string
  requestedEndTime?: string
  rescheduleReason?: string
  rescheduleRejectionReason?: string
  enrollment: { student: { name: string; phone: string | null } }
  course: { name: string; courseType: string }
  vehicle: { plateNumber: string; brand: string; model: string } | null
  attendance: { isPresent: boolean; score: number | null } | null
}

export default function InstructorSchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string>("")

  // Edit Lesson Type Modal State
  const [editingLessonSchedule, setEditingLessonSchedule] = useState<Schedule | null>(null)
  const [isEditLessonOpen, setIsEditLessonOpen] = useState(false)
  const [newLessonType, setNewLessonType] = useState<string>("PRACTICE")

  const [form, setForm] = useState({
    requestedDate: "",
    requestedStartTime: "08:00",
    reason: "",
  })

  const fetchSchedules = async () => {
    try {
      const res = await fetch("/api/schedules")
      const data = await res.json()
      setSchedules(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchSchedules()
  }, [])

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(""), 4000)
      return () => clearTimeout(timer)
    }
  }, [successMsg])

  const openRescheduleModal = (schedule: Schedule) => {
    setSelectedSchedule(schedule)
    const nextDate = new Date(schedule.date)
    nextDate.setDate(nextDate.getDate() + 1)
    setForm({
      requestedDate: nextDate.toISOString().split("T")[0],
      requestedStartTime: schedule.startTime || "08:00",
      reason: "",
    })
    setIsModalOpen(true)
  }

  const openEditLessonModal = (schedule: Schedule) => {
    setEditingLessonSchedule(schedule)
    setNewLessonType(schedule.lessonType || "PRACTICE")
    setIsEditLessonOpen(true)
  }

  const handleSaveLessonType = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLessonSchedule) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/schedules/${editingLessonSchedule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonType: newLessonType,
        }),
      })

      if (res.ok) {
        setIsEditLessonOpen(false)
        const typeLabel = newLessonType === "THEORY" ? "Teori" : newLessonType === "PRACTICE" ? "Praktik" : "Ujian"
        setSuccessMsg(`Jenis pelajaran untuk sesi ${editingLessonSchedule.enrollment.student.name} berhasil diubah menjadi "${typeLabel}".`)
        fetchSchedules()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSchedule) return
    setIsLoading(true)
    try {
      const startHour = parseInt(form.requestedStartTime.split(":")[0], 10)
      const requestedEndTime = `${(startHour + 2).toString().padStart(2, "0")}:00`

      await fetch(`/api/schedules/${selectedSchedule.id}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestedDate: form.requestedDate,
          requestedStartTime: form.requestedStartTime,
          requestedEndTime,
          reason: form.reason,
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

  const columns = [
    {
      key: "date",
      label: "Tanggal & Waktu",
      render: (item: Schedule) => (
        <div>
          <p className="font-medium text-slate-900">{formatDate(item.date)}</p>
          <p className="text-xs text-slate-500">{item.startTime} - {item.endTime}</p>
        </div>
      ),
    },
    {
      key: "student",
      label: "Siswa",
      render: (item: Schedule) => (
        <div>
          <p className="font-bold text-slate-900">{item.enrollment.student.name}</p>
          <p className="text-xs text-slate-400 font-medium">{item.enrollment.student.phone || "-"}</p>
        </div>
      ),
    },
    { key: "course", label: "Kursus", render: (item: Schedule) => item.course.name },
    {
      key: "lessonType",
      label: "Jenis Pelajaran",
      render: (item: Schedule) => (
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
              item.lessonType === "PRACTICE"
                ? "bg-[#7ADA3A]/25 text-[#244b0c] border border-[#7ADA3A]/40"
                : item.lessonType === "EXAM"
                ? "bg-purple-100 text-purple-800"
                : "bg-slate-100 text-slate-700"
            )}
          >
            {item.lessonType === "THEORY" ? "Teori" : item.lessonType === "PRACTICE" ? "Praktik" : "Ujian"}
          </span>

          <button
            onClick={() => openEditLessonModal(item)}
            className="p-1 text-slate-400 hover:text-[#2a5513] hover:bg-[#7ADA3A]/15 rounded transition-colors cursor-pointer"
            title="Ubah Jenis Pelajaran (Teori/Praktik/Ujian)"
          >
            <Edit3 size={13} />
          </button>
        </div>
      ),
    },
    {
      key: "vehicle",
      label: "Mobil Khusus",
      render: (item: Schedule) => (
        item.vehicle ? `${item.vehicle.brand} (${item.vehicle.plateNumber})` : "-"
      ),
    },
    {
      key: "status",
      label: "Status & Reschedule",
      render: (item: Schedule) => (
        <div>
          <Badge variant={item.status === "COMPLETED" ? "success" : item.status === "RESCHEDULED" ? "purple" : item.status === "SCHEDULED" ? "info" : "danger"}>
            {item.status === "SCHEDULED" ? "Terjadwal" : item.status === "COMPLETED" ? "Selesai" : item.status === "RESCHEDULED" ? "Dijadwal Ulang" : "Dibatalkan"}
          </Badge>
          {item.rescheduleStatus === "PENDING" && (
            <p className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-1 font-medium">
              Pengajuan Reschedule (Menunggu CS)
            </p>
          )}
        </div>
      ),
    },
    {
      key: "action",
      label: "Aksi",
      render: (item: Schedule) => (
        <div className="flex items-center gap-1.5 justify-end">
          <Button
            size="xs"
            variant="outline"
            onClick={() => openEditLessonModal(item)}
            className="text-xs"
            title="Ubah Jenis Teori/Praktik/Ujian"
          >
            <Edit3 size={12} className="mr-1" />
            <span>Ubah Jenis</span>
          </Button>

          {item.status !== "COMPLETED" && item.status !== "CANCELLED" && (
            <Button
              size="xs"
              variant={item.rescheduleStatus === "PENDING" ? "secondary" : "outline"}
              disabled={item.rescheduleStatus === "PENDING"}
              onClick={() => openRescheduleModal(item)}
              className="text-xs"
            >
              <RefreshCw size={12} className="mr-1" />
              {item.rescheduleStatus === "PENDING" ? "Menunggu CS" : "Reschedule"}
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Jadwal Mengajar Instruktur</h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
          Lihat jadwal mengajar, ubah jenis pelajaran (Teori/Praktik/Ujian), atau ajukan reschedule sesi ke Customer Service
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs sm:text-sm text-emerald-900 font-bold flex items-center gap-2.5 shadow-2xs animate-fade-in">
          <CheckCircle2 size={18} className="text-[#386E1B] shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <DataTable columns={columns} data={schedules} searchable searchPlaceholder="Cari jadwal atau nama siswa..." />

      {/* Modal Edit Jenis Pelajaran (Teori, Praktik, Ujian) */}
      <Modal
        isOpen={isEditLessonOpen}
        onClose={() => setIsEditLessonOpen(false)}
        title="Ubah Jenis Pelajaran Sesi"
        subtitle={`Siswa: ${editingLessonSchedule?.enrollment.student.name || ""}`}
        size="sm"
      >
        {editingLessonSchedule && (
          <form onSubmit={handleSaveLessonType} className="space-y-4">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <p><span className="text-slate-400">Siswa:</span> <strong className="text-slate-900">{editingLessonSchedule.enrollment.student.name}</strong></p>
              <p><span className="text-slate-400">Jadwal:</span> <strong className="text-slate-800">{formatDate(editingLessonSchedule.date)} ({editingLessonSchedule.startTime} - {editingLessonSchedule.endTime})</strong></p>
              <p><span className="text-slate-400">Paket:</span> <strong className="text-[#254d0d]">{editingLessonSchedule.course.name}</strong></p>
            </div>

            <Select
              label="Pilih Jenis Pelajaran"
              value={newLessonType}
              onChange={(e) => setNewLessonType(e.target.value)}
              required
              options={[
                { value: "THEORY", label: "Teori (Materi / Rambu / Dasar Berkendara)" },
                { value: "PRACTICE", label: "Praktik (Latihan Mengemudi Langsung di Jalan)" },
                { value: "EXAM", label: "Ujian (Ujian Evaluasi Kelulusan)" },
              ]}
            />

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => setIsEditLessonOpen(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                className="bg-[#7ADA3A] text-slate-900 font-bold hover:bg-[#68c62f]"
              >
                Simpan Jenis Pelajaran
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Reschedule Request */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Pengajuan Perubahan Jadwal Mengajar (Reschedule)"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-emerald-50 p-3 rounded-lg text-xs text-emerald-900">
            <p className="font-semibold mb-1">Jadwal Mengajar Saat Ini:</p>
            <p>{selectedSchedule ? formatDate(selectedSchedule.date) : ""} ({selectedSchedule?.startTime} - {selectedSchedule?.endTime})</p>
            <p className="text-emerald-700 mt-1">Siswa: {selectedSchedule?.enrollment.student.name}</p>
          </div>

          <Input
            label="Tanggal Usulan Baru"
            type="date"
            value={form.requestedDate}
            onChange={(e) => setForm({ ...form, requestedDate: e.target.value })}
            required
          />

          <Select
            label="Jam Latihan Usulan Baru (2 Jam)"
            value={form.requestedStartTime}
            onChange={(e) => setForm({ ...form, requestedStartTime: e.target.value })}
            required
            options={[
              { value: "08:00", label: "Sesi Pagi (08:00 - 10:00)" },
              { value: "10:00", label: "Sesi Siang (10:00 - 12:00)" },
              { value: "13:00", label: "Sesi Siang 2 (13:00 - 15:00)" },
              { value: "15:00", label: "Sesi Sore (15:00 - 17:00)" },
            ]}
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Alasan Reschedule</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7ADA3A]"
              rows={3}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Jelaskan alasan perubahan jadwal..."
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" isLoading={isLoading}>Kirim Pengajuan</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
