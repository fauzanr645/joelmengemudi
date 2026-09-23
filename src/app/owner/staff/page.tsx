"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Modal } from "@/components/ui/modal"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { Plus, Edit2, Headset, Building2, Phone, Mail } from "lucide-react"
import { cn } from "@/lib/utils"

interface User {
  id: string
  name: string
  email: string
  phone: string | null
  gender: string | null
  address: string | null
  isActive: boolean
  branch: { name: string } | null
  branchId: string | null
}

interface Branch {
  id: string
  name: string
  city: string
}

export default function StaffPage() {
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "",
    branchId: "", gender: "", address: "",
  })

  const fetchData = async () => {
    const [userRes, branchRes] = await Promise.all([
      fetch("/api/users?role=CUSTOMER_SERVICE"),
      fetch("/api/branches"),
    ])
    setAllUsers(await userRes.json())
    setBranches(await branchRes.json())
  }

  useEffect(() => { fetchData() }, [])

  const filteredUsers = selectedBranch === "ALL"
    ? allUsers
    : allUsers.filter(u => u.branchId === selectedBranch)

  const getBranchCount = (branchId: string) =>
    allUsers.filter(u => u.branchId === branchId).length

  const openModal = (user?: User) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users"
      const method = editingUser ? "PUT" : "POST"
      const payload: Record<string, string> = { ...form, role: "CUSTOMER_SERVICE" }
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

  const columns = [
    {
      key: "name",
      label: "Petugas CS",
      render: (item: User) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold shrink-0 border border-sky-200/60">
            <Headset size={18} />
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
      label: "Kontak",
      render: (item: User) => (
        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
          <Phone size={12} className="text-slate-400" /> {item.phone || "-"}
        </span>
      ),
    },
    {
      key: "gender",
      label: "Gender",
      render: (item: User) => (
        <span className="text-xs text-slate-600 font-medium">
          {item.gender === "MALE" ? "Laki-laki" : item.gender === "FEMALE" ? "Perempuan" : "-"}
        </span>
      ),
    },
    ...(selectedBranch === "ALL"
      ? [
          {
            key: "branch",
            label: "Penempatan Cabang",
            render: (item: User) =>
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
      key: "isActive",
      label: "Status",
      render: (item: User) => (
        <Badge variant={item.isActive ? "brand" : "danger"} dot>
          {item.isActive ? "Aktif" : "Nonaktif"}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Kelola Customer Service</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Manajemen akun dan penempatan staff CS joelmengemudi di setiap cabang
          </p>
        </div>
        <Button
          onClick={() => openModal()}
          variant="primary"
          leftIcon={<Plus size={16} />}
          className="self-start sm:self-auto font-bold text-slate-900 bg-[#7ADA3A] hover:bg-[#68c62f]"
        >
          Tambah Staff CS
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
            {allUsers.length}
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
        data={filteredUsers}
        searchable
        searchPlaceholder="Cari nama staff CS atau email..."
        emptyMessage={selectedBranch === "ALL" ? "Belum ada staff customer service." : "Belum ada staff CS di cabang ini."}
        actions={(item: User) => (
          <button
            onClick={() => openModal(item)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-[#2a5514] hover:bg-[#7ADA3A]/15 transition-colors cursor-pointer"
            title="Edit Data CS"
          >
            <Edit2 size={15} />
          </button>
        )}
      />

      {/* Modal Add / Edit CS */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? "Edit Data Customer Service" : "Tambah Staff CS Baru"}
        subtitle="Petugas CS dapat mendaftarkan siswa, mengatur jadwal, dan mengonfirmasi pembayaran"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nama Lengkap"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Contoh: Siti Rahayu"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Email Login"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="cs@joelmengemudi.com"
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
              label="Penempatan Cabang"
              value={form.branchId}
              onChange={(e) => setForm({ ...form, branchId: e.target.value })}
              required
              placeholder="Pilih Cabang Tugas"
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
              label="Alamat Tinggal"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Alamat domisili"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading} className="bg-[#7ADA3A] text-slate-900 font-bold">
              {editingUser ? "Simpan Perubahan" : "Daftarkan Staff CS"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
