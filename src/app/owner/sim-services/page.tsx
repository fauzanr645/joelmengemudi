"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Modal } from "@/components/ui/modal"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import {
  Award,
  Car,
  Bike,
  Calendar,
  CheckCircle2,
  Building2,
  DollarSign,
  Trash2,
  Edit2,
  MessageSquare,
  AlertCircle,
  ExternalLink,
} from "lucide-react"
import { formatCurrency, formatDate, getWhatsAppLink, cn } from "@/lib/utils"

interface SimApplication {
  id: string
  simType: "SIM_A" | "SIM_C"
  price: number
  fullName: string
  nik: string | null
  phone: string
  address: string | null
  ktpPhoto: string | null
  medicalDoc: string | null
  status: "SUBMITTED" | "VERIFIED" | "SCHEDULED_SATPAS" | "COMPLETED" | "REJECTED"
  paymentStatus: "PENDING" | "CONFIRMED" | "REJECTED"
  bankName: string | null
  accountName: string | null
  accountNumber: string | null
  transferProof: string | null
  satpasDate: string | null
  notes: string | null
  rejectionReason: string | null
  createdAt: string
  branch: { id: string; name: string; city: string }
  student: { id: string; name: string; email: string; phone: string | null }
}

interface Branch {
  id: string
  name: string
  city: string
}

