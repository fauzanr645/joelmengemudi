"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import {
  UserCheck,
  Calendar,
  Clock,
  Building2,
  Eye,
  Phone,
  Award,
  CheckCircle2,
  MessageSquare,
  GraduationCap,
  Users,
  BookOpen,
  ArrowRight,
  Car,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  ListFilter,
  Star,
  Bell,
} from "lucide-react"
import { formatDate, getWhatsAppLink, cn } from "@/lib/utils"

interface RatingItem {
  id: string
  rating: number
  review: string | null
  createdAt: string
  student: { id: string; name: string; phone?: string | null }
  schedule?: {
    date: string
    course?: { name: string }
  } | null
}

interface Instructor {
  id: string
  name: string
  email: string
  phone: string | null
  licenseNumber: string | null
  specialization: string | null
  branchId: string | null
  branch: { name: string; city: string } | null
  receivedRatings?: RatingItem[]
}

interface Schedule {
  id: string
  date: string
  startTime: string
  endTime: string
  lessonType: string
  status: string
  instructorId: string
  instructor: { id: string; name: string }
  enrollment: {
    studentId: string
    student: { id: string; name: string; phone: string | null; email: string }
  }
  course: { name: string; sessions: number }
  vehicle: { brand: string; plateNumber: string } | null
  branch: { name: string }
  attendance?: { isPresent: boolean; score: number | null; feedback: string | null } | null
}

interface StudentUnderInstructor {
  studentId: string
  studentName: string
  studentPhone: string | null
  studentEmail: string
  courseName: string
  branchName: string
  totalSchedules: number
  completedSchedules: number
  upcomingSchedules: number
  averageScore: number
  nextSession: Schedule | null
}

