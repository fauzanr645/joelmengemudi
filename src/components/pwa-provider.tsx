"use client"

import { useEffect, useState } from "react"
import { Download, X, Smartphone, Share, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("PWA Service Worker registered:", reg.scope)
          })
          .catch((err) => {
            console.log("PWA Service Worker registration failed:", err)
          })
      })
    }

    // 2. Check if already installed / standalone
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true

    setIsStandalone(isStandaloneMode)

    // 3. Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(isIosDevice)

    // Check localStorage dismissal
    const dismissed = localStorage.getItem("pwa-prompt-dismissed")

    // 4. Capture beforeinstallprompt event (Android Chrome, Edge, etc.)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      if (!dismissed && !isStandaloneMode) {
        setShowPrompt(true)
      }
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // 5. Detect appinstalled event
    const handleAppInstalled = () => {
      setInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
      console.log("PWA installed successfully")
    }

    window.addEventListener("appinstalled", handleAppInstalled)

    // Show prompt on iOS if not dismissed and not standalone
    if (isIosDevice && !isStandaloneMode && !dismissed) {
      const timer = setTimeout(() => setShowPrompt(true), 3000)
      return () => clearTimeout(timer)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const choiceResult = await deferredPrompt.userChoice

    if (choiceResult.outcome === "accepted") {
      setInstalled(true)
      setShowPrompt(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem("pwa-prompt-dismissed", "true")
  }

  return (
    <>
      {children}

      {/* Floating PWA Install Prompt for Mobile Devices */}
      {showPrompt && !isStandalone && (
        <div className="fixed bottom-20 lg:bottom-5 left-3 right-3 sm:left-auto sm:right-5 sm:max-w-sm z-50 animate-fade-in">
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-800 relative overflow-hidden">
            <div className="absolute right-0 top-0 -mt-6 -mr-6 w-28 h-28 bg-[#7ADA3A]/20 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between gap-3 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 p-1 flex items-center justify-center shrink-0 border border-white/10">
                  <img src="/joel-logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white leading-tight">
                    Install Aplikasi joelmengemudi
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Akses cepat & latihan nyaman langsung dari layar HP Anda
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="text-slate-400 hover:text-white p-1 rounded-lg shrink-0 cursor-pointer"
                aria-label="Tutup Banner PWA"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800/80 relative z-10">
              {isIOS ? (
                <div className="text-[11px] text-slate-300 flex items-center gap-2 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                  <Share size={16} className="text-[#7ADA3A] shrink-0" />
                  <span>
                    Tekan tombol <strong>Bagikan (Share)</strong> lalu pilih <strong>Tambah ke Layar Utama</strong>.
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleInstallClick}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#7ADA3A] text-slate-950 font-bold text-xs hover:bg-[#68c62f] transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Install ke HP Sekarang</span>
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="py-2 px-3 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Nanti Saja
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Installed Toast Confirmation */}
      {installed && (
        <div className="fixed bottom-24 lg:bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-fade-in">
          <CheckCircle2 size={16} />
          <span>Aplikasi joelmengemudi berhasil terpasang di HP Anda!</span>
        </div>
      )}
    </>
  )
}
