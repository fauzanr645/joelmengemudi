"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import {
  Check,
  X as XIcon,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Plus,
  Eye,
  Receipt,
  FileCheck,
  ExternalLink,
  Clock,
  Send,
  Building2,
} from "lucide-react"
import { formatCurrency, formatDateTime, getWhatsAppLink, cn } from "@/lib/utils"

interface Payment {
  id: string
  amount: number
  status: string
  bankName: string | null
  accountName: string | null
  accountNumber: string | null
  transferProof: string | null
  confirmedAt: string | null
  rejectionReason: string | null
  notes: string | null
  createdAt: string
  student: { id: string; name: string; email: string; phone: string | null }
  enrollment: {
    id: string
    course: { name: string; price: number; courseType: string }
    branch: { name: string }
    payments?: {
      id: string
      amount: number
      status: string
    }[]
  }
}

interface Enrollment {
  id: string
  studentId: string
  student: { id: string; name: string; phone: string | null; email: string }
  course: { name: string; price: number; courseType: string; sessions: number }
  branch: { name: string }
  status: string
  payments?: {
    id: string
    amount: number
    status: string
  }[]
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [activeFilter, setActiveFilter] = useState<"ALL" | "PENDING_PROOF" | "PENDING_BILLS" | "CONFIRMED">("ALL")

  // Modal States
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")

  // View Full Proof Modal
  const [previewProofPayment, setPreviewProofPayment] = useState<Payment | null>(null)
  const [isProofModalOpen, setIsProofModalOpen] = useState(false)

  // Create Bill Modal State
  const [isCreateBillOpen, setIsCreateBillOpen] = useState(false)
  const [billTypeOption, setBillTypeOption] = useState<"HALF" | "FULL" | "REMAINING" | "CUSTOM">("HALF")
  const [billForm, setBillForm] = useState({
    enrollmentId: "",
    amount: 0,
    notes: "Tagihan Pembayaran Uang Muka (DP 50%) Kursus Mengemudi",
  })

  const [isLoading, setIsLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string>("")
  const [errorMsg, setErrorMsg] = useState<string>("")

  const fetchData = async () => {
    try {
      const [payRes, enrollRes] = await Promise.all([
        fetch("/api/payments"), // strictly CS branch
        fetch("/api/enrollments"), // strictly CS branch
      ])
      setPayments(await payRes.json())
      setEnrollments(await enrollRes.json())
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

  const handleConfirm = async (id: string) => {
    if (!confirm("Konfirmasi pembayaran ini sebagai sah?")) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/payments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONFIRMED" }),
      })
      if (res.ok) {
        setSuccessMsg("Pembayaran berhasil diverifikasi dan dikonfirmasi sah!")
        setIsProofModalOpen(false)
        fetchData()
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selectedPayment) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/payments/${selectedPayment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED", rejectionReason }),
      })
      if (res.ok) {
        setSuccessMsg("Pembayaran berhasil ditolak dengan alasan yang tercatat.")
        setIsRejectOpen(false)
        setIsProofModalOpen(false)
        fetchData()
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Create Bill / Invoice Submission
  const openCreateBillModal = () => {
    const firstEn = enrollments.find((e) => e.status === "ACTIVE") || enrollments[0]
    const initialPrice = firstEn ? firstEn.course.price / 2 : 0

    setBillTypeOption("HALF")
    setBillForm({
      enrollmentId: firstEn?.id || "",
      amount: initialPrice,
      notes: "Tagihan Pembayaran Uang Muka (DP 50%) Kursus Mengemudi",
    })
    setErrorMsg("")
    setIsCreateBillOpen(true)
  }

  const handleBillTypeChange = (type: "HALF" | "FULL" | "REMAINING" | "CUSTOM", en?: Enrollment) => {
    setBillTypeOption(type)
    if (!en) {
      en = enrollments.find((e) => e.id === billForm.enrollmentId)
    }
    if (!en) return

    const price = en.course.price
    const paymentsList = en.payments || []
    const confirmedTotal = paymentsList
      .filter((p) => p.status === "CONFIRMED")
      .reduce((acc, p) => acc + p.amount, 0)
    const remaining = Math.max(0, price - confirmedTotal)

    if (type === "HALF") {
      setBillForm((prev) => ({
        ...prev,
        amount: price / 2,
        notes: "Tagihan Pembayaran Uang Muka (DP 50%) Kursus Mengemudi",
      }))
    } else if (type === "FULL") {
      setBillForm((prev) => ({
        ...prev,
        amount: price,
        notes: "Tagihan Pelunasan Penuh (100%) Kursus Mengemudi",
      }))
    } else if (type === "REMAINING") {
      setBillForm((prev) => ({
        ...prev,
        amount: remaining || price / 2,
        notes: "Tagihan Pelunasan Sisa Biaya Kursus (50%)",
      }))
    }
  }

  const handleCreateBillSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!billForm.enrollmentId || !billForm.amount) {
      setErrorMsg("Pilih siswa kursus dan tentukan nominal tagihan.")
      return
    }

    const selectedEn = enrollments.find((e) => e.id === billForm.enrollmentId)
    if (!selectedEn) return

    setIsLoading(true)
    setErrorMsg("")
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedEn.studentId,
          enrollmentId: selectedEn.id,
          amount: Number(billForm.amount),
          notes: billForm.notes,
          paymentMethod: "BANK_TRANSFER",
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Gagal menerbitkan tagihan.")
      }

