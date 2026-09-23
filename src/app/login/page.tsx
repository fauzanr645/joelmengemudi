"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Car, Mail, Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null)

  const demoAccounts = [
    {
      role: "Owner",
      email: "owner@demo.com",
      pass: "password123",
      desc: "Manajemen cabang & aset",
      badge: "bg-purple-100 text-purple-800 border-purple-200",
    },
    {
      role: "CS",
      email: "cs@demo.com",
      pass: "password123",
      desc: "Pendaftaran & jadwal",
      badge: "bg-sky-100 text-sky-800 border-sky-200",
    },
    {
      role: "Instruktur",
      email: "instruktur@demo.com",
      pass: "password123",
      desc: "Jadwal & penilaian",
      badge: "bg-[#7ADA3A]/25 text-[#244b0c] border-[#7ADA3A]/40",
    },
    {
      role: "Siswa",
      email: "siswa@demo.com",
      pass: "password123",
      desc: "Kursus & pembayaran",
      badge: "bg-amber-100 text-amber-800 border-amber-200",
    },
  ]

  const handleSelectDemo = (acc: (typeof demoAccounts)[0]) => {
    setEmail(acc.email)
    setPassword(acc.pass)
    setSelectedDemo(acc.role)
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          email,
          password,
          redirect: "false",
          csrfToken: await getCsrfToken(),
        }),
      })

      if (res.ok) {
        const session = await fetch("/api/auth/session")
        const data = await session.json()

        if (data?.user) {
          const role = data.user.role
          switch (role) {
            case "OWNER":
              router.push("/owner")
              break
            case "CUSTOMER_SERVICE":
              router.push("/cs")
              break
            case "INSTRUCTOR":
              router.push("/instructor")
              break
            case "STUDENT":
              router.push("/student")
              break
            default:
              router.push("/")
          }
          router.refresh()
        } else {
          setError("Email atau password tidak sesuai.")
        }
      } else {
        setError("Email atau password tidak sesuai.")
      }
    } catch {
      setError("Terjadi kendala saat menghubungkan ke server.")
    } finally {
      setIsLoading(false)
    }
  }

  async function getCsrfToken() {
    const res = await fetch("/api/auth/csrf")
    const data = await res.json()
    return data.csrfToken
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-[#f4fcee]/40 to-slate-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Decorative Circles */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#7ADA3A]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#5cb82a]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-2">
            <img
              src="/joel-logo.png"
              alt="Logo joelmengemudi"
              className="w-24 h-24 object-contain drop-shadow-md"
            />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            joel<span className="text-[#3c7717]">mengemudi</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">
            Sistem Informasi Kursus Mengemudi Multi-Cabang
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-8">
          <div className="mb-5 pb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Masuk ke Akun</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Masukkan kredensial Anda atau pilih akun demo di bawah
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                label="Alamat Email"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setSelectedDemo(null)
                }}
                leftIcon={<Mail size={16} />}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 tracking-wide">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setSelectedDemo(null)
                  }}
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 shadow-sm focus:outline-none focus:border-[#7ADA3A] focus:ring-2 focus:ring-[#7ADA3A]/25 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              variant="primary"
              className="w-full mt-2 font-bold text-slate-900 bg-[#7ADA3A] hover:bg-[#68c62f] shadow-md hover:shadow-lg transition-all"
              isLoading={isLoading}
              rightIcon={<ArrowRight size={16} />}
            >
              Masuk Sekarang
            </Button>
          </form>

          {/* Quick Demo 1-Click Selector */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                1-Klik Akun Demo
              </span>
              <span className="text-[10px] text-slate-400">Klik untuk isi otomatis</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => {
                const isSelected = selectedDemo === acc.role
                return (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => handleSelectDemo(acc)}
                    className={cn(
                      "p-2.5 rounded-xl border text-left transition-all duration-150 relative cursor-pointer",
                      isSelected
                        ? "border-[#7ADA3A] bg-[#7ADA3A]/15 shadow-xs"
                        : "border-slate-200 bg-slate-50/70 hover:bg-slate-100/80 hover:border-slate-300"
                    )}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-slate-800">{acc.role}</span>
                      {isSelected && (
                        <CheckCircle2 size={13} className="text-[#315c1c]" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight truncate">
                      {acc.desc}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck size={14} className="text-[#3c7717]" />
          <span>joelmengemudi v1.0 • Aman, Terpercaya, & Berstandar Nasional</span>
        </div>
      </div>
    </div>
  )
}
