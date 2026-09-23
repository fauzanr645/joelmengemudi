"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Modal } from "@/components/ui/modal"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import {
  Plus,
  CreditCard,
  Copy,
  Check,
  Building2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  DollarSign,
  Receipt,
  Upload,
  Image as ImageIcon,
  FileCheck,
  X,
  ExternalLink,
  Eye,
  Bell,
} from "lucide-react"
import { formatCurrency, formatDateTime, formatDate, cn } from "@/lib/utils"
import { convertImageToWebP, formatFileSize, WebPConversionResult } from "@/lib/image-converter"

interface Payment {
  id: string
  amount: number
  status: string
  bankName: string | null
  accountName: string | null
  accountNumber: string | null
  transferProof: string | null
  rejectionReason: string | null
  notes: string | null
  createdAt: string
  confirmedAt: string | null
  enrollment: {
    course: { name: string; price: number }
    branch: { name: string }
  }
}

interface Enrollment {
  id: string
  course: { name: string; price: number; courseType: string; sessions: number }
  branch: { name: string }
  status: string
  payments?: {
    id: string
    amount: number
    status: string
    createdAt: string
    confirmedAt: string | null
  }[]
}

interface BankAccount {
  id: string
  bankName: string
  accountNumber: string
  accountName: string
  isActive: boolean
}

