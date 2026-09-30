# joelmengemudi

Sistem Informasi Manajemen & Pendaftaran Kursus Mengemudi Multi-Cabang Bali.

## Fitur Utama

- **Landing Page Interaktif**: Filter transmisi, kalkulator rekomendasi kursus, rincian biaya DP 50%, informasi 5 cabang Bali, dan FAQ.
- **Multi-Role Portal**:
  - **Owner**: Manajemen cabang, armada mobil, instruktur, tarif kursus, modul persetujuan servis armada, dan rekapitulasi keuangan.
  - **Customer Service**: Pendaftaran siswa baru, verifikasi pembayaran, penjadwalan latihan, verifikasi permohonan SIM, dan monitoring jadwal instruktur.
  - **Instruktur**: Kalender sesi mengemudi harian, pengisian presensi dan nilai kompetensi siswa, serta pelaporan kendala armada mobil.
  - **Siswa**: Tracking sesi mengemudi, riwayat pembayaran bertahap (DP/Lunas), pengajuan reschedule, proses bimbingan SIM Satpas, dan rating instruktur.
- **PWA & Web Push Notification**: Notifikasi penting ke perangkat pengguna (pendaftaran, verifikasi pembayaran, jadwal Satpas, dan laporan armada).

## Teknologi

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Database**: PostgreSQL (Prisma ORM)
- **Autentikasi**: NextAuth.js v5 (JWT & Role-Based Access Control)
- **Penyimpanan Berkas**: Hybrid Local & Vercel Blob Storage
- **Push Notification**: Web Push Protocol (VAPID)
- **Styling**: Tailwind CSS

## Memulai Proyek

```bash
# Install dependensi
npm install

# Setup database
npx prisma db push
npx tsx prisma/seed.ts

# Jalankan server development
npm run dev
```

Buka [http://localhost:3001](http://localhost:3001) di browser Anda.
