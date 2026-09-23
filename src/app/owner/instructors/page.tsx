"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Modal } from "@/components/ui/modal"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { Plus, Edit2, UserCheck, Building2, Phone, Mail, Award, Star, MessageSquare, Eye } from "lucide-react"
import { formatDate, getWhatsAppLink, cn } from "@/lib/utils"

interface RatingItem {
  id: string
  rating: number
  review: string | null
  createdAt: string
  student: { id: string; name: string }
  schedule?: {
    date: string
    course?: { name: string }
  } | null
}

interface Instructor {
  id: string
  name: string
  email: string
  phone: string | null
  gender: string | null
  address: string | null
  isActive: boolean
  branch: { name: string } | null
  branchId: string | null
  licenseNumber: string | null
  specialization: string | null
  assignedVehicle?: { id: string; plateNumber: string; brand: string; model: string } | null
  receivedRatings?: RatingItem[]
}

interface Branch {
  id: string
  name: string
  city: string
}

export default function InstructorsPage() {
  const [allInstructors, setAllInstructors] = useState<Instructor[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [ratings, setRatings] = useState<any[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL")

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Instructor | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "",
    branchId: "", gender: "", address: "",
    licenseNumber: "", specialization: "",
  })

  // Review Details Modal
  const [selectedInstructorForReview, setSelectedInstructorForReview] = useState<Instructor | null>(null)
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false)

  const fetchData = async () => {
    try {
      const [userRes, branchRes, ratingsRes] = await Promise.all([
        fetch("/api/users?role=INSTRUCTOR"),
        fetch("/api/branches"),
        fetch("/api/ratings"),
      ])
      setAllInstructors(await userRes.json())
      setBranches(await branchRes.json())
      setRatings(await ratingsRes.json())
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => { fetchData() }, [])

  const filteredInstructors = selectedBranch === "ALL"
    ? allInstructors
    : allInstructors.filter(u => u.branchId === selectedBranch)

  const getBranchCount = (branchId: string) =>
    allInstructors.filter(u => u.branchId === branchId).length

  // Helper calculate rating stats
  const getInstructorRatingStats = (instructorId: string) => {
    const instRatings = ratings.filter((r: any) => r.instructorId === instructorId || r.instructor?.id === instructorId)
    if (instRatings.length === 0) return { avg: 0, count: 0, items: [] }
    const sum = instRatings.reduce((acc, curr) => acc + curr.rating, 0)
    return {
      avg: Number((sum / instRatings.length).toFixed(1)),
      count: instRatings.length,
      items: instRatings,
    }
  }

  const openReviewsModal = (instructor: Instructor) => {
    setSelectedInstructorForReview(instructor)
    setIsReviewsModalOpen(true)
  }

  const openModal = (user?: Instructor) => {
    if (user) {
      setEditingUser(user)
      setForm({
        name: user.name, email: user.email, phone: user.phone || "",
        password: "", branchId: user.branchId || "",
        gender: user.gender || "", address: user.address || "",
        licenseNumber: user.licenseNumber || "", specialization: user.specialization || "",
      })
    } else {
      setEditingUser(null)
      setForm({
        name: "", email: "", phone: "", password: "",
        branchId: selectedBranch !== "ALL" ? selectedBranch : "",
        gender: "", address: "", licenseNumber: "", specialization: "",
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users"
      const method = editingUser ? "PUT" : "POST"
      const payload: Record<string, string> = { ...form, role: "INSTRUCTOR" }
      if (editingUser && !payload.password) delete payload.password
      await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      setIsModalOpen(false)
      fetchData()
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const specLabels: Record<string, string> = {
    MANUAL: "Manual", AUTOMATIC: "Matic", BOTH: "Manual & Matic",
  }

  const columns = [
    {
      key: "name",
      label: "Instruktur",
      render: (item: Instructor) => (
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
      key: "rating",
      label: "Rating Siswa",
      render: (item: Instructor) => {
        const stats = getInstructorRatingStats(item.id)
        return (
          <button
            type="button"
            onClick={() => openReviewsModal(item)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold hover:bg-amber-100 transition-colors cursor-pointer"
            title="Lihat seluruh ulasan siswa"
          >
            <Star size={13} className="text-amber-500 fill-amber-400" />
            <span className="font-black">{stats.avg > 0 ? stats.avg : "Baru"}</span>
            <span className="text-[11px] text-amber-700 font-normal">({stats.count} ulasan)</span>
          </button>
        )
      },
    },
    {
      key: "licenseNumber",
      label: "No. SIM & Lisensi",
      render: (item: Instructor) => (
        item.licenseNumber ? (
          <span className="font-mono text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg inline-flex items-center gap-1">
            <Award size={11} className="text-[#3c7717]" /> {item.licenseNumber}
          </span>
        ) : (
          <span className="text-slate-400 text-xs">-</span>
        )
      ),
    },
    {
      key: "vehicle",
      label: "Mobil Khusus (1:1)",
      render: (item: Instructor) => (
        item.assignedVehicle ? (
          <span className="text-xs font-bold text-[#285513] bg-[#7ADA3A]/15 px-2.5 py-1 rounded-xl border border-[#7ADA3A]/30 inline-flex items-center gap-1.5">
            <span>{item.assignedVehicle.brand} ({item.assignedVehicle.plateNumber})</span>
          </span>
        ) : (
          <span className="text-xs text-slate-400">-</span>
        )
      ),
    },
    {
      key: "specialization",
      label: "Keahlian Mengajar",
      render: (item: Instructor) => (
        item.specialization ? (
          <Badge
            variant={item.specialization === "MANUAL" ? "info" : item.specialization === "AUTOMATIC" ? "purple" : "brand"}
          >
            {specLabels[item.specialization] || item.specialization}
          </Badge>
        ) : (
          <span className="text-slate-400 text-xs">-</span>
        )
      ),
    },
    {
      key: "phone",
      label: "Kontak",
      render: (item: Instructor) => (
        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
          <Phone size={12} className="text-slate-400" /> {item.phone || "-"}
        </span>
      ),
    },
    ...(selectedBranch === "ALL"
      ? [
          {
            key: "branch",
            label: "Cabang",
            render: (item: Instructor) =>
              item.branch ? (
                <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {item.branch.name}
                </span>
              ) : (
                <span className="text-slate-400 text-xs">-</span>
              ),
          },
        ]
      : []),
    {
      key: "isActive",
      label: "Status",
      render: (item: Instructor) => (
        <Badge variant={item.isActive ? "brand" : "danger"} dot>
          {item.isActive ? "Siap Mengajar" : "Nonaktif"}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Kelola Instruktur & Rating Siswa</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Owner dapat memantau kualitas pelatih, skor kepuasan bintang 1-5, dan ulasan langsung dari siswa di setiap cabang
          </p>
        </div>
        <Button
          onClick={() => openModal()}
          variant="primary"
          leftIcon={<Plus size={16} />}
          className="self-start sm:self-auto font-bold text-slate-900 bg-[#7ADA3A] hover:bg-[#68c62f]"
        >
          Tambah Instruktur
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
            {allInstructors.length}
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
        data={filteredInstructors}
        searchable
        searchPlaceholder="Cari nama instruktur atau nomor SIM..."
        emptyMessage={selectedBranch === "ALL" ? "Belum ada instruktur terdaftar." : "Belum ada instruktur di cabang ini."}
        actions={(item: Instructor) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => openReviewsModal(item)}
              className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
              title="Lihat Rating & Ulasan Siswa"
            >
              <Star size={15} className="fill-amber-400 text-amber-400" />
            </button>
            <button
              onClick={() => openModal(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-[#2a5514] hover:bg-[#7ADA3A]/15 transition-colors cursor-pointer"
              title="Edit Data Instruktur"
            >
              <Edit2 size={15} />
            </button>
          </div>
        )}
      />

      {/* MODAL LIHAT RATING & ULASAN SISWA (OWNER VIEW) */}
      <Modal
        isOpen={isReviewsModalOpen}
        onClose={() => setIsReviewsModalOpen(false)}
        title="Ulasan & Skor Rating Siswa"
        subtitle={`Instruktur: ${selectedInstructorForReview?.name || ""} (${selectedInstructorForReview?.branch?.name || "Semua Cabang"})`}
        size="md"
      >
        {selectedInstructorForReview && (
          <div className="space-y-4">
            {(() => {
              const stats = getInstructorRatingStats(selectedInstructorForReview.id)
              return (
                <>
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-xs">
                        <Star size={24} className="fill-slate-950" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-black text-slate-900">{stats.avg}</span>
                          <div className="flex items-center text-amber-500">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                size={16}
                                className={cn(
                                  i < Math.round(stats.avg) ? "fill-amber-400 text-amber-400" : "text-slate-300"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 font-medium">
                          Total {stats.count} ulasan langsung dari siswa bimbingan
                        </p>
                      </div>
                    </div>
                  </div>

                  {stats.items.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-400">
                      <Star size={32} className="mx-auto text-slate-300 mb-2" />
                      <p className="font-bold text-slate-600">Belum ada ulasan yang masuk untuk instruktur ini.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Siswa dapat mengisi ulasan bintang 1-5 setelah sesi latihan selesai.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                      {stats.items.map((rev: any) => (
                        <div
                          key={rev.id}
                          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 transition-colors shadow-2xs space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-900">{rev.student?.name || "Siswa"}</span>
                                <span className="text-[10px] text-slate-400 font-medium">{formatDate(rev.createdAt)}</span>
                              </div>
                              {rev.schedule?.course && (
                                <p className="text-[11px] text-slate-400">{rev.schedule.course.name}</p>
                              )}
                            </div>

                            <div className="flex items-center text-amber-400">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  size={13}
                                  className={cn(i < rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-200")}
                                />
                              ))}
                            </div>
                          </div>

                          {rev.review ? (
                            <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                              "{rev.review}"
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-400 italic">Tanpa ulasan tertulis.</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )
            })()}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => setIsReviewsModalOpen(false)}>
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Add / Edit Instructor */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? "Edit Data Instruktur" : "Tambah Instruktur Baru"}
        subtitle="Pastikan data nomor SIM dan keahlian transmisi sesuai dengan sertifikasi"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nama Lengkap Instruktur"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Contoh: Ahmad Fauzi"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Email Login"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="instruktur@joelmengemudi.com"
              required
            />
            <Input
              label="Nomor WhatsApp / HP"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="081234567890"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Password Akun"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={!editingUser}
              helperText={editingUser ? "Kosongkan jika tidak ingin mengganti password" : ""}
            />
            <Select
              label="Penempatan Cabang"
              value={form.branchId}
              onChange={(e) => setForm({ ...form, branchId: e.target.value })}
              required
              placeholder="Pilih Cabang Tugas"
              options={branches.map((b) => ({ value: b.id, label: b.name }))}
            />
          </div>

          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
            <p className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Award size={14} className="text-[#3c7717]" />
              <span>Sertifikasi & Keahlian</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Nomor SIM-A Instruktur"
                value={form.licenseNumber}
                onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                placeholder="SIM-A-001234"
              />
              <Select
                label="Spesialisasi Transmisi"
                value={form.specialization}
                onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                required
                placeholder="Pilih Spesialisasi"
                options={[
                  { value: "MANUAL", label: "Manual Saja" },
                  { value: "AUTOMATIC", label: "Matic Saja" },
                  { value: "BOTH", label: "Manual & Matic (Keduanya)" },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Select
              label="Jenis Kelamin"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              placeholder="Pilih Jenis Kelamin"
              options={[
                { value: "MALE", label: "Laki-laki" },
                { value: "FEMALE", label: "Perempuan" },
              ]}
            />
            <Input
              label="Alamat Domisili"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Alamat domisili"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading} className="bg-[#7ADA3A] text-slate-900 font-bold">
              {editingUser ? "Simpan Perubahan" : "Daftarkan Instruktur"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
