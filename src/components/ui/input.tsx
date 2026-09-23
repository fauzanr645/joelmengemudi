import { cn } from "@/lib/utils"
import { forwardRef } from "react"
import { AlertCircle } from "lucide-react"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label className="block text-xs font-semibold text-slate-700 tracking-wide">
            {label}
            {props.required && <span className="text-rose-500 ml-1 font-bold">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition-all duration-150",
              leftIcon && "pl-10",
              error
                ? "border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                : "border-slate-200 focus:border-[#7ADA3A] focus:ring-2 focus:ring-[#7ADA3A]/25",
              className
            )}
            {...props}
          />
        </div>
        {error ? (
          <p className="text-xs text-rose-500 flex items-center gap-1 font-medium mt-1">
            <AlertCircle size={13} className="shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-xs text-slate-400 font-normal">{helperText}</p>
        ) : null}
      </div>
    )
  }
)

Input.displayName = "Input"
