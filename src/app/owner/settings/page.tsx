"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Modal } from "@/components/ui/modal"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import {
  Settings,
  Headset,
  UserCheck,
  Shield,
  KeyRound,
  Edit2,
  Building2,
  Phone,
  Mail,
  Award,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  CreditCard,
  Copy,
  Check,
  Power,
  User,
  Plus,
  Trash2,
} from "lucide-react"
import { cn, getWhatsAppLink } from "@/lib/utils"

interface UserAccount {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  gender: string | null
  address: string | null
  isActive: boolean
  branchId: string | null
  branch: { name: string; city: string } | null
  licenseNumber?: string | null
  specialization?: string | null
}

interface Branch {
  id: string
  name: string
  city: string
}

interface BankAccount {
  id: string
  bankName: string
  accountNumber: string
  accountName: string
  isActive: boolean
  createdAt?: string
}

export default function OwnerSettingsPage() {
  const [activeTab, setActiveTab] = useState<"CS" | "INSTRUCTOR" | "OWNER_PROFILE" | "SYSTEM">("CS")
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL")
  const [branches, setBranches] = useState<Branch[]>([])

  // Account Lists
  const [csList, setCsList] = useState<UserAccount[]>([])
  const [instructorList, setInstructorList] = useState<UserAccount[]>([])
  const [ownerData, setOwnerData] = useState<any>(null)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])

  // Loading & Feedback
  const [isLoading, setIsLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string>("")
  const [errorMsg, setErrorMsg] = useState<string>("")

  // Reset Password Modal
  const [resetTargetUser, setResetTargetUser] = useState<UserAccount | null>(null)
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false)
  const [newPassword, setNewPassword] = useState<string>("password123")

  // Edit User Modal
  const [editingTargetUser, setEditingTargetUser] = useState<UserAccount | null>(null)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    branchId: "",
    gender: "",
    address: "",
    licenseNumber: "",
    specialization: "BOTH",
    isActive: true,
  })

  // Owner Profile Form
  const [ownerForm, setOwnerForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Bank Account Modal State
  const [isBankModalOpen, setIsBankModalOpen] = useState(false)
  const [editingBankAccount, setEditingBankAccount] = useState<BankAccount | null>(null)
  const [bankForm, setBankForm] = useState({
    bankName: "BCA",
    accountNumber: "",
    accountName: "PT Joel Mengemudi Jaya",
    isActive: true,
  })

  // Bank Copy State
  const [copiedBank, setCopiedBank] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      const [branchRes, csRes, instrRes, sessionRes, banksRes] = await Promise.all([
        fetch("/api/branches"),
        fetch("/api/users?role=CUSTOMER_SERVICE"),
        fetch("/api/users?role=INSTRUCTOR"),
        fetch("/api/auth/session"),
        fetch("/api/bank-accounts"),
      ])

      const branchesData = await branchRes.json()
      const csData = await csRes.json()
      const instData = await instrRes.json()
      const sessData = await sessionRes.json()
      const banksData = await banksRes.json()

      setBranches(branchesData)
      setCsList(csData)
      setInstructorList(instData)
      setBankAccounts(Array.isArray(banksData) ? banksData : [])

      if (sessData?.user) {
        setOwnerData(sessData.user)
        setOwnerForm((prev) => ({
          ...prev,
          name: sessData.user.name || "",
          email: sessData.user.email || "",
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

  // Auto clear alerts
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(""), 4000)
      return () => clearTimeout(timer)
    }
  }, [successMsg])

  const filteredCS =
    selectedBranch === "ALL" ? csList : csList.filter((u) => u.branchId === selectedBranch)

  const filteredInstructors =
    selectedBranch === "ALL"
      ? instructorList
      : instructorList.filter((u) => u.branchId === selectedBranch)

  // 1. Handle Reset Password
  const openResetPasswordModal = (user: UserAccount) => {
    setResetTargetUser(user)
    setNewPassword("password123")
    setErrorMsg("")
    setIsResetPasswordOpen(true)
  }

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetTargetUser) return
    setIsLoading(true)
    setErrorMsg("")
    try {
      const res = await fetch(`/api/users/${resetTargetUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: newPassword,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || "Gagal mereset password.")
        return
      }

      setIsResetPasswordOpen(false)
      setSuccessMsg(`Password akun ${resetTargetUser.name} berhasil direset menjadi "${newPassword}".`)
    } catch (e) {
      setErrorMsg("Terjadi kesalahan koneksi.")
    } finally {
      setIsLoading(false)
    }
  }

  // 2. Handle Edit User
  const openEditUserModal = (user: UserAccount) => {
    setEditingTargetUser(user)
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      branchId: user.branchId || "",
      gender: user.gender || "MALE",
      address: user.address || "",
      licenseNumber: user.licenseNumber || "",
      specialization: user.specialization || "BOTH",
      isActive: user.isActive,
    })
    setErrorMsg("")
    setIsEditUserOpen(true)
  }

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTargetUser) return
    setIsLoading(true)
    setErrorMsg("")
    try {
      const res = await fetch(`/api/users/${editingTargetUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })

      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || "Gagal menyimpan perubahan.")
        return
      }

      setIsEditUserOpen(false)
      setSuccessMsg(`Data akun ${editForm.name} berhasil diperbarui.`)
      fetchData()
    } catch (e) {
      setErrorMsg("Terjadi kesalahan koneksi.")
    } finally {
      setIsLoading(false)
    }
  }

  // 3. Toggle Status Active / Inactive
  const handleToggleStatus = async (user: UserAccount) => {
    const actionName = user.isActive ? "menonaktifkan" : "mengaktifkan"
    if (!confirm(`Apakah Anda yakin ingin ${actionName} akun ${user.name}?`)) return
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: !user.isActive,
        }),
      })
      if (res.ok) {
        setSuccessMsg(`Status akun ${user.name} berhasil diubah.`)
        fetchData()
      }
    } catch (e) {
      console.error(e)
    }
  }

  // 4. Handle Owner Profile & Security Update
  const handleOwnerProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ownerData?.id) return
    setIsLoading(true)
    setErrorMsg("")

    if (ownerForm.newPassword && ownerForm.newPassword !== ownerForm.confirmPassword) {
      setErrorMsg("Konfirmasi password baru tidak cocok!")
      setIsLoading(false)
      return
    }

    try {
      const payload: any = {
        name: ownerForm.name,
        email: ownerForm.email,
        phone: ownerForm.phone,
        address: ownerForm.address,
      }
      if (ownerForm.newPassword.trim()) {
        payload.password = ownerForm.newPassword
      }

      const res = await fetch(`/api/users/${ownerData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || "Gagal memperbarui profil Owner.")
        return
      }

      setOwnerForm((prev) => ({ ...prev, newPassword: "", confirmPassword: "" }))
      setSuccessMsg("Profil dan keamanan akun Owner berhasil diperbarui!")
      fetchData()
    } catch (e) {
      setErrorMsg("Terjadi kesalahan koneksi.")
    } finally {
      setIsLoading(false)
    }
  }

  // 5. Handle Bank Account CRUD
  const openAddBankModal = () => {
    setEditingBankAccount(null)
    setBankForm({
      bankName: "BCA",
      accountNumber: "",
      accountName: "PT Joel Mengemudi Jaya",
      isActive: true,
    })
    setErrorMsg("")
    setIsBankModalOpen(true)
  }

  const openEditBankModal = (bank: BankAccount) => {
    setEditingBankAccount(bank)
    setBankForm({
      bankName: bank.bankName,
      accountNumber: bank.accountNumber,
      accountName: bank.accountName,
      isActive: bank.isActive,
    })
    setErrorMsg("")
    setIsBankModalOpen(true)
  }

  const handleSaveBankAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg("")
    try {
      const url = editingBankAccount
        ? `/api/bank-accounts/${editingBankAccount.id}`
        : "/api/bank-accounts"
      const method = editingBankAccount ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bankForm),
      })

      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || "Gagal menyimpan rekening.")
        return
      }

      setIsBankModalOpen(false)
      setSuccessMsg(
        editingBankAccount
          ? `Rekening Bank ${bankForm.bankName} berhasil diperbarui!`
          : `Rekening Bank ${bankForm.bankName} baru berhasil ditambahkan!`
      )
      fetchData()
    } catch (e) {
      setErrorMsg("Terjadi kesalahan koneksi.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteBankAccount = async (id: string, bankName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus rekening Bank ${bankName}?`)) return
    try {
      const res = await fetch(`/api/bank-accounts/${id}`, { method: "DELETE" })
      if (res.ok) {
        setSuccessMsg(`Rekening Bank ${bankName} berhasil dihapus.`)
        fetchData()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleToggleBankActive = async (bank: BankAccount) => {
    try {
      const res = await fetch(`/api/bank-accounts/${bank.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !bank.isActive }),
      })
      if (res.ok) {
        setSuccessMsg(`Status rekening Bank ${bank.bankName} berhasil diubah.`)
        fetchData()
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Copy Bank Helper
  const copyBank = (text: string, bank: string) => {
    navigator.clipboard.writeText(text)
    setCopiedBank(bank)
    setTimeout(() => setCopiedBank(null), 2000)
  }

  const specLabels: Record<string, string> = {
    MANUAL: "Manual",
    AUTOMATIC: "Matic",
    BOTH: "Manual & Matic",
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pengaturan Sistem & Akun</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Kelola akun Customer Service, Instruktur, pengaturan keamanan Owner, dan rekening pembayaran resmi joelmengemudi
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

      {/* Main Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("CS")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer",
            activeTab === "CS"
              ? "bg-[#7ADA3A] text-slate-900 shadow-sm border border-[#6ecb30]"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          )}
        >
          <Headset size={16} />
          <span>Pengaturan Akun CS ({csList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("INSTRUCTOR")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer",
            activeTab === "INSTRUCTOR"
              ? "bg-[#7ADA3A] text-slate-900 shadow-sm border border-[#6ecb30]"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          )}
        >
          <UserCheck size={16} />
          <span>Pengaturan Akun Instruktur ({instructorList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("OWNER_PROFILE")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer",
            activeTab === "OWNER_PROFILE"
              ? "bg-[#7ADA3A] text-slate-900 shadow-sm border border-[#6ecb30]"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          )}
        >
          <Shield size={16} />
          <span>Profil & Keamanan Owner</span>
        </button>

        <button
          onClick={() => setActiveTab("SYSTEM")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer",
            activeTab === "SYSTEM"
              ? "bg-[#7ADA3A] text-slate-900 shadow-sm border border-[#6ecb30]"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          )}
        >
          <CreditCard size={16} />
          <span>Rekening & Info Sistem ({bankAccounts.length})</span>
        </button>
      </div>

      {/* TAB 1: PENGATURAN CS */}
      {activeTab === "CS" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <h3 className="font-bold text-base text-slate-900">Daftar Akun Customer Service</h3>
              <p className="text-xs text-slate-500">
                Owner dapat mereset password staf CS yang lupa kata sandi atau mengganti cabang penugasan
              </p>
            </div>

            {/* Branch Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setSelectedBranch("ALL")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer",
                  selectedBranch === "ALL"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                Semua ({csList.length})
              </button>
              {branches.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBranch(b.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer",
                    selectedBranch === b.id
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {b.name.replace("Cabang ", "")} ({csList.filter((u) => u.branchId === b.id).length})
                </button>
              ))}
            </div>
          </div>

          <DataTable
            columns={[
              {
                key: "name",
                label: "Nama Petugas CS",
                render: (item: UserAccount) => (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold shrink-0 border border-sky-200/60">
                      <Headset size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                        <Mail size={10} /> {item.email}
                      </p>
                    </div>
                  </div>
                ),
              },
              {
                key: "branch",
                label: "Cabang Penugasan",
                render: (item: UserAccount) => (
                  <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {item.branch?.name || "Belum ditugaskan"}
                  </span>
                ),
              },
              {
                key: "phone",
                label: "Nomor WhatsApp",
                render: (item: UserAccount) => (
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Phone size={12} className="text-slate-400" /> {item.phone || "-"}
                  </span>
                ),
              },
              {
                key: "isActive",
                label: "Status Akun",
                render: (item: UserAccount) => (
                  <Badge variant={item.isActive ? "brand" : "danger"} dot>
                    {item.isActive ? "Aktif" : "Nonaktif"}
                  </Badge>
                ),
              },
            ]}
            data={filteredCS}
            searchable
            searchPlaceholder="Cari CS berdasarkan nama atau email..."
            actions={(item: UserAccount) => {
              const waMsg = `Halo Kak ${item.name}, akun Customer Service joelmengemudi Anda siap digunakan. Email: ${item.email}. Hubungi Owner jika membutuhkan bantuan.`
              return (
                <div className="flex items-center gap-1.5 justify-end">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => openResetPasswordModal(item)}
                    className="text-xs font-bold border-amber-300 text-amber-800 hover:bg-amber-50"
                    title="Reset Password Akun CS"
                  >
                    <KeyRound size={12} className="mr-1" />
                    <span>Reset Password</span>
                  </Button>

                  <Button
                    size="xs"
                    variant="secondary"
                    onClick={() => openEditUserModal(item)}
                    className="text-xs font-bold"
                    title="Edit Profil CS & Cabang"
                  >
                    <Edit2 size={12} className="mr-1" />
                    <span>Edit</span>
                  </Button>

                  {item.phone && (
                    <a
                      href={getWhatsAppLink(item.phone, waMsg)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors shadow-2xs"
                      title="Kirim Info Akun via WA"
                    >
                      <MessageSquare size={13} />
                    </a>
                  )}

                  <button
                    onClick={() => handleToggleStatus(item)}
                    className={cn(
                      "p-1.5 rounded-lg transition-colors cursor-pointer",
                      item.isActive
                        ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        : "text-[#386E1B] hover:bg-[#7ADA3A]/20"
                    )}
                    title={item.isActive ? "Nonaktifkan Akun" : "Aktifkan Akun"}
                  >
                    <Power size={14} />
                  </button>
                </div>
              )
            }}
          />
        </div>
      )}

      {/* TAB 2: PENGATURAN INSTRUKTUR */}
      {activeTab === "INSTRUCTOR" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <h3 className="font-bold text-base text-slate-900">Daftar Akun Instruktur Mengemudi</h3>
              <p className="text-xs text-slate-500">
                Owner dapat mereset password instruktur, memperbarui nomor SIM, atau mengubah cabang & spesialisasi transmisi
              </p>
            </div>

            {/* Branch Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setSelectedBranch("ALL")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer",
                  selectedBranch === "ALL"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                Semua ({instructorList.length})
              </button>
              {branches.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBranch(b.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer",
                    selectedBranch === b.id
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {b.name.replace("Cabang ", "")} ({instructorList.filter((u) => u.branchId === b.id).length})
                </button>
              ))}
            </div>
          </div>

          <DataTable
            columns={[
              {
                key: "name",
                label: "Instruktur",
                render: (item: UserAccount) => (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#7ADA3A]/15 text-[#254d0d] flex items-center justify-center font-bold shrink-0 border border-[#7ADA3A]/30">
                      <UserCheck size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                        <Mail size={10} /> {item.email}
                      </p>
                    </div>
                  </div>
                ),
              },
              {
                key: "license",
                label: "SIM & Spesialisasi",
                render: (item: UserAccount) => (
                  <div className="space-y-1 text-xs">
                    <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                      <Award size={11} className="text-[#3c7717]" />
                      {item.licenseNumber || "SIM Belum Ada"}
                    </span>
                    <Badge variant={item.specialization === "MANUAL" ? "info" : item.specialization === "AUTOMATIC" ? "purple" : "brand"}>
                      {specLabels[item.specialization || "BOTH"]}
                    </Badge>
                  </div>
                ),
              },
              {
                key: "branch",
                label: "Cabang",
                render: (item: UserAccount) => (
                  <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {item.branch?.name || "-"}
                  </span>
                ),
              },
              {
                key: "phone",
                label: "WhatsApp",
                render: (item: UserAccount) => (
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Phone size={12} className="text-slate-400" /> {item.phone || "-"}
                  </span>
                ),
              },
              {
                key: "isActive",
                label: "Status",
                render: (item: UserAccount) => (
                  <Badge variant={item.isActive ? "brand" : "danger"} dot>
                    {item.isActive ? "Aktif" : "Nonaktif"}
                  </Badge>
                ),
              },
            ]}
            data={filteredInstructors}
            searchable
            searchPlaceholder="Cari instruktur berdasarkan nama atau SIM..."
            actions={(item: UserAccount) => {
              const waMsg = `Halo Pak/Bu ${item.name}, akun Instruktur joelmengemudi Anda. Email: ${item.email}. Silakan hubungi Owner jika membutuhkan bantuan.`
              return (
                <div className="flex items-center gap-1.5 justify-end">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => openResetPasswordModal(item)}
                    className="text-xs font-bold border-amber-300 text-amber-800 hover:bg-amber-50"
                    title="Reset Password Instruktur"
                  >
                    <KeyRound size={12} className="mr-1" />
                    <span>Reset Password</span>
                  </Button>

                  <Button
                    size="xs"
                    variant="secondary"
                    onClick={() => openEditUserModal(item)}
                    className="text-xs font-bold"
                    title="Edit Data Instruktur"
                  >
                    <Edit2 size={12} className="mr-1" />
                    <span>Edit</span>
                  </Button>

                  {item.phone && (
                    <a
                      href={getWhatsAppLink(item.phone, waMsg)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors shadow-2xs"
                      title="Kirim Info via WA"
                    >
                      <MessageSquare size={13} />
                    </a>
                  )}

                  <button
                    onClick={() => handleToggleStatus(item)}
                    className={cn(
                      "p-1.5 rounded-lg transition-colors cursor-pointer",
                      item.isActive
                        ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        : "text-[#386E1B] hover:bg-[#7ADA3A]/20"
                    )}
                    title={item.isActive ? "Nonaktifkan Akun" : "Aktifkan Akun"}
                  >
                    <Power size={14} />
                  </button>
                </div>
              )
            }}
          />
        </div>
      )}

      {/* TAB 3: PROFIL & KEAMANAN OWNER */}
      {activeTab === "OWNER_PROFILE" && (
        <div className="max-w-2xl bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
            <div className="w-14 h-14 rounded-2xl bg-[#7ADA3A] text-slate-900 flex items-center justify-center font-black text-xl shadow-sm">
              <Shield size={28} />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900">Pengaturan Akun Pemilik (Owner)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Perbarui identitas pribadi dan amankan kata sandi login Anda
              </p>
            </div>
          </div>

          <form onSubmit={handleOwnerProfileSubmit} className="space-y-4">
            <Input
              label="Nama Lengkap Owner"
              value={ownerForm.name}
              onChange={(e) => setOwnerForm({ ...ownerForm, name: e.target.value })}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Email Utama Login"
                type="email"
                value={ownerForm.email}
                onChange={(e) => setOwnerForm({ ...ownerForm, email: e.target.value })}
                required
              />
              <Input
                label="Nomor WhatsApp / HP"
                value={ownerForm.phone}
                onChange={(e) => setOwnerForm({ ...ownerForm, phone: e.target.value })}
              />
            </div>

            <Input
              label="Alamat Lengkap"
              value={ownerForm.address}
              onChange={(e) => setOwnerForm({ ...ownerForm, address: e.target.value })}
              placeholder="Alamat kantor pusat / domisili"
            />

            {/* Change Password Section */}
            <div className="pt-4 border-t border-slate-100 space-y-3.5">
              <p className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound size={14} className="text-[#3c7717]" />
                <span>Ganti Password Akun Owner (Opsional)</span>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Input
                  label="Password Baru"
                  type="password"
                  value={ownerForm.newPassword}
                  onChange={(e) => setOwnerForm({ ...ownerForm, newPassword: e.target.value })}
                  placeholder="Minimal 6 karakter"
                  helperText="Biarkan kosong jika tidak ingin mengganti password"
                />
                <Input
                  label="Konfirmasi Password Baru"
                  type="password"
                  value={ownerForm.confirmPassword}
                  onChange={(e) => setOwnerForm({ ...ownerForm, confirmPassword: e.target.value })}
                  placeholder="Ulangi password baru"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <Button type="submit" variant="primary" isLoading={isLoading} className="bg-[#7ADA3A] text-slate-900 font-bold px-6">
                Simpan Perubahan Akun Owner
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: REKENING RESMI & INFO SISTEM (DINAMIS DARI DATABASE) */}
      {activeTab === "SYSTEM" && (
        <div className="space-y-6">
          {/* Card Pengelolaan Rekening Bank */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-900">Rekening Resmi Pembayaran Kursus</h3>
                  <Badge variant="brand" dot>
                    {bankAccounts.filter((b) => b.isActive).length} Rekening Aktif
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Owner dapat menambah, mengedit nama bank, nomor rekening, atau nama pemilik (a/n) yang otomatis tampil ke siswa
                </p>
              </div>

              <Button
                onClick={openAddBankModal}
                variant="primary"
                size="sm"
                leftIcon={<Plus size={15} />}
                className="bg-[#7ADA3A] text-slate-900 font-bold hover:bg-[#68c62f] self-start sm:self-auto"
              >
                Tambah Rekening Baru
              </Button>
            </div>

            {/* Grid Rekening Bank Dinamis */}
            {bankAccounts.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-400">
                <CreditCard size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-slate-600">Belum ada rekening bank terdaftar.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Klik tombol Tambah Rekening Baru di atas untuk menambahkan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {bankAccounts.map((acc) => {
                  const isCopied = copiedBank === acc.bankName

                  return (
                    <div
                      key={acc.id}
                      className={cn(
                        "p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-all relative",
                        acc.isActive
                          ? "bg-white border-slate-200 hover:border-[#7ADA3A]/70 shadow-2xs"
                          : "bg-slate-50/70 border-slate-200 opacity-60"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xs text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md border shadow-2xs">
                              Bank {acc.bankName}
                            </span>
                            <Badge variant={acc.isActive ? "brand" : "danger"} size="sm" dot>
                              {acc.isActive ? "Aktif" : "Nonaktif"}
                            </Badge>
                          </div>
                          <p className="font-mono font-black text-lg text-slate-900 mt-2 tracking-wide">
                            {acc.accountNumber}
                          </p>
                          <p className="text-xs text-slate-500 font-medium">a/n {acc.accountName}</p>
                        </div>

                        <button
                          onClick={() => copyBank(acc.accountNumber, acc.bankName)}
                          className="p-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-[#285314] hover:bg-[#7ADA3A]/15 transition-colors cursor-pointer shrink-0"
                          title="Salin Nomor Rekening"
                        >
                          {isCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        </button>
                      </div>

                      {/* Tombol Aksi Edit & Hapus */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => handleToggleBankActive(acc)}
                          className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                        >
                          {acc.isActive ? "Nonaktifkan" : "Aktifkan"}
                        </button>

                        <div className="flex items-center gap-1">
                          <Button
                            size="xs"
                            variant="secondary"
                            onClick={() => openEditBankModal(acc)}
                            className="text-xs font-bold"
                          >
                            <Edit2 size={12} className="mr-1" />
                            <span>Edit</span>
                          </Button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBankAccount(acc.id, acc.bankName)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus Rekening"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Info Sistem */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-base text-slate-900 pb-2 border-b border-slate-100">
              Ringkasan Infrastruktur Multi-Cabang
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60">
                <span className="text-slate-400 block font-medium">Total Cabang Resmi</span>
                <span className="text-lg font-black text-slate-900">{branches.length} Cabang</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60">
                <span className="text-slate-400 block font-medium">Customer Service</span>
                <span className="text-lg font-black text-slate-900">{csList.length} Petugas</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60">
                <span className="text-slate-400 block font-medium">Instruktur Resmi</span>
                <span className="text-lg font-black text-slate-900">{instructorList.length} Orang</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60">
                <span className="text-slate-400 block font-medium">Status PWA</span>
                <span className="text-lg font-black text-[#2e6015]">Aktif (Offline Ready)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RESET PASSWORD AKUN */}
      <Modal
        isOpen={isResetPasswordOpen}
        onClose={() => setIsResetPasswordOpen(false)}
        title="Reset Kata Sandi Akun"
        subtitle={`Pengguna: ${resetTargetUser?.name || ""} (${resetTargetUser?.role === "CUSTOMER_SERVICE" ? "Customer Service" : "Instruktur"})`}
        size="sm"
      >
        <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
            <p className="font-bold">Perhatian:</p>
            <p>Password baru akan langsung aktif dan pengguna harus login menggunakan kata sandi ini.</p>
          </div>

          <div className="space-y-2">
            <Input
              label="Masukkan Password Baru"
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setNewPassword("password123")}
                className="text-xs text-[#2a5513] hover:underline font-bold cursor-pointer"
              >
                Gunakan Standar: "password123"
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsResetPasswordOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading} className="bg-[#7ADA3A] text-slate-900 font-bold">
              Simpan Password Baru
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL EDIT DATA AKUN */}
      <Modal
        isOpen={isEditUserOpen}
        onClose={() => setIsEditUserOpen(false)}
        title="Edit Data Pengguna"
        subtitle={`ID: ${editingTargetUser?.id || ""}`}
        size="lg"
      >
        <form onSubmit={handleEditUserSubmit} className="space-y-4">
          <Input
            label="Nama Lengkap"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Alamat Email"
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              required
            />
            <Input
              label="Nomor WhatsApp / HP"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Select
              label="Penempatan Cabang"
              value={editForm.branchId}
              onChange={(e) => setEditForm({ ...editForm, branchId: e.target.value })}
              required
              options={branches.map((b) => ({ value: b.id, label: b.name }))}
            />
            <Select
              label="Status Akun"
              value={editForm.isActive ? "true" : "false"}
              onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === "true" })}
              options={[
                { value: "true", label: "Aktif (Bisa Login & Mengajar/Melayani)" },
                { value: "false", label: "Nonaktif / Dibekukan" },
              ]}
            />
          </div>

          {editingTargetUser?.role === "INSTRUCTOR" && (
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Nomor SIM-A Instruktur"
                value={editForm.licenseNumber}
                onChange={(e) => setEditForm({ ...editForm, licenseNumber: e.target.value })}
                placeholder="SIM-A-001234"
              />
              <Select
                label="Spesialisasi Transmisi"
                value={editForm.specialization}
                onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                options={[
                  { value: "MANUAL", label: "Manual Saja" },
                  { value: "AUTOMATIC", label: "Matic Saja" },
                  { value: "BOTH", label: "Manual & Matic" },
                ]}
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Select
              label="Jenis Kelamin"
              value={editForm.gender}
              onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
              options={[
                { value: "MALE", label: "Laki-laki" },
                { value: "FEMALE", label: "Perempuan" },
              ]}
            />
            <Input
              label="Alamat Domisili"
              value={editForm.address}
              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsEditUserOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading} className="bg-[#7ADA3A] text-slate-900 font-bold">
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL TAMBAH / EDIT REKENING BANK */}
      <Modal
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        title={editingBankAccount ? "Edit Rekening Bank" : "Tambah Rekening Bank Baru"}
        subtitle="Data rekening ini langsung disimpan ke database dan ditampilkan ke siswa saat pembayaran"
        size="md"
      >
        <form onSubmit={handleSaveBankAccount} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Select
              label="Nama Bank"
              value={bankForm.bankName}
              onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
              required
              options={[
                { value: "BCA", label: "Bank BCA" },
                { value: "BRI", label: "Bank BRI" },
                { value: "Mandiri", label: "Bank Mandiri" },
                { value: "BNI", label: "Bank BNI" },
                { value: "BSI", label: "Bank BSI (Syariah)" },
                { value: "CIMB Niaga", label: "Bank CIMB Niaga" },
                { value: "Danamon", label: "Bank Danamon" },
                { value: "Permata", label: "Bank Permata" },
                { value: "Lainnya", label: "Bank Lainnya" },
              ]}
            />

            <Select
              label="Status Rekening"
              value={bankForm.isActive ? "true" : "false"}
              onChange={(e) => setBankForm({ ...bankForm, isActive: e.target.value === "true" })}
              options={[
                { value: "true", label: "Aktif (Tampil ke Siswa)" },
                { value: "false", label: "Nonaktif / Ditutup Sementara" },
              ]}
            />
          </div>

          <Input
            label="Nomor Rekening"
            type="text"
            value={bankForm.accountNumber}
            onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
            placeholder="Contoh: 1234567890"
            required
          />

          <Input
            label="Atas Nama / Nama Pemilik Rekening"
            type="text"
            value={bankForm.accountName}
            onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })}
            placeholder="Contoh: PT Joel Mengemudi Jaya"
            required
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsBankModalOpen(false)}>
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="bg-[#7ADA3A] text-slate-900 font-bold hover:bg-[#68c62f]"
            >
              {editingBankAccount ? "Simpan Perubahan Rekening" : "Daftarkan Rekening"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
