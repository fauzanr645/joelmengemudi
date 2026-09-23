"use client"

import { useEffect, useState } from "react"
import { MessageSquare, Headset, X } from "lucide-react"
import { getWhatsAppLink } from "@/lib/utils"

interface StudentFloatingWAProps {
  studentName?: string
  branchName?: string | null
}

export function StudentFloatingWA({ studentName = "Siswa", branchName = "joelmengemudi" }: StudentFloatingWAProps) {
  const [csPhone, setCsPhone] = useState<string>("081234567801")
  const [csName, setCsName] = useState<string>("Customer Service")
  const [isOpenTooltip, setIsOpenTooltip] = useState(false)

  useEffect(() => {
    // Fetch CS phone of student's branch
    fetch("/api/users?role=CUSTOMER_SERVICE")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCsPhone(data[0].phone || "081234567801")
          setCsName(data[0].name || "Customer Service")
        }
      })
      .catch((err) => console.error(err))
  }, [])

  const defaultMessage = `Halo ${csName} (${branchName || "joelmengemudi"}), saya ${studentName} (siswa kursus). Saya ingin bertanya mengenai jadwal / pembayaran kursus mengemudi saya.`
  const waUrl = getWhatsAppLink(csPhone, defaultMessage)

  return (
    <div className="fixed bottom-24 lg:bottom-7 right-4 lg:right-7 z-40 flex flex-col items-end">
      {/* Tooltip Popup */}
      {isOpenTooltip && (
        <div className="mb-2 p-3 bg-white text-slate-800 rounded-2xl shadow-xl border border-slate-200 text-xs w-60 space-y-1.5 animate-fade-in relative">
          <button
            onClick={() => setIsOpenTooltip(false)}
            className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
          >
            <X size={13} />
          </button>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-slate-900">CS {branchName || "Cabang"}</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            Butuh bantuan jadwal, ubah sesi, atau info pembayaran? Chat langsung CS kami via WhatsApp.
          </p>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors"
          >
            Buka Chat WhatsApp
          </a>
        </div>
      )}

      {/* Floating Action Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpenTooltip(!isOpenTooltip)}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-emerald-800 font-bold text-xs border border-emerald-200 shadow-md hover:bg-emerald-50 transition-all cursor-pointer"
        >
          <Headset size={14} className="text-[#3c7717]" />
          <span>Chat CS Cabang</span>
        </button>

        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-600 to-[#7ADA3A] text-slate-950 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 border-2 border-white brand-glow group"
          title="Chat WhatsApp ke Customer Service"
          aria-label="Chat WhatsApp ke Customer Service"
        >
          <MessageSquare size={26} className="text-slate-950 fill-slate-950/20 group-hover:rotate-6 transition-transform" />
        </a>
      </div>
    </div>
  )
}
