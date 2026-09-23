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
  Car,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  Check,
  MessageSquare,
  Building2,
  ShieldAlert,
  Edit2,
  DollarSign,
  Bell,
} from "lucide-react"
import { formatDate, formatCurrency, getWhatsAppLink, cn } from "@/lib/utils"

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
  instructor: {
    id: string
    name: string
    phone: string | null
  }
  branch: {
    id: string
    name: string
  }
}

export default function CSVehicleReportsPage() {
  const [reports, setReports] = useState<VehicleReport[]>([])
  const [activeFilter, setActiveFilter] = useState<string>("ALL")
  const [selectedReport, setSelectedReport] = useState<VehicleReport | null>(null)
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string>("")
  const [errorMsg, setErrorMsg] = useState<string>("")

  const [processForm, setProcessForm] = useState({
    status: "CS_REVIEWED",
    estimatedCost: 0,
    actualCost: 0,
    repairNotes: "",
  })

  const fetchData = async () => {
    try {
      const res = await fetch("/api/vehicle-reports")
      const data = await res.json()
      setReports(Array.isArray(data) ? data : [])
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

  const pendingReports = reports.filter((r) => r.status === "REPORTED")
  const inRepairReports = reports.filter((r) => r.status === "IN_REPAIR" || r.status === "APPROVED")

  const filteredReports =
    activeFilter === "ALL"
      ? reports
      : activeFilter === "PENDING"
      ? pendingReports
      : activeFilter === "IN_REPAIR"
      ? inRepairReports
      : reports.filter((r) => r.status === activeFilter)

  const openProcessModal = (report: VehicleReport) => {
    setSelectedReport(report)
    setProcessForm({
      status: report.status === "REPORTED" ? "CS_REVIEWED" : report.status,
      estimatedCost: report.estimatedCost || 0,
      actualCost: report.actualCost || 0,
      repairNotes: report.repairNotes || "",
    })
    setErrorMsg("")
    setIsProcessModalOpen(true)
  }

  const handleProcessSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReport) return
    setIsLoading(true)
    setErrorMsg("")
    try {
      const res = await fetch(`/api/vehicle-reports/${selectedReport.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: processForm.status,
          estimatedCost: Number(processForm.estimatedCost),
          actualCost: Number(processForm.actualCost),
          repairNotes: processForm.repairNotes,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Gagal memperbarui laporan kendala.")
      }

      setIsProcessModalOpen(false)
      setSuccessMsg(`Status kendala mobil ${selectedReport.vehicle.plateNumber} berhasil diperbarui!`)
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
    REPORTED: { label: "Baru Dilaporkan Instruktur", variant: "warning" },
    CS_REVIEWED: { label: "Ditinjau CS (Diajukan)", variant: "info" },
    APPROVED: { label: "Disetujui Owner", variant: "brand" },
    IN_REPAIR: { label: "Sedang di Bengkel", variant: "purple" as any },
    RESOLVED: { label: "Selesai Diperbaiki", variant: "success" },
    REJECTED: { label: "Ditolak", variant: "danger" },
  }

  const columns = [
    {
      key: "vehicle",
      label: "Unit Mobil & Plat",
      render: (item: VehicleReport) => (
        <div>
          <span className="font-extrabold text-sm text-slate-900 block">
            {item.vehicle.brand} {item.vehicle.model}
          </span>
          <span className="font-mono text-xs text-[#254f13] font-bold">
            {item.vehicle.plateNumber} ({item.vehicle.transmission})
          </span>
        </div>
      ),
    },
    {
      key: "issue",
      label: "Kendala Kerusakan",
      render: (item: VehicleReport) => (
        <div className="space-y-0.5">
          <p className="font-bold text-slate-900 text-xs sm:text-sm">{item.issueTitle}</p>
          <p className="text-xs text-slate-500 line-clamp-2 max-w-sm">{item.description}</p>
          <span className="text-[10px] text-slate-400 block pt-0.5">{formatDate(item.createdAt)}</span>
        </div>
      ),
    },
    {
      key: "instructor",
      label: "Instruktur Pemegang",
      render: (item: VehicleReport) => (
        <span className="font-bold text-xs text-slate-800">{item.instructor.name}</span>
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
      key: "cost",
      label: "Estimasi Biaya",
      render: (item: VehicleReport) => (
        item.estimatedCost ? (
          <span className="font-bold text-xs text-slate-800">
            {formatCurrency(item.estimatedCost)}
          </span>
        ) : (
          <span className="text-slate-400 text-xs">-</span>
        )
      ),
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
                {item.repairNotes}
              </p>
            )}
          </div>
        )
      },
    },
    {
      key: "actions",
      label: "Aksi CS",
      render: (item: VehicleReport) => {
        const waMsg = `Halo Pak/Bu ${item.instructor.name}, mengenai laporan kendala mobil ${item.vehicle.brand} (${item.vehicle.plateNumber}): "${item.issueTitle}". CS joelmengemudi sedang memproses penanganan servisnya. Terima kasih!`
        const waUrl = getWhatsAppLink(item.instructor.phone, waMsg)

        return (
          <div className="flex items-center gap-1.5 justify-end">
            {item.instructor.phone && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-2xs"
                title="Hubungi Instruktur via WhatsApp"
              >
                <MessageSquare size={13} />
              </a>
            )}

            <Button
              size="xs"
              variant="primary"
              onClick={() => openProcessModal(item)}
              className="bg-[#7ADA3A] text-slate-900 font-bold hover:bg-[#68c62f] text-xs"
            >
              <Wrench size={12} className="mr-1" />
              <span>Proses Servis</span>
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Penanganan Kendala & Servis Mobil
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Customer Service dapat meninjau laporan kerusakan mobil dari instruktur cabang, mengisi estimasi biaya, dan mengajukan servis ke Owner
          </p>
        </div>
      </div>

      {/* Alert Notification if any new reported */}
      {pendingReports.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-3xl flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shrink-0">
              <Bell size={20} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">
                Pemberitahuan: Ada {pendingReports.length} Laporan Kendala Baru dari Instruktur!
              </h4>
              <p className="text-xs text-amber-800">
                Segera periksa kondisi mobil dan ajukan estimasi biaya servis agar jadwal latihan siswa tidak terganggu.
              </p>
            </div>
          </div>
          <Button
            size="xs"
            variant="primary"
            onClick={() => setActiveFilter("PENDING")}
            className="bg-amber-600 text-white font-bold hover:bg-amber-700 shrink-0"
          >
            Lihat Laporan Baru
          </Button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs sm:text-sm text-emerald-900 font-bold flex items-center gap-2.5 shadow-2xs animate-fade-in">
          <CheckCircle2 size={18} className="text-[#386E1B] shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveFilter("ALL")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer",
            activeFilter === "ALL"
              ? "bg-[#7ADA3A] text-slate-900 shadow-sm border border-[#6ecb30]"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          )}
        >
          Semua Laporan ({reports.length})
        </button>

        <button
          onClick={() => setActiveFilter("PENDING")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer",
            activeFilter === "PENDING"
              ? "bg-amber-600 text-white shadow-sm"
              : "text-amber-800 bg-amber-50 hover:bg-amber-100"
          )}
        >
          <span>Laporan Baru ({pendingReports.length})</span>
        </button>

        <button
          onClick={() => setActiveFilter("IN_REPAIR")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer",
            activeFilter === "IN_REPAIR"
              ? "bg-purple-600 text-white shadow-sm"
              : "text-purple-800 bg-purple-50 hover:bg-purple-100"
          )}
        >
          Sedang Diservis ({inRepairReports.length})
        </button>

        <button
          onClick={() => setActiveFilter("RESOLVED")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer",
            activeFilter === "RESOLVED"
              ? "bg-emerald-700 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          )}
        >
          Selesai Diperbaiki
        </button>
      </div>

      <DataTable
        columns={columns}
        data={filteredReports}
        searchable
        searchPlaceholder="Cari plat nomor atau kendala mobil..."
        emptyMessage="Tidak ada laporan kendala mobil pada kategori ini."
      />

      {/* MODAL PROSES & PENGAJUAN PERBAIKAN MOBIL */}
      <Modal
        isOpen={isProcessModalOpen}
        onClose={() => setIsProcessModalOpen(false)}
        title="Proses & Ajukan Perbaikan Mobil"
        subtitle={`Unit: ${selectedReport?.vehicle.brand} ${selectedReport?.vehicle.model} (${selectedReport?.vehicle.plateNumber})`}
        size="md"
      >
        <form onSubmit={handleProcessSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
            <p><span className="text-slate-400">Instruktur Pelapor:</span> <strong className="text-slate-900">{selectedReport?.instructor.name}</strong></p>
            <p><span className="text-slate-400">Judul Kendala:</span> <strong className="text-slate-900">{selectedReport?.issueTitle}</strong></p>
            <p><span className="text-slate-400">Keterangan:</span> <span className="text-slate-700 italic">"{selectedReport?.description}"</span></p>
          </div>

          <Select
            label="Pilih Status Penanganan"
            value={processForm.status}
            onChange={(e) => setProcessForm({ ...processForm, status: e.target.value })}
            required
            options={[
              { value: "CS_REVIEWED", label: "Ditinjau CS (Ajukan Perbaikan ke Owner)" },
              { value: "APPROVED", label: "Setujui Perbaikan" },
              { value: "IN_REPAIR", label: "Mobil Sedang di Bengkel (Servis)" },
              { value: "RESOLVED", label: "Selesai Diperbaiki (Mobil Aktif Kembali)" },
              { value: "REJECTED", label: "Tolak Laporan" },
            ]}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Estimasi Biaya Servis (Rp)"
              type="number"
              value={processForm.estimatedCost}
              onChange={(e) => setProcessForm({ ...processForm, estimatedCost: Number(e.target.value) })}
              placeholder="Contoh: 350000"
            />
            <Input
              label="Biaya Aktual Bengkel (Rp)"
              type="number"
              value={processForm.actualCost}
              onChange={(e) => setProcessForm({ ...processForm, actualCost: Number(e.target.value) })}
              placeholder="Setelah selesai servis"
            />
          </div>

          <Input
            label="Catatan Bengkel / Tindak Lanjut"
            value={processForm.repairNotes}
            onChange={(e) => setProcessForm({ ...processForm, repairNotes: e.target.value })}
            placeholder="Contoh: Ganti kanvas rem depan di Bengkel Resmi"
          />

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsProcessModalOpen(false)}>
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="bg-[#7ADA3A] text-slate-900 font-bold hover:bg-[#68c62f]"
            >
              Simpan & Perbarui Status
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
