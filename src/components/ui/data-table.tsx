"use client"

import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react"
import { useState } from "react"

interface Column<T> {
  key: string
  label: string
  render?: (item: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  searchable?: boolean
  searchPlaceholder?: string
  onSearch?: (query: string) => void
  actions?: (item: T) => React.ReactNode
  emptyMessage?: string
  className?: string
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchable,
  searchPlaceholder = "Cari data...",
  onSearch,
  actions,
  emptyMessage = "Belum ada data tersedia.",
  className,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const filteredData = searchQuery
    ? data.filter((item) =>
        Object.values(item).some(
          (val) =>
            val !== null &&
            val !== undefined &&
            String(val).toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : data

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
    onSearch?.(query)
  }

  const clearSearch = () => {
    setSearchQuery("")
    setCurrentPage(1)
    onSearch?.("")
  }

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage))
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className={cn("bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm", className)}>
      {searchable && (
        <div className="p-3.5 sm:p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#7ADA3A] focus:ring-2 focus:ring-[#7ADA3A]/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="hidden sm:block">
            <span className="text-xs text-slate-500 font-medium bg-white px-2.5 py-1 rounded-lg border border-slate-200">
              Total: <strong>{filteredData.length}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider",
                    col.className
                  )}
                >
                  {col.label}
                </th>
              ))}
              {actions && (
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Aksi
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-4 py-12 text-center text-sm text-slate-400"
                >
                  <p className="font-medium text-slate-500">{emptyMessage}</p>
                  {searchQuery && (
                    <p className="text-xs text-slate-400 mt-1">Coba kata kunci pencarian yang lain.</p>
                  )}
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => (
                <tr
                  key={index}
                  className="hover:bg-[#7ADA3A]/5 transition-colors duration-100"
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn("px-4 py-3 text-sm text-slate-700", col.className)}>
                      {col.render ? col.render(item) : item[col.key]}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-right">
                      {actions(item)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="block md:hidden divide-y divide-slate-100">
        {paginatedData.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            <p className="font-medium text-slate-500">{emptyMessage}</p>
            {searchQuery && (
              <p className="text-xs text-slate-400 mt-1">Coba kata kunci pencarian yang lain.</p>
            )}
          </div>
        ) : (
          paginatedData.map((item, index) => (
            <div key={index} className="p-4 space-y-3 hover:bg-slate-50/50 transition-colors">
              <div className="space-y-2">
                {columns.map((col) => (
                  <div key={col.key} className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {col.label}
                    </span>
                    <div className="text-sm font-medium text-slate-800">
                      {col.render ? col.render(item) : item[col.key]}
                    </div>
                  </div>
                ))}
              </div>

              {actions && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                  {actions(item)}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/40">
          <p className="text-xs text-slate-500 text-center sm:text-left font-medium">
            Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{" "}
            {Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} data
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed bg-white text-slate-600 transition-colors"
              aria-label="Halaman Sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "w-7 h-7 rounded-lg text-xs font-semibold transition-all",
                  currentPage === page
                    ? "bg-[#7ADA3A] text-slate-900 shadow-sm font-bold border border-[#6ecb30]"
                    : "text-slate-600 hover:bg-white border border-transparent hover:border-slate-200"
                )}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed bg-white text-slate-600 transition-colors"
              aria-label="Halaman Selanjutnya"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
