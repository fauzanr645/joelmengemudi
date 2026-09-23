"use client"

import { useEffect, useState, useRef } from "react"
import {
  Bell,
  Check,
  CheckCheck,
  Smartphone,
  ExternalLink,
  Trash2,
  AlertCircle,
  Clock,
  Sparkles,
  Send,
  X,
} from "lucide-react"
import { cn, formatDate } from "@/lib/utils"

interface NotificationItem {
  id: string
  title: string
  message: string
  type: string
  link: string | null
  isRead: boolean
  createdAt: string
}

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

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"ALL" | "UNREAD">("ALL")
  const [permissionState, setPermissionState] = useState<NotificationPermission>("default")
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: "success" | "error" } | null>(null)

  const dropdownRef = useRef<HTMLDivElement>(null)

  const vapidPublicKey =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    "BMarwauV9nlSh4yO2Bx_4JgR4nV3DT8DqeR1KtOL_PUAax2HfSG0cjC5MAUQrfs4JuT6WV6KOqQHbLZAclsBt8A"

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 25000)

    if (typeof window !== "undefined" && "Notification" in window) {
      setPermissionState(Notification.permission)
    }

    return () => clearInterval(interval)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Clear toast alert
  useEffect(() => {
    if (alertMsg) {
      const timer = setTimeout(() => setAlertMsg(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [alertMsg])

  // Request Push Permission & Register Service Worker Subscription
  const enableDevicePush = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setAlertMsg({ text: "Browser ini belum mendukung notifikasi Web Push.", type: "error" })
      return
    }

    setIsSubscribing(true)
    try {
      const permission = await Notification.requestPermission()
      setPermissionState(permission)

      if (permission !== "granted") {
        setAlertMsg({
          text: "Izin notifikasi belum diberikan. Silakan izinkan di pengaturan browser Anda.",
          type: "error",
        })
        return
      }

      // Check service worker registration
      if (!("serviceWorker" in navigator)) {
        throw new Error("Service Worker tidak tersedia di browser ini.")
      }

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

      // Kirim data subscription ke server
      const res = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: subJson.keys,
          userAgent: navigator.userAgent,
        }),
      })

      if (!res.ok) {
        throw new Error("Gagal mendaftarkan perangkat ke server.")
      }

      setAlertMsg({
        text: "Notifikasi ke perangkat Anda berhasil diaktifkan!",
        type: "success",
      })
    } catch (err: any) {
      console.error(err)
      setAlertMsg({ text: err.message || "Gagal mengaktifkan notifikasi.", type: "error" })
    } finally {
      setIsSubscribing(false)
    }
  }

  // Send Test Notification
  const triggerTestNotification = async () => {
    setIsTesting(true)
    try {
      const res = await fetch("/api/notifications/test", { method: "POST" })
      if (!res.ok) throw new Error("Gagal mengirim notifikasi uji coba")

      setAlertMsg({
        text: "Notifikasi uji coba dikirim! Periksa layar perangkat Anda.",
        type: "success",
      })
      fetchNotifications()
    } catch (err: any) {
      setAlertMsg({ text: err.message || "Gagal mengirim tes", type: "error" })
    } finally {
      setIsTesting(false)
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (e) {
      console.error(e)
    }
  }

  // Mark single as read and navigate
  const handleItemClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      try {
        await fetch("/api/notifications", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: notif.id }),
        })
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        )
        setUnreadCount((c) => Math.max(0, c - 1))
      } catch (e) {
        console.error(e)
      }
    }

    if (notif.link) {
      setIsOpen(false)
      window.location.href = notif.link
    }
  }

  // Filtered notifications
  const displayedNotifications = notifications.filter((n) =>
    activeTab === "UNREAD" ? !n.isRead : true
  )

  const typeBadges: Record<string, { label: string; color: string }> = {
    PAYMENT: { label: "Pembayaran", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
    SCHEDULE: { label: "Jadwal", color: "bg-sky-100 text-sky-800 border-sky-300" },
    RESCHEDULE: { label: "Reschedule", color: "bg-amber-100 text-amber-800 border-amber-300" },
    VEHICLE_REPORT: { label: "Armada", color: "bg-rose-100 text-rose-800 border-rose-300" },
    SIM_SERVICE: { label: "Layanan SIM", color: "bg-purple-100 text-purple-800 border-purple-300" },
    ENROLLMENT: { label: "Kursus", color: "bg-[#7ADA3A]/25 text-[#234c0e] border-[#7ADA3A]/50" },
    SYSTEM: { label: "Sistem", color: "bg-slate-100 text-slate-800 border-slate-300" },
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
        aria-label="Pemberitahuan Notifikasi"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-[#7ADA3A] text-slate-950 font-black text-[10px] rounded-full flex items-center justify-center border-2 border-white shadow-2xs animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="fixed sm:absolute top-14 sm:top-12 right-2 sm:right-0 w-[calc(100vw-16px)] sm:w-96 max-w-[420px] bg-white rounded-3xl border-2 border-slate-200 shadow-2xl z-50 overflow-hidden flex flex-col max-h-[82vh] animate-fade-in">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-900">Pemberitahuan</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#7ADA3A] text-slate-950 font-black text-[10px]">
                  {unreadCount} Baru
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-[11px] font-bold text-[#386E1B] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <CheckCheck size={13} />
                  <span>Tandai Dibaca</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Toast Alert */}
          {alertMsg && (
            <div
              className={cn(
                "p-2.5 px-4 text-xs font-bold border-b flex items-center justify-between",
                alertMsg.type === "success"
                  ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                  : "bg-rose-50 text-rose-900 border-rose-200"
              )}
            >
              <span>{alertMsg.text}</span>
              <button type="button" onClick={() => setAlertMsg(null)}>
                <X size={13} />
              </button>
            </div>
          )}

          {/* Device Push Permission Box */}
          <div className="p-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white border-b border-slate-700/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#7ADA3A]/20 text-[#7ADA3A] flex items-center justify-center shrink-0">
                <Smartphone size={16} />
              </div>
              <div className="min-w-0">
                <span className="block text-[11px] font-bold text-white leading-tight truncate">
                  {permissionState === "granted"
                    ? "Notifikasi Perangkat Aktif"
                    : "Notifikasi HP / Laptop"}
                </span>
                <span className="block text-[10px] text-slate-400 truncate">
                  {permissionState === "granted"
                    ? "Terhubung ke Service Worker Web Push"
                    : "Terima info jadwal & bayar langsung ke layar"}
                </span>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-1.5">
              {permissionState !== "granted" ? (
                <button
                  type="button"
                  onClick={enableDevicePush}
                  disabled={isSubscribing}
                  className="py-1 px-2.5 rounded-lg bg-[#7ADA3A] hover:bg-[#68c82f] text-slate-950 font-black text-[11px] cursor-pointer transition-all shadow-2xs"
                >
                  {isSubscribing ? "Mengaktifkan..." : "Aktifkan"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={triggerTestNotification}
                  disabled={isTesting}
                  title="Kirim notifikasi tes langsung ke layar Anda"
                  className="py-1 px-2.5 rounded-lg bg-white/15 hover:bg-white/25 text-white font-bold text-[11px] cursor-pointer transition-colors flex items-center gap-1"
                >
                  <Send size={11} />
                  <span>{isTesting ? "Mengirim..." : "Tes Notif"}</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-3 pt-2.5 pb-1 flex items-center gap-2 border-b border-slate-100 bg-white">
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                activeTab === "ALL"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              Semua ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("UNREAD")}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                activeTab === "UNREAD"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              Belum Dibaca ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {displayedNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-1">
                <Bell size={28} className="mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-xs text-slate-600">Tidak ada notifikasi baru</p>
                <p className="text-[11px]">Semua informasi aktivitas Anda akan muncul di sini.</p>
              </div>
            ) : (
              displayedNotifications.map((notif) => {
                const badge = typeBadges[notif.type] || typeBadges.SYSTEM
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    className={cn(
                      "p-3.5 sm:p-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3 relative",
                      !notif.isRead && "bg-emerald-50/40"
                    )}
                  >
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#7ADA3A] mt-1.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded border",
                            badge.color
                          )}
                        >
                          {badge.label}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {formatDate(notif.createdAt)}
                        </span>
                      </div>

                      <h4 className="font-bold text-xs text-slate-900 leading-snug">
                        {notif.title}
                      </h4>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {notif.message}
                      </p>

                      {notif.link && (
                        <p className="text-[10px] font-bold text-[#386E1B] flex items-center gap-1 pt-0.5">
                          <span>Buka halaman</span>
                          <ExternalLink size={10} />
                        </p>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
