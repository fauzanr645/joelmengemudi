"use client"

import { useEffect, useState } from "react"
import { Bell, Check, X, Smartphone, ArrowRight } from "lucide-react"

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function PushPermissionBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const vapidPublicKey =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    "BMarwauV9nlSh4yO2Bx_4JgR4nV3DT8DqeR1KtOL_PUAax2HfSG0cjC5MAUQrfs4JuT6WV6KOqQHbLZAclsBt8A"

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return
    }

    const dismissed = localStorage.getItem("push-banner-dismissed")
    if (Notification.permission === "default" && !dismissed) {
      // Delay slightly for smooth page load
      const timer = setTimeout(() => setShowBanner(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleEnablePush = async () => {
    setIsLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission === "granted") {
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.ready
          let subscription = await registration.pushManager.getSubscription()

          if (!subscription) {
            const convertedKey = urlBase64ToUint8Array(vapidPublicKey)
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: convertedKey,
            })
          }

          const subJson = subscription.toJSON()
          await fetch("/api/notifications/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              endpoint: subJson.endpoint,
              keys: subJson.keys,
              userAgent: navigator.userAgent,
            }),
          })
        }

        setIsSuccess(true)
        setTimeout(() => setShowBanner(false), 2500)
      } else {
        setShowBanner(false)
      }
    } catch (e) {
      console.error("Failed to enable push:", e)
      setShowBanner(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem("push-banner-dismissed", "true")
  }

  if (!showBanner) return null

  return (
    <div className="mb-5 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white border-2 border-[#7ADA3A]/50 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in relative">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#7ADA3A] text-slate-950 flex items-center justify-center font-bold shrink-0">
          {isSuccess ? <Check size={18} /> : <Bell size={18} />}
        </div>
        <div>
          <span className="font-bold text-xs sm:text-sm text-white block">
            {isSuccess
              ? "Notifikasi Perangkat Berhasil Diaktifkan! ✅"
              : "Aktifkan Notifikasi ke HP / Laptop Anda 🔔"}
          </span>
          <span className="text-[11px] text-slate-300 font-normal block mt-0.5">
            {isSuccess
              ? "Anda akan menerima informasi jadwal, pembayaran, dan pembaruan penting langsung di layar."
              : "Dapatkan pembaruan langsung tentang jadwal latihan, verifikasi pembayaran, kendala armada, dan jadwal ujian Satpas."}
          </span>
        </div>
      </div>

      {!isSuccess && (
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            type="button"
            onClick={handleEnablePush}
            disabled={isLoading}
            className="py-1.5 px-3.5 rounded-xl bg-[#7ADA3A] hover:bg-[#68c82f] text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <span>{isLoading ? "Mengaktifkan..." : "Aktifkan Sekarang"}</span>
            <ArrowRight size={13} />
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
            aria-label="Tutup"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
