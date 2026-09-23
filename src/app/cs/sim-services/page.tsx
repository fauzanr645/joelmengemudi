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
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Check,
  X as XIcon,
  Eye,
  Building2,
  ExternalLink,
  DollarSign,
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

export default function CSSimServicesPage() {
  const [applications, setApplications] = useState<SimApplication[]>([])
  const [activeFilter, setActiveFilter] = useState<string>("ALL")
  const [branchInfo, setBranchInfo] = useState<{ name: string; city: string } | null>(null)

  // Modals
  const [selectedApp, setSelectedApp] = useState<SimApplication | null>(null)
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

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
      const [appRes, sessRes] = await Promise.all([
        fetch("/api/sim-services"), // strictly CS branch
        fetch("/api/auth/session"),
      ])
      const appData = await appRes.json()
      const sessData = await sessRes.json()

      setApplications(Array.isArray(appData) ? appData : [])
      if (sessData?.user?.branchName) {
        setBranchInfo({ name: sessData.user.branchName, city: "" })
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

  const openProcessModal = (app: SimApplication) => {
    setSelectedApp(app)
    setProcessForm({
      status: app.status === "SUBMITTED" ? "VERIFIED" : app.status,
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

  const handleRejectSubmit = async () => {
    if (!selectedApp) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/sim-services/${selectedApp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "REJECTED",
          rejectionReason,
        }),
      })
      if (res.ok) {
        setIsRejectModalOpen(false)
        setSuccessMsg(`Pengajuan SIM ${selectedApp.fullName} ditolak.`)
        fetchData()
      }
    } finally {
      setIsLoading(false)
    }
  }

  const filteredApps =
    activeFilter === "ALL"
      ? applications
      : applications.filter((a) => a.status === activeFilter)

  const statusLabels: Record<string, { label: string; variant: "default" | "info" | "brand" | "success" | "danger" }> = {
    SUBMITTED: { label: "Berkas Diajukan Siswa", variant: "info" },
    VERIFIED: { label: "Berkas Diverifikasi CS", variant: "brand" },
    SCHEDULED_SATPAS: { label: "Terjadwal Satpas", variant: "brand" },
    COMPLETED: { label: "SIM Selesai Dicetak", variant: "success" },
    REJECTED: { label: "Ditolak / Berkas Belum Lengkap", variant: "danger" },
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
            <p className="text-xs font-black text-[#264f13]">{formatCurrency(item.price)}</p>
          </div>
        </div>
      ),
    },
    {
      key: "applicant",
      label: "Data Siswa & NIK",
      render: (item: SimApplication) => (
        <div className="text-xs space-y-0.5">
          <p className="font-bold text-slate-900">{item.fullName}</p>
          <p className="text-slate-400 font-mono text-[11px]">{item.nik ? `NIK: ${item.nik}` : "NIK Belum Diisi"}</p>
          <p className="text-slate-500 text-[11px]">{item.phone}</p>
        </div>
      ),
    },
    {
      key: "payment",
      label: "Biaya & Pembayaran",
      render: (item: SimApplication) => (
        <div className="space-y-1">
          <span className={cn(
            "px-2.5 py-0.5 rounded-md text-[11px] font-bold inline-block",
            item.paymentStatus === "CONFIRMED"
              ? "bg-emerald-100 text-emerald-800"
              : item.transferProof
              ? "bg-amber-100 text-amber-800"
              : "bg-rose-100 text-rose-800"
          )}>
            {item.paymentStatus === "CONFIRMED" ? "Lunas" : item.transferProof ? "Perlu Dicek" : "Belum Bayar"}
          </span>
          {item.transferProof && (
            <button
              onClick={() => {
                setPreviewProofUrl(item.transferProof)
                setIsPreviewOpen(true)
              }}
              className="text-[10px] font-bold text-[#2a5513] hover:underline block cursor-pointer"
            >
              Lihat Bukti Transfer
            </button>
          )}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status & Jadwal Satpas",
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
            {item.notes && (
              <p className="text-[10px] text-slate-500 italic max-w-xs truncate">{item.notes}</p>
            )}
          </div>
        )
      },
    },
    {
      key: "actions",
      label: "Aksi CS",
      render: (item: SimApplication) => {
        const waMsg = item.satpasDate
          ? `Halo Kak ${item.fullName}, jadwal keberangkatan ujian ${item.simType === "SIM_A" ? "SIM A" : "SIM C"} Anda ke Satpas telah ditetapkan pada ${formatDate(item.satpasDate)}. Didampingi oleh tim joelmengemudi. Mohon hadir tepat waktu ya Kak!`
          : `Halo Kak ${item.fullName}, mengenai pengajuan layanan ${item.simType === "SIM_A" ? "SIM A" : "SIM C"} Anda di joelmengemudi (${branchInfo?.name || ""})...`

        const waUrl = getWhatsAppLink(item.phone, waMsg)

        return (
          <div className="flex items-center gap-1.5 justify-end">
            {item.phone && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-[#7ADA3A] text-slate-900 hover:bg-[#68c62f] transition-colors shadow-2xs font-bold text-xs"
                title="Kirim Informasi via WhatsApp"
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
              <span>Proses SIM</span>
            </Button>

            <button
              onClick={() => {
                setSelectedApp(item)
                setRejectionReason("Berkas KTP / dokumen kesehatan belum lengkap")
                setIsRejectModalOpen(true)
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Tolak Pengajuan"
            >
              <XIcon size={14} />
            </button>
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
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#7ADA3A]/15 border border-[#7ADA3A]/30 text-[#254d0d] text-xs font-bold shadow-2xs">
              <Building2 size={13} />
              <span>{branchInfo?.name || "Cabang Anda"}</span>
            </span>
            <span className="text-xs text-slate-400 font-medium">Layanan Pembuatan SIM Cabang</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Pengurusan & Jadwal Satpas SIM Siswa
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            CS memverifikasi berkas KTP siswa, menetapkan tanggal keberangkatan ujian Satpas Polresta, dan mengonfirmasi pembayaran
          </p>
        </div>
      </div>

      {/* Global Alerts */}
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
          Semua Pengajuan ({applications.length})
        </button>

        <button
          onClick={() => setActiveFilter("SUBMITTED")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer",
            activeFilter === "SUBMITTED"
              ? "bg-sky-600 text-white shadow-sm"
              : "text-sky-800 bg-sky-50 hover:bg-sky-100"
          )}
        >
          Berkas Baru ({applications.filter((a) => a.status === "SUBMITTED").length})
        </button>

        <button
          onClick={() => setActiveFilter("SCHEDULED_SATPAS")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer",
            activeFilter === "SCHEDULED_SATPAS"
              ? "bg-amber-600 text-white shadow-sm"
              : "text-amber-800 bg-amber-50 hover:bg-amber-100"
          )}
        >
          Terjadwal Satpas ({applications.filter((a) => a.status === "SCHEDULED_SATPAS").length})
        </button>

        <button
          onClick={() => setActiveFilter("COMPLETED")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer",
            activeFilter === "COMPLETED"
              ? "bg-emerald-700 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          )}
        >
          SIM Selesai ({applications.filter((a) => a.status === "COMPLETED").length})
        </button>
      </div>

      <DataTable
        columns={columns}
        data={filteredApps}
        searchable
        searchPlaceholder="Cari siswa atau NIK..."
        emptyMessage="Tidak ada pengajuan SIM pada kategori ini."
      />

      {/* MODAL PROSES PENGAJUAN & ATUR JADWAL SATPAS */}
      <Modal
        isOpen={isProcessModalOpen}
        onClose={() => setIsProcessModalOpen(false)}
        title="Proses Pengajuan & Jadwal Ujian Satpas"
        subtitle={`Siswa: ${selectedApp?.fullName || ""} (${selectedApp?.simType === "SIM_A" ? "SIM A Mobil - Rp 700rb" : "SIM C Motor - Rp 625rb"})`}
        size="md"
      >
        <form onSubmit={handleProcessSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
            <p><span className="text-slate-400">Nama Siswa:</span> <strong className="text-slate-900">{selectedApp?.fullName}</strong></p>
            <p><span className="text-slate-400">NIK:</span> <strong className="text-slate-800 font-mono">{selectedApp?.nik || "Belum ada"}</strong></p>
            <p><span className="text-slate-400">WhatsApp:</span> <strong className="text-slate-800">{selectedApp?.phone}</strong></p>
            <p><span className="text-slate-400">Biaya Layanan:</span> <strong className="text-[#264f13]">{selectedApp ? formatCurrency(selectedApp.price) : ""}</strong></p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Select
              label="Status Pengurusan SIM"
              value={processForm.status}
              onChange={(e) => setProcessForm({ ...processForm, status: e.target.value as any })}
              required
              options={[
                { value: "SUBMITTED", label: "Berkas Diajukan" },
                { value: "VERIFIED", label: "Berkas Diverifikasi Lengkap" },
                { value: "SCHEDULED_SATPAS", label: "Terjadwal Ujian ke Satpas" },
                { value: "COMPLETED", label: "SIM Selesai Dicetak (Lulus)" },
                { value: "REJECTED", label: "Ditolak / Berkas Tidak Lengkap" },
              ]}
            />

            <Select
              label="Status Pembayaran SIM"
              value={processForm.paymentStatus}
              onChange={(e) => setProcessForm({ ...processForm, paymentStatus: e.target.value as any })}
              required
              options={[
                { value: "PENDING", label: "Menunggu Pembayaran" },
                { value: "CONFIRMED", label: "Lunas / Dikonfirmasi Sah" },
                { value: "REJECTED", label: "Pembayaran Ditolak" },
              ]}
            />
          </div>

          <Input
            label="Tanggal Keberangkatan Ujian ke Satpas"
            type="date"
            value={processForm.satpasDate}
            onChange={(e) => setProcessForm({ ...processForm, satpasDate: e.target.value })}
            helperText="Atur tanggal keberangkatan ujian teori & praktik didampingi instruktur"
          />

          <Input
            label="Catatan / Keterangan untuk Siswa"
            value={processForm.notes}
            onChange={(e) => setProcessForm({ ...processForm, notes: e.target.value })}
            placeholder="Contoh: Kumpul di kantor cabang jam 08:00, bawa KTP asli"
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
              Simpan & Perbarui Status SIM
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL TOLAK PENGAJUAN */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Tolak Pengajuan Layanan SIM"
        subtitle={`Siswa: ${selectedApp?.fullName || ""}`}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Alasan Penolakan"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            required
            placeholder="Contoh: NIK KTP tidak valid atau foto buram"
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsRejectModalOpen(false)}>
              Batal
            </Button>
            <Button type="button" variant="danger" onClick={handleRejectSubmit} isLoading={isLoading}>
              Tolak Pengajuan
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL PRATINJAU STRUK TRANSFER */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Pratinjau Bukti Transfer Pembayaran SIM"
        size="md"
      >
        <div className="space-y-4">
          {previewProofUrl && (
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center p-2">
              <img src={previewProofUrl} alt="Bukti" className="max-h-[60vh] w-auto object-contain rounded-xl" />
            </div>
          )}
          <div className="flex items-center justify-between pt-2">
            <a href={previewProofUrl || "#"} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-[#2a5513] hover:underline flex items-center gap-1">
              <ExternalLink size={13} />
              <span>Buka Tab Baru</span>
            </a>
            <Button variant="secondary" size="sm" onClick={() => setIsPreviewOpen(false)}>
              Tutup
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