      setIsCreateBillOpen(false)
      setSuccessMsg(
        `Tagihan sebesar ${formatCurrency(billForm.amount)} berhasil diterbitkan untuk siswa ${selectedEn.student.name}!`
      )
      fetchData()
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat membuat tagihan.")
    } finally {
      setIsLoading(false)
    }
  }

  const openProofModal = (payment: Payment) => {
    setPreviewProofPayment(payment)
    setIsProofModalOpen(true)
  }

  // Filter Categories
  const paymentsWithProof = payments.filter((p) => p.status === "PENDING" && Boolean(p.transferProof))
  const unpaidBills = payments.filter((p) => p.status === "PENDING" && !p.transferProof)
  const confirmedPayments = payments.filter((p) => p.status === "CONFIRMED")

  const filteredPayments =
    activeFilter === "ALL"
      ? payments
      : activeFilter === "PENDING_PROOF"
      ? paymentsWithProof
      : activeFilter === "PENDING_BILLS"
      ? unpaidBills
      : confirmedPayments

  const statusBadge: Record<string, "success" | "warning" | "danger" | "info"> = {
    PENDING: "warning",
    CONFIRMED: "success",
    REJECTED: "danger",
    REFUNDED: "info",
  }
  const statusLabels: Record<string, string> = {
    PENDING: "Menunggu CS",
    CONFIRMED: "Dikonfirmasi (Sah)",
    REJECTED: "Ditolak",
    REFUNDED: "Dikembalikan",
  }

  const selectedEnrollmentForBill = enrollments.find((e) => e.id === billForm.enrollmentId)

  const columns = [
    {
      key: "student",
      label: "Siswa & Kontak",
      render: (item: Payment) => (
        <div>
          <p className="font-bold text-slate-900">{item.student.name}</p>
          <p className="text-xs text-slate-400 font-medium">
            {item.student.phone || item.student.email} • {item.enrollment.branch.name}
          </p>
        </div>
      ),
    },
    {
      key: "course",
      label: "Paket Kursus",
      render: (item: Payment) => (
        <div>
          <p className="font-bold text-xs text-slate-800">{item.enrollment.course.name}</p>
          <p className="text-[11px] text-slate-400">
            Total Biaya: {formatCurrency(item.enrollment.course.price)}
          </p>
        </div>
      ),
    },
    {
      key: "transferProof",
      label: "Bukti Transfer",
      render: (item: Payment) => (
        item.transferProof ? (
          <button
            type="button"
            onClick={() => openProofModal(item)}
            className="flex items-center gap-2 group cursor-pointer p-1 rounded-xl hover:bg-slate-100 transition-colors text-left"
            title="Klik untuk membuka bukti transfer ukuran penuh"
          >
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
              <img
                src={item.transferProof}
                alt="Bukti Transfer"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
              />
            </div>
            <div className="text-[11px]">
              <span className="font-bold text-[#2a5513] group-hover:underline flex items-center gap-0.5">
                <Eye size={12} />
                <span>Lihat Bukti</span>
              </span>
              <span className="text-[10px] text-slate-400 block font-medium">
                Foto Struk
              </span>
            </div>
          </button>
        ) : (
          <div>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              Belum Upload Bukti
            </span>
          </div>
        )
      ),
    },
    {
      key: "paymentType",
      label: "Tipe Pembayaran",
      render: (item: Payment) => {
        const coursePrice = item.enrollment.course.price
        const half = coursePrice / 2
        const isHalf = Math.abs(item.amount - half) < 1000
        const isFull = Math.abs(item.amount - coursePrice) < 1000

        return (
          <div className="space-y-0.5">
            <span
              className={cn(
                "px-2.5 py-0.5 rounded-md text-[11px] font-bold inline-block",
                isFull
                  ? "bg-emerald-100 text-emerald-800"
                  : isHalf
                  ? "bg-[#7ADA3A]/25 text-[#244b0c] border border-[#7ADA3A]/40"
                  : "bg-slate-100 text-slate-700"
              )}
            >
              {isFull ? "Bayar Lunas (100%)" : isHalf ? "Bayar Setengah (DP 50%)" : "Pelunasan / Tagihan"}
            </span>
            {item.notes && <p className="text-[10px] text-slate-400 italic truncate max-w-xs">{item.notes}</p>}
          </div>
        )
      },
    },
    {
      key: "amount",
      label: "Nominal Tagihan / Transfer",
      render: (item: Payment) => (
        <span className="font-extrabold text-sm text-[#244c0d]">
          {formatCurrency(item.amount)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status Verifikasi",
      render: (item: Payment) => (
        <div className="space-y-1">
          <Badge variant={statusBadge[item.status] || "default"} dot>
            {statusLabels[item.status] || item.status}
          </Badge>
          {!item.transferProof && item.status === "PENDING" && (
            <span className="block text-[10px] text-amber-700 font-semibold">
              Tagihan Diterbitkan
            </span>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Aksi",
      render: (item: Payment) => {
        const coursePrice = item.enrollment.course.price
        const half = coursePrice / 2
        const isHalf = Math.abs(item.amount - half) < 1000
        const remainingAmount = Math.max(0, coursePrice - item.amount)

        let waMsg = ""
        if (item.status === "CONFIRMED") {
          waMsg = isHalf
            ? `Halo Kak ${item.student.name}, pembayaran DP 50% sebesar ${formatCurrency(item.amount)} untuk ${item.enrollment.course.name} telah dikonfirmasi sah oleh joelmengemudi. Sisa tagihan pelunasan: ${formatCurrency(remainingAmount)}. Selamat berlatih!`
            : `Halo Kak ${item.student.name}, pembayaran sebesar ${formatCurrency(item.amount)} untuk ${item.enrollment.course.name} telah dikonfirmasi sah oleh joelmengemudi. Pembayaran kursus Anda kini LUNAS 100%. Selamat berlatih!`
        } else if (item.transferProof) {
          waMsg = `Halo Kak ${item.student.name}, bukti transfer Anda sebesar ${formatCurrency(item.amount)} sedang diverifikasi oleh CS joelmengemudi. Terima kasih!`
        } else {
          // Tagihan belum diupload bukti
          waMsg = `Halo Kak ${item.student.name}, kami telah menerbitkan tagihan kursus ${item.enrollment.course.name} sebesar ${formatCurrency(item.amount)} (${item.notes || "Tagihan Pembayaran"}). Mohon lakukan transfer dan upload bukti transfer melalui web/aplikasi joelmengemudi. Terima kasih!`
        }

        const waUrl = getWhatsAppLink(item.student.phone, waMsg)

        return (
          <div className="flex items-center gap-1.5 justify-end">
            {/* Tombol WA */}
            {item.student.phone && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#7ADA3A] text-slate-900 hover:bg-[#66be2f] transition-colors shadow-2xs"
                title="Kirim Pesan WhatsApp ke Siswa"
              >
                <MessageSquare size={13} />
                <span>WA</span>
              </a>
            )}

            {/* Tombol Buka Bukti Transfer jika ada */}
            {item.transferProof && (
              <button
                onClick={() => openProofModal(item)}
                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
                title="Lihat Bukti Transfer .webp"
              >
                <Eye size={14} />
              </button>
            )}

            {/* Tombol Konfirmasi / Tolak jika PENDING */}
            {item.status === "PENDING" && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleConfirm(item.id)}
                  className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer"
                  title="Konfirmasi Pembayaran Sah"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => {
                    setSelectedPayment(item)
                    setIsRejectOpen(true)
                  }}
                  className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-2xs cursor-pointer"
                  title="Tolak Pembayaran"
                >
                  <XIcon size={14} />
                </button>
              </div>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header with Create Bill Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Verifikasi Pembayaran & Tagihan Siswa
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Terbitkan tagihan ke akun siswa, verifikasi foto bukti transfer, dan kirim konfirmasi WhatsApp
          </p>
        </div>

        <Button
          onClick={openCreateBillModal}
          variant="primary"
          leftIcon={<Receipt size={16} />}
          className="self-start sm:self-auto font-bold text-slate-900 bg-[#7ADA3A] hover:bg-[#68c62f]"
        >
          Terbitkan Tagihan Siswa Baru
        </Button>
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
          Semua ({payments.length})
        </button>

        <button
          onClick={() => setActiveFilter("PENDING_PROOF")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer",
            activeFilter === "PENDING_PROOF"
              ? "bg-amber-600 text-white shadow-sm"
              : "text-amber-800 bg-amber-50 hover:bg-amber-100"
          )}
        >
          <span>Perlu Dicek (Ada Bukti Transfer) ({paymentsWithProof.length})</span>
          {paymentsWithProof.length > 0 && (
            <span className="bg-amber-700 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
              {paymentsWithProof.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveFilter("PENDING_BILLS")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer",
            activeFilter === "PENDING_BILLS"
              ? "bg-sky-600 text-white shadow-sm"
              : "text-sky-800 bg-sky-50 hover:bg-sky-100"
          )}
        >
          <span>Tagihan Diterbitkan (Belum Ada Bukti) ({unpaidBills.length})</span>
        </button>

        <button
          onClick={() => setActiveFilter("CONFIRMED")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer",
            activeFilter === "CONFIRMED"
              ? "bg-emerald-700 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          )}
        >
          Terkonfirmasi Sah ({confirmedPayments.length})
        </button>
      </div>

      <DataTable
        columns={columns}
        data={filteredPayments}
        searchable
        searchPlaceholder="Cari nama siswa, paket kursus, atau bank..."
        emptyMessage="Belum ada transaksi pembayaran pada kategori ini."
      />

      {/* MODAL TERBITKAN TAGIHAN SISWA BARU */}
      <Modal
        isOpen={isCreateBillOpen}
        onClose={() => setIsCreateBillOpen(false)}
        title="Terbitkan Tagihan Pembayaran Siswa"
        subtitle="Tagihan ini akan langsung muncul di halaman akun siswa untuk dibayar & diupload buktinya"
        size="md"
      >
        <form onSubmit={handleCreateBillSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <Select
            label="Pilih Siswa & Kursus Yang Ditagih"
            value={billForm.enrollmentId}
            onChange={(e) => {
              const selectedEn = enrollments.find((en) => en.id === e.target.value)
              setBillForm((prev) => ({ ...prev, enrollmentId: e.target.value }))
              if (selectedEn) {
                handleBillTypeChange(billTypeOption, selectedEn)
              }
            }}
            required
            placeholder="Pilih Pendaftaran Siswa"
            options={enrollments.map((en) => ({
              value: en.id,
              label: `${en.student.name} - ${en.course.name} (${formatCurrency(en.course.price)})`,
            }))}
          />

          {/* Opsi Cepat Tipe Tagihan */}
          {selectedEnrollmentForBill && (
            <div className="space-y-2 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Pilih Tipe Tagihan
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleBillTypeChange("HALF", selectedEnrollmentForBill)}
                  className={cn(
                    "p-2.5 rounded-xl border text-left transition-all cursor-pointer text-xs",
                    billTypeOption === "HALF"
                      ? "bg-[#7ADA3A]/20 border-[#7ADA3A] text-slate-900 font-bold"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <p className="font-bold">Tagihan DP 50%</p>
                  <p className="text-[11px] text-[#295413] font-black mt-0.5">
                    {formatCurrency(selectedEnrollmentForBill.course.price / 2)}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleBillTypeChange("REMAINING", selectedEnrollmentForBill)}
                  className={cn(
                    "p-2.5 rounded-xl border text-left transition-all cursor-pointer text-xs",
                    billTypeOption === "REMAINING"
                      ? "bg-[#7ADA3A]/20 border-[#7ADA3A] text-slate-900 font-bold"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <p className="font-bold">Tagihan Pelunasan (50%)</p>
                  <p className="text-[11px] text-[#295413] font-black mt-0.5">
                    {formatCurrency(selectedEnrollmentForBill.course.price / 2)}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleBillTypeChange("FULL", selectedEnrollmentForBill)}
                  className={cn(
                    "p-2.5 rounded-xl border text-left transition-all cursor-pointer text-xs",
                    billTypeOption === "FULL"
                      ? "bg-[#7ADA3A]/20 border-[#7ADA3A] text-slate-900 font-bold"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <p className="font-bold">Tagihan Lunas 100%</p>
                  <p className="text-[11px] text-[#295413] font-black mt-0.5">
                    {formatCurrency(selectedEnrollmentForBill.course.price)}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setBillTypeOption("CUSTOM")}
                  className={cn(
                    "p-2.5 rounded-xl border text-left transition-all cursor-pointer text-xs",
                    billTypeOption === "CUSTOM"
                      ? "bg-[#7ADA3A]/20 border-[#7ADA3A] text-slate-900 font-bold"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <p className="font-bold">Nominal Bebas</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Ketik manual</p>
                </button>
              </div>
            </div>
          )}

          <Input
            label="Nominal Tagihan (Rp)"
            type="number"
            value={billForm.amount}
            onChange={(e) => setBillForm({ ...billForm, amount: Number(e.target.value) })}
            placeholder="Contoh: 900000"
            required
          />

          <Input
            label="Catatan / Keterangan Tagihan"
            value={billForm.notes}
            onChange={(e) => setBillForm({ ...billForm, notes: e.target.value })}
            placeholder="Contoh: Tagihan DP 50% - Harap bayar sebelum sesi 1"
            required
          />

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsCreateBillOpen(false)}>
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="bg-[#7ADA3A] text-slate-900 font-bold hover:bg-[#68c62f]"
            >
              Terbitkan Tagihan Sekarang
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL PRATINJAU BUKTI TRANSFER UKURAN PENUH UNTUK CS */}
      <Modal
        isOpen={isProofModalOpen}
        onClose={() => setIsProofModalOpen(false)}
        title="Verifikasi Bukti Transfer"
        subtitle={`Siswa: ${previewProofPayment?.student.name || ""} • ${formatCurrency(previewProofPayment?.amount || 0)}`}
        size="md"
      >
        {previewProofPayment && (
          <div className="space-y-4">
            {/* Info Rincian */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Nama Siswa:</span>
                <span className="font-bold text-slate-900">{previewProofPayment.student.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Paket Kursus:</span>
                <span className="font-bold text-slate-900">{previewProofPayment.enrollment.course.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Bank Pengirim:</span>
                <span className="font-bold text-slate-900">
                  {previewProofPayment.bankName || "Bank"} - a/n {previewProofPayment.accountName || "-"} (Rek: {previewProofPayment.accountNumber || "-"})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Nominal Transfer:</span>
                <span className="font-black text-sm text-[#254d0d]">{formatCurrency(previewProofPayment.amount)}</span>
              </div>
            </div>

            {/* Gambar Bukti Transfer */}
            {previewProofPayment.transferProof ? (
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center p-2 relative">
                <img
                  src={previewProofPayment.transferProof}
                  alt="Bukti Transfer Penuh"
                  className="max-h-[60vh] w-auto object-contain rounded-xl"
                />
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                Siswa belum mengunggah gambar bukti transfer.
              </div>
            )}

            {/* Tombol Aksi Verifikasi Langsung */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              {previewProofPayment.transferProof ? (
                <a
                  href={previewProofPayment.transferProof}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-[#254d0d] hover:underline inline-flex items-center gap-1"
                >
                  <ExternalLink size={13} />
                  <span>Buka Tab Baru</span>
                </a>
              ) : <div />}

              <div className="flex items-center gap-2">
                {previewProofPayment.status === "PENDING" && (
                  <>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        setSelectedPayment(previewProofPayment)
                        setIsRejectOpen(true)
                      }}
                      className="text-xs"
                    >
                      <XIcon size={14} className="mr-1" />
                      <span>Tolak</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleConfirm(previewProofPayment.id)}
                      isLoading={isLoading}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                      <Check size={14} className="mr-1" />
                      <span>Konfirmasi Pembayaran Sah</span>
                    </Button>
                  </>
                )}
                <Button variant="secondary" size="sm" onClick={() => setIsProofModalOpen(false)}>
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Tolak Pembayaran */}
      <Modal
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        title="Tolak Verifikasi Pembayaran"
        subtitle={`Siswa: ${selectedPayment?.student.name || ""} (${formatCurrency(selectedPayment?.amount || 0)})`}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Tuliskan alasan penolakan agar siswa dapat memeriksa kembali mutasi rekening atau bukti transfernya:
          </p>

          <Input
            label="Alasan Penolakan"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            required
            placeholder="Contoh: Bukti transfer buram / dana belum masuk mutasi"
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsRejectOpen(false)}>
              Batal
            </Button>
            <Button type="button" variant="danger" onClick={handleReject} isLoading={isLoading}>
              Tolak Pembayaran
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
