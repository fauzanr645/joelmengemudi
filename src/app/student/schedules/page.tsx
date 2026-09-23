"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Modal } from "@/components/ui/modal"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { formatDate } from "@/lib/utils"
import { Calendar, RefreshCw, AlertCircle, Star, CheckCircle2, Award } from "lucide-react"

interface Rating {
  id: string
  rating: number
  review: string | null
  createdAt: string
}

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
  instructor: { id: string; name: string }
  course: { name: string }
  vehicle: { plateNumber: string; brand: string; model: string } | null
  attendance: { isPresent: boolean; score: number | null; feedback: string | null } | null
  rating?: Rating | null
}

export default function StudentSchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string>("")
  const [form, setForm] = useState({
    requestedDate: "",
    requestedStartTime: "08:00",
    reason: "",
  })

  // Rating Modal State
  const [ratingTargetSchedule, setRatingTargetSchedule] = useState<Schedule | null>(null)
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false)
  const [selectedStars, setSelectedStars] = useState<number>(5)
  const [reviewText, setReviewText] = useState<string>("")
  const [isRatingLoading, setIsRatingLoading] = useState(false)

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

  const openRatingModal = (schedule: Schedule) => {
    setRatingTargetSchedule(schedule)
    setSelectedStars(schedule.rating ? schedule.rating.rating : 5)
    setReviewText(schedule.rating?.review || "")
    setIsRatingModalOpen(true)
  }

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ratingTargetSchedule) return
    setIsRatingLoading(true)
    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduleId: ratingTargetSchedule.id,
          rating: selectedStars,
          review: reviewText,
        }),
      })

      if (res.ok) {
        setIsRatingModalOpen(false)
        setSuccessMsg(`Terima kasih! Penilaian untuk Instruktur ${ratingTargetSchedule.instructor.name} berhasil disimpan.`)
        fetchSchedules()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsRatingLoading(false)
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
      label: "Tanggal & Jam",
      render: (item: Schedule) => (
        <div>
          <p className="font-medium text-slate-900">{formatDate(item.date)}</p>
          <p className="text-xs text-slate-500">{item.startTime} - {item.endTime}</p>
        </div>
      ),
    },
    { key: "course", label: "Kursus", render: (item: Schedule) => item.course.name },
    {
      key: "instructor",
      label: "Instruktur",
      render: (item: Schedule) => (
        <span className="font-bold text-slate-800">{item.instructor.name}</span>
      ),
    },
    {
      key: "type",
      label: "Jenis",
      render: (item: Schedule) => (
        <Badge variant={item.lessonType === "EXAM" ? "purple" : item.lessonType === "PRACTICE" ? "brand" : "default"}>
          {item.lessonType === "THEORY" ? "Teori" : item.lessonType === "PRACTICE" ? "Praktik" : "Ujian"}
        </Badge>
      ),
    },
    {
      key: "rating",
      label: "Rating Instruktur",
      render: (item: Schedule) => (
        item.status === "COMPLETED" ? (
          item.rating ? (
            <button
              onClick={() => openRatingModal(item)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold hover:bg-amber-100 transition-colors cursor-pointer"
              title="Klik untuk ubah ulasan"
            >
              <div className="flex items-center text-amber-500">
                {Array.from({ length: item.rating.rating }).map((_, i) => (
                  <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-[11px] font-black">{item.rating.rating}/5</span>
            </button>
          ) : (
            <Button
              size="xs"
              variant="outline"
              onClick={() => openRatingModal(item)}
              className="text-[11px] font-bold border-amber-300 text-amber-800 hover:bg-amber-50"
            >
              <Star size={11} className="mr-1 text-amber-500 fill-amber-400" />
              <span>Beri Rating</span>
            </Button>
          )
        ) : (
          <span className="text-xs text-slate-400">Belum Selesai</span>
        )
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
          {item.rescheduleStatus === "REJECTED" && (
            <p className="text-xs text-red-600 mt-1" title={item.rescheduleRejectionReason || ""}>
              Pengajuan Ditolak: {item.rescheduleRejectionReason || "Slot bentrok"}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "action",
      label: "Aksi",
      render: (item: Schedule) => (
        item.status !== "COMPLETED" && item.status !== "CANCELLED" && (
          <Button
            size="sm"
            variant={item.rescheduleStatus === "PENDING" ? "secondary" : "outline"}
            disabled={item.rescheduleStatus === "PENDING"}
            onClick={() => openRescheduleModal(item)}
            className="text-xs"
          >
            <RefreshCw size={13} className="mr-1" />
            {item.rescheduleStatus === "PENDING" ? "Menunggu CS" : "Ajukan Reschedule"}
          </Button>
        )
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Jadwal Kursus Saya</h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
          Lihat jadwal latihan Anda, ajukan reschedule jika berhalangan, dan berikan rating bintang & ulasan kepada instruktur setelah sesi selesai
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs sm:text-sm text-emerald-900 font-bold flex items-center gap-2.5 shadow-2xs animate-fade-in">
          <CheckCircle2 size={18} className="text-[#386E1B] shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <DataTable columns={columns} data={schedules} searchable searchPlaceholder="Cari jadwal atau nama instruktur..." />

      {/* Modal Rating & Review Instruktur */}
      <Modal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        title="Beri Rating & Ulasan Instruktur"
        subtitle={`Instruktur: ${ratingTargetSchedule?.instructor.name || ""}`}
        size="sm"
      >
        <form onSubmit={handleRatingSubmit} className="space-y-4">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
            <p><span className="text-slate-400">Sesi Latihan:</span> <strong className="text-slate-900">{ratingTargetSchedule ? formatDate(ratingTargetSchedule.date) : ""}</strong></p>
            <p><span className="text-slate-400">Jam:</span> <strong className="text-slate-800">{ratingTargetSchedule?.startTime} - {ratingTargetSchedule?.endTime}</strong></p>
            <p><span className="text-slate-400">Instruktur:</span> <strong className="text-[#254d0d]">{ratingTargetSchedule?.instructor.name}</strong></p>
          </div>

          {/* Star Selection 1 - 5 */}
          <div className="text-center space-y-2 py-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Kepuasan Pelatihan
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setSelectedStars(star)}
                  className="p-1 hover:scale-125 transition-transform cursor-pointer focus:outline-none"
                >
                  <Star
                    size={32}
                    className={star <= selectedStars ? "fill-amber-400 text-amber-400" : "text-slate-300"}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs font-bold text-slate-700">
              {selectedStars === 5 && "⭐⭐⭐⭐⭐ Sangat Memuaskan & Ramah"}
              {selectedStars === 4 && "⭐⭐⭐⭐ Bagus & Jelas"}
              {selectedStars === 3 && "⭐⭐⭐ Cukup Baik"}
              {selectedStars === 2 && "⭐⭐ Kurang Memuaskan"}
              {selectedStars === 1 && "⭐ Sangat Kurang"}
            </p>
          </div>

          {/* Review / Comment Textarea */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Ulasan / Komentar Anda
            </label>
            <textarea
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#7ADA3A] focus:ring-2 focus:ring-[#7ADA3A]/20 transition-all"
              rows={3}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Contoh: Instruktur sangat sabar mengajari teknik kopling di tanjakan, penjelasannya mudah dipahami."
            />
            <p className="text-[10px] text-slate-400">Ulasan Anda akan langsung terlihat oleh Owner dan Customer Service untuk memantau kualitas pelayanan.</p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsRatingModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={isRatingLoading} className="bg-[#7ADA3A] text-slate-900 font-bold hover:bg-[#68c62f]">
              Simpan Ulasan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Reschedule Request */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Pengajuan Perubahan Jadwal (Reschedule)"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-emerald-50 p-3 rounded-lg text-xs text-emerald-900">
            <p className="font-semibold mb-1">Jadwal Saat Ini:</p>
            <p>{selectedSchedule ? formatDate(selectedSchedule.date) : ""} ({selectedSchedule?.startTime} - {selectedSchedule?.endTime})</p>
            <p className="text-emerald-700 mt-1">Instruktur: {selectedSchedule?.instructor.name}</p>
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
              placeholder="Jelaskan alasan perubahan jadwal (misal: sakit / ada urusan mendadak)..."
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
