import { cn } from "@/lib/utils"
import { forwardRef } from "react"
import { AlertCircle, ChevronDown } from "lucide-react"

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options?: { value: string; label: string }[]
  placeholder?: string
  helperText?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options = [], placeholder, helperText, className, value, ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label className="block text-xs font-semibold text-slate-700 tracking-wide">
            {label}
            {props.required && <span className="text-rose-500 ml-1 font-bold">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            value={value ?? ""}
            className={cn(
              "w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm text-slate-800 shadow-sm transition-all duration-150 appearance-none pr-10 cursor-pointer",
              error
                ? "border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                : "border-slate-200 focus:border-[#7ADA3A] focus:ring-2 focus:ring-[#7ADA3A]/25",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {(options || []).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <ChevronDown size={16} />
          </div>
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

Select.displayName = "Select"
