"use client"

import { useState, useMemo } from "react"
import { ChevronDown, ArrowRight } from "lucide-react"
import { formatCurrency, getWhatsAppLink, cn } from "@/lib/utils"

interface CoursePackage {
  name: string
  courseType: "MANUAL" | "AUTOMATIC" | "BOTH"
  duration: number
  sessions: number
  price: number
  description: string
  popular?: boolean
  includesSim?: boolean
}

interface BranchItem {
  id: string
  name: string
  address: string
  city: string
  phone: string | null
}

interface LandingInteractiveProps {
  branches: BranchItem[]
}

export function LandingInteractive({ branches }: LandingInteractiveProps) {
  // Course Package Tab
  const [activeTab, setActiveTab] = useState<"MANUAL" | "MATIC" | "COMBO" | "SIM">("MANUAL")

  // Interactive Payment Mode: Total vs DP 50%
  const [paymentView, setPaymentView] = useState<"TOTAL" | "DP">("TOTAL")

  // Interactive Recommendation State
  const [expLevel, setExpLevel] = useState<"ZERO" | "SOME" | "PRO">("ZERO")
  const [transType, setTransType] = useState<"MANUAL" | "MATIC" | "BOTH">("MANUAL")
  const [needSim, setNeedSim] = useState<"YES" | "NO">("NO")

  // Interactive Selected Branch
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branches[0]?.id || "")

  // FAQ Accordion State
  const [activeFaq, setActiveFaq] = useState<number | null>(null)

  const defaultPhone = branches[0]?.phone || "081234567801"

  // 10 Paket Resmi joelmengemudi
  const packages: CoursePackage[] = [
    {
      name: "Paket Manual 4 Jam",
      courseType: "MANUAL",
      duration: 4,
      sessions: 2,
      price: 525000,
      description: "2 sesi latihan (@ 2 jam). Cocok untuk yang sudah sedikit bisa dan butuh kelancaran di jalan raya.",
    },
    {
      name: "Paket Manual 8 Jam",
      courseType: "MANUAL",
      duration: 8,
      sessions: 4,
      price: 950000,
      description: "4 sesi latihan (@ 2 jam). Pilihan umum bagi pemula dari dasar pengenalan mobil hingga jalan umum.",
      popular: true,
    },
    {
      name: "Paket Manual 10 Jam",
      courseType: "MANUAL",
      duration: 10,
      sessions: 5,
      price: 1150000,
      description: "5 sesi latihan (@ 2 jam). Materi lengkap dari pedal kopling, tanjakan, putar balik, hingga parkir.",
    },
    {
      name: "Paket Matic 4 Jam",
      courseType: "AUTOMATIC",
      duration: 4,
      sessions: 2,
      price: 525000,
      description: "2 sesi latihan (@ 2 jam). Pengenalan kemudi matic dan penyesuaian berkendara di jalan raya.",
    },
    {
      name: "Paket Matic 8 Jam",
      courseType: "AUTOMATIC",
      duration: 8,
      sessions: 4,
      price: 950000,
      description: "4 sesi latihan (@ 2 jam). Latihan menyeluruh untuk berkendara harian dengan aman dan percaya diri.",
      popular: true,
    },
    {
      name: "Paket Matic 10 Jam",
      courseType: "AUTOMATIC",
      duration: 10,
      sessions: 5,
      price: 1150000,
      description: "5 sesi latihan (@ 2 jam). Pendalaman kemudi matic, kontrol jarak aman, jalan sempit, dan parkir.",
    },
    {
      name: "Paket Mix (Manual + Matic)",
      courseType: "BOTH",
      duration: 12,
      sessions: 6,
      price: 1475000,
      description: "Manual 8 Jam (4 sesi) + Matic 4 Jam (2 sesi). Kuasai kedua jenis transmisi sekaligus dalam satu paket.",
      popular: true,
    },
    {
      name: "Paket Manual + SIM A (10 Jam)",
      courseType: "MANUAL",
      duration: 10,
      sessions: 5,
      price: 1830000,
      description: "5 sesi manual @ 2 jam, sudah termasuk biaya pengurusan dan pendampingan ujian SIM A resmi di Satpas.",
      includesSim: true,
      popular: true,
    },
    {
      name: "Paket Matic + SIM A (10 Jam)",
      courseType: "AUTOMATIC",
      duration: 10,
      sessions: 5,
      price: 1830000,
      description: "5 sesi matic @ 2 jam, sudah termasuk biaya pengurusan dan pendampingan ujian SIM A resmi di Satpas.",
      includesSim: true,
      popular: true,
    },
    {
      name: "Paket Mix + SIM A (12 Jam)",
      courseType: "BOTH",
      duration: 12,
      sessions: 6,
      price: 2155000,
      description: "Latihan Manual 8 Jam + Matic 4 Jam, sudah termasuk pendampingan ujian dan penerbitan SIM A resmi.",
      includesSim: true,
    },
  ]

  // Filter packages based on active tab
  const filteredPackages = packages.filter((pkg) => {
    if (activeTab === "MANUAL") return pkg.courseType === "MANUAL" && !pkg.includesSim
    if (activeTab === "MATIC") return pkg.courseType === "AUTOMATIC" && !pkg.includesSim
    if (activeTab === "COMBO") return pkg.courseType === "BOTH" && !pkg.includesSim
    if (activeTab === "SIM") return pkg.includesSim
    return true
  })

  // Dynamic recommendation calculation based on user answers
  const recommendedResult = useMemo(() => {
    if (expLevel === "PRO") {
      return {
        title: "Layanan Khusus SIM A (Tanpa Kursus)",
        price: 700000,
        dp: 350000,
        durationText: "Bimbingan Ujian Satpas",
        sessionsText: "Simulasi Teori & Uji Praktik",
        notes: "Sangat pas bagi Anda yang sudah bisa menyetir dan ingin segera memegang SIM A resmi dari Satpas Polresta.",
        isSimOnly: true,
      }
    }

    if (needSim === "YES") {
      if (transType === "BOTH") {
        return {
          title: "Paket Mix + SIM A (12 Jam)",
          price: 2155000,
          dp: 1077500,
          durationText: "12 Jam Latihan (Manual & Matic)",
          sessionsText: "6x Sesi (@ 2 Jam) + SIM A",
          notes: "Paket komplit terbaik: mahir mobil manual dan matic, langsung didampingi hingga SIM A terbit.",
          isSimOnly: false,
        }
      }
      if (transType === "MATIC") {
        return {
          title: "Paket Matic + SIM A (10 Jam)",
          price: 1830000,
          dp: 915000,
          durationText: "10 Jam Latihan Matic",
          sessionsText: "5x Sesi (@ 2 Jam) + SIM A",
          notes: "Belajar mobil matic sampai mahir di jalan raya dengan pendampingan penerbitan SIM A resmi.",
          isSimOnly: false,
        }
      }
      return {
        title: "Paket Manual + SIM A (10 Jam)",
        price: 1830000,
        dp: 915000,
        durationText: "10 Jam Latihan Manual",
        sessionsText: "5x Sesi (@ 2 Jam) + SIM A",
        notes: "Paket paling diminati pemula: kuasai mobil manual dari nol lengkap dengan SIM A resmi Satpas.",
        isSimOnly: false,
      }
    }

    // Kursus saja (Tanpa SIM)
    if (expLevel === "SOME") {
      if (transType === "MATIC") {
        return {
          title: "Paket Matic 4 Jam",
          price: 525000,
          dp: 262500,
          durationText: "4 Jam Latihan Matic",
          sessionsText: "2x Sesi (@ 2 Jam)",
          notes: "Cocok untuk melancarkan kemudi matic dan mengasah rasa percaya diri di jalan raya.",
          isSimOnly: false,
        }
      }
      return {
        title: "Paket Manual 4 Jam",
        price: 525000,
        dp: 262500,
        durationText: "4 Jam Latihan Manual",
        sessionsText: "2x Sesi (@ 2 Jam)",
        notes: "Pilihan kilat untuk menyegarkan kembali feeling kopling dan kelancaran manuver jalan umum.",
        isSimOnly: false,
      }
    }

    // Pemula Nol
    if (transType === "BOTH") {
      return {
        title: "Paket Mix (Manual + Matic)",
        price: 1475000,
        dp: 737500,
        durationText: "12 Jam Latihan Gabungan",
        sessionsText: "6x Sesi (4 Manual + 2 Matic)",
        notes: "Solusi fleksibel untuk menguasai kedua tipe mobil dalam satu jadwal latihan bertahap.",
        isSimOnly: false,
      }
    }
    if (transType === "MATIC") {
      return {
        title: "Paket Matic 8 Jam",
        price: 950000,
        dp: 475000,
        durationText: "8 Jam Latihan Matic",
        sessionsText: "4x Sesi (@ 2 Jam)",
        notes: "Paket ideal bagi pemula nol yang ingin langsung mahir mengendarai mobil matic di jalan raya Bali.",
        isSimOnly: false,
      }
    }
    return {
      title: "Paket Manual 8 Jam",
      price: 950000,
      dp: 475000,
      durationText: "8 Jam Latihan Manual",
      sessionsText: "4x Sesi (@ 2 Jam)",
      notes: "Paket terpopuler untuk pemula dari nol sampai lancar menghadapi tanjakan, macet, dan parkir.",
      isSimOnly: false,
    }
  }, [expLevel, transType, needSim])

  // Active branch object
  const activeBranch = branches.find((b) => b.id === selectedBranchId) || branches[0]

  const faqs = [
    {
      q: "Saya belum pernah menyetir sama sekali, apakah bisa belajar dari nol?",
      a: "Bisa. Mayoritas siswa joelmengemudi memulai dari nol tanpa pengalaman sama sekali. Instruktur mendampingi bertahap mulai dari pengenalan pedal, setir, hingga latihan jalan raya secara bertahap.",
    },
    {
      q: "Apakah mobil latihan aman untuk pemula?",
      a: "Aman. Seluruh unit mobil latihan kami dilengkapi pedal rem ganda tambahan di kursi instruktur, sehingga instruktur dapat melakukan pengereman darurat kapan saja demi keamanan Anda.",
    },
    {
      q: "Apakah biaya kursus bisa dibayar DP 50% dulu?",
      a: "Bisa. Anda cukup membayar uang muka 50% saat pendaftaran, dan sisa 50% dapat dilunasi di pertengahan sesi latihan langsung melalui akun portal siswa Anda.",
    },
    {
      q: "Bagaimana jika ada jadwal latihan yang bentrok?",
      a: "Siswa dapat mengajukan perubahan jadwal (reschedule) secara mandiri lewat akun aplikasi siswa sebelum sesi latihan berlangsung.",
    },
    {
      q: "Berapa lama durasi setiap pertemuan latihan?",
      a: "Setiap sesi latihan berlangsung selama 2 jam. Contohnya paket 8 jam terbagi menjadi 4 kali pertemuan di hari yang dapat Anda pilih bersama instruktur.",
    },
    {
      q: "Apa syarat untuk mendaftar paket kursus + SIM A?",
      a: "Cukup melampirkan foto KTP (usia minimal 17 tahun). Staf joelmengemudi akan mendampingi seluruh proses administrasi dan simulasi uji praktik hingga selesai di Satpas Polresta.",
    },
  ]

  return (
    <>
      {/* ========================================================= */}
      {/* 1. INTERACTIVE COURSE RECOMMENDER / ESTIMATOR */}
      {/* ========================================================= */}
      <section className="py-12 sm:py-16 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
            <span className="inline-block px-3 py-1 rounded-full bg-[#7ADA3A]/20 text-slate-950 font-bold text-xs uppercase tracking-wider mb-2 border border-[#7ADA3A]/40">
              Kalkulator Rekomendasi
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Temukan Paket yang Tepat Untuk Anda
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Pilih kondisi dan kebutuhan Anda di bawah ini untuk melihat rekomendasi paket beserta rincian biayanya secara instan.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl border-2 border-slate-200 p-5 sm:p-7 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
              {/* Left Form: 3 Interactive Questions */}
              <div className="lg:col-span-7 space-y-5">
                {/* Q1: Tingkat Pengalaman */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
                    1. Pengalaman Menyetir Anda
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "ZERO", label: "Pemula Nol", desc: "Belum pernah" },
                      { id: "SOME", label: "Pernah Belajar", desc: "Butuh lancar" },
                      { id: "PRO", label: "Sudah Bisa", desc: "Butuh SIM saja" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setExpLevel(item.id as any)}
                        className={cn(
                          "p-2.5 sm:p-3 rounded-xl text-left border transition-all cursor-pointer",
                          expLevel === item.id
                            ? "bg-white border-[#7ADA3A] ring-2 ring-[#7ADA3A]/40 shadow-xs"
                            : "bg-white/70 border-slate-200 hover:border-slate-300 text-slate-700"
                        )}
                      >
                        <span className="block font-bold text-xs text-slate-900 leading-snug">
                          {item.label}
                        </span>
                        <span className="block text-[10px] text-slate-500 mt-0.5">
                          {item.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Q2: Jenis Transmisi (Hidden if PRO / SIM Only) */}
                {expLevel !== "PRO" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
                      2. Pilihan Transmisi Mobil
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "MANUAL", label: "Manual", desc: "Kopling & oper gigi" },
                        { id: "MATIC", label: "Matic", desc: "Transmisi otomatis" },
                        { id: "BOTH", label: "Mix (Keduanya)", desc: "Manual & Matic" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setTransType(item.id as any)}
                          className={cn(
                            "p-2.5 sm:p-3 rounded-xl text-left border transition-all cursor-pointer",
                            transType === item.id
                              ? "bg-white border-[#7ADA3A] ring-2 ring-[#7ADA3A]/40 shadow-xs"
                              : "bg-white/70 border-slate-200 hover:border-slate-300 text-slate-700"
                          )}
                        >
                          <span className="block font-bold text-xs text-slate-900 leading-snug">
                            {item.label}
                          </span>
                          <span className="block text-[10px] text-slate-500 mt-0.5">
                            {item.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Q3: Butuh SIM A (Hidden if PRO) */}
                {expLevel !== "PRO" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
                      3. Pendampingan SIM A Resmi
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "NO", label: "Hanya Kursus", desc: "Tanpa pengurusan SIM" },
                        { id: "YES", label: "Sekaligus SIM A", desc: "Paket kursus + SIM A" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setNeedSim(item.id as any)}
                          className={cn(
                            "p-2.5 sm:p-3 rounded-xl text-left border transition-all cursor-pointer",
                            needSim === item.id
                              ? "bg-white border-[#7ADA3A] ring-2 ring-[#7ADA3A]/40 shadow-xs"
                              : "bg-white/70 border-slate-200 hover:border-slate-300 text-slate-700"
                          )}
                        >
                          <span className="block font-bold text-xs text-slate-900 leading-snug">
                            {item.label}
                          </span>
                          <span className="block text-[10px] text-slate-500 mt-0.5">
                            {item.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Output: Recommended Card Box with #7ADA3A identity */}
              <div className="lg:col-span-5 bg-white rounded-xl border-2 border-[#7ADA3A] p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    Rekomendasi Paket
                  </span>
                  <span className="text-[11px] font-black bg-[#7ADA3A] text-slate-950 px-2.5 py-0.5 rounded-full">
                    Paling Sesuai
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-tight">
                    {recommendedResult.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {recommendedResult.notes}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-lg p-3 text-xs space-y-1.5 border border-slate-200/70">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Durasi Waktu:</span>
                    <strong className="text-slate-900">{recommendedResult.durationText}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Pertemuan:</span>
                    <strong className="text-slate-900">{recommendedResult.sessionsText}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Fasilitas:</span>
                    <strong className="text-slate-900">Mobil Ber-AC + Rem Ganda</strong>
                  </div>
                </div>

                <div className="pt-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-500 font-medium">Total Biaya:</span>
                    <span className="text-2xl font-black text-slate-900">
                      {formatCurrency(recommendedResult.price)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs text-emerald-800 font-semibold mt-0.5">
                    <span>Bisa DP 50% di awal:</span>
                    <span className="font-bold">{formatCurrency(recommendedResult.dp)}</span>
                  </div>
                </div>

                <a
                  href={getWhatsAppLink(
                    defaultPhone,
                    `Halo CS joelmengemudi, dari kalkulator rekomendasi web saya tertarik dengan "${recommendedResult.title}" seharga ${formatCurrency(recommendedResult.price)}. Apakah jadwalnya masih tersedia?`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#7ADA3A] hover:bg-[#68c82f] text-slate-950 font-bold text-xs text-center transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>Daftar Paket Ini via WhatsApp</span>
                  <ArrowRight size={13} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. PILIHAN PAKET LENGKAP & INTERACTIVE DP TOGGLE */}
      {/* ========================================================= */}
      <section id="paket-kursus" className="py-12 sm:py-16 bg-slate-50 border-b border-slate-200 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-[#7ADA3A]/20 text-slate-950 font-bold text-xs uppercase tracking-wider mb-2 border border-[#7ADA3A]/40">
                Tarif Resmi Transparan
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Daftar Lengkap Paket Kursus
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Seluruh paket menggunakan unit mobil khusus latihan ber-AC dengan instruktur pendamping.
              </p>
            </div>

            {/* Interactive Payment Display Toggle */}
            <div className="inline-flex items-center p-1 bg-white rounded-xl border border-slate-200 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setPaymentView("TOTAL")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  paymentView === "TOTAL"
                    ? "bg-[#7ADA3A] text-slate-950 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                Tampilkan Biaya Penuh
              </button>
              <button
                type="button"
                onClick={() => setPaymentView("DP")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  paymentView === "DP"
                    ? "bg-[#7ADA3A] text-slate-950 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                Skema DP 50%
              </button>
            </div>
          </div>

          {/* Filter Tabs with #7ADA3A styling */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { id: "MANUAL", label: "Mobil Manual" },
              { id: "MATIC", label: "Mobil Matic" },
              { id: "COMBO", label: "Mix (Manual + Matic)" },
              { id: "SIM", label: "Paket + SIM A" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  activeTab === tab.id
                    ? "bg-[#7ADA3A] text-slate-950 border border-[#6ac92e] shadow-xs"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredPackages.map((pkg) => {
              const waUrl = getWhatsAppLink(
                defaultPhone,
                `Halo CS joelmengemudi, saya ingin menanyakan pendaftaran untuk ${pkg.name} (${formatCurrency(pkg.price)}).`
              )

              return (
                <div
                  key={pkg.name}
                  className={cn(
                    "bg-white rounded-2xl p-5 border-2 flex flex-col justify-between transition-all",
                    pkg.popular
                      ? "border-[#7ADA3A] shadow-sm relative"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {pkg.courseType === "MANUAL"
                          ? "Transmisi Manual"
                          : pkg.courseType === "AUTOMATIC"
                          ? "Transmisi Matic"
                          : "Manual + Matic"}
                      </span>
                      {pkg.popular && (
                        <span className="text-[10px] font-black text-slate-950 bg-[#7ADA3A] px-2 py-0.5 rounded-md">
                          Paling Populer
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-slate-900">{pkg.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {pkg.description}
                    </p>

                    <div className="my-4 py-3 px-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Durasi:</span>
                        <strong className="text-slate-900">{pkg.duration} Jam Latihan</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Pertemuan:</span>
                        <strong className="text-slate-900">{pkg.sessions}x Sesi (@ 2 Jam)</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Unit Mobil:</span>
                        <strong className="text-slate-900">AC Dingin + Rem Ganda</strong>
                      </div>
                    </div>

                    <div>
                      {paymentView === "TOTAL" ? (
                        <>
                          <span className="text-[11px] text-slate-400 font-medium block">
                            Biaya Kursus Lengkap:
                          </span>
                          <p className="text-2xl font-black text-slate-900 tracking-tight">
                            {formatCurrency(pkg.price)}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Bisa DP 50% ({formatCurrency(pkg.price / 2)}) di awal
                          </p>
                        </>
                      ) : (
                        <>
                          <span className="text-[11px] text-[#386E1B] font-bold block uppercase tracking-wide">
                            Uang Muka (DP 50%):
                          </span>
                          <p className="text-2xl font-black text-slate-900 tracking-tight">
                            {formatCurrency(pkg.price / 2)}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Pelunasan sisa 50% ({formatCurrency(pkg.price / 2)}) saat latihan berjalan
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-3 rounded-xl bg-[#7ADA3A] hover:bg-[#68c82f] text-slate-950 font-bold text-xs text-center transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <span>Pilih Paket Ini</span>
                      <ArrowRight size={13} />
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. INTERACTIVE 5 CABANG BALI */}
      {/* ========================================================= */}
      <section id="cabang-bali" className="py-12 sm:py-16 bg-white border-b border-slate-200 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-8">
            <span className="inline-block px-3 py-1 rounded-full bg-[#7ADA3A]/20 text-slate-950 font-bold text-xs uppercase tracking-wider mb-2 border border-[#7ADA3A]/40">
              Jaringan Resmi
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              5 Cabang joelmengemudi di Bali
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Klik cabang di bawah untuk melihat lokasi detail dan menghubungi Customer Service cabang terkait.
            </p>
          </div>

          {/* Interactive Branch Switcher Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
            {branches.map((b, idx) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBranchId(b.id)}
                className={cn(
                  "p-3 rounded-xl text-left border-2 transition-all cursor-pointer",
                  selectedBranchId === b.id
                    ? "bg-[#7ADA3A]/10 border-[#7ADA3A] text-slate-950 shadow-2xs"
                    : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700"
                )}
              >
                <span className="block text-[10px] font-extrabold text-slate-400 uppercase">
                  Cabang 0{idx + 1}
                </span>
                <span className="block font-bold text-xs text-slate-900 truncate mt-0.5">
                  {b.name}
                </span>
                <span className="block text-[10px] text-slate-500 mt-0.5">
                  {b.city}
                </span>
              </button>
            ))}
          </div>

          {/* Active Branch Detail Card */}
          {activeBranch && (
            <div className="bg-slate-50 rounded-2xl border-2 border-slate-200 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg text-slate-900">
                    {activeBranch.name}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 bg-[#7ADA3A] text-slate-950 rounded-md">
                    {activeBranch.city}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Alamat: <strong className="text-slate-900">{activeBranch.address}</strong>
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                  <span>Telepon / WA: <strong className="text-slate-800">{activeBranch.phone || "-"}</strong></span>
                  <span>Jam Layanan: <strong className="text-slate-800">Setiap Hari 08.00 - 17.00 WITA</strong></span>
                </div>
              </div>

              <div className="shrink-0">
                <a
                  href={getWhatsAppLink(
                    activeBranch.phone || defaultPhone,
                    `Halo CS ${activeBranch.name}, saya ingin konsultasi pendaftaran kursus mengemudi di cabang ini.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-[#7ADA3A] hover:bg-[#68c82f] text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-xs"
                >
                  <span>Chat CS {activeBranch.name}</span>
                  <ArrowRight size={14} />
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. FAQ ACCORDION */}
      {/* ========================================================= */}
      <section id="faq" className="py-12 sm:py-16 bg-slate-50 scroll-mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
            <span className="inline-block px-3 py-1 rounded-full bg-[#7ADA3A]/20 text-slate-950 font-bold text-xs uppercase tracking-wider mb-2 border border-[#7ADA3A]/40">
              Informasi Umum
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Pertanyaan yang Sering Diajukan
            </h2>
          </div>

          <div className="space-y-2.5">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx
              return (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900 hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={16}
                      className={cn(
                        "text-slate-400 shrink-0 transition-transform duration-150",
                        isOpen && "rotate-180 text-slate-900"
                      )}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}
