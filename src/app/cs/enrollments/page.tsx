"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Modal } from "@/components/ui/modal"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { Input } from "@/components/ui/input"
import { Plus, CheckCircle2, Clock, BookOpen, User, AlertCircle, Car } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

interface Enrollment {
  id: string
  status: string
  startDate: string
  student: { id: string; name: string; email: string; phone: string | null }
  course: { id: string; name: string; courseType: string; price: number; sessions: number; duration: number }
  branch: { name: string }
  schedules?: {
    id: string
    date: string
    startTime: string
    endTime: string
    status: string
    instructor: { name: string }
  }[]
  _count: { payments: number; schedules: number }
}

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [instructors, setInstructors] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [form, setForm] = useState({
    studentId: "",
    courseId: "",
    startDate: new Date().toISOString().split("T")[0],
    instructorId: "",
    vehicleId: "",
    startTime: "08:00",
    intervalDays: "2",
    notes: "",
  })

  const fetchData = async () => {
    const [enrollRes, studentRes, courseRes, instrRes, vehRes] = await Promise.all([
      fetch("/api/enrollments"),
      fetch("/api/users?role=STUDENT"),
      fetch("/api/courses"),
      fetch("/api/users?role=INSTRUCTOR"),
      fetch("/api/vehicles"),
    ])
    setEnrollments(await enrollRes.json())
    setStudents(await studentRes.json())
    setCourses(await courseRes.json())
    setInstructors(await instrRes.json())
    setVehicles(await vehRes.json())
  }

  useEffect(() => { fetchData() }, [])

  const selectedCourse = courses.find(c => c.id === form.courseId)

  // Filter instructors strictly matching the selected course package's transmission
  const matchingInstructors = instructors.filter((i: any) => {
    if (!selectedCourse) return true
    if (selectedCourse.courseType === "MANUAL") {
      return i.specialization === "MANUAL" || i.specialization === "BOTH"
    }
    if (selectedCourse.courseType === "AUTOMATIC") {
      return i.specialization === "AUTOMATIC" || i.specialization === "BOTH"
    }
    return true // BOTH / Mix
  })

  // Selected instructor object
  const selectedInstructorObj = instructors.find((i: any) => i.id === form.instructorId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      setIsModalOpen(false)
      setForm({
        studentId: "",
        courseId: "",
        startDate: new Date().toISOString().split("T")[0],
        instructorId: "",
        vehicleId: "",
        startTime: "08:00",
        intervalDays: "2",
        notes: "",
      })
      fetchData()
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const columns = [
    {
      key: "student",
      label: "Siswa Terdaftar",
      render: (item: Enrollment) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-200/60">
            {item.student.name.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-slate-900">{item.student.name}</p>
            <p className="text-xs text-slate-400 font-normal">{item.student.phone || item.student.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "course",
      label: "Paket Kursus",
      render: (item: Enrollment) => (
        <div>
          <p className="font-bold text-slate-900">{item.course.name}</p>
          <div className="flex items-center gap-2 mt-0.5 text-xs">
            <span className="font-extrabold text-[#2a5513]">
              {formatCurrency(item.course.price)}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500 font-medium">
              {item.course.duration} Jam ({item.course.sessions} Sesi @ 2 Jam)
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "startDate",
      label: "Mulai Kursus",
      render: (item: Enrollment) => (
        <span className="text-xs text-slate-600 font-medium">{formatDate(item.startDate)}</span>
      ),
    },
    {
      key: "progress",
      label: "Jadwal Sesi Latihan",
      render: (item: Enrollment) => (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#2a5513]">
              {item._count.schedules} dari {item.course.sessions} Sesi
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {Math.min(100, Math.round((item._count.schedules / item.course.sessions) * 100))}%
            </span>
          </div>
          <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#7ADA3A] to-[#5cb82a] rounded-full"
              style={{
                width: `${Math.min(100, Math.round((item._count.schedules / item.course.sessions) * 100))}%`,
              }}
            />
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status Kursus",
      render: (item: Enrollment) => (
        <Badge variant={item.status === "ACTIVE" ? "brand" : "success"} dot>
          {item.status === "ACTIVE" ? "Sedang Berjalan" : "Telah Selesai"}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pendaftaran Kursus</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Pendaftaran siswa joelmengemudi dengan pembuatan seluruh jadwal sesi otomatis (2 jam per sesi)
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          variant="primary"
          leftIcon={<Plus size={16} />}
          className="self-start sm:self-auto font-bold text-slate-900 bg-[#7ADA3A] hover:bg-[#68c62f]"
        >
          Pendaftaran Siswa Baru
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={enrollments}
        searchable
        searchPlaceholder="Cari siswa atau paket kursus..."
        emptyMessage="Belum ada pendaftaran kursus."
      />

      {/* Modal Pendaftaran & Auto Generate Schedules */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Pendaftaran Kursus & Generate Jadwal Otomatis"
        subtitle="Pilih siswa dan paket latihan untuk langsung membuat seluruh sesi jadwalnya"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Pilih Siswa"
            value={form.studentId}
            onChange={(e) => setForm({ ...form, studentId: e.target.value })}
            required
            placeholder="Pilih Siswa yang Terdaftar"
            options={students.map((s: any) => ({ value: s.id, label: `${s.name} (${s.email})` }))}
          />

          <Select
            label="Pilih Paket Kursus (Manual / Matic / Mix)"
            value={form.courseId}
            onChange={(e) => setForm({ ...form, courseId: e.target.value })}
            required
            placeholder="Pilih Paket Kursus"
            options={courses.map((c: any) => ({
              value: c.id,
              label: `${c.name} - ${formatCurrency(c.price)} (${c.sessions} Sesi @ 2 Jam)`,
            }))}
          />

          {selectedCourse && (
            <div className="p-4 bg-[#7ADA3A]/15 border border-[#7ADA3A]/30 rounded-2xl text-xs text-[#244b0c] flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <span className="font-extrabold text-sm text-slate-900 block">{selectedCourse.name}</span>
                <p className="text-slate-600 font-medium">{selectedCourse.description}</p>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-white font-bold text-[#2e5e15] border border-[#7ADA3A]/40 shrink-0 shadow-2xs">
                {selectedCourse.sessions} Sesi (2 Jam/Sesi)
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Tanggal Mulai Sesi Pertama"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              required
            />
            <Select
              label="Jam Latihan Per Sesi (2 Jam)"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              required
              options={[
                { value: "08:00", label: "Pagi (08:00 - 10:00)" },
                { value: "10:00", label: "Siang (10:00 - 12:00)" },
                { value: "13:00", label: "Siang 2 (13:00 - 15:00)" },
                { value: "15:00", label: "Sore (15:00 - 17:00)" },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Select
              label="Pilih Instruktur Pelatih"
              value={form.instructorId}
              onChange={(e) => setForm({ ...form, instructorId: e.target.value })}
              placeholder={
                selectedCourse
                  ? `Pilih Instruktur ${selectedCourse.courseType === "MANUAL" ? "Manual" : selectedCourse.courseType === "AUTOMATIC" ? "Matic" : "Kombinasi"}`
                  : "Pilih Paket Kursus Terlebih Dahulu"
              }
              options={matchingInstructors.map((i: any) => ({
                value: i.id,
                label: `${i.name} (${i.specialization}) • ${i.assignedVehicle ? `${i.assignedVehicle.brand} ${i.assignedVehicle.plateNumber}` : "Unit Mobil Cabang"}`,
              }))}
            />
            <Select
              label="Interval Antar Sesi Latihan"
              value={form.intervalDays}
              onChange={(e) => setForm({ ...form, intervalDays: e.target.value })}
              options={[
                { value: "1", label: "Setiap Hari (Intensif)" },
                { value: "2", label: "Setiap 2 Hari Sekali (Standar)" },
                { value: "3", label: "Setiap 3 Hari Sekali" },
                { value: "7", label: "Seminggu Sekali (Santai)" },
              ]}
            />
          </div>

          {/* Auto Dedicated Car Badge (1 Car per Instructor) */}
          {selectedInstructorObj && (
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200/80 flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#7ADA3A] text-slate-950 flex items-center justify-center font-bold shrink-0">
                  <Car size={16} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">
                    Mobil Dinas Khusus: {selectedInstructorObj.assignedVehicle ? `${selectedInstructorObj.assignedVehicle.brand} ${selectedInstructorObj.assignedVehicle.model} (${selectedInstructorObj.assignedVehicle.plateNumber})` : "Mobil Dinas Cabang"}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Sistem 1:1 • Mobil otomatis terikat dengan Instruktur {selectedInstructorObj.name}
                  </p>
                </div>
              </div>
              <Badge variant="brand">1 Instruktur 1 Mobil</Badge>
            </div>
          )}

          <Input
            label="Catatan Pendaftaran"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Contoh: Siswa minta hari Sabtu/Minggu saja atau catatan khusus lainnya"
          />

          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-600 flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-[#3c7717] shrink-0" />
            <span>
              Sistem akan otomatis membuat seluruh <strong>{selectedCourse ? selectedCourse.sessions : "2 - 5"} sesi jadwal</strong> lengkap dengan sesi Teori, Praktik, dan Ujian tanpa bentrok.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="bg-[#7ADA3A] text-slate-900 font-bold hover:bg-[#68c62f]"
            >
              Daftarkan & Buat Jadwal Otomatis
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
