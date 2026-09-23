"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { Plus, Edit2, Power, Building2, MapPin, Phone, Mail, Users, Car, GraduationCap } from "lucide-react"

interface Branch {
  id: string
  name: string
  address: string
  phone: string | null
  email: string | null
  city: string
  isActive: boolean
  _count: { users: number; courses: number; vehicles: number; enrollments: number }
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({ name: "", address: "", phone: "", email: "", city: "" })

  const fetchBranches = async () => {
    const res = await fetch("/api/branches")
    const data = await res.json()
    setBranches(data)
  }

  useEffect(() => { fetchBranches() }, [])

  const openModal = (branch?: Branch) => {
    if (branch) {
      setEditingBranch(branch)
      setForm({
        name: branch.name,
        address: branch.address,
        phone: branch.phone || "",
        email: branch.email || "",
        city: branch.city,
      })
    } else {
      setEditingBranch(null)
      setForm({ name: "", address: "", phone: "", email: "", city: "" })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = editingBranch ? `/api/branches/${editingBranch.id}` : "/api/branches"
      const method = editingBranch ? "PUT" : "POST"

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      setIsModalOpen(false)
      fetchBranches()
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin mengubah status cabang ini?")) return
    await fetch(`/api/branches/${id}`, { method: "DELETE" })
    fetchBranches()
  }

  const columns = [
    {
      key: "name",
      label: "Nama Cabang",
      render: (item: Branch) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#7ADA3A]/15 text-[#305b1b] flex items-center justify-center font-bold shrink-0">
            <Building2 size={18} />
          </div>
          <div>
            <p className="font-bold text-slate-900">{item.name}</p>
            <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-0.5">
              <MapPin size={11} /> {item.city}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      label: "Kontak & Alamat",
      render: (item: Branch) => (
        <div className="text-xs space-y-0.5 text-slate-600">
          <p className="font-medium truncate max-w-xs">{item.address}</p>
          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
            {item.phone && <span className="flex items-center gap-1"><Phone size={10} /> {item.phone}</span>}
            {item.email && <span className="flex items-center gap-1"><Mail size={10} /> {item.email}</span>}
          </div>
        </div>
      ),
    },
    {
      key: "stats",
      label: "Aset & Siswa",
      render: (item: Branch) => (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold" title="Staff / Karyawan">
            <Users size={12} className="text-slate-500" /> {item._count.users}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#7ADA3A]/15 text-[#295214] text-xs font-bold" title="Siswa Terdaftar">
            <GraduationCap size={12} className="text-[#3c7717]" /> {item._count.enrollments}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 text-xs font-semibold" title="Armada Kendaraan">
            <Car size={12} className="text-amber-600" /> {item._count.vehicles}
          </span>
        </div>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      render: (item: Branch) => (
        <Badge variant={item.isActive ? "brand" : "danger"} dot>
          {item.isActive ? "Aktif Beroperasi" : "Nonaktif"}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Kelola Cabang</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Manajemen lokasi cabang joelmengemudi di berbagai kota
          </p>
        </div>
        <Button
          onClick={() => openModal()}
          variant="primary"
          leftIcon={<Plus size={16} />}
          className="self-start sm:self-auto font-bold text-slate-900 bg-[#7ADA3A] hover:bg-[#68c62f]"
        >
          Tambah Cabang Baru
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={branches}
        searchable
        searchPlaceholder="Cari nama cabang atau kota..."
        actions={(item: Branch) => (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => openModal(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-[#2a5514] hover:bg-[#7ADA3A]/15 transition-colors cursor-pointer"
              title="Edit Cabang"
            >
              <Edit2 size={15} />
            </button>
            <button
              onClick={() => handleDelete(item.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Ubah Status Aktif"
            >
              <Power size={15} />
            </button>
          </div>
        )}
      />

      {/* Modal Add / Edit Branch */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBranch ? "Edit Data Cabang" : "Tambah Cabang Baru"}
        subtitle="Masukkan rincian alamat dan kontak operasional cabang"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Nama Cabang"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Contoh: Cabang Jakarta Selatan"
              required
            />
            <Input
              label="Kota"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="Contoh: Jakarta Selatan"
              required
            />
          </div>

          <Input
            label="Alamat Lengkap"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Jl. Raya No. 123, Kecamatan, Kelurahan"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Nomor Telepon Kantor"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="021-XXXXXXX"
            />
            <Input
              label="Email Cabang"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="cabang@joelmengemudi.com"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading} className="bg-[#7ADA3A] text-slate-900 font-bold">
              {editingBranch ? "Simpan Perubahan" : "Daftarkan Cabang"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
