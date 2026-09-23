import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  description?: string
  trend?: { value: number; isPositive: boolean }
  badgeText?: string
  badgeVariant?: "brand" | "success" | "warning" | "danger" | "info" | "default"
  className?: string
}

export function StatCard({
  title,
  value,
  icon,
  description,
  trend,
  badgeText,
  badgeVariant = "brand",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "relative bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:border-[#7ADA3A]/50 transition-all duration-200 group overflow-hidden",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {value}
          </p>
          {description && (
            <p className="text-xs text-slate-400 font-medium">{description}</p>
          )}
          {trend && (
            <p
              className={cn(
                "text-xs font-semibold inline-flex items-center gap-1 mt-1",
                trend.isPositive ? "text-emerald-600" : "text-rose-600"
              )}
            >
              <span>{trend.isPositive ? "↑ +" : "↓ -"}</span>
              <span>{Math.abs(trend.value)}% dari bulan lalu</span>
            </p>
          )}
        </div>

        <div className="w-12 h-12 rounded-2xl bg-[#7ADA3A]/15 text-[#386E1B] flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-[#7ADA3A]/25 transition-transform duration-200">
          {icon}
        </div>
      </div>

      {badgeText && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-400">Status</span>
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold",
              badgeVariant === "warning" && "bg-amber-50 text-amber-800 border border-amber-200",
              badgeVariant === "danger" && "bg-rose-50 text-rose-800 border border-rose-200",
              badgeVariant === "success" && "bg-emerald-50 text-emerald-800 border border-emerald-200",
              badgeVariant === "info" && "bg-sky-50 text-sky-800 border border-sky-200",
              badgeVariant === "brand" && "bg-[#7ADA3A]/20 text-[#2e5e15] border border-[#7ADA3A]/40",
              badgeVariant === "default" && "bg-slate-100 text-slate-700"
            )}
          >
            {badgeText}
          </span>
        </div>
      )}
    </div>
  )
}
