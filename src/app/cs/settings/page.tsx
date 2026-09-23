"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Modal } from "@/components/ui/modal"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import {
  GraduationCap,
  KeyRound,
  Edit2,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Power,
  ShieldCheck,
  Calendar,
  Building2,
} from "lucide-react"
import { formatDate, getWhatsAppLink, cn } from "@/lib/utils"

interface Student {
  id: string
  name: string
  email: string
  phone: string | null
  gender: string | null
  address: string | null
  isActive: boolean
  branchId: string | null
  branch: { name: string; city: string } | null
  createdAt: string
  enrollments?: {
    id: string
    status: string
    course: { name: string; price: number }
  }[]
}

export default function CSSettingsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string>("")
  const [errorMsg, setErrorMsg] = useState<string>("")

  // Reset Password Modal
  const [resetTargetStudent, setResetTargetStudent] = useState<Student | null>(null)
  const [isResetOpen, setIsResetOpen] = useState(false)
  const [newPassword, setNewPassword] = useState<string>("password123")

  // Edit Student Modal
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "MALE",
    address: "",
    isActive: true,
  })

  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/users?role=STUDENT")
      const data = await res.json()
      setStudents(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(""), 4000)
      return () => clearTimeout(timer)
    }
  }, [successMsg])

  // 1. Reset Password
  const openResetModal = (student: Student) => {
    setResetTargetStudent(student)
    setNewPassword("password123")
    setErrorMsg("")
    setIsResetOpen(true)
  }

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetTargetStudent) return
    setIsLoading(true)
    setErrorMsg("")
    try {
      const res = await fetch(`/api/users/${resetTargetStudent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: newPassword,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || "Gagal mereset kata sandi.")
        return
      }

      setIsResetOpen(false)
      setSuccessMsg(`Kata sandi siswa ${resetTargetStudent.name} berhasil direset menjadi "${newPassword}".`)
    } catch (e) {
      setErrorMsg("Terjadi kesalahan koneksi.")
    } finally {
      setIsLoading(false)
    }
  }

  // 2. Edit Profile
  const openEditModal = (student: Student) => {
    setEditingStudent(student)
    setEditForm({
      name: student.name,
      email: student.email,
      phone: student.phone || "",
      gender: student.gender || "MALE",
      address: student.address || "",
      isActive: student.isActive,
    })
    setErrorMsg("")
    setIsEditOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStudent) return
    setIsLoading(true)
    setErrorMsg("")
    try {
      const res = await fetch(`/api/users/${editingStudent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })

      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || "Gagal memperbarui data siswa.")
        return
      }

      setIsEditOpen(false)
      setSuccessMsg(`Data akun siswa ${editForm.name} berhasil diperbarui.`)
      fetchStudents()
    } catch (e) {
      setErrorMsg("Terjadi kesalahan koneksi.")
    } finally {
      setIsLoading(false)
    }
  }

  // 3. Toggle Status Active / Inactive
  const handleToggleStatus = async (student: Student) => {
    const actionName = student.isActive ? "menonaktifkan" : "mengaktifkan"
    if (!confirm(`Apakah Anda yakin ingin ${actionName} akun siswa ${student.name}?`)) return
    try {
      const res = await fetch(`/api/users/${student.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: !student.isActive,
        }),
      })
      if (res.ok) {
        setSuccessMsg(`Status akun siswa ${student.name} berhasil diubah.`)
        fetchStudents()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const columns = [
    {
      key: "student",
      label: "Identitas Siswa",
      render: (item: Student) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm shrink-0 border border-amber-200/60">
            <GraduationCap size={18} />
          </div>
          <div>
            <p className="font-bold text-slate-900">{item.name}</p>
            <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <Mail size={10} /> {item.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      label: "Nomor WhatsApp",
      render: (item: Student) => (
        item.phone ? (
          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
            <Phone size={12} className="text-slate-400" /> {item.phone}
          </span>
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
    {
      key: "registered",
      label: "Tanggal Daftar",
      render: (item: Student) => (
        <span className="text-xs text-slate-500">{formatDate(item.createdAt)}</span>
      ),
    },
    {
      key: "isActive",
      label: "Status Akun",
      render: (item: Student) => (
        <Badge variant={item.isActive ? "brand" : "danger"} dot>
          {item.isActive ? "Aktif Belajar" : "Nonaktif"}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pengaturan Akun Siswa</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Customer Service dapat mereset kata sandi siswa yang lupa password, mengupdate kontak, atau mengaktifkan akun
          </p>
        </div>
      </div>

      {/* Alert Feedbacks */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs sm:text-sm text-emerald-900 font-bold flex items-center gap-2.5 shadow-2xs animate-fade-in">
          <CheckCircle2 size={18} className="text-[#386E1B] shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl text-xs sm:text-sm text-rose-800 font-bold flex items-center gap-2.5 shadow-2xs animate-fade-in">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Info Card */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#7ADA3A]/20 text-[#2a5714] flex items-center justify-center shrink-0 font-bold">
          <ShieldCheck size={18} />
        </div>
        <div className="text-xs text-slate-600 space-y-0.5">
          <p className="font-bold text-slate-900">Bantuan Layanan Siswa</p>
          <p>
            Jika siswa lupa kata sandi login di HP atau PWA, gunakan tombol <strong>Reset Password</strong>. Anda juga dapat langsung mengirimkan kredensial baru ke WhatsApp siswa dengan 1-klik.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={students}
        searchable
        searchPlaceholder="Cari nama siswa atau email..."
        emptyMessage="Belum ada siswa terdaftar di cabang ini."
        actions={(item: Student) => {
          const waMsg = `Halo Kak ${item.name}, kami dari CS joelmengemudi. Akun login siswa Anda: Email: ${item.email}. Jika ada kendala silakan hubungi kami. Terima kasih!`
          return (
            <div className="flex items-center gap-1.5 justify-end">
              <Button
                size="xs"
                variant="outline"
                onClick={() => openResetModal(item)}
                className="text-xs font-bold border-amber-300 text-amber-800 hover:bg-amber-50"
                title="Reset Password Siswa"
              >
                <KeyRound size={12} className="mr-1" />
                <span>Reset Password</span>
              </Button>

              <Button
                size="xs"
                variant="secondary"
                onClick={() => openEditModal(item)}
                className="text-xs font-bold"
                title="Edit Profil Siswa"
              >
                <Edit2 size={12} className="mr-1" />
                <span>Edit</span>
              </Button>

              {item.phone && (
                <a
                  href={getWhatsAppLink(item.phone, waMsg)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors shadow-2xs"
                  title="Kirim Info Akun via WhatsApp"
                >
                  <MessageSquare size={13} />
                </a>
              )}

              <button
                onClick={() => handleToggleStatus(item)}
                className={cn(
                  "p-1.5 rounded-lg transition-colors cursor-pointer",
                  item.isActive
                    ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    : "text-[#386E1B] hover:bg-[#7ADA3A]/20"
                )}
                title={item.isActive ? "Nonaktifkan Akun" : "Aktifkan Akun"}
              >
                <Power size={14} />
              </button>
            </div>
          )
        }}
      />

      {/* MODAL RESET PASSWORD SISWA */}
      <Modal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        title="Reset Password Akun Siswa"
        subtitle={`Siswa: ${resetTargetStudent?.name || ""} (${resetTargetStudent?.email || ""})`}
        size="sm"
      >
        <form onSubmit={handleResetSubmit} className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
            <p className="font-bold">Informasi Kredensial:</p>
            <p>Setelah direset, siswa dapat langsung masuk ke web/PWA menggunakan password ini.</p>
          </div>

          <div className="space-y-2">
            <Input
              label="Masukkan Password Baru"
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setNewPassword("password123")}
                className="text-xs text-[#2a5513] hover:underline font-bold cursor-pointer"
              >
                Gunakan Standar: "password123"
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsResetOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading} className="bg-[#7ADA3A] text-slate-900 font-bold">
              Reset Password
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL EDIT DATA SISWA */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Profil Akun Siswa"
        subtitle={`ID: ${editingStudent?.id || ""}`}
        size="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            label="Nama Lengkap Siswa"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Alamat Email Login"
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              required
            />
            <Input
              label="Nomor WhatsApp / HP"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Select
              label="Jenis Kelamin"
              value={editForm.gender}
              onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
              options={[
                { value: "MALE", label: "Laki-laki" },
                { value: "FEMALE", label: "Perempuan" },
              ]}
            />
            <Select
              label="Status Keaktifan"
              value={editForm.isActive ? "true" : "false"}
              onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === "true" })}
              options={[
                { value: "true", label: "Aktif Belajar" },
                { value: "false", label: "Nonaktif / Cuti" },
              ]}
            />
          </div>

          <Input
            label="Alamat Domisili Siswa"
            value={editForm.address}
            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
            placeholder="Alamat domisili"
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsEditOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading} className="bg-[#7ADA3A] text-slate-900 font-bold">
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
