"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn, getInitials } from "@/lib/utils"
import {
  Car,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Building2,
} from "lucide-react"
import { useState } from "react"
import { signOut } from "next-auth/react"
import { NotificationCenter } from "@/components/notification-center"

interface SidebarItem {
  label: string
  href: string
  icon: React.ReactNode
  children?: { label: string; href: string }[]
}

interface SidebarProps {
  items: SidebarItem[]
  role: string
  userName: string
  branchName?: string | null
}

export function Sidebar({ items, role, userName, branchName }: SidebarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleSignOut = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoggingOut) return
    setIsLoggingOut(true)

    try {
      // Panggil signOut bawaan NextAuth.js yang otomatis menangani CSRF token & session broadcast
      await signOut({ callbackUrl: "/login", redirect: false })
    } catch (err) {
      console.warn("NextAuth signOut warning:", err)
      // Fallback manual request jika diperlukan
      try {
        const csrfRes = await fetch("/api/auth/csrf")
        const csrfData = await csrfRes.json()
        const csrfToken = csrfData?.csrfToken || ""
        await fetch("/api/auth/signout", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ csrfToken, callbackUrl: "/login" }),
        })
      } catch (fallbackErr) {
        console.warn("Fallback signout error:", fallbackErr)
      }
    } finally {
      // Full hard reload ke /login untuk mereset seluruh cache, chunks lama, dan session cookies
      window.location.href = "/login"
    }
  }

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]
    )
  }

  const roleStyles: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    OWNER: {
      bg: "bg-purple-50 border-purple-200/80 text-purple-700",
      dot: "bg-purple-600",
      text: "text-purple-700",
      label: "Owner / Pemilik",
    },
    CUSTOMER_SERVICE: {
      bg: "bg-sky-50 border-sky-200/80 text-sky-700",
      dot: "bg-sky-600",
      text: "text-sky-700",
      label: "Customer Service",
    },
    INSTRUCTOR: {
      bg: "bg-[#7ADA3A]/15 border-[#7ADA3A]/30 text-[#254d0d]",
      dot: "bg-[#7ADA3A]",
      text: "text-[#254d0d]",
      label: "Instruktur Mengemudi",
    },
    STUDENT: {
      bg: "bg-amber-50 border-amber-200/80 text-amber-700",
      dot: "bg-amber-500",
      text: "text-amber-700",
      label: "Siswa Kursus",
    },
  }

  const currentRole = roleStyles[role] || {
    bg: "bg-slate-100 border-slate-200 text-slate-700",
    dot: "bg-slate-500",
    text: "text-slate-700",
    label: role,
  }

  return (
    <>
      {/* Mobile Top App Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors active:scale-95 cursor-pointer"
            aria-label="Menu Navigasi"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-2">
            <img
              src="/joel-logo.png"
              alt="Logo"
              className="w-8 h-8 object-contain"
            />
            <div>
              <span className="font-extrabold text-slate-900 text-sm tracking-tight block leading-tight">
                joelmengemudi
              </span>
              <span className="text-[10px] text-slate-400 font-medium block leading-none">
                Driving Course
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationCenter />
          <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-bold border", currentRole.bg)}>
            {currentRole.label.split("/")[0]}
          </span>
        </div>
      </div>

      {/* Overlay Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Desktop & Mobile Drawer */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-200/80 transition-transform duration-250 ease-out flex flex-col shadow-xs lg:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-100 bg-gradient-to-b from-[#7ADA3A]/10 via-[#7ADA3A]/5 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/joel-logo.png"
              alt="Logo joelmengemudi"
              className="w-11 h-11 object-contain shrink-0 drop-shadow-xs"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-slate-900 text-base tracking-tight">
                  joel<span className="text-[#3c7717]">mengemudi</span>
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium block">
                Management System
              </span>
            </div>
          </div>
          <div className="hidden lg:block">
            <NotificationCenter />
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 border-b border-slate-100/80">
          <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-sm text-[#254d0d] shadow-xs shrink-0">
              {getInitials(userName || "User")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{userName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", currentRole.dot)} />
                <span className="text-[11px] font-medium text-slate-500 truncate">
                  {currentRole.label}
                </span>
              </div>
              {branchName && (
                <p className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                  <Building2 size={10} />
                  <span>{branchName}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-3 pt-2 pb-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Menu Utama
            </p>
          </div>

          {items.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" &&
                item.href !== "/owner" &&
                item.href !== "/cs" &&
                item.href !== "/instructor" &&
                item.href !== "/student" &&
                pathname.startsWith(item.href))
            const isExpanded = expandedItems.includes(item.label)

            if (item.children) {
              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleExpand(item.label)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                      isActive
                        ? "bg-[#7ADA3A]/15 text-[#244b0c] border border-[#7ADA3A]/40"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <span className="shrink-0 text-current">{item.icon}</span>
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronDown
                      size={15}
                      className={cn("transition-transform duration-200 text-slate-400", isExpanded && "rotate-180")}
                    />
                  </button>
                  {isExpanded && (
                    <div className="ml-8 mt-1 space-y-1 pl-2 border-l border-slate-200">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "block px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                            pathname === child.href
                              ? "text-[#2e5e15] font-bold bg-[#7ADA3A]/10"
                              : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                          )}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group",
                  isActive
                    ? "bg-[#7ADA3A]/15 text-[#244b0c] border border-[#7ADA3A]/40 shadow-xs font-bold"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <span
                  className={cn(
                    "shrink-0 transition-colors",
                    isActive ? "text-[#386E1B]" : "text-slate-400 group-hover:text-slate-600"
                  )}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#7ADA3A]" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer with Logout */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/40">
          <form onSubmit={handleSignOut}>
            <button
              type="submit"
              disabled={isLoggingOut}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors border border-transparent hover:border-rose-200 cursor-pointer disabled:opacity-50"
            >
              <LogOut size={16} />
              <span>{isLoggingOut ? "Sedang keluar..." : "Keluar dari Akun"}</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (For Student & Instructor) */}
      {(role === "STUDENT" || role === "INSTRUCTOR") && (
        <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
          {items.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/instructor" &&
                item.href !== "/student" &&
                pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-xs transition-all relative",
                  isActive
                    ? "text-[#2e5e15] font-bold"
                    : "text-slate-400 hover:text-slate-700 font-medium"
                )}
              >
                <div
                  className={cn(
                    "p-1 rounded-lg mb-0.5 transition-colors",
                    isActive && "bg-[#7ADA3A]/20 text-[#244b0c]"
                  )}
                >
                  {item.icon}
                </div>
                <span className="text-[10px] truncate max-w-[62px] leading-tight">
                  {item.label}
                </span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-[#7ADA3A] mt-0.5" />
                )}
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
