"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Modal } from "@/components/ui/modal"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { Plus, Edit2, GraduationCap, Eye, Building2, Calendar, Clock, CheckCircle2, Phone, Mail, MessageSquare } from "lucide-react"
import { formatDate, getWhatsAppLink, cn } from "@/lib/utils"

interface Student {
  id: string
  name: string
  email: string
  phone: string | null
  gender: string | null
  address: string | null
  isActive: boolean
  branch: { name: string } | null
  branchId: string | null
  createdAt: string
  enrollments?: {
    id: string
    status: string
    course: { name: string; courseType: string }
  }[]
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

interface Branch {
  id: string
  name: string
  city: string
}

export default function StudentsPage() {
  const [allStudents, setAllStudents] = useState<Student[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [studentSchedules, setStudentSchedules] = useState<StudentSchedule[]>([])
  const [loadingSchedules, setLoadingSchedules] = useState(false)
  const [editingUser, setEditingUser] = useState<Student | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "",
    branchId: "", gender: "", address: "",
  })

  const fetchData = async () => {
    const [userRes, branchRes] = await Promise.all([
      fetch("/api/users?role=STUDENT"),
      fetch("/api/branches"),
    ])
    setAllStudents(await userRes.json())
    setBranches(await branchRes.json())
  }

  useEffect(() => { fetchData() }, [])

  const filteredStudents = selectedBranch === "ALL"
    ? allStudents
    : allStudents.filter(u => u.branchId === selectedBranch)

  const getBranchCount = (branchId: string) =>
    allStudents.filter(u => u.branchId === branchId).length

  const openModal = (user?: Student) => {
    if (user) {
      setEditingUser(user)
      setForm({
        name: user.name, email: user.email, phone: user.phone || "",
        password: "", branchId: user.branchId || "",
        gender: user.gender || "", address: user.address || "",
      })
    } else {
      setEditingUser(null)
      setForm({
        name: "", email: "", phone: "", password: "",
        branchId: selectedBranch !== "ALL" ? selectedBranch : "",
        gender: "", address: "",
      })
    }
    setIsModalOpen(true)
  }

