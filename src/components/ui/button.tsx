import { cn } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline" | "success" | "brand-dark"
  size?: "xs" | "sm" | "md" | "lg"
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const variants = {
  primary: "bg-[#7ADA3A] text-slate-900 font-semibold hover:bg-[#6ecb30] shadow-sm hover:shadow active:scale-[0.98] border border-[#6ecb30]",
  "brand-dark": "bg-[#386E1B] text-white font-medium hover:bg-[#2e5b16] shadow-sm hover:shadow active:scale-[0.98]",
  secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-[0.98] border border-slate-200/60",
  danger: "bg-rose-500 text-white font-medium hover:bg-rose-600 shadow-sm active:scale-[0.98]",
  success: "bg-emerald-600 text-white font-medium hover:bg-emerald-700 shadow-sm active:scale-[0.98]",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  outline: "border border-slate-200 text-slate-700 bg-white hover:border-[#7ADA3A] hover:bg-[#7ADA3A]/10 hover:text-[#315c1c] active:scale-[0.98]",
}

const sizeClasses = {
  xs: "px-2.5 py-1 text-xs rounded-md gap-1",
  sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
  md: "px-4 py-2 text-sm rounded-xl gap-2",
  lg: "px-5 py-2.5 text-base rounded-xl gap-2.5 font-semibold",
}

export function Button({
  variant = "primary",
  size = "md",
  isLoading,
  leftIcon,
  rightIcon,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-150 select-none focus:outline-none focus:ring-2 focus:ring-[#7ADA3A]/50 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed cursor-pointer",
        variants[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : leftIcon ? (
        <span className="shrink-0">{leftIcon}</span>
      ) : null}
      <span>{children}</span>
      {!isLoading && rightIcon ? <span className="shrink-0">{rightIcon}</span> : null}
    </button>
  )
}
