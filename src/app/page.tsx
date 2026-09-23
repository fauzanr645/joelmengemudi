import Link from "next/link"
import prisma from "@/lib/prisma"
import { Star, ArrowRight } from "lucide-react"
import { formatDate, getWhatsAppLink, cn } from "@/lib/utils"
import { LandingInteractive } from "@/components/landing-interactive"

export default async function HomePage() {
  // Ambil data cabang dan rating nyata dari database
  const [branches, ratings] = await Promise.all([
    prisma.branch.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        phone: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.instructorRating.findMany({
      take: 6,
      include: {
        student: { select: { name: true } },
        instructor: { select: { name: true } },
        branch: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

  const defaultCsPhone = branches[0]?.phone || "081234567801"
  const defaultWaUrl = getWhatsAppLink(
    defaultCsPhone,
    "Halo CS joelmengemudi, saya ingin bertanya seputar pendaftaran kursus mengemudi di Bali."
  )

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-[#7ADA3A]/40 selection:text-slate-950 font-sans">
      {/* ========================================================= */}
      {/* 1. NAVBAR */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo with signature #7ADA3A branding */}
          <Link href="/" className="flex items-center gap-2.5">
            <img
              src="/joel-logo.png"
              alt="Logo joelmengemudi"
              className="w-8 h-8 object-contain"
            />
            <div>
              <span className="font-black text-slate-900 text-base tracking-tight block leading-tight">
                joel<span className="text-[#386E1B] bg-[#7ADA3A]/20 px-1 py-0.5 rounded ml-0.5">mengemudi</span>
              </span>
              <span className="text-[10px] text-slate-500 font-semibold block">
                Kursus Mengemudi Bali
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
            <a href="#layanan" className="hover:text-slate-900 transition-colors">
              Layanan
            </a>
            <a href="#paket-kursus" className="hover:text-slate-900 transition-colors">
              Paket & Biaya
            </a>
            <a href="#layanan-sim" className="hover:text-slate-900 transition-colors">
              Layanan SIM
            </a>
            <a href="#armada" className="hover:text-slate-900 transition-colors">
              Armada Mobil
            </a>
            <a href="#cabang-bali" className="hover:text-slate-900 transition-colors">
              5 Cabang
            </a>
            <a href="#testimoni" className="hover:text-slate-900 transition-colors">
              Ulasan Siswa
            </a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">
              FAQ
            </a>
          </nav>

          {/* Tombol Masuk Portal with #7ADA3A */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="py-2 px-4 rounded-xl bg-[#7ADA3A] hover:bg-[#68c82f] text-slate-950 font-bold text-xs transition-all shadow-2xs flex items-center gap-1.5"
            >
              <span>Masuk Portal</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. HERO SECTION */}
      {/* ========================================================= */}
      <section className="pt-8 pb-12 sm:pt-14 sm:pb-16 bg-gradient-to-b from-[#f4fcee] via-white to-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Teks Kiri */}
            <div className="lg:col-span-7 space-y-4 text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7ADA3A]/25 border border-[#7ADA3A]/50 text-slate-950 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-[#386E1B]" />
                <span>Sekolah Mengemudi Resmi Terpercaya di Bali</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Kursus Mengemudi Mobil{" "}
                <span className="bg-[#7ADA3A] text-slate-950 px-2 py-0.5 rounded-lg inline-block">
                  di Bali
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-600 font-normal max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Latihan mengemudi mobil manual dan matic bersama instruktur berpengalaman. Jadwal fleksibel di 5 cabang resmi Bali serta pendampingan uji SIM A resmi di Satpas Polresta.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <a
                  href="#paket-kursus"
                  className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-[#7ADA3A] hover:bg-[#68c82f] text-slate-950 font-bold text-xs sm:text-sm text-center transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  <span>Pilih Paket Kursus</span>
                  <ArrowRight size={14} />
                </a>
                <a
                  href={defaultWaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm text-center transition-all"
                >
                  Konsultasi via WhatsApp
                </a>
              </div>

              {/* 4 Poin Kunci (Icon-free, clean tag design) */}
              <div className="grid grid-cols-2 gap-2 pt-4 text-left border-t border-slate-200">
                <div className="p-2.5 rounded-xl bg-white border-2 border-slate-200">
                  <span className="block text-[11px] font-bold text-slate-900">5 Cabang Resmi</span>
                  <span className="text-[10px] text-slate-500">Denpasar, Badung, Gianyar, Bangli</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border-2 border-slate-200">
                  <span className="block text-[11px] font-bold text-slate-900">Manual & Matic</span>
                  <span className="text-[10px] text-slate-500">Pilihan paket sesuai kebutuhan</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border-2 border-slate-200">
                  <span className="block text-[11px] font-bold text-slate-900">Pedal Rem Ganda</span>
                  <span className="text-[10px] text-slate-500">Aman dan tenang untuk pemula</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border-2 border-slate-200">
                  <span className="block text-[11px] font-bold text-slate-900">Bisa Bayar DP 50%</span>
                  <span className="text-[10px] text-slate-500">Pelunasan saat latihan berjalan</span>
                </div>
              </div>
            </div>

            {/* Visual Kanan: Mobil Latihan Indonesia Asli */}
            <div className="lg:col-span-5">
              <div className="bg-white p-3 rounded-2xl border-2 border-[#7ADA3A] shadow-sm">
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 relative">
                  <img
                    src="/images/mobil_brio.webp"
                    alt="Mobil Latihan Kursus Mengemudi Honda Brio di Indonesia"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-[#7ADA3A] text-slate-950 text-[10px] font-black uppercase tracking-wider py-1 px-2.5 rounded-md shadow-xs">
                    Unit Latihan Resmi
                  </div>
                </div>

                <div className="p-3 grid grid-cols-3 gap-2 text-center text-[11px] text-slate-600 border-t border-slate-100 mt-2">
                  <div className="p-1.5 bg-slate-50 rounded-lg">
                    <span className="block text-slate-400 text-[10px]">Transmisi</span>
                    <strong className="text-slate-800">Manual & Matic</strong>
                  </div>
                  <div className="p-1.5 bg-slate-50 rounded-lg">
                    <span className="block text-slate-400 text-[10px]">Kenyamanan</span>
                    <strong className="text-slate-800">Full AC Dingin</strong>
                  </div>
                  <div className="p-1.5 bg-slate-50 rounded-lg">
                    <span className="block text-slate-400 text-[10px]">Keamanan</span>
                    <strong className="text-slate-800">Rem Ganda</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. TIGA PILIHAN LAYANAN UTAMA (ICON-FREE & CLEAN) */}
      {/* ========================================================= */}
      <section id="layanan" className="py-12 sm:py-16 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-8 sm:mb-10">
            <span className="inline-block px-3 py-1 rounded-full bg-[#7ADA3A]/20 text-slate-950 font-bold text-xs uppercase tracking-wider mb-2 border border-[#7ADA3A]/40">
              Layanan Utama
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Program Belajar Sesuai Kebutuhan
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Pelatihan terstruktur mulai dari dasar pengenalan kendaraan hingga siap berkendara mandiri di jalan umum.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Kursus Manual */}
            <div className="p-5 rounded-2xl border-2 border-slate-200 hover:border-[#7ADA3A] bg-white transition-all space-y-3 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-[#7ADA3A] text-slate-950 flex items-center justify-center font-black text-xs">
                01
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Kursus Mobil Manual</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Latihan penguasaan pedal kopling, perpindahan tuas gigi manual, teknik berhenti di tanjakan, dan manuver persimpangan.
                </p>
              </div>
              <div className="text-xs text-slate-700 space-y-1 pt-1 border-t border-slate-100">
                <p className="font-medium">• Pilihan 4 Jam, 8 Jam, dan 10 Jam</p>
                <p className="font-medium">• Latihan tanjakan & setengah kopling</p>
                <p className="font-medium">• Unit mobil ber-AC + rem tambahan</p>
              </div>
            </div>

            {/* 2. Kursus Matic */}
            <div className="p-5 rounded-2xl border-2 border-slate-200 hover:border-[#7ADA3A] bg-white transition-all space-y-3 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-[#7ADA3A] text-slate-950 flex items-center justify-center font-black text-xs">
                02
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Kursus Mobil Matic</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Belajar mengemudi transmisi otomatis untuk kemudahan dan kenyamanan berkendara di tengah lalu lintas padat perkotaan.
                </p>
              </div>
              <div className="text-xs text-slate-700 space-y-1 pt-1 border-t border-slate-100">
                <p className="font-medium">• Pilihan 4 Jam, 8 Jam, dan 10 Jam</p>
                <p className="font-medium">• Kontrol setir, gas halus, & jarak aman</p>
                <p className="font-medium">• Latihan parkir paralel dan serong</p>
              </div>
            </div>

            {/* 3. Layanan SIM */}
            <div className="p-5 rounded-2xl border-2 border-slate-200 hover:border-[#7ADA3A] bg-white transition-all space-y-3 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-[#7ADA3A] text-slate-950 flex items-center justify-center font-black text-xs">
                03
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Layanan SIM A & SIM C</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Bimbingan materi ujian teori, simulasi praktik lintasan uji, dan pendampingan resmi di Satpas Polresta hingga SIM terbit.
                </p>
              </div>
              <div className="text-xs text-slate-700 space-y-1 pt-1 border-t border-slate-100">
                <p className="font-medium">• SIM A Mobil Pribadi: Rp 700.000</p>
                <p className="font-medium">• SIM C Sepeda Motor: Rp 625.000</p>
                <p className="font-medium">• Pendampingan langsung oleh staf kami</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. ARMADA MOBIL INDONESIA & FASILITAS */}
      {/* ========================================================= */}
      <section id="armada" className="py-12 sm:py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-3">
              <span className="inline-block px-3 py-1 rounded-full bg-[#7ADA3A]/20 text-slate-950 font-bold text-xs uppercase tracking-wider mb-1 border border-[#7ADA3A]/40">
                Armada & Fasilitas
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Mobil Latihan Khusus yang Terawat
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Kami menggunakan unit mobil compact city car yang umum digunakan di Indonesia (Honda Brio, Toyota Agya, Daihatsu Ayla) dengan posisi kemudi setir kanan. Dimensinya pas untuk pemula, radius putar lincah, dan dilengkapi pedal rem ganda demi keselamatan.
              </p>

              <div className="space-y-2 pt-2 text-xs text-slate-700">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <strong className="block text-slate-900 font-bold">1. Pedal Rem Tambahan Instruktur</strong>
                  <span className="text-slate-500">Mencegah salah injak pedal dan memberi rasa aman saat latihan di jalan umum.</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <strong className="block text-slate-900 font-bold">2. Kabin Bersih & Full AC</strong>
                  <span className="text-slate-500">Suhu kabin sejuk dan bersih agar siswa dapat fokus penuh saat belajar mengemudi.</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <strong className="block text-slate-900 font-bold">3. Instruktur Berpengalaman & Komunikatif</strong>
                  <span className="text-slate-500">Mendampingi dengan tenang, ramah, dan tanpa membebani mental siswa.</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-2 gap-3">
              <div className="space-y-3">
                <div className="rounded-2xl overflow-hidden border-2 border-slate-200 bg-white">
                  <img
                    src="/images/mobil_agya.webp"
                    alt="Toyota Agya Mobil Latihan Indonesia"
                    className="w-full h-36 sm:h-44 object-cover"
                  />
                  <p className="p-2 text-center text-[11px] font-bold text-slate-800">
                    Toyota Agya (Transmisi Matic)
                  </p>
                </div>
                <div className="rounded-2xl overflow-hidden border-2 border-slate-200 bg-white">
                  <img
                    src="/images/interior_mobil.webp"
                    alt="Interior Mobil Setir Kanan Indonesia"
                    className="w-full h-36 sm:h-44 object-cover"
                  />
                  <p className="p-2 text-center text-[11px] font-bold text-slate-800">
                    Kemudi Setir Kanan & Rem Ganda
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <div className="rounded-2xl overflow-hidden border-2 border-slate-200 bg-white">
                  <img
                    src="/images/mobil_ayla.webp"
                    alt="Daihatsu Ayla Mobil Latihan Indonesia"
                    className="w-full h-36 sm:h-44 object-cover"
                  />
                  <p className="p-2 text-center text-[11px] font-bold text-slate-800">
                    Daihatsu Ayla (Transmisi Manual)
                  </p>
                </div>
                <div className="rounded-2xl overflow-hidden border-2 border-slate-200 bg-white">
                  <img
                    src="/images/jalan_bali.webp"
                    alt="Suasana Jalan Raya di Bali"
                    className="w-full h-36 sm:h-44 object-cover"
                  />
                  <p className="p-2 text-center text-[11px] font-bold text-slate-800">
                    Latihan Langsung di Jalan Bali
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. INTERACTIVE SECTION (RECOMMENDER, PACKAGES, BRANCHES, FAQ) */}
      {/* ========================================================= */}
      <LandingInteractive branches={branches} />

      {/* ========================================================= */}
      {/* 6. MODUL KHUSUS LAYANAN SIM SATPAS */}
      {/* ========================================================= */}
      <section id="layanan-sim" className="py-12 sm:py-16 bg-white border-t border-slate-200 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-8 sm:mb-10">
            <span className="inline-block px-3 py-1 rounded-full bg-[#7ADA3A]/20 text-slate-950 font-bold text-xs uppercase tracking-wider mb-2 border border-[#7ADA3A]/40">
              Layanan Tambahan
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Pendampingan Pembuatan SIM Satpas
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Khusus bagi Anda yang sudah bisa mengemudi namun membutuhkan bimbingan materi ujian dan pendampingan resmi di Satpas Polresta.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl">
            {/* Card SIM A */}
            <div className="p-5 sm:p-6 rounded-2xl border-2 border-slate-200 hover:border-[#7ADA3A] bg-slate-50/60 flex flex-col justify-between space-y-4 transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-md bg-[#7ADA3A] text-slate-950">
                    Mobil (Roda 4)
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">SIM A Resmi Satpas</span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">Layanan Pengurusan SIM A</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Untuk pengemudi mobil penumpang dan kendaraan perseorangan.
                  </p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                  <p className="font-bold text-slate-900 mb-1">Fasilitas yang didapat:</p>
                  <p className="font-medium">• Bimbingan materi ujian teori & rambu jalan</p>
                  <p className="font-medium">• Simulasi praktik lintasan (tanjakan & parkir)</p>
                  <p className="font-medium">• Pendampingan langsung staf di Satpas Polresta</p>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Tarif Layanan:</span>
                  <p className="text-2xl font-black text-slate-900">Rp 700.000</p>
                </div>
              </div>

              <a
                href={getWhatsAppLink(defaultCsPhone, "Halo CS joelmengemudi, saya ingin mendaftar Layanan Pengurusan SIM A (Rp 700.000).")}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-[#7ADA3A] hover:bg-[#68c82f] text-slate-950 font-bold text-xs text-center transition-all flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <span>Daftar SIM A via WhatsApp</span>
                <ArrowRight size={13} />
              </a>
            </div>

            {/* Card SIM C */}
            <div className="p-5 sm:p-6 rounded-2xl border-2 border-slate-200 hover:border-[#7ADA3A] bg-slate-50/60 flex flex-col justify-between space-y-4 transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-md bg-[#7ADA3A] text-slate-950">
                    Motor (Roda 2)
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">SIM C Resmi Satpas</span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">Layanan Pengurusan SIM C</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Untuk pengendara sepeda motor (kapasitas mesin s.d. 250 cc).
                  </p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                  <p className="font-bold text-slate-900 mb-1">Fasilitas yang didapat:</p>
                  <p className="font-medium">• Bimbingan materi soal ujian tertulis teori</p>
                  <p className="font-medium">• Simulasi lintasan praktik huruf S terbaru</p>
                  <p className="font-medium">• Pendampingan berkas di Satpas Polresta</p>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Tarif Layanan:</span>
                  <p className="text-2xl font-black text-slate-900">Rp 625.000</p>
                </div>
              </div>

              <a
                href={getWhatsAppLink(defaultCsPhone, "Halo CS joelmengemudi, saya ingin mendaftar Layanan Pengurusan SIM C (Rp 625.000).")}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-[#7ADA3A] hover:bg-[#68c82f] text-slate-950 font-bold text-xs text-center transition-all flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <span>Daftar SIM C via WhatsApp</span>
                <ArrowRight size={13} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 7. ULASAN & TESTIMONI DARI DATABASE */}
      {/* ========================================================= */}
      <section id="testimoni" className="py-12 sm:py-16 bg-slate-50 border-t border-slate-200 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-8 sm:mb-10">
            <span className="inline-block px-3 py-1 rounded-full bg-[#7ADA3A]/20 text-slate-950 font-bold text-xs uppercase tracking-wider mb-2 border border-[#7ADA3A]/40">
              Ulasan Siswa
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Pengalaman Belajar di joelmengemudi
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Ulasan dari para siswa yang telah menyelesaikan kursus mengemudi di cabang-cabang kami.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {ratings.map((rev) => (
              <div
                key={rev.id}
                className="p-5 rounded-2xl bg-white border-2 border-slate-200 flex flex-col justify-between space-y-3 shadow-2xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={13}
                          className={cn(
                            i < rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {formatDate(rev.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    "{rev.review || "Instruktur sabar sekali saat mengajari tanjakan dan parkir. Mobilnya bersih dan ber-AC. Sangat terbantu."}"
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{rev.student.name}</span>
                    <span className="text-[11px] text-slate-500">
                      Instruktur: {rev.instructor.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-[#7ADA3A]/25 text-slate-950 rounded">
                    {rev.branch.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 8. FOOTER BERSIH & RAPI DENGAN BRAND #7ADA3A */}
      {/* ========================================================= */}
      <footer className="bg-slate-950 text-white text-xs border-t border-slate-800 pb-20 lg:pb-8 pt-10 sm:pt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8">
            {/* Kolom 1: Profil */}
            <div className="md:col-span-5 space-y-3">
              <div className="flex items-center gap-2">
                <img
                  src="/joel-logo.png"
                  alt="Logo joelmengemudi"
                  className="w-7 h-7 object-contain brightness-0 invert"
                />
                <span className="font-bold text-white text-base tracking-tight">
                  joel<span className="text-[#7ADA3A]">mengemudi</span>
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed text-xs max-w-sm">
                Lembaga kursus mengemudi mobil resmi di Bali. Melayani pelatihan transmisi manual, matic, serta bimbingan uji SIM A & C di Satpas Polresta.
              </p>
              <div className="pt-1 text-slate-400 space-y-1 text-xs">
                <p>Telepon / WA: <strong className="text-white">{defaultCsPhone}</strong></p>
                <p>Jam Operasional: Setiap hari 08.00 - 17.00 WITA</p>
              </div>
            </div>

            {/* Kolom 2: Cabang */}
            <div className="md:col-span-3 space-y-2">
              <p className="font-bold text-white tracking-wider text-xs uppercase">
                Kantor & Cabang
              </p>
              <ul className="space-y-1 text-slate-400 text-xs">
                <li>• Head Office (Jl. Kanyeri, Denpasar)</li>
                <li>• Office Sesetan (Denpasar Selatan)</li>
                <li>• Office Bangli (Jl. M. Hatta)</li>
                <li>• Drop Point Mengwi (Badung)</li>
                <li>• Office Gianyar (Sukawati)</li>
              </ul>
            </div>

            {/* Kolom 3: Pilihan Paket */}
            <div className="md:col-span-4 space-y-2">
              <p className="font-bold text-white tracking-wider text-xs uppercase">
                Paket & Layanan
              </p>
              <ul className="space-y-1 text-slate-400 text-xs">
                <li>• Paket Manual: 4 Jam (525rb), 8 Jam (950rb), 10 Jam (1.150rb)</li>
                <li>• Paket Matic: 4 Jam (525rb), 8 Jam (950rb), 10 Jam (1.150rb)</li>
                <li>• Paket Mix (Manual 8 Jam + Matic 4 Jam): 1.475rb</li>
                <li>• Paket Kursus + SIM A (Manual, Matic, Mix)</li>
                <li>• Layanan SIM Satpas: SIM A (700rb) & SIM C (625rb)</li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
            <p>© {new Date().getFullYear()} joelmengemudi. Hak Cipta Dilindungi.</p>
            <p>Sistem Informasi Kursus Mengemudi Bali</p>
          </div>
        </div>
      </footer>

      {/* ========================================================= */}
      {/* 9. FLOATING BOTTOM BAR PADA LAYAR MOBILE */}
      {/* ========================================================= */}
      <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 p-2.5 flex items-center gap-2 shadow-md">
        <a
          href={defaultWaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2 px-3 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <span>Tanya CS WhatsApp</span>
        </a>
        <a
          href="#paket-kursus"
          className="flex-1 py-2 px-3 rounded-xl bg-[#7ADA3A] text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <span>Pilih Paket</span>
          <ArrowRight size={13} />
        </a>
      </div>
    </div>
  )
}
