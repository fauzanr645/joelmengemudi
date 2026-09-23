"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import {
  Plus,
  User,
  CheckCircle,
  Clock,
  AlertTriangle,
  Check,
  X as XIcon,
  RefreshCw,
  MessageSquare,
  Edit3,
  Calendar,
  Building2,
  ListFilter,
  CalendarDays,
  Car,
} from "lucide-react"
import { formatDate, getWhatsAppLink, cn } from "@/lib/utils"

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
  instructorId: string
  branchId: string
  vehicleId: string | null
  enrollment: {
    studentId: string
    student: { id: string; name: string; phone: string | null }
  }
  instructor: { id: string; name: string; phone: string | null }
  course: { name: string; courseType: string }
  vehicle: { id: string; plateNumber: string; brand: string; model: string } | null
  branch: { id: string; name: string; city: string }
  attendance?: { isPresent: boolean; score: number | null; feedback: string | null } | null
}

export default function SchedulesPage() {
  const [activeTab, setActiveTab] = useState<"BY_DAY" | "ALL_TABLE" | "RESCHEDULE_PENDING">("BY_DAY")
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("")

  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [instructors, setInstructors] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [branchInfo, setBranchInfo] = useState<{ name: string; city: string } | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string>("")

  // Student Schedule Modal State
  const [selectedStudentName, setSelectedStudentName] = useState<string>("")
  const [studentSchedules, setStudentSchedules] = useState<Schedule[]>([])
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false)

  // Reschedule Approval State
  const [selectedReschedule, setSelectedReschedule] = useState<Schedule | null>(null)
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState<string>("")
  const [overrideInstructorId, setOverrideInstructorId] = useState<string>("")
  const [overrideVehicleId, setOverrideVehicleId] = useState<string>("")

  // CS Direct Reschedule State
  const [directRescheduleItem, setDirectRescheduleItem] = useState<Schedule | null>(null)
  const [isDirectRescheduleOpen, setIsDirectRescheduleOpen] = useState(false)
  const [directForm, setDirectForm] = useState({
    date: "",
    startTime: "08:00",
    instructorId: "",
    vehicleId: "",
  })

  // Edit Lesson Type Modal State
  const [editingLessonItem, setEditingLessonItem] = useState<Schedule | null>(null)
  const [isEditLessonOpen, setIsEditLessonOpen] = useState(false)
  const [newLessonType, setNewLessonType] = useState<string>("PRACTICE")

  const [form, setForm] = useState({
    enrollmentId: "",
    instructorId: "",
    courseId: "",
    vehicleId: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "08:00",
    endTime: "10:00",
    lessonType: "PRACTICE",
  })

  const fetchData = async () => {
    try {
      const [schedRes, enrollRes, instrRes, courseRes, vehRes, sessionRes] = await Promise.all([
        fetch("/api/schedules"), // strictly scoped to CS branch by backend
        fetch("/api/enrollments"),
        fetch("/api/users?role=INSTRUCTOR"),
        fetch("/api/courses"),
        fetch("/api/vehicles"),
        fetch("/api/auth/session"),
      ])

      const schedData: Schedule[] = await schedRes.json()
      const sessData = await sessionRes.json()

      setSchedules(schedData)
      setEnrollments(await enrollRes.json())
      setInstructors(await instrRes.json())
      setCourses(await courseRes.json())
      setVehicles(await vehRes.json())

      // Get branch name dynamically
      if (schedData.length > 0 && schedData[0].branch) {
        setBranchInfo(schedData[0].branch)
      } else if (sessData?.user?.branchName) {
        setBranchInfo({ name: sessData.user.branchName, city: "" })
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Filter schedules by Date if selected
  const displaySchedules = schedules.filter((s) => {
    if (!selectedDateFilter) return true
    const sDate = new Date(s.date).toISOString().split("T")[0]
    return sDate === selectedDateFilter
  })

  const pendingReschedules = schedules.filter((s) => s.rescheduleStatus === "PENDING")

  // Group schedules by Day (Date string YYYY-MM-DD)
  const dayGroups: { [dateStr: string]: Schedule[] } = {}
  displaySchedules.forEach((s) => {
    const dateKey = new Date(s.date).toISOString().split("T")[0]
    if (!dayGroups[dateKey]) {
      dayGroups[dateKey] = []
    }
    dayGroups[dateKey].push(s)
  })

  // Sort dates chronologically
  const sortedDates = Object.keys(dayGroups).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  )

  const handleStudentClick = (studentName: string, studentId: string) => {
    const studentScheds = schedules.filter(
      (s) => s.enrollment?.student?.name === studentName || s.enrollment?.studentId === studentId
    )
    setSelectedStudentName(studentName)
    setStudentSchedules(studentScheds)
    setIsStudentModalOpen(true)
  }

  const openApproveModal = (schedule: Schedule) => {
    setSelectedReschedule(schedule)
    setOverrideInstructorId(schedule.instructorId)
    setOverrideVehicleId(schedule.vehicleId || "")
    setErrorMsg("")
    setIsApproveModalOpen(true)
  }

  const openRejectModal = (schedule: Schedule) => {
    setSelectedReschedule(schedule)
    setRejectionReason("Slot waktu/instruktur penuh pada tanggal yang diminta.")
    setIsRejectModalOpen(true)
  }

  const openDirectReschedule = (schedule: Schedule) => {
    setDirectRescheduleItem(schedule)
    const dStr = new Date(schedule.date).toISOString().split("T")[0]
    setDirectForm({
      date: dStr,
      startTime: schedule.startTime || "08:00",
      instructorId: schedule.instructorId,
      vehicleId: schedule.vehicleId || "",
    })
    setErrorMsg("")
    setIsDirectRescheduleOpen(true)
  }

  const openEditLessonModal = (schedule: Schedule) => {
    setEditingLessonItem(schedule)
    setNewLessonType(schedule.lessonType || "PRACTICE")
    setIsEditLessonOpen(true)
  }

  const handleSaveLessonType = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLessonItem) return
    setIsLoading(true)
    try {
      await fetch(`/api/schedules/${editingLessonItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonType: newLessonType,
        }),
      })
      setIsEditLessonOpen(false)
      fetchData()
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDirectRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!directRescheduleItem) return
    setIsLoading(true)
    setErrorMsg("")
    try {
      const startHour = parseInt(directForm.startTime.split(":")[0], 10)
      const endTimeStr = `${(startHour + 2).toString().padStart(2, "0")}:00`

      const res = await fetch(`/api/schedules/${directRescheduleItem.id}/reschedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPROVE",
          requestedDate: directForm.date,
          requestedStartTime: directForm.startTime,
          requestedEndTime: endTimeStr,
          instructorId: directForm.instructorId,
          vehicleId: directForm.vehicleId || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || "Gagal mengubah jadwal siswa.")
        return
      }

      setIsDirectRescheduleOpen(false)
      fetchData()
    } catch (e) {
      setErrorMsg("Terjadi kesalahan koneksi.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleApproveReschedule = async () => {
    if (!selectedReschedule) return
    setIsLoading(true)
    setErrorMsg("")
    try {
      const res = await fetch(`/api/schedules/${selectedReschedule.id}/reschedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPROVE",
          instructorId: overrideInstructorId,
          vehicleId: overrideVehicleId || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || "Gagal menyetujui reschedule.")
        return
      }

      setIsApproveModalOpen(false)
      fetchData()
    } catch (e) {
      setErrorMsg("Terjadi kesalahan koneksi.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRejectReschedule = async () => {
    if (!selectedReschedule) return
    setIsLoading(true)
    try {
      await fetch(`/api/schedules/${selectedReschedule.id}/reschedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REJECT",
          rejectionReason,
        }),
      })
      setIsRejectModalOpen(false)
      fetchData()
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg("")
    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || "Gagal membuat jadwal.")
        return
      }

      setIsModalOpen(false)
      setErrorMsg("")
      fetchData()
    } catch (error) {
      setErrorMsg("Terjadi kesalahan koneksi.")
    } finally {
      setIsLoading(false)
    }
  }

  const statusBadge: Record<string, "success" | "info" | "danger" | "warning" | "brand"> = {
    SCHEDULED: "info",
    COMPLETED: "success",
    CANCELLED: "danger",
    RESCHEDULED: "brand",
  }
  const statusLabels: Record<string, string> = {
    SCHEDULED: "Terjadwal",
    COMPLETED: "Selesai",
    CANCELLED: "Dibatalkan",
    RESCHEDULED: "Dijadwal Ulang",
  }

  const columns = [
    {
      key: "date",
      label: "Tanggal & Jam",
      render: (item: Schedule) => (
        <div>
          <p className="font-bold text-slate-900">{formatDate(item.date)}</p>
          <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
            <Clock size={11} /> {item.startTime} - {item.endTime}
          </p>
        </div>
      ),
    },
    {
      key: "student",
      label: "Siswa Kursus",
      render: (item: Schedule) => (
        <div>
          <button
            type="button"
            onClick={() => handleStudentClick(item.enrollment.student.name, item.enrollment.student.id || item.enrollment.studentId)}
            className="font-bold text-emerald-800 hover:underline text-left inline-flex items-center gap-1.5 group cursor-pointer"
          >
            <User size={13} className="text-[#386E1B]" />
            <span>{item.enrollment.student.name}</span>
          </button>
          <p className="text-[11px] text-slate-400 font-medium">{item.enrollment.student.phone || "-"}</p>
        </div>
      ),
    },
    {
      key: "instructor",
      label: "Instruktur",
      render: (item: Schedule) => (
        <span className="font-bold text-xs text-slate-800">{item.instructor.name}</span>
      ),
    },
    {
      key: "course",
      label: "Paket Kursus",
      render: (item: Schedule) => (
        <div className="text-xs">
          <p className="font-bold text-slate-800">{item.course.name}</p>
        </div>
      ),
    },
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
      label: "Mobil",
      render: (item: Schedule) => (
        item.vehicle ? (
          <span className="text-xs font-medium text-slate-700">
            {item.vehicle.brand} ({item.vehicle.plateNumber})
          </span>
        ) : (
          <span className="text-xs text-slate-400">-</span>
        )
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (item: Schedule) => (
        <div>
          <Badge variant={statusBadge[item.status] || "default"}>{statusLabels[item.status] || item.status}</Badge>
          {item.rescheduleStatus === "PENDING" && (
            <p className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded mt-1 inline-block">
              Minta Reschedule ({item.rescheduleRequestedBy === "STUDENT" ? "Siswa" : "Instruktur"})
            </p>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Aksi (WA & Reschedule)",
      render: (item: Schedule) => {
        const waMsg = `Halo Kak ${item.enrollment.student.name}, mengingatkan jadwal latihan mengemudi joelmengemudi pada ${formatDate(item.date)} jam ${item.startTime} - ${item.endTime} bersama Instruktur ${item.instructor.name}. Sampai jumpa!`
        const waUrl = getWhatsAppLink(item.enrollment.student.phone, waMsg)

        return (
          <div className="flex items-center gap-1.5 justify-end">
            {item.enrollment.student.phone && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#7ADA3A] text-slate-900 hover:bg-[#66be2f] transition-colors shadow-2xs"
                title="Kirim Pengingat WhatsApp ke Siswa"
              >
                <MessageSquare size={13} />
                <span>WA</span>
              </a>
            )}

            {item.rescheduleStatus === "PENDING" ? (
              <div className="flex items-center gap-1">
                <Button size="xs" variant="primary" onClick={() => openApproveModal(item)} className="bg-emerald-600 hover:bg-emerald-700">
                  <Check size={13} />
                </Button>
                <Button size="xs" variant="danger" onClick={() => openRejectModal(item)}>
                  <XIcon size={13} />
                </Button>
              </div>
            ) : (
              item.status !== "COMPLETED" &&
              item.status !== "CANCELLED" && (
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => openDirectReschedule(item)}
                  className="text-xs text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                  title="Reschedule Langsung Siswa"
                >
                  <RefreshCw size={12} className="mr-1" />
                  <span>Reschedule</span>
                </Button>
              )
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header with Specific Branch Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#7ADA3A]/15 border border-[#7ADA3A]/30 text-[#254d0d] text-xs font-bold shadow-2xs">
              <Building2 size={13} />
              <span>{branchInfo?.name || "Cabang Anda"}</span>
            </span>
            <span className="text-xs text-slate-400 font-medium">Khusus Operasional Cabang Ini</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Jadwal Sesi Latihan Siswa</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Daftar jadwal sesi siswa cabang {branchInfo?.name || ""}, dikategorikan per hari secara otomatis
          </p>
        </div>
        <Button
          onClick={() => {
            setErrorMsg("")
            setIsModalOpen(true)
          }}
          variant="primary"
          leftIcon={<Plus size={16} />}
          className="self-start sm:self-auto font-bold text-slate-900 bg-[#7ADA3A] hover:bg-[#68c62f]"
        >
          Buat Jadwal Manual
        </Button>
      </div>

      {/* View Mode Tabs: Per Hari (BY_DAY) vs Tabel Lengkap vs Reschedule */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab("BY_DAY")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer",
              activeTab === "BY_DAY"
                ? "bg-[#7ADA3A] text-slate-900 shadow-sm border border-[#6ecb30]"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <CalendarDays size={16} />
            <span>Kategori Per Hari ({sortedDates.length} Hari)</span>
          </button>

          <button
            onClick={() => setActiveTab("ALL_TABLE")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer",
              activeTab === "ALL_TABLE"
                ? "bg-[#7ADA3A] text-slate-900 shadow-sm border border-[#6ecb30]"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <ListFilter size={16} />
            <span>Tabel Semua Jadwal ({displaySchedules.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("RESCHEDULE_PENDING")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer",
              activeTab === "RESCHEDULE_PENDING"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-amber-800 bg-amber-50 hover:bg-amber-100"
            )}
          >
            <RefreshCw size={15} />
            <span>Permintaan Reschedule ({pendingReschedules.length})</span>
          </button>
        </div>

        {/* Date Quick Filter */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
            <Calendar size={13} className="text-[#3c7717]" />
            <span>Pilih Tanggal:</span>
          </span>
          <input
            type="date"
            value={selectedDateFilter}
            onChange={(e) => setSelectedDateFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#7ADA3A]"
          />
          {selectedDateFilter && (
            <button
              onClick={() => setSelectedDateFilter("")}
              className="text-xs text-[#2a5513] font-bold hover:underline"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* MODE 1: KATEGORI JADWAL PER HARI */}
      {activeTab === "BY_DAY" && (
        <div className="space-y-6">
          {sortedDates.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-sm">
              <CalendarDays size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-slate-600">Tidak ada jadwal sesi latihan pada cabang ini.</p>
              <p className="text-xs text-slate-400 mt-0.5">Jadwal akan otomatis terbuat saat siswa didaftarkan di menu Pendaftaran.</p>
            </div>
          ) : (
            sortedDates.map((dateKey) => {
              const daySchedules = dayGroups[dateKey]
              const todayStr = new Date().toISOString().split("T")[0]
              const isToday = dateKey === todayStr
              const isPast = new Date(dateKey).getTime() < new Date(todayStr).getTime()

              return (
                <div
                  key={dateKey}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden"
                >
                  {/* Day Category Header */}
                  <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-emerald-50/20 to-transparent border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 border",
                        isToday
                          ? "bg-[#7ADA3A] text-slate-900 border-[#6ecb30] shadow-sm brand-glow-sm"
                          : isPast
                          ? "bg-slate-100 text-slate-500 border-slate-200"
                          : "bg-emerald-50 text-emerald-800 border-emerald-200"
                      )}>
                        <Calendar size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-base text-slate-900">
                            {formatDate(dateKey)}
                          </h3>
                          {isToday && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#7ADA3A] text-slate-900">
                              HARI INI
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Total {daySchedules.length} Sesi Latihan • {daySchedules.filter((s) => s.status === "COMPLETED").length} Selesai • {daySchedules.filter((s) => s.status === "SCHEDULED").length} Terjadwal
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-xl self-start sm:self-auto">
                      {branchInfo?.name || "Cabang Ini"}
                    </span>
                  </div>

                  {/* Sesi-Sesi di Hari Tersebut (Grid Cards) */}
                  <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {daySchedules.map((schedule) => {
                      const waMsg = `Halo Kak ${schedule.enrollment.student.name}, mengingatkan jadwal latihan mengemudi joelmengemudi (${branchInfo?.name || ""}) hari ${formatDate(schedule.date)} jam ${schedule.startTime} - ${schedule.endTime} bersama Instruktur ${schedule.instructor.name}. Sampai jumpa!`
                      const waUrl = getWhatsAppLink(schedule.enrollment.student.phone, waMsg)

                      return (
                        <div
                          key={schedule.id}
                          className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-[#7ADA3A]/60 hover:bg-white transition-all space-y-3 shadow-2xs"
                        >
                          {/* Top Row: Jam & Status */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded-xl bg-slate-900 text-[#7ADA3A] font-mono font-bold text-xs">
                                {schedule.startTime} - {schedule.endTime}
                              </span>
                              <span className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-md",
                                schedule.lessonType === "PRACTICE" ? "bg-[#7ADA3A]/25 text-[#244b0c]" :
                                schedule.lessonType === "EXAM" ? "bg-purple-100 text-purple-800" : "bg-slate-200 text-slate-700"
                              )}>
                                {schedule.lessonType === "THEORY" ? "Teori" : schedule.lessonType === "PRACTICE" ? "Praktik" : "Ujian"}
                              </span>
                            </div>
                            <Badge variant={statusBadge[schedule.status] || "default"}>
                              {statusLabels[schedule.status] || schedule.status}
                            </Badge>
                          </div>

                          {/* Student & Course Details */}
                          <div className="space-y-1">
                            <button
                              type="button"
                              onClick={() => handleStudentClick(schedule.enrollment.student.name, schedule.enrollment.student.id || schedule.enrollment.studentId)}
                              className="font-bold text-sm text-slate-900 hover:text-[#2d5d14] hover:underline text-left block cursor-pointer"
                            >
                              {schedule.enrollment.student.name}
                            </button>
                            <p className="text-xs text-slate-500 font-medium truncate">
                              {schedule.course.name}
                            </p>
                          </div>

                          {/* Instructor & Vehicle */}
                          <div className="pt-2 border-t border-slate-200/60 text-xs text-slate-600 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Instruktur:</span>
                              <span className="font-bold text-slate-800">{schedule.instructor.name}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Mobil:</span>
                              <span className="font-medium text-slate-800 truncate max-w-[140px]">
                                {schedule.vehicle ? `${schedule.vehicle.brand} (${schedule.vehicle.plateNumber})` : "Belum ada"}
                              </span>
                            </div>
                          </div>

                          {/* Actions: WA, Reschedule, Edit Lesson */}
                          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                            <button
                              onClick={() => openEditLessonModal(schedule)}
                              className="text-[11px] font-bold text-slate-500 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                              title="Ubah Jenis Pelajaran"
                            >
                              <Edit3 size={12} />
                              <span>Ubah Jenis</span>
                            </button>

                            <div className="flex items-center gap-1.5">
                              {schedule.enrollment.student.phone && (
                                <a
                                  href={waUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg bg-[#7ADA3A] text-slate-900 hover:bg-[#68c62f] transition-colors shadow-2xs font-bold text-xs"
                                  title="Ingatkan via WhatsApp"
                                >
                                  <MessageSquare size={13} />
                                </a>
                              )}
                              {schedule.status !== "COMPLETED" && schedule.status !== "CANCELLED" && (
                                <Button
                                  size="xs"
                                  variant="outline"
                                  onClick={() => openDirectReschedule(schedule)}
                                  className="text-[11px] font-bold text-emerald-900 border-emerald-300 hover:bg-emerald-50"
                                >
                                  <RefreshCw size={11} className="mr-1" />
                                  <span>Reschedule</span>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* MODE 2: TABEL SEMUA JADWAL */}
      {activeTab === "ALL_TABLE" && (
        <DataTable
          columns={columns}
          data={displaySchedules}
          searchable
          searchPlaceholder="Cari jadwal atau nama siswa..."
          emptyMessage="Tidak ada jadwal yang cocok dengan filter."
        />
      )}

      {/* MODE 3: PERMINTAAN RESCHEDULE PENDING */}
      {activeTab === "RESCHEDULE_PENDING" && (
        <DataTable
          columns={columns}
          data={pendingReschedules}
          searchable
          searchPlaceholder="Cari pengajuan reschedule..."
          emptyMessage="Tidak ada pengajuan reschedule yang menunggu persetujuan CS saat ini."
        />
      )}

      {/* Modal Edit Jenis Pelajaran */}
      <Modal
        isOpen={isEditLessonOpen}
        onClose={() => setIsEditLessonOpen(false)}
        title="Ubah Jenis Pelajaran Sesi Ini"
        subtitle={editingLessonItem?.enrollment.student.name || ""}
        size="sm"
      >
        {editingLessonItem && (
          <form onSubmit={handleSaveLessonType} className="space-y-4">
            <div className="p-3 bg-emerald-50 rounded-xl text-xs text-emerald-900 space-y-1 border border-emerald-200">
              <p><span className="font-semibold">Siswa:</span> {editingLessonItem.enrollment.student.name}</p>
              <p><span className="font-semibold">Jadwal:</span> {formatDate(editingLessonItem.date)} ({editingLessonItem.startTime} - {editingLessonItem.endTime})</p>
              <p><span className="font-semibold">Paket:</span> {editingLessonItem.course.name}</p>
            </div>

            <Select
              label="Pilih Jenis Pelajaran"
              value={newLessonType}
              onChange={(e) => setNewLessonType(e.target.value)}
              required
              options={[
                { value: "THEORY", label: "Teori (Materi / Rambu / Dasar)" },
                { value: "PRACTICE", label: "Praktik (Latihan Mengemudi Langsung)" },
                { value: "EXAM", label: "Ujian (Evaluasi Kelulusan)" },
              ]}
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => setIsEditLessonOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="primary" isLoading={isLoading} className="bg-[#7ADA3A] text-slate-900 font-bold hover:bg-[#68c62f]">
                Simpan Perubahan
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal View All Schedules for Selected Student */}
      <Modal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        title={`Semua Jadwal: ${selectedStudentName}`}
        subtitle={`Total ${studentSchedules.length} sesi terdaftar`}
        size="lg"
      >
        <div className="space-y-3">
          <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
            {studentSchedules.map((schedule, idx) => (
              <div key={schedule.id} className="p-3.5 border border-slate-200 rounded-2xl bg-white shadow-2xs space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-[#7ADA3A]/20 text-[#244b0c] font-bold text-[10px] flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-xs text-slate-900">{formatDate(schedule.date)}</span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock size={11} /> {schedule.startTime} - {schedule.endTime}
                    </span>
                  </div>
                  <Badge variant={statusBadge[schedule.status] || "default"}>
                    {statusLabels[schedule.status] || schedule.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600 pt-1.5 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Pelajaran:</span>
                    <span className="font-semibold">{schedule.lessonType === "THEORY" ? "Teori" : schedule.lessonType === "PRACTICE" ? "Praktik" : "Ujian"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Instruktur:</span>
                    <span className="font-semibold">{schedule.instructor.name}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px]">Mobil:</span>
                    <span className="font-semibold">{schedule.vehicle ? `${schedule.vehicle.brand} (${schedule.vehicle.plateNumber})` : "-"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsStudentModalOpen(false)}>
              Tutup
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal CS Direct Reschedule */}
      <Modal
        isOpen={isDirectRescheduleOpen}
        onClose={() => setIsDirectRescheduleOpen(false)}
        title={`Reschedule Jadwal Siswa: ${directRescheduleItem?.enrollment.student.name || ""}`}
        size="md"
      >
        <form onSubmit={handleDirectRescheduleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="bg-emerald-50 p-3.5 rounded-2xl text-xs text-emerald-900 space-y-1 border border-emerald-200">
            <p><span className="font-bold">Siswa:</span> {directRescheduleItem?.enrollment.student.name}</p>
            <p><span className="font-bold">Jadwal Lama:</span> {directRescheduleItem ? formatDate(directRescheduleItem.date) : ""} ({directRescheduleItem?.startTime} - {directRescheduleItem?.endTime})</p>
            <p><span className="font-bold">Instruktur Lama:</span> {directRescheduleItem?.instructor.name}</p>
          </div>

          <Input
            label="Tanggal Baru"
            type="date"
            value={directForm.date}
            onChange={(e) => setDirectForm({ ...directForm, date: e.target.value })}
            required
          />

          <Select
            label="Jam Latihan Baru (2 Jam)"
            value={directForm.startTime}
            onChange={(e) => setDirectForm({ ...directForm, startTime: e.target.value })}
            required
            options={[
              { value: "08:00", label: "Sesi Pagi (08:00 - 10:00)" },
              { value: "10:00", label: "Sesi Siang (10:00 - 12:00)" },
              { value: "13:00", label: "Sesi Siang 2 (13:00 - 15:00)" },
              { value: "15:00", label: "Sesi Sore (15:00 - 17:00)" },
            ]}
          />

          <Select
            label="Ganti Instruktur (Opsional)"
            value={directForm.instructorId}
            onChange={(e) => setDirectForm({ ...directForm, instructorId: e.target.value })}
            required
            options={instructors.map((i) => ({
              value: i.id,
              label: `${i.name} • Mobil: ${i.assignedVehicle ? `${i.assignedVehicle.brand} (${i.assignedVehicle.plateNumber})` : "Mobil Dinas"}`,
            }))}
          />

          {(() => {
            const chosenInst = instructors.find((i) => i.id === directForm.instructorId)
            return chosenInst ? (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                <span className="font-semibold">
                  Mobil Dinas Terikat: {chosenInst.assignedVehicle ? `${chosenInst.assignedVehicle.brand} ${chosenInst.assignedVehicle.model} (${chosenInst.assignedVehicle.plateNumber})` : "Unit Mobil Cabang"}
                </span>
                <Badge variant="brand">1 Instruktur 1 Mobil</Badge>
              </div>
            ) : null
          })()}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsDirectRescheduleOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading} className="bg-[#7ADA3A] text-slate-900 font-bold hover:bg-[#68c62f]">
              Simpan Jadwal Baru
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Approve Reschedule Pending */}
      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        title="Setujui Pengajuan Reschedule"
        size="md"
      >
        {selectedReschedule && (
          <div className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <p className="font-bold">Pengajuan Dari: {selectedReschedule.rescheduleRequestedBy === "STUDENT" ? "Siswa" : "Instruktur"}</p>
              <p><span className="font-semibold">Siswa:</span> {selectedReschedule.enrollment.student.name}</p>
              <p><span className="font-semibold">Jadwal Lama:</span> {formatDate(selectedReschedule.date)} ({selectedReschedule.startTime} - {selectedReschedule.endTime})</p>
              <p className="font-bold text-amber-900"><span className="font-semibold">Usulan Baru:</span> {selectedReschedule.requestedDate ? formatDate(selectedReschedule.requestedDate) : "-"} ({selectedReschedule.requestedStartTime} - {selectedReschedule.requestedEndTime})</p>
              {selectedReschedule.rescheduleReason && (
                <p className="italic text-amber-700 mt-1">"Alasan: {selectedReschedule.rescheduleReason}"</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Instruktur Bertugas"
                value={overrideInstructorId}
                onChange={(e) => setOverrideInstructorId(e.target.value)}
                options={instructors.map((i) => ({ value: i.id, label: i.name }))}
              />
              <Select
                label="Kendaraan Bertugas"
                value={overrideVehicleId}
                onChange={(e) => setOverrideVehicleId(e.target.value)}
                placeholder="Tanpa Kendaraan"
                options={vehicles.filter((v) => v.isActive).map((v) => ({ value: v.id, label: `${v.brand} ${v.model} (${v.plateNumber})` }))}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => setIsApproveModalOpen(false)}>
                Batal
              </Button>
              <Button type="button" variant="primary" onClick={handleApproveReschedule} isLoading={isLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                Setujui Jadwal Baru
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Reject Reschedule */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Tolak Pengajuan Reschedule"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Tolak pengajuan reschedule dari <strong>{selectedReschedule?.enrollment.student.name}</strong>?
          </p>

          <Input
            label="Alasan Penolakan"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            required
            placeholder="Contoh: Jadwal instruktur pada jam tersebut penuh"
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsRejectModalOpen(false)}>
              Batal
            </Button>
            <Button type="button" variant="danger" onClick={handleRejectReschedule} isLoading={isLoading}>
              Tolak Reschedule
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Add Schedule Manual */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Buat Jadwal Baru" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <Select
            label="Pendaftaran (Siswa)"
            value={form.enrollmentId}
            onChange={(e) => {
              const en = enrollments.find((x) => x.id === e.target.value)
              setForm({
                ...form,
                enrollmentId: e.target.value,
                courseId: en?.courseId || form.courseId,
              })
            }}
            required
            placeholder="Pilih Siswa Terdaftar"
            options={enrollments.filter((e: any) => e.status === "ACTIVE").map((e: any) => ({ value: e.id, label: `${e.student.name} - ${e.course.name}` }))}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Select
              label="Instruktur"
              value={form.instructorId}
              onChange={(e) => setForm({ ...form, instructorId: e.target.value })}
              required
              placeholder="Pilih Instruktur"
              options={instructors.map((i: any) => ({
                value: i.id,
                label: `${i.name} • ${i.assignedVehicle ? `${i.assignedVehicle.brand} (${i.assignedVehicle.plateNumber})` : "Mobil Dinas"}`,
              }))}
            />
            <Select label="Kursus" value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} required placeholder="Pilih Kursus" options={courses.map((c: any) => ({ value: c.id, label: c.name }))} />
          </div>

          {(() => {
            const chosenInst = instructors.find((i: any) => i.id === form.instructorId)
            return chosenInst ? (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                <span className="font-semibold">
                  Mobil Terikat Otomatis: {chosenInst.assignedVehicle ? `${chosenInst.assignedVehicle.brand} ${chosenInst.assignedVehicle.model} (${chosenInst.assignedVehicle.plateNumber})` : "Unit Mobil Cabang"}
                </span>
                <Badge variant="brand">1 Instruktur 1 Mobil</Badge>
              </div>
            ) : null
          })()}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <Input label="Tanggal" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            <Input label="Jam Mulai" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
            <Input label="Jam Selesai" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required />
          </div>

          <Select
            label="Jenis Pelajaran"
            value={form.lessonType}
            onChange={(e) => setForm({ ...form, lessonType: e.target.value })}
            options={[
              { value: "THEORY", label: "Teori" },
              { value: "PRACTICE", label: "Praktik (#7ADA3A)" },
              { value: "EXAM", label: "Ujian" },
            ]}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading} className="bg-[#7ADA3A] text-slate-900 font-bold hover:bg-[#68c62f]">
              Buat Jadwal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
