"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Modal } from "@/components/ui/modal"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { Plus, Calendar, Clock, CheckCircle, MessageSquare } from "lucide-react"
import { formatDate, getWhatsAppLink } from "@/lib/utils"

interface Student {
  id: string
  name: string
  email: string
  phone: string | null
  gender: string | null
  address: string | null
  isActive: boolean
  createdAt: string
}

interface StudentSchedule {
  id: string
  date: string
  startTime: string
  endTime: string
  lessonType: string
  status: string
  course: { name: string }
  instructor: { name: string }
  vehicle: { brand: string; plateNumber: string } | null
  attendance?: { isPresent: boolean; score: number | null; feedback: string | null } | null
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", gender: "", address: "",
  })

  // Schedule detail modal state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [studentSchedules, setStudentSchedules] = useState<StudentSchedule[]>([])
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [loadingSchedules, setLoadingSchedules] = useState(false)

  const fetchStudents = async () => {
    const res = await fetch("/api/users?role=STUDENT")
    const data = await res.json()
    setStudents(data)
  }

  useEffect(() => { fetchStudents() }, [])

  const viewStudentSchedules = async (student: Student) => {
    setSelectedStudent(student)
    setIsScheduleModalOpen(true)
    setLoadingSchedules(true)
    try {
      const res = await fetch(`/api/schedules?studentId=${student.id}`)
      const data = await res.json()
      const filtered = Array.isArray(data)
        ? data.filter((s: any) => s.enrollment?.studentId === student.id || s.enrollment?.student?.id === student.id)
        : []
      setStudentSchedules(filtered)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingSchedules(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role: "STUDENT" }),
      })
      setIsModalOpen(false)
      setForm({ name: "", email: "", phone: "", password: "", gender: "", address: "" })
      fetchStudents()
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const statusBadge: Record<string, "success" | "info" | "danger" | "warning"> = {
    SCHEDULED: "info", COMPLETED: "success", CANCELLED: "danger", RESCHEDULED: "warning",
  }
  const statusLabels: Record<string, string> = {
    SCHEDULED: "Terjadwal", COMPLETED: "Selesai", CANCELLED: "Dibatalkan", RESCHEDULED: "Dijadwal Ulang",
  }
  const lessonLabels: Record<string, string> = { THEORY: "Teori", PRACTICE: "Praktik", EXAM: "Ujian" }

  const columns = [
    { key: "name", label: "Nama Siswa", render: (item: Student) => (
      <button
        type="button"
        onClick={() => viewStudentSchedules(item)}
        className="font-medium text-gray-900 hover:text-[#3d8019] hover:underline text-left"
      >
        <p>{item.name}</p>
        <p className="text-xs text-gray-500 font-normal">{item.email}</p>
      </button>
    )},
    { key: "phone", label: "Telepon / WA", render: (item: Student) => (
      item.phone ? (
        <div className="flex items-center gap-2">
          <span>{item.phone}</span>
          <a
            href={getWhatsAppLink(item.phone, `Halo Kak ${item.name}, ini dari Customer Service Kursus Mengemudi.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
            title="Chat WhatsApp"
          >
            <MessageSquare size={13} />
          </a>
        </div>
      ) : "-"
    )},
    { key: "gender", label: "Jenis Kelamin", render: (item: Student) => (
      item.gender === "MALE" ? "Laki-laki" : item.gender === "FEMALE" ? "Perempuan" : "-"
    )},
    { key: "isActive", label: "Status", render: (item: Student) => (
      <Badge variant={item.isActive ? "success" : "danger"}>
        {item.isActive ? "Aktif" : "Nonaktif"}
      </Badge>
    )},
  ]

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Kelola Siswa Kursus</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Daftar siswa cabang joelmengemudi. Klik nama siswa untuk riwayat jadwal atau tombol WA untuk komunikasi.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <a
            href="/cs/settings"
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:border-[#7ADA3A] hover:bg-[#7ADA3A]/10 transition-colors shadow-2xs"
          >
            Pengaturan & Reset Akun
          </a>
          <Button onClick={() => setIsModalOpen(true)} className="bg-[#7ADA3A] text-slate-900 font-bold hover:bg-[#68c62f]">
            <Plus size={16} className="mr-1.5" /> Tambah Siswa
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={students}
        searchable
        searchPlaceholder="Cari siswa..."
        actions={(item: Student) => (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => viewStudentSchedules(item)}
              className="text-xs flex items-center gap-1"
            >
              <Calendar size={14} />
              <span>Lihat Jadwal</span>
            </Button>
            {item.phone && (
              <a
                href={getWhatsAppLink(item.phone, `Halo Kak ${item.name}, ini dari Customer Service Kursus Mengemudi.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm"
              >
                <MessageSquare size={13} />
                <span>WA</span>
              </a>
            )}
          </div>
        )}
      />

      {/* Modal All Schedules for Student */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title={`Jadwal Kursus: ${selectedStudent?.name || ""}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-emerald-50 p-3 rounded-lg text-sm text-emerald-900 flex justify-between items-center">
            <div>
              <p className="font-semibold">{selectedStudent?.name}</p>
              <p className="text-xs text-emerald-700">{selectedStudent?.email} {selectedStudent?.phone ? `| ${selectedStudent.phone}` : ""}</p>
            </div>
            {selectedStudent?.phone && (
              <a
                href={getWhatsAppLink(selectedStudent.phone, `Halo Kak ${selectedStudent.name}, mengenai jadwal kursus mengemudi Anda...`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-600 text-white hover:bg-green-700"
              >
                <MessageSquare size={14} />
                <span>Hubungi WA</span>
              </a>
            )}
          </div>

          {loadingSchedules ? (
            <p className="text-center py-6 text-gray-500 text-sm">Memuat jadwal...</p>
          ) : studentSchedules.length === 0 ? (
            <p className="text-center py-6 text-gray-500 text-sm">Belum ada jadwal untuk siswa ini.</p>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {studentSchedules.map((schedule, idx) => (
                <div key={schedule.id} className="p-4 border border-gray-200 rounded-xl bg-white">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#7ADA3A]/20 text-emerald-700 font-semibold text-xs flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <p className="font-semibold text-gray-900 text-sm">{formatDate(schedule.date)}</p>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock size={12} /> {schedule.startTime} - {schedule.endTime}
                      </span>
                    </div>
                    <Badge variant={statusBadge[schedule.status]}>{statusLabels[schedule.status]}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-2 pt-2 border-t border-gray-100">
                    <div>
                      <span className="text-gray-400">Kursus:</span> <span className="font-medium text-gray-800">{schedule.course.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Jenis:</span> <span className="font-medium text-gray-800">{lessonLabels[schedule.lessonType]}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Instruktur:</span> <span className="font-medium text-gray-800">{schedule.instructor.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Kendaraan:</span> <span className="font-medium text-gray-800">{schedule.vehicle ? `${schedule.vehicle.brand} (${schedule.vehicle.plateNumber})` : "-"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="secondary" onClick={() => setIsScheduleModalOpen(false)}>Tutup</Button>
          </div>
        </div>
      </Modal>

      {/* Modal Add Student */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Siswa Baru">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nama Lengkap" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <Input label="Telepon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            <Select label="Jenis Kelamin" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} placeholder="Pilih" options={[
              { value: "MALE", label: "Laki-laki" },
              { value: "FEMALE", label: "Perempuan" },
            ]} />
          </div>
          <Input label="Alamat" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" isLoading={isLoading}>Tambah</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