export default function OwnerSimServicesPage() {
  const [applications, setApplications] = useState<SimApplication[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL")

  const [selectedApp, setSelectedApp] = useState<SimApplication | null>(null)
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string>("")
  const [errorMsg, setErrorMsg] = useState<string>("")

  const [processForm, setProcessForm] = useState({
    status: "VERIFIED",
    paymentStatus: "CONFIRMED",
    satpasDate: "",
    notes: "",
  })

  const fetchData = async () => {
    try {
      const [appRes, branchRes] = await Promise.all([
        fetch("/api/sim-services"), // Owner gets all branches
        fetch("/api/branches"),
      ])
      const appData = await appRes.json()
      const bData = await branchRes.json()

      setApplications(Array.isArray(appData) ? appData : [])
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

  const filteredApps =
    selectedBranch === "ALL"
      ? applications
      : applications.filter((a) => a.branch.id === selectedBranch)

  const getBranchCount = (branchId: string) =>
    applications.filter((a) => a.branch.id === branchId).length

  // Stats calculation
  const totalSimA = filteredApps.filter((a) => a.simType === "SIM_A").length
  const totalSimC = filteredApps.filter((a) => a.simType === "SIM_C").length
  const totalScheduled = filteredApps.filter((a) => a.status === "SCHEDULED_SATPAS").length
  const totalCompleted = filteredApps.filter((a) => a.status === "COMPLETED").length
  const totalRevenue = filteredApps
    .filter((a) => a.paymentStatus === "CONFIRMED")
    .reduce((acc, curr) => acc + curr.price, 0)

  const openProcessModal = (app: SimApplication) => {
    setSelectedApp(app)
    setProcessForm({
      status: app.status,
      paymentStatus: app.paymentStatus,
      satpasDate: app.satpasDate ? new Date(app.satpasDate).toISOString().split("T")[0] : "",
      notes: app.notes || "",
    })
    setErrorMsg("")
    setIsProcessModalOpen(true)
  }

  const handleProcessSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedApp) return
    setIsLoading(true)
    setErrorMsg("")
    try {
      const res = await fetch(`/api/sim-services/${selectedApp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: processForm.status,
          paymentStatus: processForm.paymentStatus,
          satpasDate: processForm.satpasDate || null,
          notes: processForm.notes,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Gagal memperbarui pengajuan SIM.")
      }

      setIsProcessModalOpen(false)
      setSuccessMsg(`Status pengajuan SIM ${selectedApp.fullName} berhasil diperbarui!`)
      fetchData()
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan koneksi.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (app: SimApplication) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus pengajuan SIM ${app.fullName}?`)) return
    try {
      const res = await fetch(`/api/sim-services/${app.id}`, { method: "DELETE" })
      if (res.ok) {
        setSuccessMsg("Pengajuan SIM berhasil dihapus.")
        fetchData()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const statusLabels: Record<string, { label: string; variant: "default" | "info" | "brand" | "success" | "danger" }> = {
    SUBMITTED: { label: "Diajukan Siswa", variant: "info" },
    VERIFIED: { label: "Berkas Lengkap", variant: "brand" },
    SCHEDULED_SATPAS: { label: "Terjadwal Satpas", variant: "brand" },
    COMPLETED: { label: "SIM Selesai (Lulus)", variant: "success" },
    REJECTED: { label: "Ditolak", variant: "danger" },
  }

  const columns = [
    {
      key: "simType",
      label: "Layanan SIM",
      render: (item: SimApplication) => (
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 border",
            item.simType === "SIM_A" ? "bg-sky-50 text-sky-800 border-sky-200" : "bg-amber-50 text-amber-800 border-amber-200"
          )}>
            {item.simType === "SIM_A" ? <Car size={18} /> : <Bike size={18} />}
          </div>
          <div>
            <p className="font-extrabold text-sm text-slate-900">
              {item.simType === "SIM_A" ? "SIM A (Mobil)" : "SIM C (Motor)"}
            </p>
            <span className="font-black text-xs text-[#254f13] bg-[#7ADA3A]/15 px-2 py-0.5 rounded-md">
              {formatCurrency(item.price)}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "applicant",
      label: "Pemohon & Cabang",
      render: (item: SimApplication) => (
        <div className="text-xs space-y-0.5">
          <p className="font-bold text-slate-900">{item.fullName}</p>
          <p className="text-slate-500 font-medium">
            Cabang: <strong>{item.branch.name}</strong>
          </p>
          <p className="text-slate-400 text-[11px] font-mono">{item.phone}</p>
        </div>
      ),
    },
    {
      key: "payment",
      label: "Pembayaran",
      render: (item: SimApplication) => (
        <Badge variant={item.paymentStatus === "CONFIRMED" ? "success" : item.transferProof ? "warning" : "danger"} dot>
          {item.paymentStatus === "CONFIRMED" ? "Lunas" : item.transferProof ? "Perlu Verifikasi" : "Belum Bayar"}
        </Badge>
      ),
    },
    {
      key: "status",
      label: "Status & Satpas",
      render: (item: SimApplication) => {
        const st = statusLabels[item.status] || { label: item.status, variant: "default" }
        return (
          <div className="space-y-1">
            <Badge variant={st.variant} dot>
              {st.label}
            </Badge>
            {item.satpasDate && (
              <p className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                <Calendar size={11} className="text-[#3c7717]" />
                <span>Ujian: {formatDate(item.satpasDate)}</span>
              </p>
            )}
          </div>
        )
      },
    },
    {
      key: "actions",
      label: "Aksi Owner",
      render: (item: SimApplication) => (
        <div className="flex items-center gap-1.5 justify-end">
          <Button
            size="xs"
            variant="primary"
            onClick={() => openProcessModal(item)}
            className="bg-[#7ADA3A] text-slate-900 font-bold hover:bg-[#68c62f] text-xs"
          >
            <Edit2 size={12} className="mr-1" />
            <span>Kelola</span>
          </Button>

          <button
            onClick={() => handleDelete(item)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Hapus Permohonan"
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
            Layanan Pembuatan SIM (Semua Cabang)
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Owner memantau rekapitulasi penerbitan SIM A (Rp 700rb) & SIM C (Rp 625rb) serta pendapatan resmi di 5 cabang
          </p>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Pemohon</span>
          <p className="text-2xl font-black text-slate-900">{filteredApps.length}</p>
        </div>
        <div className="p-4 bg-sky-50 rounded-3xl border border-sky-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-sky-800 uppercase">SIM A Mobil (700k)</span>
          <p className="text-2xl font-black text-sky-900">{totalSimA}</p>
        </div>
        <div className="p-4 bg-amber-50 rounded-3xl border border-amber-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-amber-800 uppercase">SIM C Motor (625k)</span>
          <p className="text-2xl font-black text-amber-900">{totalSimC}</p>
        </div>
        <div className="p-4 bg-[#7ADA3A]/15 rounded-3xl border border-[#7ADA3A]/30 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-[#275013] uppercase">Jadwal Satpas</span>
          <p className="text-2xl font-black text-[#275013]">{totalScheduled}</p>
        </div>
        <div className="p-4 bg-emerald-50 rounded-3xl border border-emerald-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-emerald-800 uppercase">SIM Terbit (Lulus)</span>
          <p className="text-2xl font-black text-emerald-900">{totalCompleted}</p>
        </div>
        <div className="p-4 bg-slate-900 rounded-3xl text-white shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-[#7ADA3A] uppercase">Pendapatan SIM</span>
          <p className="text-base font-black text-white truncate">{formatCurrency(totalRevenue)}</p>
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
            {applications.length}
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
        data={filteredApps}
        searchable
        searchPlaceholder="Cari nama siswa atau NIK..."
        emptyMessage="Tidak ada pengajuan SIM pada cabang ini."
      />

      {/* MODAL PROSES SIM OWNER */}
      <Modal
        isOpen={isProcessModalOpen}
        onClose={() => setIsProcessModalOpen(false)}
        title="Pengelolaan Permohonan SIM (Owner)"
        subtitle={`Siswa: ${selectedApp?.fullName || ""} • ${selectedApp?.branch.name}`}
        size="md"
      >
        <form onSubmit={handleProcessSubmit} className="space-y-4">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
            <p><span className="text-slate-400">Layanan:</span> <strong className="text-slate-900">{selectedApp?.simType === "SIM_A" ? "SIM A (Mobil - Rp 700.000)" : "SIM C (Motor - Rp 625.000)"}</strong></p>
            <p><span className="text-slate-400">NIK Siswa:</span> <strong className="text-slate-800 font-mono">{selectedApp?.nik || "-"}</strong></p>
            <p><span className="text-slate-400">Kontak:</span> <strong className="text-slate-800">{selectedApp?.phone}</strong></p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Select
              label="Status Permohonan"
              value={processForm.status}
              onChange={(e) => setProcessForm({ ...processForm, status: e.target.value as any })}
              required
              options={[
                { value: "SUBMITTED", label: "Diajukan" },
                { value: "VERIFIED", label: "Berkas Lengkap" },
                { value: "SCHEDULED_SATPAS", label: "Terjadwal Satpas" },
                { value: "COMPLETED", label: "SIM Selesai (Lulus)" },
                { value: "REJECTED", label: "Ditolak" },
              ]}
            />

            <Select
              label="Status Pembayaran"
              value={processForm.paymentStatus}
              onChange={(e) => setProcessForm({ ...processForm, paymentStatus: e.target.value as any })}
              required
              options={[
                { value: "PENDING", label: "Menunggu Pembayaran" },
                { value: "CONFIRMED", label: "Lunas / Sah" },
                { value: "REJECTED", label: "Ditolak" },
              ]}
            />
          </div>

          <Input
            label="Tanggal Ujian Satpas"
            type="date"
            value={processForm.satpasDate}
            onChange={(e) => setProcessForm({ ...processForm, satpasDate: e.target.value })}
          />

          <Input
            label="Catatan Owner"
            value={processForm.notes}
            onChange={(e) => setProcessForm({ ...processForm, notes: e.target.value })}
            placeholder="Catatan koordinasi Satpas..."
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
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
