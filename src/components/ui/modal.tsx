"use client"

import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { useEffect, useCallback } from "react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const sizes = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = "md",
  className,
}: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      window.addEventListener("keydown", handleKeyDown)
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        className={cn(
          "relative bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full overflow-hidden z-10 my-auto transform transition-all animate-fade-in",
          sizes[size],
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Header with accent top bar */}
        <div className="h-1.5 bg-gradient-to-r from-[#7ADA3A] via-[#8ce35a] to-[#5cb82a]" />
        
        <div className="flex items-start justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors shrink-0 ml-3"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 max-h-[75vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