export default function StudentPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [copiedBank, setCopiedBank] = useState<string | null>(null)
  const [paymentOption, setPaymentOption] = useState<"HALF" | "FULL" | "REMAINING" | "CUSTOM">("HALF")

  // Target payment ID if paying an existing bill from CS
  const [targetBillId, setTargetBillId] = useState<string | null>(null)

  // WebP Image Upload State
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [webpResult, setWebpResult] = useState<WebPConversionResult | null>(null)
  const [isConvertingImage, setIsConvertingImage] = useState(false)
  const [imageError, setImageError] = useState<string>("")

  // Preview Proof Modal
  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)

  const [form, setForm] = useState({
    enrollmentId: "",
    amount: 0,
    bankName: "BCA",
    accountName: "",
    accountNumber: "",
    notes: "",
  })

  const copyToClipboard = (text: string, bank: string) => {
    navigator.clipboard.writeText(text)
    setCopiedBank(bank)
    setTimeout(() => setCopiedBank(null), 2000)
  }

  const fetchData = async () => {
    try {
      const [payRes, enrollRes, banksRes] = await Promise.all([
        fetch("/api/payments"),
        fetch("/api/enrollments"),
        fetch("/api/bank-accounts?activeOnly=true"),
      ])
      setPayments(await payRes.json())
      setEnrollments(await enrollRes.json())

      const banksData = await banksRes.json()
      if (Array.isArray(banksData) && banksData.length > 0) {
        setBankAccounts(banksData)
        setForm((prev) => ({ ...prev, bankName: banksData[0].bankName }))
      } else {
        setBankAccounts([
          { id: "1", bankName: "BCA", accountNumber: "1234567890", accountName: "PT Joel Mengemudi Jaya", isActive: true },
          { id: "2", bankName: "BRI", accountNumber: "0987654321", accountName: "PT Joel Mengemudi Jaya", isActive: true },
          { id: "3", bankName: "Mandiri", accountNumber: "1122334455", accountName: "PT Joel Mengemudi Jaya", isActive: true },
        ])
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Calculate billing status for a given enrollment
  const getEnrollmentBilling = (en: Enrollment) => {
    const coursePrice = en.course.price
    const paymentsList = en.payments || []
    const confirmedTotal = paymentsList
      .filter((p) => p.status === "CONFIRMED")
      .reduce((acc, p) => acc + p.amount, 0)
    const pendingTotal = paymentsList
      .filter((p) => p.status === "PENDING")
      .reduce((acc, p) => acc + p.amount, 0)
    const remaining = Math.max(0, coursePrice - confirmedTotal)
    const halfPrice = coursePrice / 2
    const percentPaid = Math.min(100, Math.round((confirmedTotal / coursePrice) * 100))

    return {
      coursePrice,
      confirmedTotal,
      pendingTotal,
      remaining,
      halfPrice,
      percentPaid,
      isFullyPaid: remaining === 0 && confirmedTotal > 0,
      hasPaidHalf: confirmedTotal >= halfPrice && remaining > 0,
    }
  }

  // Tagihan yang diterbitkan oleh CS yang belum diupload bukti transfer
  const unpaidBillsFromCS = payments.filter((p) => !p.transferProof && p.status === "PENDING")

  // Open modal with pre-calculated options
  const openPaymentModalForEnrollment = (
    en: Enrollment,
    preferredMode?: "HALF" | "REMAINING" | "FULL" | "CUSTOM",
    existingBill?: Payment
  ) => {
    const billing = getEnrollmentBilling(en)
    let initialAmount = billing.halfPrice
    let mode: "HALF" | "FULL" | "REMAINING" | "CUSTOM" = "HALF"

    if (existingBill) {
      setTargetBillId(existingBill.id)
      initialAmount = existingBill.amount
      mode = "CUSTOM"
    } else {
      setTargetBillId(null)
      if (preferredMode) {
        mode = preferredMode
        if (preferredMode === "HALF") initialAmount = billing.halfPrice
        else if (preferredMode === "REMAINING") initialAmount = billing.remaining
        else if (preferredMode === "FULL") initialAmount = billing.remaining || billing.coursePrice
      } else {
        if (billing.confirmedTotal === 0) {
          mode = "HALF"
          initialAmount = billing.halfPrice
        } else if (billing.remaining > 0) {
          mode = "REMAINING"
          initialAmount = billing.remaining
        } else {
          mode = "CUSTOM"
          initialAmount = 0
        }
      }
    }

    setPaymentOption(mode)
    setSelectedImageFile(null)
    setWebpResult(null)
    setImageError("")

    setForm({
      enrollmentId: en.id,
      amount: initialAmount,
      bankName: bankAccounts[0]?.bankName || "BCA",
      accountName: "",
      accountNumber: "",
      notes: existingBill
        ? existingBill.notes || "Pembayaran Tagihan CS"
        : mode === "HALF"
        ? "Pembayaran Uang Muka / Setengah (DP 50%)"
        : mode === "REMAINING"
        ? "Pelunasan Sisa Pembayaran Kursus (50%)"
        : "Pembayaran Lunas (100%)",
    })
    setIsModalOpen(true)
  }

  // Handle Image File Selection & Auto-Convert to .webp
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedImageFile(file)
    setImageError("")
    setIsConvertingImage(true)

    try {
      // Auto convert to WebP
      const result = await convertImageToWebP(file, 0.85)
      setWebpResult(result)
    } catch (err: any) {
      console.error(err)
      setImageError(err.message || "Gagal memproses gambar bukti transfer.")
    } finally {
      setIsConvertingImage(false)
    }
  }

  const removeSelectedImage = () => {
    setSelectedImageFile(null)
    setWebpResult(null)
    setImageError("")
  }

  const handleOptionChange = (opt: "HALF" | "FULL" | "REMAINING" | "CUSTOM", en?: Enrollment) => {
    setPaymentOption(opt)
    if (!en) {
      en = enrollments.find((e) => e.id === form.enrollmentId)
    }
    if (!en) return

    const billing = getEnrollmentBilling(en)
    if (opt === "HALF") {
      setForm((prev) => ({
        ...prev,
        amount: billing.halfPrice,
        notes: "Pembayaran Uang Muka / Setengah (DP 50%)",
      }))
    } else if (opt === "FULL") {
      setForm((prev) => ({
        ...prev,
        amount: billing.coursePrice,
        notes: "Pembayaran Lunas Langsung (100%)",
      }))
    } else if (opt === "REMAINING") {
      setForm((prev) => ({
        ...prev,
        amount: billing.remaining,
        notes: "Pelunasan Sisa Pembayaran Kursus (50%)",
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setImageError("")

    try {
      let uploadedWebpUrl: string | null = null

      // 1. Upload WebP Image if provided
      if (webpResult) {
        // Upload base64 WebP or form-data
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dataUrl: webpResult.dataUrl,
            filename: webpResult.filename,
          }),
        })

        const uploadData = await uploadRes.json()
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || "Gagal mengunggah gambar bukti transfer.")
        }
        uploadedWebpUrl = uploadData.url
      }

      // 2. Submit payment or update existing bill
      if (targetBillId) {
        // Update existing bill with student's bank info & webp proof
        const res = await fetch(`/api/payments/${targetBillId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: Number(form.amount),
            bankName: form.bankName,
            accountName: form.accountName,
            accountNumber: form.accountNumber,
            notes: form.notes,
            transferProof: uploadedWebpUrl,
          }),
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || "Gagal mengonfirmasi pembayaran tagihan.")
        }
      } else {
        // Create new payment
        const res = await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            amount: Number(form.amount),
            transferProof: uploadedWebpUrl,
          }),
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || "Gagal mengirimkan konfirmasi pembayaran.")
        }
      }

      setIsModalOpen(false)
      setSelectedImageFile(null)
      setWebpResult(null)
      setTargetBillId(null)
      fetchData()
    } catch (error: any) {
      console.error(error)
      setImageError(error.message || "Terjadi kesalahan saat memproses pembayaran.")
    } finally {
      setIsLoading(false)
    }
  }

  const openPreviewProof = (url: string) => {
    setPreviewProofUrl(url)
    setIsPreviewModalOpen(true)
  }

  const statusBadge: Record<string, "success" | "warning" | "danger" | "info" | "brand"> = {
    PENDING: "warning",
    CONFIRMED: "success",
    REJECTED: "danger",
    REFUNDED: "info",
  }
  const statusLabels: Record<string, string> = {
    PENDING: "Menunggu Verifikasi CS",
    CONFIRMED: "Dikonfirmasi (Lunas/Sah)",
    REJECTED: "Ditolak",
    REFUNDED: "Dikembalikan",
  }

  const selectedEnrollment = enrollments.find((e) => e.id === form.enrollmentId)
  const currentBilling = selectedEnrollment ? getEnrollmentBilling(selectedEnrollment) : null

  const columns = [
    {
      key: "course",
      label: "Paket Kursus",
      render: (item: Payment) => (
        <div>
          <p className="font-bold text-slate-900">{item.enrollment.course.name}</p>
          <span className="text-[11px] text-slate-400 font-medium">{item.enrollment.branch.name}</span>
        </div>
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
              {isFull ? "Lunas (100%)" : isHalf ? "Setengah / DP (50%)" : "Sebagian / Pelunasan"}
            </span>
            {item.notes && <p className="text-[10px] text-slate-400 italic truncate max-w-xs">{item.notes}</p>}
          </div>
        )
      },
    },
    {
      key: "amount",
      label: "Nominal Transfer",
      render: (item: Payment) => (
        <span className="font-extrabold text-sm text-[#244c0d]">{formatCurrency(item.amount)}</span>
      ),
    },
    {
      key: "transferProof",
      label: "Bukti Transfer",
      render: (item: Payment) => (
        item.transferProof ? (
          <button
            type="button"
            onClick={() => openPreviewProof(item.transferProof!)}
            className="flex items-center gap-2 group cursor-pointer p-1 rounded-xl hover:bg-slate-100 transition-colors"
            title="Klik untuk melihat bukti transfer ukuran besar"
          >
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 relative shrink-0">
              <img
                src={item.transferProof}
                alt="Bukti Transfer"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
              />
            </div>
            <div className="text-left text-[11px]">
              <span className="font-bold text-[#2a5513] group-hover:underline flex items-center gap-0.5">
                <Eye size={12} />
                <span>Lihat Bukti</span>
              </span>
              <span className="text-[10px] text-slate-400 block font-medium">Struk Transfer</span>
            </div>
          </button>
        ) : (
          <div className="text-xs">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              Belum Ada Bukti
            </span>
          </div>
        )
      ),
    },
    {
      key: "bank",
      label: "Bank & Rekening",
      render: (item: Payment) => (
        <div className="text-xs space-y-0.5">
          <p className="font-bold text-slate-800">{item.bankName || "Transfer Bank"}</p>
          <p className="text-slate-400 text-[11px]">
            {item.accountNumber ? `${item.accountNumber} • ` : ""}a/n {item.accountName || "-"}
          </p>
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "Tanggal Kirim",
      render: (item: Payment) => (
        <span className="text-xs text-slate-500 font-medium">{formatDateTime(item.createdAt)}</span>
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
          {item.rejectionReason && (
            <p className="text-[11px] text-rose-600 font-medium mt-0.5 max-w-xs">
              Alasan: {item.rejectionReason}
            </p>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Status & Pembayaran Kursus</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Unggah bukti transfer, bayar DP 50%, pelunasan, atau respon tagihan dari CS
          </p>
        </div>
        <Button
          onClick={() => {
            const firstActive = enrollments.find((e) => e.status === "ACTIVE") || enrollments[0]
            if (firstActive) {
              openPaymentModalForEnrollment(firstActive)
            } else {
              setIsModalOpen(true)
            }
          }}
          variant="primary"
          leftIcon={<Plus size={16} />}
          className="self-start sm:self-auto font-bold text-slate-900 bg-[#7ADA3A] hover:bg-[#68c62f]"
        >
          Konfirmasi Transfer Baru
        </Button>
      </div>

      {/* SECTION: TAGIHAN DARI CUSTOMER SERVICE (JIKA ADA) */}
      {unpaidBillsFromCS.length > 0 && (
        <div className="p-5 rounded-3xl bg-amber-50/90 border border-amber-200/90 shadow-sm space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                <Bell size={18} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  Tagihan Pembayaran Diterbitkan oleh Customer Service
                </h3>
                <p className="text-xs text-amber-800">
                  Ada {unpaidBillsFromCS.length} tagihan kursus yang menunggu pembayaran & unggahan bukti transfer Anda
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-600 text-white">
              Perlu Dibayar
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {unpaidBillsFromCS.map((bill) => {
              const en = enrollments.find((e) => e.id === (bill as any).enrollmentId)
              return (
                <div
                  key={bill.id}
                  className="p-4 bg-white rounded-2xl border border-amber-200 shadow-2xs flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{bill.enrollment.course.name}</span>
                      <span className="text-[11px] text-slate-400">{formatDate(bill.createdAt)}</span>
                    </div>
                    <p className="text-lg font-black text-[#264f13]">{formatCurrency(bill.amount)}</p>
                    <p className="text-xs text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-100 italic">
                      "{bill.notes || "Tagihan Pembayaran Kursus"}"
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      if (en) openPaymentModalForEnrollment(en, "CUSTOM", bill)
                    }}
                    className="w-full bg-[#7ADA3A] text-slate-900 font-bold hover:bg-[#68c62f] text-xs flex items-center justify-center gap-1.5"
                  >
                    <Upload size={14} />
                    <span>Bayar Tagihan Ini & Upload Bukti Transfer</span>
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Course Billing Summary Cards */}
      {enrollments.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 px-1">
            <Receipt size={14} className="text-[#3c7717]" />
            <span>Tagihan Paket Kursus Anda</span>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {enrollments.map((en) => {
              const b = getEnrollmentBilling(en)

              return (
                <div
                  key={en.id}
                  className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4 hover:border-[#7ADA3A]/60 transition-all relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold text-[#275013] bg-[#7ADA3A]/20 px-2.5 py-0.5 rounded-md">
                        {en.course.courseType === "MANUAL" ? "Manual" : "Matic"} • {en.branch.name}
                      </span>
                      <h3 className="font-extrabold text-base text-slate-900 mt-1.5">{en.course.name}</h3>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        Total Biaya: <strong className="text-slate-800">{formatCurrency(b.coursePrice)}</strong>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      {b.isFullyPaid ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 size={13} />
                          <span>Lunas (100%)</span>
                        </span>
                      ) : b.hasPaidHalf ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#7ADA3A]/20 text-[#295514] border border-[#7ADA3A]/40">
                          <span>DP 50% Masuk</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <span>Belum Bayar</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar & Balances */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Terbayar:</span>
                      <span className="font-extrabold text-[#285513]">
                        {formatCurrency(b.confirmedTotal)} ({b.percentPaid}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#7ADA3A] to-[#5cb82a] rounded-full transition-all duration-300"
                        style={{ width: `${b.percentPaid}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium pt-0.5">
                      <span>DP 50%: {formatCurrency(b.halfPrice)}</span>
                      <span>
                        Sisa Tagihan:{" "}
                        <strong className={b.remaining > 0 ? "text-rose-600 font-black" : "text-emerald-600 font-black"}>
                          {formatCurrency(b.remaining)}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    {!b.isFullyPaid && (
                      <>
                        {b.confirmedTotal === 0 ? (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => openPaymentModalForEnrollment(en, "HALF")}
                            className="text-xs bg-[#7ADA3A] text-slate-900 font-bold hover:bg-[#68c62f]"
                          >
                            Bayar Setengah Dulu (DP: {formatCurrency(b.halfPrice)})
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => openPaymentModalForEnrollment(en, "REMAINING")}
                            className="text-xs bg-[#7ADA3A] text-slate-900 font-bold hover:bg-[#68c62f]"
                          >
                            Lunasi Sisa ({formatCurrency(b.remaining)})
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Official Bank Account Cards with 1-Click Copy */}
      <div className="space-y-2.5">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 px-1">
          <CreditCard size={14} className="text-[#3c7717]" />
          <span>Nomor Rekening Resmi Pembayaran joelmengemudi</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {bankAccounts.map((acc) => {
            const isCopied = copiedBank === acc.bankName
            return (
              <div
                key={acc.id || acc.bankName}
                className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between gap-3 hover:border-[#7ADA3A]/60 transition-all"
              >
                <div>
                  <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                    Bank {acc.bankName}
                  </span>
                  <p className="font-mono font-bold text-base text-slate-800 mt-1">{acc.accountNumber}</p>
                  <p className="text-[11px] text-slate-400 font-medium">a/n {acc.accountName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(acc.accountNumber, acc.bankName)}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-[#7ADA3A]/20 text-slate-600 hover:text-[#274e14] transition-colors border border-slate-200/80 cursor-pointer shrink-0"
                  title="Salin Nomor Rekening"
                >
                  {isCopied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={payments}
        searchable
        searchPlaceholder="Cari riwayat pembayaran..."
        emptyMessage="Belum ada transaksi pembayaran yang dikirimkan."
      />

      {/* MODAL KONFIRMASI PEMBAYARAN + UPLOAD BUKTI TRANSFER */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={targetBillId ? "Bayar Tagihan dari Customer Service" : "Kirim Konfirmasi Transfer Bank"}
        subtitle="Upload foto struk transfer Anda secara jelas untuk diverifikasi CS"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {imageError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>{imageError}</span>
            </div>
          )}

          <Select
            label="Pilih Kursus yang Dibayar"
            value={form.enrollmentId}
            onChange={(e) => {
              const selectedEn = enrollments.find((en) => en.id === e.target.value)
              setForm((prev) => ({ ...prev, enrollmentId: e.target.value }))
              if (selectedEn) {
                handleOptionChange(paymentOption, selectedEn)
              }
            }}
            required
            placeholder="Pilih Kursus Aktif"
            options={enrollments.map((e) => ({
              value: e.id,
              label: `${e.course.name} - ${formatCurrency(e.course.price)} (${e.branch.name})`,
            }))}
          />

          {/* Payment Amount Choice: 50% vs 100% vs Pelunasan (If not direct bill) */}
          {!targetBillId && selectedEnrollment && currentBilling && (
            <div className="space-y-2 p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200/80">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Pilih Opsi Pembayaran
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentBilling.confirmedTotal === 0 && (
                  <button
                    type="button"
                    onClick={() => handleOptionChange("HALF", selectedEnrollment)}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all cursor-pointer",
                      paymentOption === "HALF"
                        ? "bg-[#7ADA3A]/20 border-[#7ADA3A] text-slate-900 font-bold shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    <p className="text-xs font-bold">Bayar Setengah (DP 50%)</p>
                    <p className="text-xs text-[#2b5814] font-extrabold mt-0.5">
                      {formatCurrency(currentBilling.halfPrice)}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Sisanya dilunasi nanti</p>
                  </button>
                )}

                {currentBilling.confirmedTotal > 0 && currentBilling.remaining > 0 && (
                  <button
                    type="button"
                    onClick={() => handleOptionChange("REMAINING", selectedEnrollment)}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all cursor-pointer",
                      paymentOption === "REMAINING"
                        ? "bg-[#7ADA3A]/20 border-[#7ADA3A] text-slate-900 font-bold shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    <p className="text-xs font-bold">Pelunasan Sisa (50%)</p>
                    <p className="text-xs text-[#2b5814] font-extrabold mt-0.5">
                      {formatCurrency(currentBilling.remaining)}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Melunasi seluruh biaya kursus</p>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleOptionChange("FULL", selectedEnrollment)}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all cursor-pointer",
                    paymentOption === "FULL"
                      ? "bg-[#7ADA3A]/20 border-[#7ADA3A] text-slate-900 font-bold shadow-2xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <p className="text-xs font-bold">Bayar Lunas (100%)</p>
                  <p className="text-xs text-[#2b5814] font-extrabold mt-0.5">
                    {formatCurrency(currentBilling.remaining || currentBilling.coursePrice)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Langsung lunas tanpa cicilan</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentOption("CUSTOM")}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all cursor-pointer",
                    paymentOption === "CUSTOM"
                      ? "bg-[#7ADA3A]/20 border-[#7ADA3A] text-slate-900 font-bold shadow-2xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <p className="text-xs font-bold">Nominal Kustom</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Ketik nominal sendiri</p>
                </button>
              </div>
            </div>
          )}

          <Input
            label="Nominal Transfer (Rp)"
            type="number"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            placeholder="Contoh: 900000"
            required
          />

          {/* UPLOAD FOTO BUKTI TRANSFER */}
          <div className="space-y-2 p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-200">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Upload size={14} className="text-[#3c7717]" />
                <span>Upload Bukti Transfer Bank</span>
              </span>
              <span className="text-[10px] text-emerald-800 font-bold bg-[#7ADA3A]/25 px-2 py-0.5 rounded">
                Foto / Struk
              </span>
            </label>

            {!webpResult ? (
              <div className="relative border-2 border-dashed border-emerald-300 rounded-2xl p-4 text-center hover:bg-white transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center justify-center space-y-1">
                  <div className="w-10 h-10 rounded-xl bg-[#7ADA3A]/20 text-[#2b5814] flex items-center justify-center">
                    <ImageIcon size={20} />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    {isConvertingImage ? "Memproses gambar..." : "Pilih Foto / Screenshot Bukti Transfer"}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Pilih foto struk ATM, screenshot m-banking, atau foto langsung dengan kamera HP
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-white rounded-xl border border-emerald-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                    <img
                      src={webpResult.dataUrl}
                      alt="Preview Bukti"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-slate-900 flex items-center gap-1 truncate max-w-[200px]">
                      <FileCheck size={14} className="text-emerald-600 shrink-0" />
                      <span>{webpResult.filename}</span>
                    </p>
                    <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                      ✓ Foto Siap Dikirim ({formatFileSize(webpResult.convertedSize)})
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={removeSelectedImage}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Hapus / Ganti Gambar"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Select
              label="Tujuan Bank Transfer"
              value={form.bankName}
              onChange={(e) => setForm({ ...form, bankName: e.target.value })}
              required
              options={
                bankAccounts.length > 0
                  ? bankAccounts.map((b) => ({
                      value: b.bankName,
                      label: `Bank ${b.bankName} (${b.accountNumber} a/n ${b.accountName})`,
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
              value={form.accountName}
              onChange={(e) => setForm({ ...form, accountName: e.target.value })}
              placeholder="Nama di buku tabungan Anda"
              required
            />
          </div>

          <Input
            label="Nomor Rekening Pengirim"
            value={form.accountNumber}
            onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
            placeholder="Nomor rekening asal transfer"
            required
          />

          <Input
            label="Catatan Pembayaran"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Contoh: Transfer via m-banking jam 10 pagi"
          />

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
              Kirim Bukti Pembayaran
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL PRATINJAU BUKTI TRANSFER UKURAN PENUH */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title="Pratinjau Bukti Transfer"
        subtitle="Foto bukti transfer pembayaran kursus Anda"
        size="md"
      >
        <div className="space-y-4">
          {previewProofUrl && (
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center p-2">
              <img
                src={previewProofUrl}
                alt="Bukti Transfer Penuh"
                className="max-h-[70vh] w-auto object-contain rounded-xl"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <a
              href={previewProofUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-[#274e14] hover:underline inline-flex items-center gap-1"
            >
              <ExternalLink size={13} />
              <span>Buka di Tab Baru</span>
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
