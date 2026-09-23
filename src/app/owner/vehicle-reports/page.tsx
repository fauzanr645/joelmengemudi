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
  Check,
  Building2,
  DollarSign,
  Trash2,
  Edit2,
  Bell,
  MessageSquare,
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

interface Branch {
  id: string
  name: string
  city: string
}

export default function OwnerVehicleReportsPage() {
  const [reports, setReports] = useState<VehicleReport[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL")

  const [selectedReport, setSelectedReport] = useState<VehicleReport | null>(null)
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string>("")
  const [errorMsg, setErrorMsg] = useState<string>("")

  const [processForm, setProcessForm] = useState({
    status: "APPROVED",
    estimatedCost: 0,
    actualCost: 0,
    repairNotes: "",
  })

  const fetchData = async () => {
    try {
      const [reportsRes, branchRes] = await Promise.all([
        fetch("/api/vehicle-reports"), // Owner gets all branches
        fetch("/api/branches"),
      ])
      const repData = await reportsRes.json()
      const bData = await branchRes.json()

      setReports(Array.isArray(repData) ? repData : [])
      setBranches(Array.isArray(bData) ? bData : [])
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

  const filteredReports =
    selectedBranch === "ALL"
      ? reports
      : reports.filter((r) => r.branch.id === selectedBranch)

  const getBranchCount = (branchId: string) =>
    reports.filter((r) => r.branch.id === branchId).length

  const pendingApproval = filteredReports.filter(
    (r) => r.status === "REPORTED" || r.status === "CS_REVIEWED"
  )
  const inRepair = filteredReports.filter((r) => r.status === "IN_REPAIR" || r.status === "APPROVED")
  const resolved = filteredReports.filter((r) => r.status === "RESOLVED")

  const openProcessModal = (report: VehicleReport) => {
    setSelectedReport(report)
    setProcessForm({
      status: report.status === "CS_REVIEWED" || report.status === "REPORTED" ? "APPROVED" : report.status,
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
        throw new Error(data.error || "Gagal memperbarui status perbaikan.")
      }

      setIsProcessModalOpen(false)
      setSuccessMsg(`Persetujuan perbaikan mobil ${selectedReport.vehicle.plateNumber} berhasil disimpan!`)
      fetchData()
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan koneksi.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (report: VehicleReport) => {
    if (!confirm(`Hapus riwayat kendala mobil ${report.vehicle.plateNumber}?`)) return
    try {
      const res = await fetch(`/api/vehicle-reports/${report.id}`, { method: "DELETE" })
      if (res.ok) {
        setSuccessMsg("Riwayat laporan kendala berhasil dihapus.")
        fetchData()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const severityBadges: Record<string, { label: string; color: string }> = {
    LOW: { label: "Ringan", color: "bg-slate-100 text-slate-700 border-slate-200" },
    MEDIUM: { label: "Sedang", color: "bg-amber-100 text-amber-800 border-amber-200" },
    HIGH: { label: "Mendesak", color: "bg-orange-100 text-orange-900 border-orange-200" },
    EMERGENCY: { label: "Darurat / Mogok", color: "bg-rose-100 text-rose-900 border-rose-200" },
  }

  const statusLabels: Record<string, { label: string; variant: "default" | "warning" | "info" | "brand" | "success" | "danger" }> = {
    REPORTED: { label: "Laporan Baru", variant: "warning" },
    CS_REVIEWED: { label: "Diajukan CS", variant: "info" },
    APPROVED: { label: "Disetujui Owner", variant: "brand" },
    IN_REPAIR: { label: "Sedang di Bengkel", variant: "purple" as any },
    RESOLVED: { label: "Selesai Diperbaiki", variant: "success" },
    REJECTED: { label: "Ditolak", variant: "danger" },
  }

  const columns = [
    {
      key: "vehicle",
      label: "Unit Mobil & Cabang",
      render: (item: VehicleReport) => (
        <div>
          <span className="font-extrabold text-sm text-slate-900 block">
            {item.vehicle.brand} {item.vehicle.model}
          </span>
          <p className="text-xs text-slate-400 font-medium">
            <strong className="font-mono text-slate-700">{item.vehicle.plateNumber}</strong> • {item.branch.name}
          </p>
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
      key: "costs",
      label: "Biaya Servis",
      render: (item: VehicleReport) => (
        <div className="text-xs space-y-0.5">
          {item.actualCost ? (
            <p className="font-bold text-emerald-800">
              Aktual: {formatCurrency(item.actualCost)}
            </p>
          ) : item.estimatedCost ? (
            <p className="font-medium text-slate-700">
              Estimasi: {formatCurrency(item.estimatedCost)}
            </p>
          ) : (
            <span className="text-slate-400">-</span>
          )}
        </div>
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
      label: "Aksi Owner",
      render: (item: VehicleReport) => (
        <div className="flex items-center gap-1.5 justify-end">
          <Button
            size="xs"
            variant="primary"
            onClick={() => openProcessModal(item)}
            className="bg-[#7ADA3A] text-slate-900 font-bold hover:bg-[#68c62f] text-xs"
          >
            <Check size={13} className="mr-1" />
            <span>Setujui / Update</span>
          </Button>

          <button
            onClick={() => handleDelete(item)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Hapus Laporan"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Laporan Kendala & Servis Mobil (Semua Cabang)
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Owner memantau seluruh kendala armada mobil dari instruktur & menyetujui pengajuan anggaran perbaikan bengkel
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-slate-400 block text-xs font-semibold uppercase">Total Laporan</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{filteredReports.length}</p>
        </div>
        <div className="p-4 bg-amber-50 rounded-3xl border border-amber-200/80 shadow-xs">
          <span className="text-amber-800 block text-xs font-bold uppercase">Perlu Persetujuan</span>
          <p className="text-2xl font-black text-amber-900 mt-1">{pendingApproval.length}</p>
        </div>
        <div className="p-4 bg-purple-50 rounded-3xl border border-purple-200/80 shadow-xs">
          <span className="text-purple-800 block text-xs font-bold uppercase">Sedang di Bengkel</span>
          <p className="text-2xl font-black text-purple-900 mt-1">{inRepair.length}</p>
        </div>
        <div className="p-4 bg-emerald-50 rounded-3xl border border-emerald-200/80 shadow-xs">
          <span className="text-emerald-800 block text-xs font-bold uppercase">Selesai Diperbaiki</span>
          <p className="text-2xl font-black text-emerald-900 mt-1">{resolved.length}</p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs sm:text-sm text-emerald-900 font-bold flex items-center gap-2.5 shadow-2xs animate-fade-in">
          <CheckCircle2 size={18} className="text-[#386E1B] shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

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
            {reports.length}
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
        data={filteredReports}
        searchable
        searchPlaceholder="Cari plat nomor atau kendala mobil..."
        emptyMessage="Tidak ada laporan kendala mobil pada cabang ini."
      />

      {/* MODAL APPROVE PERBAIKAN & ANGGARAN OWNER */}
      <Modal
        isOpen={isProcessModalOpen}
        onClose={() => setIsProcessModalOpen(false)}
        title="Persetujuan Servis & Anggaran Perbaikan"
        subtitle={`Mobil: ${selectedReport?.vehicle.brand} ${selectedReport?.vehicle.model} (${selectedReport?.vehicle.plateNumber}) • ${selectedReport?.branch.name}`}
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
            <p><span className="text-slate-400">Instruktur Pemegang:</span> <strong className="text-slate-900">{selectedReport?.instructor.name}</strong></p>
            <p><span className="text-slate-400">Masalah Dilaporkan:</span> <strong className="text-slate-900">{selectedReport?.issueTitle}</strong></p>
            <p><span className="text-slate-400">Rincian Gejala:</span> <span className="text-slate-700 italic">"{selectedReport?.description}"</span></p>
          </div>

          <Select
            label="Keputusan Status Owner"
            value={processForm.status}
            onChange={(e) => setProcessForm({ ...processForm, status: e.target.value })}
            required
            options={[
              { value: "APPROVED", label: "Setujui Anggaran & Izin Servis (Approved)" },
              { value: "IN_REPAIR", label: "Mobil Masuk Bengkel (In Repair)" },
              { value: "RESOLVED", label: "Selesai Diperbaiki & Lunas (Mobil Aktif Kembali)" },
              { value: "REJECTED", label: "Tolak Pengajuan Perbaikan" },
            ]}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Estimasi Biaya Disetujui (Rp)"
              type="number"
              value={processForm.estimatedCost}
              onChange={(e) => setProcessForm({ ...processForm, estimatedCost: Number(e.target.value) })}
              placeholder="Contoh: 500000"
            />
            <Input
              label="Biaya Aktual Servis (Rp)"
              type="number"
              value={processForm.actualCost}
              onChange={(e) => setProcessForm({ ...processForm, actualCost: Number(e.target.value) })}
              placeholder="Total nota bengkel"
            />
          </div>

          <Input
            label="Catatan Owner / Bengkel Rujukan"
            value={processForm.repairNotes}
            onChange={(e) => setProcessForm({ ...processForm, repairNotes: e.target.value })}
            placeholder="Contoh: Bawa ke Bengkel Resmi Denpasar, ganti suku cadang asli"
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
              Simpan Keputusan Owner
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