export default function CSInstructorsSchedulePage() {
  const [viewMode, setViewMode] = useState<"CALENDAR" | "CARDS">("CALENDAR")
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [ratings, setRatings] = useState<RatingItem[]>([])
  const [branchInfo, setBranchInfo] = useState<{ name: string; city: string } | null>(null)

  // Calendar Navigation State
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  )

  // Detail Modal State
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null)
  const [instructorAgenda, setInstructorAgenda] = useState<Schedule[]>([])
  const [instructorStudents, setInstructorStudents] = useState<StudentUnderInstructor[]>([])
  const [instructorReviews, setInstructorReviews] = useState<RatingItem[]>([])
  const [modalTab, setModalTab] = useState<"STUDENTS" | "AGENDA" | "RATINGS">("STUDENTS")
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchData = async () => {
    try {
      const [instrRes, schedRes, sessionRes, ratingsRes] = await Promise.all([
        fetch("/api/users?role=INSTRUCTOR"), // strictly CS branch
        fetch("/api/schedules"), // strictly CS branch
        fetch("/api/auth/session"),
        fetch("/api/ratings"), // ratings for this CS branch
      ])

      const instData: Instructor[] = await instrRes.json()
      const schedData: Schedule[] = await schedRes.json()
      const sessData = await sessionRes.json()
      const ratingData: RatingItem[] = await ratingsRes.json()

      setInstructors(instData)
      setSchedules(schedData)
      setRatings(Array.isArray(ratingData) ? ratingData : [])

      if (instData.length > 0 && instData[0].branch) {
        setBranchInfo(instData[0].branch)
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

  // Helper: calculate average rating for an instructor
  const getInstructorRatingStats = (instructorId: string) => {
    const instRatings = ratings.filter((r: any) => r.instructorId === instructorId || r.instructor?.id === instructorId)
    if (instRatings.length === 0) return { avg: 0, count: 0 }
    const sum = instRatings.reduce((acc, curr) => acc + curr.rating, 0)
    return {
      avg: Number((sum / instRatings.length).toFixed(1)),
      count: instRatings.length,
    }
  }

  // Helper to extract all unique students taught by an instructor
  const getStudentsForInstructor = (instructorId: string): StudentUnderInstructor[] => {
    const instSchedules = schedules.filter((s) => s.instructorId === instructorId)
    const map = new Map<string, StudentUnderInstructor>()

    instSchedules.forEach((s) => {
      const st = s.enrollment?.student
      if (!st) return

      if (!map.has(st.id)) {
        map.set(st.id, {
          studentId: st.id,
          studentName: st.name,
          studentPhone: st.phone || null,
          studentEmail: st.email || "",
          courseName: s.course?.name || "Kursus Mengemudi",
          branchName: s.branch?.name || "",
          totalSchedules: 0,
          completedSchedules: 0,
          upcomingSchedules: 0,
          averageScore: 0,
          nextSession: null,
        })
      }

      const item = map.get(st.id)!
      item.totalSchedules++
      if (s.status === "COMPLETED") {
        item.completedSchedules++
        if (s.attendance?.score) {
          item.averageScore =
            item.averageScore === 0 ? s.attendance.score : (item.averageScore + s.attendance.score) / 2
        }
      } else if (s.status === "SCHEDULED") {
        item.upcomingSchedules++
        if (!item.nextSession || new Date(s.date) < new Date(item.nextSession.date)) {
          item.nextSession = s
        }
      }
    })

    return Array.from(map.values())
  }

  // --- CALENDAR LOGIC ---
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ]
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]

  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1))
  const goToToday = () => {
    const today = new Date()
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelectedCalendarDate(today.toISOString().split("T")[0])
  }

  const schedulesByDate: { [dateStr: string]: Schedule[] } = {}
  schedules.forEach((s) => {
    const dStr = new Date(s.date).toISOString().split("T")[0]
    if (!schedulesByDate[dStr]) schedulesByDate[dStr] = []
    schedulesByDate[dStr].push(s)
  })

  const selectedDateSchedules = schedulesByDate[selectedCalendarDate] || []
  const instructorsOnSelectedDate = Array.from(new Set(selectedDateSchedules.map((s) => s.instructor.name)))
  const studentsOnSelectedDate = Array.from(new Set(selectedDateSchedules.map((s) => s.enrollment.student.name)))

  const todayStr = new Date().toISOString().split("T")[0]
  const todaySchedules = schedulesByDate[todayStr] || []

  // Instructors in this branch who have NO active schedules today (Completely Free)
  const freeInstructorsToday = instructors.filter((inst) => {
    return !todaySchedules.some(
      (s) => s.instructorId === inst.id && s.status !== "CANCELLED"
    )
  })

  const standardTimeSlots = [
    { start: "08:00", end: "10:00", label: "08:00 - 10:00" },
    { start: "10:00", end: "12:00", label: "10:00 - 12:00" },
    { start: "13:00", end: "15:00", label: "13:00 - 15:00" },
    { start: "15:00", end: "17:00", label: "15:00 - 17:00" },
  ]

  const viewInstructorModal = (
    instructor: Instructor,
    initialTab: "STUDENTS" | "AGENDA" | "RATINGS" = "STUDENTS"
  ) => {
    setSelectedInstructor(instructor)
    const agenda = schedules.filter((s) => s.instructorId === instructor.id)
    const studentsList = getStudentsForInstructor(instructor.id)
    const instReviews = ratings.filter(
      (r: any) => r.instructorId === instructor.id || r.instructor?.id === instructor.id
    )

    setInstructorAgenda(agenda)
    setInstructorStudents(studentsList)
    setInstructorReviews(instReviews)
    setModalTab(initialTab)
    setIsModalOpen(true)
  }

  const columns = [
    {
      key: "name",
      label: "Instruktur Cabang",
      render: (item: Instructor) => (
        <button
          type="button"
          onClick={() => viewInstructorModal(item, "STUDENTS")}
          className="flex items-center gap-3 text-left group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#7ADA3A]/15 text-[#254d0d] flex items-center justify-center font-bold shrink-0 border border-[#7ADA3A]/30 group-hover:scale-105 transition-transform">
            <UserCheck size={18} />
          </div>
          <div>
            <p className="font-bold text-slate-900 group-hover:text-[#2d5d14] group-hover:underline">{item.name}</p>
            <p className="text-xs text-slate-400 font-medium">{item.phone || item.email}</p>
          </div>
        </button>
      ),
    },
    {
      key: "rating",
      label: "Rating Siswa",
      render: (item: Instructor) => {
        const stats = getInstructorRatingStats(item.id)
        return (
          <button
            type="button"
            onClick={() => viewInstructorModal(item, "RATINGS")}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold hover:bg-amber-100 transition-colors cursor-pointer"
            title="Klik untuk lihat seluruh ulasan siswa"
          >
            <Star size={13} className="text-amber-500 fill-amber-400" />
            <span className="font-extrabold">{stats.avg > 0 ? stats.avg : "Baru"}</span>
            <span className="text-[11px] text-amber-700 font-normal">({stats.count} ulasan)</span>
          </button>
        )
      },
    },
    {
      key: "studentsTaught",
      label: "Siswa Yang Diajar",
      render: (item: Instructor) => {
        const students = getStudentsForInstructor(item.id)
        return (
          <button
            type="button"
            onClick={() => viewInstructorModal(item, "STUDENTS")}
            className="flex items-center gap-2 group cursor-pointer text-left"
          >
            <span className="px-2.5 py-1 rounded-xl text-xs font-extrabold bg-[#7ADA3A]/20 text-[#254d0d] border border-[#7ADA3A]/40 flex items-center gap-1.5 group-hover:bg-[#7ADA3A]/30 transition-colors">
              <GraduationCap size={14} className="text-[#386E1B]" />
              <span>{students.length} Siswa Bimbingan</span>
            </span>
          </button>
        )
      },
    },
    {
      key: "specialization",
      label: "Spesialisasi",
      render: (item: Instructor) => (
        <Badge variant={item.specialization === "MANUAL" ? "info" : item.specialization === "AUTOMATIC" ? "purple" : "brand"}>
          {item.specialization === "MANUAL" ? "Manual" : item.specialization === "AUTOMATIC" ? "Matic" : "Manual & Matic"}
        </Badge>
      ),
    },
    {
      key: "schedulesCount",
      label: "Sesi Aktif",
      render: (item: Instructor) => {
        const activeScheds = schedules.filter((s) => s.instructorId === item.id && s.status === "SCHEDULED")
        return (
          <span className={cn(
            "font-bold text-xs px-2.5 py-1 rounded-full",
            activeScheds.length > 0 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
          )}>
            {activeScheds.length} Terjadwal
          </span>
        )
      },
    },
    {
      key: "contact",
      label: "Kontak WA",
      render: (item: Instructor) =>
        item.phone ? (
          <a
            href={getWhatsAppLink(item.phone, `Halo Pak/Bu ${item.name}, salam dari CS joelmengemudi (${branchInfo?.name || ""}).`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-2xs"
          >
            <MessageSquare size={12} />
            <span>WA</span>
          </a>
        ) : (
          <span className="text-slate-400 text-xs">-</span>
        ),
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
            <span className="text-xs text-slate-400 font-medium">Monitoring Jadwal, Siswa, & Rating Instruktur</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Kalender Jadwal & Rating Instruktur
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Lihat kalender visual sesi mengajar, siswa yang sedang dibimbing, serta hasil rating & ulasan dari siswa untuk setiap instruktur
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200/80 self-start sm:self-auto">
          <button
            onClick={() => setViewMode("CALENDAR")}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
              viewMode === "CALENDAR"
                ? "bg-[#7ADA3A] text-slate-900 shadow-sm font-extrabold border border-[#6ecb30]"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            )}
          >
            <CalendarDays size={15} />
            <span>Kalender Visual</span>
          </button>

          <button
            onClick={() => setViewMode("CARDS")}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
              viewMode === "CARDS"
                ? "bg-[#7ADA3A] text-slate-900 shadow-sm font-extrabold border border-[#6ecb30]"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            )}
          >
            <Users size={15} />
            <span>Daftar Instruktur & Rating ({instructors.length})</span>
          </button>
        </div>
      </div>

      {/* PEMBERITAHUAN INSTRUKTUR KOSONG HARI INI */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#7ADA3A] text-slate-950 flex items-center justify-center font-black shrink-0">
              <Bell size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Pemberitahuan Instruktur Kosong Hari Ini ({formatDate(todayStr)})
              </h3>
              <p className="text-xs text-slate-500">
                {freeInstructorsToday.length > 0
                  ? `Ada ${freeInstructorsToday.length} instruktur di cabang ${branchInfo?.name || ""} yang tidak ada jadwal latihan hari ini (bebas/siap mengajar).`
                  : `Semua ${instructors.length} instruktur di cabang ${branchInfo?.name || ""} memiliki jadwal mengajar hari ini.`}
              </p>
            </div>
          </div>
          <span
            className={cn(
              "px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto",
              freeInstructorsToday.length > 0
                ? "bg-[#7ADA3A]/20 text-[#254d0d] border border-[#7ADA3A]/40"
                : "bg-slate-100 text-slate-600"
            )}
          >
            {freeInstructorsToday.length} Instruktur Bebas
          </span>
        </div>

        {freeInstructorsToday.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1 border-t border-slate-100">
            {freeInstructorsToday.map((inst) => {
              const waMsg = `Halo Pak/Bu ${inst.name}, ini CS joelmengemudi (${branchInfo?.name || ""}). Hari ini jadwal mengajar Anda kosong. Apakah siap jika ada siswa baru/tambahan? Terima kasih!`
              const waUrl = getWhatsAppLink(inst.phone, waMsg)
              return (
                <div
                  key={inst.id}
                  className="p-3 bg-slate-50/90 rounded-2xl border border-slate-200 flex items-center justify-between gap-2 hover:border-[#7ADA3A]/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-slate-900 truncate">{inst.name}</p>
                    <p className="text-[11px] text-slate-500 font-medium truncate">
                      {inst.specialization} • {inst.licenseNumber || "SIM-A"}
                    </p>
                  </div>
                  {inst.phone && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-2xs text-[11px] flex items-center gap-1 font-bold shrink-0"
                      title="Hubungi via WhatsApp"
                    >
                      <MessageSquare size={12} />
                      <span>WA</span>
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 1. VIEW MODE: KALENDER VISUAL LENGKAP */}
      {/* ============================================================== */}
      {viewMode === "CALENDAR" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* SISI KIRI: KALENDER BULANAN */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-[#7ADA3A] text-slate-900 flex items-center justify-center font-bold shadow-sm">
                  <Calendar size={20} />
                </div>
                <div>
                  <h2 className="font-extrabold text-base sm:text-lg text-slate-900">
                    {monthNames[month]} {year}
                  </h2>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Klik salah satu tanggal untuk melihat detail sesi instruktur & siswa
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Button size="xs" variant="outline" onClick={goToToday} className="text-xs font-bold">
                  Hari Ini
                </Button>
                <button
                  onClick={prevMonth}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  title="Bulan Sebelumnya"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  title="Bulan Berikutnya"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="space-y-2">
              <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider py-1">
                {dayNames.map((d, idx) => (
                  <div key={d} className={cn(idx === 0 && "text-rose-500")}>
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {Array.from({ length: firstDayOfMonth }).map((_, idx) => {
                  const prevDayNum = daysInPrevMonth - firstDayOfMonth + idx + 1
                  return (
                    <div
                      key={`prev-${idx}`}
                      className="min-h-[58px] sm:min-h-[72px] p-1.5 rounded-2xl bg-slate-50/40 text-slate-300 text-xs opacity-50"
                    >
                      <span className="font-medium text-[11px]">{prevDayNum}</span>
                    </div>
                  )
                })}

                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayNum = idx + 1
                  const dateStr = `${year}-${(month + 1).toString().padStart(2, "0")}-${dayNum
                    .toString()
                    .padStart(2, "0")}`
                  const daySchedules = schedulesByDate[dateStr] || []
                  const hasSchedules = daySchedules.length > 0
                  const isSelected = selectedCalendarDate === dateStr
                  const todayStr = new Date().toISOString().split("T")[0]
                  const isToday = dateStr === todayStr

                  const dayInstructors = Array.from(
                    new Set(daySchedules.map((s) => s.instructor.name.split(" ")[0]))
                  )
                  const dayStudents = Array.from(
                    new Set(daySchedules.map((s) => s.enrollment.student.name.split(" ")[0]))
                  )

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => setSelectedCalendarDate(dateStr)}
                      className={cn(
                        "min-h-[58px] sm:min-h-[72px] p-1.5 rounded-2xl border text-left flex flex-col justify-between transition-all relative cursor-pointer group",
                        isSelected
                          ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-[#7ADA3A]"
                          : hasSchedules
                          ? "bg-[#7ADA3A]/10 border-[#7ADA3A]/40 hover:border-[#7ADA3A] hover:bg-[#7ADA3A]/20"
                          : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={cn(
                            "text-xs font-bold px-1.5 py-0.5 rounded-md",
                            isSelected
                              ? "bg-[#7ADA3A] text-slate-950 font-black"
                              : isToday
                              ? "bg-slate-900 text-[#7ADA3A] font-black"
                              : "text-slate-700 group-hover:text-slate-900"
                          )}
                        >
                          {dayNum}
                        </span>

                        {hasSchedules && (
                          <span
                            className={cn(
                              "text-[10px] font-extrabold px-1.5 py-0.2 rounded-full",
                              isSelected
                                ? "bg-white/20 text-[#7ADA3A]"
                                : "bg-[#7ADA3A] text-slate-950 shadow-2xs"
                            )}
                          >
                            {daySchedules.length}
                          </span>
                        )}
                      </div>

                      {hasSchedules ? (
                        <div className="space-y-0.5 w-full mt-1">
                          <div
                            className={cn(
                              "text-[9px] sm:text-[10px] font-bold truncate rounded px-1 leading-tight flex items-center gap-0.5",
                              isSelected ? "text-[#7ADA3A]" : "text-[#244b0c] bg-white/70"
                            )}
                          >
                            <span>👨‍🏫</span>
                            <span className="truncate">{dayInstructors.join(", ")}</span>
                          </div>
                          <div
                            className={cn(
                              "text-[9px] sm:text-[10px] font-medium truncate rounded px-1 leading-tight flex items-center gap-0.5",
                              isSelected ? "text-slate-300" : "text-slate-600 bg-white/70"
                            )}
                          >
                            <span>👤</span>
                            <span className="truncate">{dayStudents.join(", ")}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-300 font-normal self-center block mb-1">-</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* SISI KANAN: DETAIL TANGGAL TERPILIH */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#7ADA3A] uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar size={13} />
                    <span>Jadwal Pada Tanggal</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#7ADA3A]/20 text-[#7ADA3A] border border-[#7ADA3A]/30">
                    {selectedDateSchedules.length} Sesi
                  </span>
                </div>
                <h3 className="text-lg font-black tracking-tight">{formatDate(selectedCalendarDate)}</h3>

                {selectedDateSchedules.length > 0 && (
                  <div className="pt-2 border-t border-slate-700/80 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Instruktur:</span>
                      <p className="font-bold text-white truncate">{instructorsOnSelectedDate.join(", ")}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Siswa:</span>
                      <p className="font-bold text-[#7ADA3A] truncate">{studentsOnSelectedDate.join(", ")}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {selectedDateSchedules.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-2xl border border-slate-100">
                    <Calendar size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-600">Tidak ada jadwal latihan pada tanggal ini.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                    {selectedDateSchedules.map((schedule) => {
                      const waMsg = `Halo Kak ${schedule.enrollment.student.name}, mengingatkan jadwal latihan mengemudi joelmengemudi (${branchInfo?.name || ""}) tanggal ${formatDate(schedule.date)} jam ${schedule.startTime} - ${schedule.endTime} bersama Instruktur ${schedule.instructor.name}. Sampai jumpa!`
                      const waUrl = getWhatsAppLink(schedule.enrollment.student.phone, waMsg)

                      return (
                        <div
                          key={schedule.id}
                          className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-[#7ADA3A]/60 transition-all space-y-2.5 shadow-2xs"
                        >
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
                            <Badge variant={schedule.status === "COMPLETED" ? "success" : "brand"}>
                              {schedule.status === "COMPLETED" ? "Selesai" : "Terjadwal"}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/60">
                            <div>
                              <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">👤 Siswa</span>
                              <p className="font-extrabold text-slate-900 text-sm truncate">{schedule.enrollment.student.name}</p>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">👨‍🏫 Instruktur</span>
                              <p className="font-extrabold text-slate-900 text-sm truncate">{schedule.instructor.name}</p>
                            </div>
                          </div>

                          {schedule.enrollment.student.phone && (
                            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-end">
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-2xs"
                              >
                                <MessageSquare size={13} />
                                <span>Kirim Pengingat WA</span>
                              </a>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. VIEW MODE: KARTU INSTRUKTUR, SISWA DIAJAR, & RATING BINTANG */}
      {/* ============================================================== */}
      {viewMode === "CARDS" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {instructors.map((instructor) => {
              const instSchedules = schedules.filter((s) => s.instructorId === instructor.id)
              const taughtStudents = getStudentsForInstructor(instructor.id)
              const stats = getInstructorRatingStats(instructor.id)

              return (
                <div
                  key={instructor.id}
                  className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:border-[#7ADA3A]/60 transition-all space-y-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-[#7ADA3A]/15 text-[#254d0d] flex items-center justify-center font-bold text-sm shrink-0 border border-[#7ADA3A]/30">
                        <UserCheck size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{instructor.name}</h3>
                        <p className="text-xs text-slate-400 font-medium">
                          SIM: {instructor.licenseNumber || "-"} • {instructor.specialization}
                        </p>
                      </div>
                    </div>

                    {/* Rating Badge Button */}
                    <button
                      type="button"
                      onClick={() => viewInstructorModal(instructor, "RATINGS")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold hover:bg-amber-100 transition-colors cursor-pointer shrink-0"
                    >
                      <Star size={14} className="text-amber-500 fill-amber-400" />
                      <span className="font-black">{stats.avg > 0 ? stats.avg : "Baru"}</span>
                      <span className="text-[10px] text-amber-700 font-normal">({stats.count} ulasan)</span>
                    </button>
                  </div>

                  {/* Summary Siswa Bimbingan */}
                  <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-[#3c7717] shrink-0" />
                      <span className="font-bold text-slate-800">
                        Membimbing {taughtStudents.length} Siswa:
                      </span>
                      <span className="text-slate-600 truncate max-w-[180px]">
                        {taughtStudents.map((s) => s.studentName).join(", ") || "Belum ada"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => viewInstructorModal(instructor, "STUDENTS")}
                      className="text-[#285213] font-bold hover:underline inline-flex items-center gap-0.5 shrink-0 self-start sm:self-auto cursor-pointer text-[11px]"
                    >
                      <span>Lihat Rincian</span>
                      <ArrowRight size={11} />
                    </button>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    <Button
                      size="xs"
                      variant="primary"
                      onClick={() => viewInstructorModal(instructor, "STUDENTS")}
                      className="bg-[#7ADA3A] text-slate-900 font-bold hover:bg-[#68c62f]"
                    >
                      <GraduationCap size={13} className="mr-1" /> Siswa Diajar ({taughtStudents.length})
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => viewInstructorModal(instructor, "RATINGS")}
                      className="border-amber-300 text-amber-800 hover:bg-amber-50"
                    >
                      <Star size={13} className="mr-1 text-amber-500 fill-amber-400" /> Ulasan Siswa ({stats.count})
                    </Button>
                    <Button size="xs" variant="outline" onClick={() => viewInstructorModal(instructor, "AGENDA")}>
                      <Calendar size={13} className="mr-1" /> Agenda
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          <DataTable
            columns={columns}
            data={instructors}
            searchable
            searchPlaceholder="Cari instruktur atau nomor SIM..."
            actions={(item: Instructor) => (
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => viewInstructorModal(item, "STUDENTS")}
                  className="bg-[#7ADA3A] text-slate-900 font-bold hover:bg-[#68c62f] text-xs"
                >
                  <GraduationCap size={13} className="mr-1" /> Siswa Diajar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => viewInstructorModal(item, "RATINGS")}
                  className="text-xs border-amber-300 text-amber-800 hover:bg-amber-50"
                >
                  <Star size={13} className="mr-1 text-amber-500 fill-amber-400" /> Rating
                </Button>
              </div>
            )}
          />
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3-TAB: SISWA DIAJAR, AGENDA, & RATING ULASAN SISWA */}
      {/* ============================================================== */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Instruktur: ${selectedInstructor?.name || ""}`}
        subtitle={`Cabang: ${branchInfo?.name || "-"} • SIM: ${selectedInstructor?.licenseNumber || "-"}`}
        size="lg"
      >
        <div className="space-y-4">
          {/* Modal Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setModalTab("STUDENTS")}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                modalTab === "STUDENTS"
                  ? "bg-[#7ADA3A] text-slate-900 shadow-sm border border-[#6ecb30]"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <GraduationCap size={15} />
              <span>Siswa Yang Diajar ({instructorStudents.length} Siswa)</span>
            </button>

            <button
              onClick={() => setModalTab("RATINGS")}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                modalTab === "RATINGS"
                  ? "bg-[#7ADA3A] text-slate-900 shadow-sm border border-[#6ecb30]"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <Star size={15} className="text-amber-500 fill-amber-400" />
              <span>Rating & Ulasan Siswa ({instructorReviews.length})</span>
            </button>

            <button
              onClick={() => setModalTab("AGENDA")}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                modalTab === "AGENDA"
                  ? "bg-[#7ADA3A] text-slate-900 shadow-sm border border-[#6ecb30]"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <Calendar size={15} />
              <span>Agenda Seluruh Sesi ({instructorAgenda.length})</span>
            </button>
          </div>

          {/* TAB 1: SISWA YANG DIAJAR */}
          {modalTab === "STUDENTS" && (
            <div className="space-y-3">
              {instructorStudents.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-400">
                  <GraduationCap size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-slate-600">Instruktur ini belum memiliki siswa yang diajar.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  {instructorStudents.map((st) => {
                    const waMsg = `Halo Kak ${st.studentName}, saya CS joelmengemudi (${branchInfo?.name || ""}) mengenai kursus latihan mengemudi Anda bersama Instruktur ${selectedInstructor?.name}.`
                    const waUrl = getWhatsAppLink(st.studentPhone, waMsg)
                    const percent = st.totalSchedules > 0 ? Math.round((st.completedSchedules / st.totalSchedules) * 100) : 0

                    return (
                      <div
                        key={st.studentId}
                        className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-[#7ADA3A]/60 shadow-2xs transition-all space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-sm shrink-0 border border-amber-200/60">
                              {st.studentName.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-slate-900">{st.studentName}</h4>
                              <p className="text-xs text-slate-400 font-medium">{st.courseName}</p>
                            </div>
                          </div>

                          {st.studentPhone && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-2xs self-start sm:self-auto"
                            >
                              <MessageSquare size={13} />
                              <span>WA Siswa</span>
                            </a>
                          )}
                        </div>

                        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-medium">
                              Kemajuan: <strong>{st.completedSchedules} Selesai</strong> dari {st.totalSchedules} Sesi
                            </span>
                            <span className="font-extrabold text-[#2a5513]">{percent}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#7ADA3A] to-[#5cb82a] rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          {st.nextSession && (
                            <p className="text-[11px] text-slate-600 pt-0.5">
                              Sesi Berikutnya: <strong className="text-slate-900">{formatDate(st.nextSession.date)}</strong> ({st.nextSession.startTime} - {st.nextSession.endTime})
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RATING & ULASAN DARI SISWA */}
          {modalTab === "RATINGS" && (
            <div className="space-y-4">
              {/* Summary Banner Rating */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-xs">
                    <Star size={24} className="fill-slate-950" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black text-slate-900">
                        {getInstructorRatingStats(selectedInstructor?.id || "").avg}
                      </span>
                      <div className="flex items-center text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className={cn(
                              i < Math.round(getInstructorRatingStats(selectedInstructor?.id || "").avg)
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-300"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">
                      Berdasarkan {instructorReviews.length} ulasan siswa di cabang {branchInfo?.name || ""}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reviews List */}
              {instructorReviews.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-400">
                  <Star size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-slate-600">Belum ada rating atau ulasan dari siswa untuk instruktur ini.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Siswa dapat memberikan bintang 1-5 dan ulasan setelah sesi latihan berstatus selesai.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                  {instructorReviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 transition-colors shadow-2xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{rev.student.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{formatDate(rev.createdAt)}</span>
                          </div>
                          {rev.schedule?.course && (
                            <p className="text-[11px] text-slate-400">{rev.schedule.course.name}</p>
                          )}
                        </div>

                        {/* Stars */}
                        <div className="flex items-center text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              className={cn(
                                i < rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                              )}
                            />
                          ))}
                        </div>
                      </div>

                      {rev.review ? (
                        <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                          "{rev.review}"
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">Tanpa komentar tertulis.</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AGENDA SELURUH SESI */}
          {modalTab === "AGENDA" && (
            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {instructorAgenda.map((sched, idx) => (
                <div key={sched.id} className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-[#7ADA3A]/20 text-[#295413] font-bold text-[10px] flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-xs text-slate-800">{formatDate(sched.date)}</span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock size={11} /> {sched.startTime} - {sched.endTime}
                      </span>
                    </div>
                    <Badge variant={sched.status === "COMPLETED" ? "success" : "brand"}>
                      {sched.status === "COMPLETED" ? "Selesai" : "Terjadwal"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Siswa:</span>
                      <span className="font-bold text-slate-900">{sched.enrollment.student.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Pelajaran:</span>
                      <span className="font-semibold text-slate-800">
                        {sched.lessonType === "THEORY" ? "Teori" : sched.lessonType === "PRACTICE" ? "Praktik" : "Ujian"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Mobil:</span>
                      <span className="font-semibold text-slate-800">
                        {sched.vehicle ? `${sched.vehicle.brand} (${sched.vehicle.plateNumber})` : "-"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Tutup
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