  const viewDetail = async (student: Student) => {
    setSelectedStudent(student)
    setIsDetailOpen(true)
    setLoadingSchedules(true)
    try {
      const [userRes, schedRes] = await Promise.all([
        fetch(`/api/users/${student.id}`),
        fetch(`/api/schedules?studentId=${student.id}&allBranches=true`),
      ])
      const userData = await userRes.json()
      const schedData = await schedRes.json()
      setSelectedStudent(userData)
      const filtered = Array.isArray(schedData)
        ? schedData.filter((s: any) => s.enrollment?.studentId === student.id || s.enrollment?.student?.id === student.id)
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
      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users"
      const method = editingUser ? "PUT" : "POST"
      const payload: Record<string, string> = { ...form, role: "STUDENT" }
      if (editingUser && !payload.password) delete payload.password
      await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      setIsModalOpen(false)
      fetchData()
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const statusBadge: Record<string, "success" | "info" | "danger" | "warning" | "brand"> = {
    SCHEDULED: "info", COMPLETED: "success", CANCELLED: "danger", RESCHEDULED: "brand",
  }
  const statusLabels: Record<string, string> = {
    SCHEDULED: "Terjadwal", COMPLETED: "Selesai", CANCELLED: "Dibatalkan", RESCHEDULED: "Dijadwal Ulang",
  }

  const columns = [
    {
      key: "name",
      label: "Nama Siswa",
      render: (item: Student) => (
        <button
          type="button"
          onClick={() => viewDetail(item)}
          className="flex items-center gap-3 text-left group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shrink-0 border border-amber-200/60 group-hover:scale-105 transition-transform">
            <GraduationCap size={18} />
          </div>
          <div>
            <p className="font-bold text-slate-900 group-hover:text-[#2d5d14] group-hover:underline">
              {item.name}
            </p>
            <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <Mail size={10} /> {item.email}
            </p>
          </div>
        </button>
      ),
    },
    {
      key: "phone",
      label: "Kontak & WA",
      render: (item: Student) => (
        item.phone ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">{item.phone}</span>
            <a
              href={getWhatsAppLink(item.phone, `Halo Kak ${item.name}, salam dari joelmengemudi.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
              title="Hubungi WhatsApp"
            >
              <MessageSquare size={13} />
            </a>
          </div>
        ) : (
          <span className="text-xs text-slate-400">-</span>
        )
      ),
    },
    {
      key: "gender",
      label: "Gender",
      render: (item: Student) => (
        <span className="text-xs text-slate-600 font-medium">
          {item.gender === "MALE" ? "Laki-laki" : item.gender === "FEMALE" ? "Perempuan" : "-"}
        </span>
      ),
    },
    ...(selectedBranch === "ALL"
      ? [
          {
            key: "branch",
            label: "Cabang Terdaftar",
            render: (item: Student) =>
              item.branch ? (
                <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {item.branch.name}
                </span>
              ) : (
                <span className="text-slate-400 text-xs">-</span>
              ),
          },
        ]
      : []),
    {
      key: "createdAt",
      label: "Terdaftar",
      render: (item: Student) => (
        <span className="text-xs text-slate-500 font-medium">{formatDate(item.createdAt)}</span>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      render: (item: Student) => (
        <Badge variant={item.isActive ? "brand" : "danger"} dot>
          {item.isActive ? "Aktif Belajar" : "Nonaktif"}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Kelola Siswa Kursus</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Klik nama siswa untuk melihat profil lengkap, paket yang diambil, dan jadwal sesi latihan
          </p>
        </div>
        <Button
          onClick={() => openModal()}
          variant="primary"
          leftIcon={<Plus size={16} />}
          className="self-start sm:self-auto font-bold text-slate-900 bg-[#7ADA3A] hover:bg-[#68c62f]"
        >
          Tambah Siswa Baru
        </Button>
      </div>

      {/* Branch Filter Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/60">
        <button
          onClick={() => setSelectedBranch("ALL")}
          className={cn(
            "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
            selectedBranch === "ALL"
              ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          )}
        >
          <Building2 size={14} className={selectedBranch === "ALL" ? "text-[#386E1B]" : "text-slate-400"} />
          <span>Semua Cabang</span>
          <span className={cn(
            "px-2 py-0.5 rounded-full text-[10px]",
            selectedBranch === "ALL" ? "bg-[#7ADA3A]/20 text-[#295214]" : "bg-slate-200 text-slate-600"
          )}>
            {allStudents.length}
          </span>
        </button>
        {branches.map((branch) => (
          <button
            key={branch.id}
            onClick={() => setSelectedBranch(branch.id)}
            className={cn(
              "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
              selectedBranch === branch.id
                ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            )}
          >
            <span>{branch.name}</span>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px]",
              selectedBranch === branch.id ? "bg-[#7ADA3A]/20 text-[#295214]" : "bg-slate-200 text-slate-600"
            )}>
              {getBranchCount(branch.id)}
            </span>
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filteredStudents}
        searchable
        searchPlaceholder="Cari nama siswa atau email..."
        emptyMessage={selectedBranch === "ALL" ? "Belum ada siswa terdaftar." : "Belum ada siswa di cabang ini."}
        actions={(item: Student) => (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => viewDetail(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-[#285314] hover:bg-[#7ADA3A]/15 transition-colors cursor-pointer"
              title="Lihat Detail & Jadwal"
            >
              <Eye size={15} />
            </button>
            <button
              onClick={() => openModal(item)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Edit Data Siswa"
            >
              <Edit2 size={15} />
            </button>
          </div>
        )}
      />

      {/* Modal Add / Edit Student */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? "Edit Data Siswa" : "Tambah Siswa Baru"}
        subtitle="Masukkan identitas siswa kursus joelmengemudi"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nama Lengkap Siswa"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Contoh: Rina Wati"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Email Siswa"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="siswa@demo.com"
              required
            />
            <Input
              label="Nomor WhatsApp / HP"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="081234567890"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Password Akun"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={!editingUser}
              helperText={editingUser ? "Kosongkan jika tidak ingin mengganti password" : ""}
            />
            <Select
              label="Pendaftaran Cabang"
              value={form.branchId}
              onChange={(e) => setForm({ ...form, branchId: e.target.value })}
              required
              placeholder="Pilih Cabang Kursus"
              options={branches.map((b) => ({ value: b.id, label: b.name }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Select
              label="Jenis Kelamin"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              placeholder="Pilih Jenis Kelamin"
              options={[
                { value: "MALE", label: "Laki-laki" },
                { value: "FEMALE", label: "Perempuan" },
              ]}
            />
            <Input
              label="Alamat Lengkap"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Alamat domisili siswa"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading} className="bg-[#7ADA3A] text-slate-900 font-bold">
              {editingUser ? "Simpan Perubahan" : "Daftarkan Siswa"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Detail Siswa & Seluruh Jadwal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Detail Siswa & Jadwal Latihan"
        subtitle={selectedStudent?.name || ""}
        size="lg"
      >
        {selectedStudent && (
          <div className="space-y-5">
            {/* Header Profile */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-[#7ADA3A]/10 to-transparent border border-[#7ADA3A]/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#7ADA3A] text-slate-900 flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                  <GraduationCap size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{selectedStudent.name}</h3>
                  <p className="text-xs text-slate-500">{selectedStudent.email} • {selectedStudent.phone || "Tidak ada HP"}</p>
                  <p className="text-xs text-[#2b5914] font-semibold mt-0.5">
                    Cabang: {selectedStudent.branch?.name || "Semua Cabang"}
                  </p>
                </div>
              </div>

              {selectedStudent.phone && (
                <a
                  href={getWhatsAppLink(selectedStudent.phone, `Halo Kak ${selectedStudent.name}, salam dari joelmengemudi.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-xs shrink-0 self-start sm:self-auto"
                >
                  <MessageSquare size={14} />
                  <span>Kirim WhatsApp</span>
                </a>
              )}
            </div>

            {/* Kursus Yang Diikuti */}
            {selectedStudent.enrollments && selectedStudent.enrollments.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Paket Kursus Aktif
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedStudent.enrollments.map((en) => (
                    <div key={en.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-xs text-slate-800">{en.course.name}</p>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Transmisi: {en.course.courseType === "MANUAL" ? "Manual" : "Matic"}
                        </span>
                      </div>
                      <Badge variant={en.status === "ACTIVE" ? "brand" : "success"} dot>
                        {en.status === "ACTIVE" ? "Aktif" : "Selesai"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* List Jadwal Sesi */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={14} className="text-[#3c7717]" />
                  <span>Daftar Jadwal Sesi Latihan ({studentSchedules.length} Sesi)</span>
                </h4>
              </div>

              {loadingSchedules ? (
                <p className="text-center py-6 text-xs text-slate-400 font-medium">Memuat jadwal siswa...</p>
              ) : studentSchedules.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/60 text-center text-xs text-slate-400">
                  Belum ada jadwal sesi yang dibuat untuk siswa ini.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {studentSchedules.map((s, idx) => (
                    <div key={s.id} className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-[#7ADA3A]/60 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-[#7ADA3A]/20 text-[#295413] font-bold text-[10px] flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </span>
                          <span className="font-bold text-xs text-slate-800">{formatDate(s.date)}</span>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Clock size={11} /> {s.startTime} - {s.endTime}
                          </span>
                        </div>
                        <Badge variant={statusBadge[s.status] || "default"}>
                          {statusLabels[s.status] || s.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600 pt-2 border-t border-slate-100">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Pelajaran:</span>
                          <span className="font-semibold text-slate-800">
                            {s.lessonType === "THEORY" ? "Teori" : s.lessonType === "PRACTICE" ? "Praktik" : "Ujian"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Instruktur:</span>
                          <span className="font-semibold text-slate-800">{s.instructor.name}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-400 block text-[10px]">Armada Mobil:</span>
                          <span className="font-semibold text-slate-800">
                            {s.vehicle ? `${s.vehicle.brand} (${s.vehicle.plateNumber})` : "Belum ditugaskan"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => setIsDetailOpen(false)}>
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
