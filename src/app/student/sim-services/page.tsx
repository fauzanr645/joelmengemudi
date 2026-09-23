"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Modal } from "@/components/ui/modal"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import {
  Car,
  Bike,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Upload,
  FileCheck,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  FileText,
  Building2,
  ArrowRight,
  Check,
} from "lucide-react"
import { formatCurrency, formatDate, getWhatsAppLink, cn } from "@/lib/utils"
import { convertImageToWebP, formatFileSize, WebPConversionResult } from "@/lib/image-converter"

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
  branch: { name: string; city: string; phone?: string | null }
}

interface Enrollment {
  id: string
  status: string
  startDate: string
  course: { name: string; courseType: string; duration: number; sessions: number; price: number }
  branch: { name: string; phone?: string | null }
}

export default function StudentSimServicesPage() {
  const [applications, setApplications] = useState<SimApplication[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [userSession, setUserSession] = useState<any>(null)

  // Modals
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false)
  const [isPayModalOpen, setIsPayModalOpen] = useState(false)
  const [payingApp, setPayingApp] = useState<SimApplication | null>(null)
  const [isDocModalOpen, setIsDocModalOpen] = useState(false)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string>("")
  const [errorMsg, setErrorMsg] = useState<string>("")

  // Form State for standalone SIM application
  const [applyForm, setApplyForm] = useState({
    simType: "SIM_A",
    fullName: "",
    nik: "",
    phone: "",
    address: "",
  })

  // Form State for editing documents (NIK, Address, KTP photo) for bundled SIM
  const [docForm, setDocForm] = useState({
    nik: "",
    address: "",
  })

  // Payment proof form
  const [payForm, setPayForm] = useState({
    bankName: "BCA",
    accountName: "",
    accountNumber: "",
  })

  // Image Upload State (Auto-converted to WebP)
  const [webpProof, setWebpProof] = useState<WebPConversionResult | null>(null)
  const [webpKtp, setWebpKtp] = useState<WebPConversionResult | null>(null)
  const [isConverting, setIsConverting] = useState(false)

  const fetchData = async () => {
    try {
      const [appRes, enrollRes, bankRes, sessionRes] = await Promise.all([
        fetch("/api/sim-services"),
        fetch("/api/enrollments"),
        fetch("/api/bank-accounts?activeOnly=true"),
        fetch("/api/auth/session"),
      ])
      const appData = await appRes.json()
      const enrollData = await enrollRes.json()
      const bData = await bankRes.json()
      const sessData = await sessionRes.json()

      const appsList: SimApplication[] = Array.isArray(appData) ? appData : []
      const enrollList: Enrollment[] = Array.isArray(enrollData) ? enrollData : []

      setApplications(appsList)
      setEnrollments(enrollList)
      setBankAccounts(Array.isArray(bData) ? bData : [])
      setUserSession(sessData?.user || null)

      if (sessData?.user) {
        setApplyForm((prev) => ({
          ...prev,
          fullName: sessData.user.name || "",
          phone: sessData.user.phone || "",
        }))
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

  // Deteksi apakah siswa terdaftar di paket kursus yang ada tambahan + SIM
  const simEnrollment = enrollments.find((e) =>
    e.course?.name?.toUpperCase().includes("SIM")
  )

  const bundledApp =
    applications.find(
      (a) =>
        a.simType === "SIM_A" &&
        (a.price === 0 ||
          a.notes?.toLowerCase().includes("paket") ||
          a.notes?.toLowerCase().includes("kursus"))
    ) || (simEnrollment ? applications.find((a) => a.simType === "SIM_A") : null)

  const isBundledSim = Boolean(simEnrollment || bundledApp)

  // Inisialisasi data form edit berkas jika ada bundled app
  useEffect(() => {
    if (bundledApp) {
      setDocForm({
        nik: bundledApp.nik || "",
        address: bundledApp.address || "",
      })
    }
  }, [bundledApp])

  const openApplyModal = (simType: "SIM_A" | "SIM_C" = "SIM_A") => {
    setApplyForm((prev) => ({
      ...prev,
      simType,
    }))
    setErrorMsg("")
    setIsApplyModalOpen(true)
  }

  const openPayModal = (app: SimApplication) => {
    setPayingApp(app)
    setPayForm({
      bankName: bankAccounts[0]?.bankName || "BCA",
      accountName: "",
      accountNumber: "",
    })
    setWebpProof(null)
    setErrorMsg("")
    setIsPayModalOpen(true)
  }

  const handleImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "proof" | "ktp"
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsConverting(true)
    setErrorMsg("")
    try {
      const result = await convertImageToWebP(file, 0.85)
      if (type === "proof") setWebpProof(result)
      else setWebpKtp(result)
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal memproses gambar.")
    } finally {
      setIsConverting(false)
    }
  }

  // Submit pengajuan mandiri (Hanya untuk yang TIDAK paket bundling)
  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg("")
    try {
      const res = await fetch("/api/sim-services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(applyForm),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengajukan layanan SIM.")
      }

      setIsApplyModalOpen(false)
      setSuccessMsg(
        `Pengajuan ${
          applyForm.simType === "SIM_A" ? "SIM A Mobil" : "SIM C Motor"
        } berhasil dikirim ke Customer Service cabang!`
      )
      fetchData()
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan koneksi.")
    } finally {
      setIsLoading(false)
    }
  }

  // Update kelengkapan berkas KTP & NIK untuk paket bundling
  const handleSaveDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bundledApp) return
    setIsLoading(true)
    setErrorMsg("")

    try {
      let ktpUrl = bundledApp.ktpPhoto

      if (webpKtp) {
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dataUrl: webpKtp.dataUrl,
            filename: webpKtp.filename,
          }),
        })
        const uploadData = await uploadRes.json()
        if (!uploadRes.ok) throw new Error(uploadData.error || "Gagal mengunggah foto KTP.")
        ktpUrl = uploadData.url
      }

      const res = await fetch(`/api/sim-services/${bundledApp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nik: docForm.nik,
          address: docForm.address,
          ktpPhoto: ktpUrl,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Gagal memperbarui berkas.")
      }

      setIsDocModalOpen(false)
      setWebpKtp(null)
      setSuccessMsg("Berkas NIK dan Foto KTP Anda berhasil disimpan dan diteruskan ke CS!")
      fetchData()
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan.")
    } finally {
      setIsLoading(false)
    }
  }

  // Submit pembayaran mandiri
  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payingApp) return
    setIsLoading(true)
    setErrorMsg("")
    try {
      let proofUrl = null

      if (webpProof) {
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dataUrl: webpProof.dataUrl,
            filename: webpProof.filename,
          }),
        })
        const uploadData = await uploadRes.json()
        if (!uploadRes.ok)
          throw new Error(uploadData.error || "Gagal mengunggah foto bukti transfer.")
        proofUrl = uploadData.url
      }

      const res = await fetch(`/api/sim-services/${payingApp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: payForm.bankName,
          accountName: payForm.accountName,
          accountNumber: payForm.accountNumber,
          transferProof: proofUrl,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Gagal mengirimkan konfirmasi pembayaran.")
      }

      setIsPayModalOpen(false)
      setWebpProof(null)
      setSuccessMsg("Bukti transfer pembayaran SIM berhasil dikirim!")
      fetchData()
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat memproses pembayaran.")
    } finally {
      setIsLoading(false)
    }
  }

  const statusLabels: Record<
    string,
    { label: string; variant: "default" | "info" | "brand" | "success" | "danger" }
  > = {
    SUBMITTED: { label: "Berkas Diajukan (Menunggu CS)", variant: "info" },
    VERIFIED: { label: "Berkas Terverifikasi", variant: "brand" },
    SCHEDULED_SATPAS: { label: "Terjadwal ke Satpas", variant: "brand" },
    COMPLETED: { label: "SIM Selesai Dicetak", variant: "success" },
    REJECTED: { label: "Perlu Perbaikan Berkas", variant: "danger" },
  }

  const csPhone =
    bundledApp?.branch?.phone || simEnrollment?.branch?.phone || "081234567801"
  const csWaUrl = getWhatsAppLink(
    csPhone,
    `Halo CS joelmengemudi, saya ingin bertanya tentang progres pengurusan SIM A resmi saya yang termasuk dalam paket ${
      simEnrollment?.course?.name || "kursus"
    }.`
  )

  // Hitung tahapan stepper progress untuk paket bundling
  const currentStep =
    bundledApp?.status === "COMPLETED"
      ? 4
      : bundledApp?.status === "SCHEDULED_SATPAS"
      ? 3
      : bundledApp?.status === "VERIFIED"
      ? 2
      : 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Layanan Pembuatan SIM Resmi
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
          {isBundledSim
            ? "Paket kursus Anda sudah mencakup bimbingan ujian dan pengurusan SIM A resmi di Satpas Polresta."
            : "Pengurusan SIM A (Mobil) & SIM C (Motor) didampingi instruktur joelmengemudi sampai lulus di Satpas."}
        </p>
      </div>

      {/* Global Alerts */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs sm:text-sm text-emerald-900 font-bold flex items-center gap-2.5 shadow-2xs animate-fade-in">
          <CheckCircle2 size={18} className="text-[#386E1B] shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* JIKA SISWA MEMILIH PAKET DENGAN TAMBAHAN + SIM:                           */}
      {/* TAMPILKAN PROSES NYA SECARA LENGKAP & TIADAKAN PILIHAN MAU BUAT SIM A / C */}
      {/* ========================================================================= */}
      {isBundledSim ? (
        <div className="space-y-6 animate-fade-in">
          {/* Banner Informasi Paket Bundling */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-lg border-2 border-[#7ADA3A]/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-52 h-52 bg-[#7ADA3A]/15 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#7ADA3A] text-slate-950 font-black text-[11px] uppercase tracking-wider">
                  <ShieldCheck size={13} />
                  <span>Paket Lengkap + SIM A Resmi Termasuk</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {simEnrollment?.course?.name || "Paket Kursus + SIM A"}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                  Anda tidak perlu membayar biaya SIM lagi atau memilih jenis SIM. Seluruh bimbingan materi, simulasi ujian, dan pendampingan di Satpas Polresta telah otomatis aktif untuk <strong>SIM A (Mobil Pribadi)</strong> Anda.
                </p>
              </div>

              <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setIsDocModalOpen(true)}
                  className="bg-[#7ADA3A] text-slate-950 font-bold hover:bg-[#68c82f] text-xs shadow-xs"
                >
                  <FileText size={13} className="mr-1.5" />
                  <span>{bundledApp?.nik ? "Perbarui NIK / KTP" : "Lengkapi NIK & KTP"}</span>
                </Button>
                <a
                  href={csWaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs text-center border border-white/20 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageSquare size={13} />
                  <span>Chat CS Cabang</span>
                </a>
              </div>
            </div>
          </div>

          {/* 4-Step Interactive Progress Stepper */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-7 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-bold text-[#386E1B] uppercase tracking-wider">
                  Alur & Tahapan Resmi
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                  Progres Pengurusan SIM A Anda
                </h3>
              </div>
              <div>
                <Badge
                  variant={
                    statusLabels[bundledApp?.status || "SUBMITTED"]?.variant || "brand"
                  }
                  dot
                >
                  {statusLabels[bundledApp?.status || "SUBMITTED"]?.label || "Sedang Berjalan"}
                </Badge>
              </div>
            </div>

            {/* Stepper Visual */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-3">
              {/* Step 1 */}
              <div
                className={cn(
                  "p-4 rounded-2xl border-2 transition-all space-y-2",
                  currentStep >= 1
                    ? "bg-[#7ADA3A]/10 border-[#7ADA3A] text-slate-950"
                    : "bg-slate-50 border-slate-200 text-slate-500"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-full bg-[#7ADA3A] text-slate-950 flex items-center justify-center font-black text-xs">
                    {currentStep > 1 ? <Check size={14} /> : "1"}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Tahap 01
                  </span>
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900">1. Pendaftaran Berkas</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    Data siswa dan paket bundling terdaftar di sistem cabang.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div
                className={cn(
                  "p-4 rounded-2xl border-2 transition-all space-y-2",
                  currentStep >= 2
                    ? "bg-[#7ADA3A]/10 border-[#7ADA3A] text-slate-950"
                    : currentStep === 1
                    ? "bg-sky-50/70 border-sky-300 text-slate-900"
                    : "bg-slate-50 border-slate-200 text-slate-500"
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center font-black text-xs",
                      currentStep >= 2
                        ? "bg-[#7ADA3A] text-slate-950"
                        : "bg-sky-200 text-sky-900"
                    )}
                  >
                    {currentStep > 2 ? <Check size={14} /> : "2"}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Tahap 02
                  </span>
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900">2. Verifikasi CS & KTP</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    CS cabang memeriksa NIK dan kelengkapan dokumen KTP.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div
                className={cn(
                  "p-4 rounded-2xl border-2 transition-all space-y-2",
                  currentStep >= 3
                    ? "bg-[#7ADA3A]/10 border-[#7ADA3A] text-slate-950"
                    : currentStep === 2
                    ? "bg-amber-50/70 border-amber-300 text-slate-900"
                    : "bg-slate-50 border-slate-200 text-slate-500"
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center font-black text-xs",
                      currentStep >= 3
                        ? "bg-[#7ADA3A] text-slate-950"
                        : "bg-slate-200 text-slate-700"
                    )}
                  >
                    {currentStep > 3 ? <Check size={14} /> : "3"}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Tahap 03
                  </span>
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900">3. Jadwal Uji Satpas</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    {bundledApp?.satpasDate
                      ? `Tanggal: ${formatDate(bundledApp.satpasDate)}`
                      : "Menunggu penetapan tanggal oleh CS cabang."}
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div
                className={cn(
                  "p-4 rounded-2xl border-2 transition-all space-y-2",
                  currentStep === 4
                    ? "bg-emerald-50 border-emerald-500 text-slate-950"
                    : "bg-slate-50 border-slate-200 text-slate-500"
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center font-black text-xs",
                      currentStep === 4
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-200 text-slate-700"
                    )}
                  >
                    {currentStep === 4 ? <Check size={14} /> : "4"}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Tahap 04
                  </span>
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900">4. Ujian & Cetak SIM</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    {currentStep === 4
                      ? "Lulus kompetensi, SIM A resmi fisik telah terbit!"
                      : "Didampingi instruktur langsung di Satpas Polresta."}
                  </p>
                </div>
              </div>
            </div>

            {/* Banner Khusus jika Satpas sudah dijadwalkan */}
            {bundledApp?.satpasDate && (
              <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="font-black text-emerald-950 uppercase tracking-wide text-[11px] block">
                    Jadwal Keberangkatan Ujian Satpas Ditetapkan:
                  </span>
                  <p className="text-sm font-black text-emerald-900 flex items-center gap-1.5">
                    <Calendar size={15} className="text-[#3c7717]" />
                    <span>{formatDate(bundledApp.satpasDate)}</span>
                  </p>
                  <p className="text-slate-600 text-[11px]">
                    Harap berkumpul di kantor cabang sebelum waktu keberangkatan dengan membawa fotokopi KTP.
                  </p>
                </div>
                <a
                  href={csWaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs text-center transition-colors shrink-0"
                >
                  Konfirmasi Kehadiran ke CS
                </a>
              </div>
            )}

            {/* Rincian Data Berkas Siswa */}
            <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Rincian Berkas Pemohon SIM A
                </span>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md">
                  Biaya: Sudah Termasuk (Rp 0 / Lunas)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Nama Pemohon
                  </span>
                  <strong className="text-slate-900 block mt-0.5">
                    {bundledApp?.fullName || userSession?.name}
                  </strong>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Nomor Induk Kependudukan (NIK)
                  </span>
                  <strong className={cn("block mt-0.5 font-mono", bundledApp?.nik ? "text-slate-900" : "text-amber-700 font-semibold")}>
                    {bundledApp?.nik || "Belum diisi"}
                  </strong>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Nomor WhatsApp
                  </span>
                  <strong className="text-slate-900 block mt-0.5">
                    {bundledApp?.phone || userSession?.phone || "-"}
                  </strong>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Cabang Pendamping
                  </span>
                  <strong className="text-slate-900 block mt-0.5">
                    {bundledApp?.branch?.name || simEnrollment?.branch?.name || "Head Office"}
                  </strong>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Alamat Domisili KTP
                  </span>
                  <p className="text-slate-700 mt-0.5 leading-relaxed">
                    {bundledApp?.address || "Belum dicantumkan"}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Foto KTP Pemohon
                  </span>
                  {bundledApp?.ktpPhoto ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <FileCheck size={14} />
                        <span>Foto KTP Sudah Diunggah</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewProofUrl(bundledApp.ktpPhoto)
                          setIsPreviewModalOpen(true)
                        }}
                        className="text-[11px] text-[#2a5714] font-bold hover:underline cursor-pointer ml-1"
                      >
                        (Lihat Foto)
                      </button>
                    </div>
                  ) : (
                    <p className="text-amber-700 font-medium mt-0.5">
                      Belum diunggah. Silakan klik tombol di bawah untuk melengkapi.
                    </p>
                  )}
                </div>
              </div>

              {/* Catatan Khusus dari CS */}
              {bundledApp?.notes && (
                <div className="pt-2 border-t border-slate-200 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Catatan dari CS Cabang:
                  </span>
                  <p className="text-slate-700 italic mt-0.5">{bundledApp.notes}</p>
                </div>
              )}

              {/* Action: Tombol Lengkapi Berkas */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setIsDocModalOpen(true)}
                  className="bg-[#7ADA3A] text-slate-950 font-bold hover:bg-[#68c82f] text-xs shadow-2xs"
                >
                  <FileText size={13} className="mr-1.5" />
                  <span>Lengkapi / Perbarui NIK & Foto KTP</span>
                </Button>
                <span className="text-[11px] text-slate-400">
                  Data NIK & KTP diperlukan CS untuk pembuatan berkas Satpas
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* JIKA SISWA TIDAK MEMILIH PAKET + SIM:                                     */
        /* TAMPILKAN PILIHAN PENDAFTARAN MANDIRI SIM A / SIM C SEPERTI BIASA        */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Two Choice Cards: SIM A (Rp 700.000) & SIM C (Rp 625.000) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SIM A Card */}
            <div className="bg-white rounded-3xl border-2 border-slate-200 hover:border-[#7ADA3A] p-6 shadow-xs transition-all space-y-4 relative overflow-hidden">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-800 flex items-center justify-center font-black text-xl border border-sky-200/80 shrink-0">
                    <Car size={24} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-sky-700 bg-sky-100 px-2.5 py-0.5 rounded-md">
                      Kendaraan Roda 4 (Mobil)
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-1">Layanan SIM A</h3>
                    <p className="text-xs text-slate-400 font-medium">Pengurusan baru / pendampingan ujian Satpas</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-black text-slate-900">Rp 700.000</span>
                  <span className="text-[10px] text-slate-400 block font-medium">Tarif resmi lengkap</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800 flex items-center gap-1">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span>Fasilitas yang didapatkan:</span>
                </p>
                <p className="text-[11px] text-slate-500 pl-4">• Pendampingan uji teori & praktik oleh instruktur</p>
                <p className="text-[11px] text-slate-500 pl-4">• Simulasi lapangan Satpas Polresta</p>
                <p className="text-[11px] text-slate-500 pl-4">• Sertifikat uji kompetensi resmi</p>
              </div>

              <Button
                size="md"
                variant="primary"
                onClick={() => openApplyModal("SIM_A")}
                className="w-full bg-[#7ADA3A] text-slate-900 font-bold hover:bg-[#68c62f]"
              >
                Ajukan Pembuatan SIM A Sekarang
              </Button>
            </div>

            {/* SIM C Card */}
            <div className="bg-white rounded-3xl border-2 border-slate-200 hover:border-[#7ADA3A] p-6 shadow-xs transition-all space-y-4 relative overflow-hidden">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center font-black text-xl border border-amber-200/80 shrink-0">
                    <Bike size={24} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-md">
                      Kendaraan Roda 2 (Motor)
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-1">Layanan SIM C</h3>
                    <p className="text-xs text-slate-400 font-medium">Pengurusan baru / pendampingan ujian Satpas</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-black text-slate-900">Rp 625.000</span>
                  <span className="text-[10px] text-slate-400 block font-medium">Tarif resmi lengkap</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800 flex items-center gap-1">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span>Fasilitas yang didapatkan:</span>
                </p>
                <p className="text-[11px] text-slate-500 pl-4">• Bimbingan materi soal tes teori & rambu jalan</p>
                <p className="text-[11px] text-slate-500 pl-4">• Simulasi praktik lintasan uji huruf S</p>
                <p className="text-[11px] text-slate-500 pl-4">• Pendampingan langsung di kantor Satpas</p>
              </div>

              <Button
                size="md"
                variant="primary"
                onClick={() => openApplyModal("SIM_C")}
                className="w-full bg-[#7ADA3A] text-slate-900 font-bold hover:bg-[#68c62f]"
              >
                Ajukan Pembuatan SIM C Sekarang
              </Button>
            </div>
          </div>

          {/* Riwayat Pengajuan SIM Siswa Mandiri */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">
              Riwayat Pengajuan SIM Anda ({applications.length})
            </h2>
            <DataTable
              columns={[
                {
                  key: "simType",
                  label: "Layanan SIM",
                  render: (item: SimApplication) => (
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border",
                          item.simType === "SIM_A"
                            ? "bg-sky-50 text-sky-800 border-sky-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        )}
                      >
                        {item.simType === "SIM_A" ? <Car size={16} /> : <Bike size={16} />}
                      </div>
                      <div>
                        <p className="font-bold text-xs sm:text-sm text-slate-900">
                          {item.simType === "SIM_A" ? "SIM A (Mobil)" : "SIM C (Motor)"}
                        </p>
                        <p className="text-xs font-bold text-[#244b0c]">
                          {formatCurrency(item.price)}
                        </p>
                      </div>
                    </div>
                  ),
                },
                {
                  key: "applicant",
                  label: "Pemohon & NIK",
                  render: (item: SimApplication) => (
                    <div className="text-xs space-y-0.5">
                      <p className="font-bold text-slate-900">{item.fullName}</p>
                      <p className="text-slate-400 font-mono text-[11px]">
                        {item.nik ? `NIK: ${item.nik}` : "NIK Belum Diisi"}
                      </p>
                      <p className="text-slate-500 text-[11px]">{item.phone}</p>
                    </div>
                  ),
                },
                {
                  key: "status",
                  label: "Status Pengurusan",
                  render: (item: SimApplication) => {
                    const st = statusLabels[item.status] || {
                      label: item.status,
                      variant: "default",
                    }
                    return (
                      <div className="space-y-1">
                        <Badge variant={st.variant} dot>
                          {st.label}
                        </Badge>
                        {item.satpasDate && (
                          <p className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                            <Calendar size={11} className="text-[#3c7717]" />
                            <span>Ujian Satpas: {formatDate(item.satpasDate)}</span>
                          </p>
                        )}
                        {item.notes && (
                          <p className="text-[10px] text-slate-500 italic max-w-xs">{item.notes}</p>
                        )}
                      </div>
                    )
                  },
                },
                {
                  key: "payment",
                  label: "Biaya & Pembayaran",
                  render: (item: SimApplication) => (
                    <div className="space-y-1">
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-md text-[11px] font-bold inline-block",
                          item.paymentStatus === "CONFIRMED"
                            ? "bg-emerald-100 text-emerald-800"
                            : item.transferProof
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        )}
                      >
                        {item.paymentStatus === "CONFIRMED"
                          ? "Lunas"
                          : item.transferProof
                          ? "Menunggu Verifikasi"
                          : "Belum Bayar"}
                      </span>
                    </div>
                  ),
                },
                {
                  key: "actions",
                  label: "Aksi",
                  render: (item: SimApplication) =>
                    item.paymentStatus !== "CONFIRMED" ? (
                      <Button
                        size="xs"
                        variant="primary"
                        onClick={() => openPayModal(item)}
                        className="bg-[#7ADA3A] text-slate-900 font-bold hover:bg-[#68c62f] text-xs"
                      >
                        <CreditCard size={12} className="mr-1" />
                        <span>{item.transferProof ? "Kirim Ulang Bukti" : "Bayar Sekarang"}</span>
                      </Button>
                    ) : null,
                },
              ]}
              data={applications}
              searchable
              searchPlaceholder="Cari pengajuan SIM..."
              emptyMessage="Anda belum pernah mengajukan layanan pembuatan SIM mandiri."
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL LENGKAPI / PERBARUI BERKAS IDENTITAS KTP & NIK (PAKET BUNDLING)     */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        title="Lengkapi Berkas Identitas KTP & NIK"
        subtitle="Data identitas diperlukan oleh Customer Service untuk pendaftaran resmi di Satpas Polresta"
        size="md"
      >
        <form onSubmit={handleSaveDocSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 font-medium">
            Pengurusan SIM A resmi untuk <strong>{bundledApp?.fullName || userSession?.name}</strong> (Sudah Termasuk dalam Paket Kursus).
          </div>

          <Input
            label="Nomor Induk Kependudukan (NIK 16 Digit Sesuai KTP)"
            value={docForm.nik}
            onChange={(e) => setDocForm({ ...docForm, nik: e.target.value.replace(/\D/g, "") })}
            placeholder="Contoh: 5171012345670001"
            maxLength={16}
            required
          />

          <Input
            label="Alamat Tempat Tinggal (Sesuai KTP)"
            value={docForm.address}
            onChange={(e) => setDocForm({ ...docForm, address: e.target.value })}
            placeholder="Alamat domisili lengkap sesuai KTP"
            required
          />

          {/* Upload Foto KTP */}
          <div className="space-y-2 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Foto Dokumen KTP Asli
            </label>

            {!webpKtp ? (
              <div className="relative border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center hover:bg-white transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, "ktp")}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center justify-center space-y-1">
                  <div className="w-9 h-9 rounded-xl bg-[#7ADA3A]/25 text-[#2b5814] flex items-center justify-center">
                    <Upload size={18} />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    {isConverting ? "Memproses gambar..." : "Pilih Foto KTP dari Galeri / Kamera"}
                  </p>
                  <p className="text-[11px] text-slate-400">Pastikan tulisan dan angka NIK terbaca jelas</p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-white rounded-xl border border-emerald-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                    <img src={webpKtp.dataUrl} alt="Preview KTP" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-slate-900 flex items-center gap-1">
                      <FileCheck size={14} className="text-emerald-600 shrink-0" />
                      <span>{webpKtp.filename}</span>
                    </p>
                    <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                      ✓ Foto Siap Disimpan ({formatFileSize(webpKtp.convertedSize)})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setWebpKtp(null)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded cursor-pointer text-xs"
                >
                  Ganti
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsDocModalOpen(false)}>
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="bg-[#7ADA3A] text-slate-900 font-bold hover:bg-[#68c62f]"
            >
              Simpan Berkas
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL PENGAJUAN MANDIRI (UNTUK SISWA TANPA PAKET BUNDLING)                */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title={
          applyForm.simType === "SIM_A"
            ? "Formulir Pengajuan SIM A (Mobil - Rp 700.000)"
            : "Formulir Pengajuan SIM C (Motor - Rp 625.000)"
        }
        subtitle="Lengkapi data identitas Anda sesuai KTP untuk pendaftaran di Satpas"
        size="md"
      >
        <form onSubmit={handleApplySubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex items-center justify-between">
            <span className="font-bold text-slate-800">Biaya Layanan:</span>
            <span className="text-base font-black text-slate-900">
              {applyForm.simType === "SIM_A" ? "Rp 700.000" : "Rp 625.000"}
            </span>
          </div>

          <Input
            label="Nama Lengkap (Sesuai KTP)"
            value={applyForm.fullName}
            onChange={(e) => setApplyForm({ ...applyForm, fullName: e.target.value })}
            placeholder="Nama lengkap tanpa singkatan"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Nomor Induk Kependudukan (NIK)"
              value={applyForm.nik}
              onChange={(e) =>
                setApplyForm({ ...applyForm, nik: e.target.value.replace(/\D/g, "") })
              }
              placeholder="16 digit NIK KTP"
              maxLength={16}
              required
            />

            <Input
              label="Nomor WhatsApp Aktif"
              value={applyForm.phone}
              onChange={(e) => setApplyForm({ ...applyForm, phone: e.target.value })}
              placeholder="081234567890"
              required
            />
          </div>

          <Input
            label="Alamat Tempat Tinggal (Sesuai KTP)"
            value={applyForm.address}
            onChange={(e) => setApplyForm({ ...applyForm, address: e.target.value })}
            placeholder="Alamat domisili lengkap"
            required
          />

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsApplyModalOpen(false)}>
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="bg-[#7ADA3A] text-slate-900 font-bold hover:bg-[#68c62f]"
            >
              Kirim Pengajuan SIM
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL PEMBAYARAN MANDIRI */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title="Pembayaran Layanan Pembuatan SIM"
        subtitle={`Total Tagihan: ${payingApp ? formatCurrency(payingApp.price) : ""}`}
        size="md"
      >
        <form onSubmit={handlePaySubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900">
                {payingApp?.simType === "SIM_A" ? "Layanan SIM A (Mobil)" : "Layanan SIM C (Motor)"}
              </p>
              <p className="text-[11px] text-slate-500">Cabang {payingApp?.branch.name}</p>
            </div>
            <span className="text-lg font-black text-slate-900">
              {payingApp ? formatCurrency(payingApp.price) : ""}
            </span>
          </div>

          {/* Upload Bukti Transfer */}
          <div className="space-y-2 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Upload Bukti Transfer Bank
            </label>

            {!webpProof ? (
              <div className="relative border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center hover:bg-white transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, "proof")}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  required
                />
                <div className="flex flex-col items-center justify-center space-y-1">
                  <div className="w-10 h-10 rounded-xl bg-[#7ADA3A]/20 text-[#2b5814] flex items-center justify-center">
                    <Upload size={20} />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    {isConverting
                      ? "Memproses gambar..."
                      : "Pilih Foto / Screenshot Bukti Transfer"}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Struk m-banking, ATM, atau foto langsung
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-white rounded-xl border border-emerald-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                    <img
                      src={webpProof.dataUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-slate-900 flex items-center gap-1">
                      <FileCheck size={14} className="text-emerald-600 shrink-0" />
                      <span>{webpProof.filename}</span>
                    </p>
                    <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                      ✓ Foto Siap Dikirim ({formatFileSize(webpProof.convertedSize)})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setWebpProof(null)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                >
                  Ganti
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Select
              label="Tujuan Bank Transfer"
              value={payForm.bankName}
              onChange={(e) => setPayForm({ ...payForm, bankName: e.target.value })}
              required
              options={
                bankAccounts.length > 0
                  ? bankAccounts.map((b: any) => ({
                      value: b.bankName,
                      label: `Bank ${b.bankName} (${b.accountNumber})`,
                    }))
                  : [
                      { value: "BCA", label: "Bank BCA" },
                      { value: "BRI", label: "Bank BRI" },
                      { value: "Mandiri", label: "Bank Mandiri" },
                    ]
              }
            />

            <Input
              label="Nama Pemilik Rekening Pengirim"
              value={payForm.accountName}
              onChange={(e) => setPayForm({ ...payForm, accountName: e.target.value })}
              placeholder="Nama di buku tabungan"
              required
            />
          </div>

          <Input
            label="Nomor Rekening Pengirim"
            value={payForm.accountNumber}
            onChange={(e) => setPayForm({ ...payForm, accountNumber: e.target.value })}
            placeholder="Nomor rekening asal transfer"
            required
          />

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsPayModalOpen(false)}>
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="bg-[#7ADA3A] text-slate-900 font-bold hover:bg-[#68c62f]"
            >
              Kirim Konfirmasi Pembayaran
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL PRATINJAU BUKTI FOTO */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title="Pratinjau Foto Dokumen"
        size="md"
      >
        <div className="space-y-4">
          {previewProofUrl && (
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center p-2">
              <img
                src={previewProofUrl}
                alt="Dokumen"
                className="max-h-[60vh] w-auto object-contain rounded-xl"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <a
              href={previewProofUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-[#254d0d] hover:underline inline-flex items-center gap-1"
            >
              <ExternalLink size={13} />
              <span>Buka Tab Baru</span>
            </a>
            <Button variant="secondary" size="sm" onClick={() => setIsPreviewModalOpen(false)}>
              Tutup
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
