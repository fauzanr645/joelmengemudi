"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Modal } from "@/components/ui/modal"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { Plus, Car, Building2, UserCheck, Tag, AlertCircle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Vehicle {
  id: string
  plateNumber: string
  brand: string
  model: string
  year: number
  transmission: string
  isActive: boolean
  branchId: string
  branch: { name: string }
  instructor?: { id: string; name: string; specialization: string } | null
}

interface Branch {
  id: string
  name: string
  city: string
}

interface Instructor {
  id: string
  name: string
  branchId: string | null
  specialization: string | null
}

export default function VehiclesPage() {
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({
    plateNumber: "",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    transmission: "MANUAL",
    branchId: "",
    instructorId: "",
  })

  const fetchData = async () => {
    try {
      const [vehRes, branchRes, instRes] = await Promise.all([
        fetch("/api/vehicles"),
        fetch("/api/branches"),
        fetch("/api/users?role=INSTRUCTOR"),
      ])
      setAllVehicles(await vehRes.json())
      setBranches(await branchRes.json())
      setInstructors(await instRes.json())
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredVehicles =
    selectedBranch === "ALL"
      ? allVehicles
      : allVehicles.filter((v) => v.branchId === selectedBranch)

  const getBranchCount = (branchId: string) =>
    allVehicles.filter((v) => v.branchId === branchId).length

  // Filter instructors for current modal branch
  const modalInstructors = instructors.filter(
    (i) => !form.branchId || i.branchId === form.branchId
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          year: Number(form.year),
          instructorId: form.instructorId || null,
        }),
      })
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
      key: "plateNumber",
      label: "Plat Nomor",
      render: (item: Vehicle) => (
        <span className="font-mono font-bold text-xs px-3 py-1.5 bg-slate-900 text-[#7ADA3A] rounded-xl border border-slate-700 shadow-xs inline-flex items-center gap-1.5 tracking-wider">
          <Tag size={12} className="text-[#7ADA3A]" />
          <span>{item.plateNumber}</span>
        </span>
      ),
    },
    {
      key: "vehicle",
      label: "Unit Mobil",
      render: (item: Vehicle) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shrink-0 border border-amber-200/60">
            <Car size={18} />
          </div>
          <div>
            <p className="font-bold text-slate-900">{item.brand} {item.model}</p>
            <p className="text-xs text-slate-400 font-medium">Tahun {item.year}</p>
          </div>
        </div>
      ),
    },
    {
      key: "transmission",
      label: "Transmisi",
      render: (item: Vehicle) => (
        <Badge variant={item.transmission === "MANUAL" ? "info" : "purple"}>
          {item.transmission === "MANUAL" ? "Manual" : "Matic"}
        </Badge>
      ),
    },
    {
      key: "instructor",
      label: "Instruktur Pemegang (1:1)",
      render: (item: Vehicle) => (
        item.instructor ? (
          <span className="font-bold text-xs text-[#285513] bg-[#7ADA3A]/15 px-2.5 py-1 rounded-xl border border-[#7ADA3A]/30 inline-flex items-center gap-1.5">
            <UserCheck size={13} className="text-[#3c7717]" />
            <span>{item.instructor.name}</span>
          </span>
        ) : (
          <span className="text-xs text-slate-400">Belum ada pemegang</span>
        )
      ),
    },
    ...(selectedBranch === "ALL"
      ? [
          {
            key: "branch",
            label: "Penempatan Cabang",
            render: (item: Vehicle) => (
              <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                {item.branch.name}
              </span>
            ),
          },
        ]
      : []),
    {
      key: "isActive",
      label: "Kondisi",
      render: (item: Vehicle) => (
        <Badge variant={item.isActive ? "brand" : "danger"} dot>
          {item.isActive ? "Siap Latihan" : "Servis"}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Armada Kendaraan (5 Unit Per Cabang)</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Sistem 1:1 — Setiap instruktur memiliki 1 unit mobil khusus tetap (Manual/Matic)
          </p>
        </div>
        <Button
          onClick={() => {
            setForm({
              plateNumber: "",
              brand: "",
              model: "",
              year: new Date().getFullYear(),
              transmission: "MANUAL",
              branchId: selectedBranch !== "ALL" ? selectedBranch : branches[0]?.id || "",
              instructorId: "",
            })
            setIsModalOpen(true)
          }}
          variant="primary"
          leftIcon={<Plus size={16} />}
          className="self-start sm:self-auto font-bold text-slate-900 bg-[#7ADA3A] hover:bg-[#68c62f]"
        >
          Tambah Unit Kendaraan
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
            {allVehicles.length}
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
        data={filteredVehicles}
        searchable
        searchPlaceholder="Cari plat nomor atau merek mobil..."
        emptyMessage={selectedBranch === "ALL" ? "Belum ada kendaraan terdaftar." : "Belum ada kendaraan di cabang ini."}
      />

      {/* Modal Add Vehicle */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Daftarkan Unit Mobil Baru"
        subtitle="Sistem menetapkan 1 mobil khusus per instruktur secara tetap"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nomor Plat Kendaraan"
            value={form.plateNumber}
            onChange={(e) => setForm({ ...form, plateNumber: e.target.value.toUpperCase() })}
            placeholder="DK 1011 HO"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Merek Kendaraan"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              placeholder="Contoh: Toyota / Honda / Daihatsu"
              required
            />
            <Input
              label="Model / Tipe"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              placeholder="Contoh: Avanza / Brio / Xenia"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Tahun Perakitan"
              type="number"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
              required
            />
            <Select
              label="Jenis Transmisi"
              value={form.transmission}
              onChange={(e) => setForm({ ...form, transmission: e.target.value })}
              options={[
                { value: "MANUAL", label: "Manual (Transmisi Manual)" },
                { value: "AUTOMATIC", label: "Matic (Transmisi Otomatis)" },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Select
              label="Penempatan Cabang"
              value={form.branchId}
              onChange={(e) => setForm({ ...form, branchId: e.target.value })}
              required
              placeholder="Pilih Cabang Kendaraan"
              options={branches.map((b) => ({ value: b.id, label: b.name }))}
            />

            <Select
              label="Instruktur Pemegang Mobil (1:1)"
              value={form.instructorId}
              onChange={(e) => setForm({ ...form, instructorId: e.target.value })}
              placeholder="Pilih Instruktur Khusus"
              options={modalInstructors.map((i) => ({
                value: i.id,
                label: `${i.name} (${i.specialization || "Manual/Matic"})`,
              }))}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading} className="bg-[#7ADA3A] text-slate-900 font-bold">
              Simpan Unit Kendaraan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
