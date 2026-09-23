import { cn } from "@/lib/utils"

interface BadgeProps {
  children: React.ReactNode
  variant?: "default" | "brand" | "success" | "warning" | "danger" | "info" | "purple" | "neutral"
  size?: "sm" | "md"
  dot?: boolean
  className?: string
}

const variants = {
  default: "bg-slate-100 text-slate-700 border-slate-200/80",
  neutral: "bg-slate-50 text-slate-600 border-slate-200",
  brand: "bg-[#7ADA3A]/15 text-[#2e5e15] border-[#7ADA3A]/30 font-semibold",
  success: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
  warning: "bg-amber-50 text-amber-800 border-amber-200/80",
  danger: "bg-rose-50 text-rose-800 border-rose-200/80",
  info: "bg-sky-50 text-sky-800 border-sky-200/80",
  purple: "bg-purple-50 text-purple-800 border-purple-200/80",
}

const dotColors = {
  default: "bg-slate-400",
  neutral: "bg-slate-400",
  brand: "bg-[#7ADA3A]",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  info: "bg-sky-500",
  purple: "bg-purple-500",
}

export function Badge({
  children,
  variant = "default",
  size = "sm",
  dot = false,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full border tracking-wide select-none transition-colors",
        size === "sm" ? "px-2.5 py-0.5 text-[11px] gap-1.5" : "px-3 py-1 text-xs gap-2",
        variants[variant],
        className
      )}
    >
      {dot && (
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColors[variant])} />
      )}
      <span>{children}</span>
    </span>
  )
}
