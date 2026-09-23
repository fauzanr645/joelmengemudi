"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Modal } from "@/components/ui/modal"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import {
  Wrench,
  Plus,
  Car,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Info,
  Flame,
  Check,
} from "lucide-react"
import { formatDate, formatCurrency, cn } from "@/lib/utils"

interface VehicleReport {
  id: string
  issueTitle: string
  description: string
  severity: "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY"
  status: "REPORTED" | "CS_REVIEWED" | "APPROVED" | "IN_REPAIR" | "RESOLVED" | "REJECTED"
  estimatedCost: number | null
  actualCost: number | null
  repairNotes: string | null
  createdAt: string
  resolvedAt: string | null
  vehicle: {
    id: string
    brand: string
    model: string
    plateNumber: string
    transmission: string
  }
}

export default function InstructorVehicleReportsPage() {
  const [reports, setReports] = useState<VehicleReport[]>([])
  const [myVehicle, setMyVehicle] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string>("")
  const [errorMsg, setErrorMsg] = useState<string>("")

  const [form, setForm] = useState({
    issueTitle: "",
    description: "",
    severity: "MEDIUM",
  })

  const fetchData = async () => {
    try {
      const [reportsRes, userRes] = await Promise.all([
        fetch("/api/vehicle-reports"),
        fetch("/api/users?role=INSTRUCTOR"),
      ])
      const repData = await reportsRes.json()
      const uData = await userRes.json()

      setReports(Array.isArray(repData) ? repData : [])
      if (Array.isArray(uData) && uData.length > 0 && uData[0].assignedVehicle) {
        setMyVehicle(uData[0].assignedVehicle)
      } else if (Array.isArray(repData) && repData.length > 0 && repData[0].vehicle) {
        setMyVehicle(repData[0].vehicle)
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(""), 4000)
      return () => clearTimeout(timer)
    }
  }, [successMsg])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg("")
    try {
      const res = await fetch("/api/vehicle-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengirimkan laporan kendala.")
      }

      setIsModalOpen(false)
      setForm({ issueTitle: "", description: "", severity: "MEDIUM" })
      setSuccessMsg("Laporan kendala mobil berhasil dikirim ke Customer Service & Owner!")
      fetchData()
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan koneksi.")
    } finally {
      setIsLoading(false)
    }
  }

  const severityBadges: Record<string, { label: string; color: string }> = {
    LOW: { label: "Ringan", color: "bg-slate-100 text-slate-700 border-slate-200" },
    MEDIUM: { label: "Sedang", color: "bg-amber-100 text-amber-800 border-amber-200" },
    HIGH: { label: "Mendesak", color: "bg-orange-100 text-orange-900 border-orange-200" },
    EMERGENCY: { label: "Darurat / Mogok", color: "bg-rose-100 text-rose-900 border-rose-200" },
  }

  const statusLabels: Record<string, { label: string; variant: "default" | "warning" | "info" | "brand" | "success" | "danger" }> = {
    REPORTED: { label: "Terkirim ke CS", variant: "warning" },
    CS_REVIEWED: { label: "Ditinjau CS (Diajukan)", variant: "info" },
    APPROVED: { label: "Disetujui Owner", variant: "brand" },
    IN_REPAIR: { label: "Sedang Diservis", variant: "purple" as any },
    RESOLVED: { label: "Selesai Diperbaiki", variant: "success" },
    REJECTED: { label: "Ditolak", variant: "danger" },
  }

  const columns = [
    {
      key: "issueTitle",
      label: "Kendala Mobil",
      render: (item: VehicleReport) => (
        <div className="space-y-0.5">
          <p className="font-bold text-slate-900 text-sm">{item.issueTitle}</p>
          <p className="text-xs text-slate-500 line-clamp-2 max-w-sm">{item.description}</p>
          <span className="text-[10px] text-slate-400 block pt-0.5">{formatDate(item.createdAt)}</span>
        </div>
      ),
    },
    {
      key: "vehicle",
      label: "Unit Mobil",
      render: (item: VehicleReport) => (
        <div className="text-xs">
          <span className="font-bold text-slate-800 block">
            {item.vehicle?.brand} {item.vehicle?.model}
          </span>
          <span className="font-mono text-[11px] text-[#285314] font-bold">
            {item.vehicle?.plateNumber}
          </span>
        </div>
      ),
    },
    {
      key: "severity",
      label: "Tingkat Urgensi",
      render: (item: VehicleReport) => {
        const sev = severityBadges[item.severity] || severityBadges.MEDIUM
        return (
          <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold border", sev.color)}>
            {sev.label}
          </span>
        )
      },
    },
    {
      key: "status",
      label: "Status Penanganan",
      render: (item: VehicleReport) => {
        const st = statusLabels[item.status] || { label: item.status, variant: "default" }
        return (
          <div className="space-y-1">
            <Badge variant={st.variant} dot>
              {st.label}
            </Badge>
            {item.repairNotes && (
              <p className="text-[10px] text-slate-500 italic truncate max-w-xs">
                Catatan: {item.repairNotes}
              </p>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Laporan Kendala Mobil Latihan
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Laporkan segera jika mobil dinas khusus Anda mengalami kendala teknis agar dapat diajukan perbaikan oleh CS & disetujui Owner
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
          Laporkan Kendala Baru
        </Button>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs sm:text-sm text-emerald-900 font-bold flex items-center gap-2.5 shadow-2xs animate-fade-in">
          <CheckCircle2 size={18} className="text-[#386E1B] shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Info Mobil Dinas Khusus Instruktur */}
      {myVehicle && (
        <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#7ADA3A]/15 text-[#254d0d] flex items-center justify-center font-bold shrink-0 border border-[#7ADA3A]/30">
              <Car size={22} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Mobil Khusus Tetap Anda (1:1)
              </span>
              <h3 className="font-extrabold text-base text-slate-900">
                {myVehicle.brand} {myVehicle.model} ({myVehicle.year})
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Plat: <strong className="text-slate-900 font-mono">{myVehicle.plateNumber}</strong> • Transmisi: {myVehicle.transmission}
              </p>
            </div>
          </div>

          <Badge variant={myVehicle.isActive ? "brand" : "danger"} dot>
            {myVehicle.isActive ? "Kondisi Siap Pakai" : "Dalam Penanganan Bengkel"}
          </Badge>
        </div>
      )}

      <DataTable
        columns={columns}
        data={reports}
        searchable
        searchPlaceholder="Cari riwayat kendala mobil..."
        emptyMessage="Belum ada laporan kendala mobil yang Anda ajukan. Mobil Anda dalam kondisi prima!"
      />

      {/* MODAL LAPOR KENDALA MOBIL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Laporkan Kendala / Kerusakan Mobil"
        subtitle="Customer Service dan Owner akan langsung menerima pemberitahuan untuk mengajukan servis bengkel"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <Input
            label="Judul Kendala / Masalah"
            value={form.issueTitle}
            onChange={(e) => setForm({ ...form, issueTitle: e.target.value })}
            placeholder="Contoh: Pedal kopling keras & selip saat tanjakan"
            required
          />

          <Select
            label="Tingkat Keparahan / Urgensi"
            value={form.severity}
            onChange={(e) => setForm({ ...form, severity: e.target.value as any })}
            required
            options={[
              { value: "LOW", label: "Ringan (Bisa jalan, tapi perlu pengecekan berkala)" },
              { value: "MEDIUM", label: "Sedang (Mengganggu kenyamanan latihan, perlu servis segera)" },
              { value: "HIGH", label: "Mendesak (Berisiko bagi keselamatan siswa jika tidak diperbaiki)" },
              { value: "EMERGENCY", label: "Darurat / Mogok (Mobil tidak bisa digunakan sama sekali)" },
            ]}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Deskripsi Lengkap Kerusakan / Gejala
            </label>
            <textarea
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#7ADA3A] focus:ring-2 focus:ring-[#7ADA3A]/20 transition-all"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Ceritakan kapan masalah mulai terjadi, suara yang timbul, atau indikator lampu dashboard yang menyala..."
              required
            />
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
              Kirim Laporan ke CS & Owner
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
