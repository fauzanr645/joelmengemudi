import { clsx, type ClassValue } from "clsx"

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return ""
  let clean = phone.replace(/\D/g, "")
  if (clean.startsWith("0")) {
    clean = "62" + clean.slice(1)
  }
  return clean
}

export function getWhatsAppLink(phone: string | null | undefined, message: string): string {
  const cleanPhone = formatPhoneNumber(phone)
  if (!cleanPhone) return "#"
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}

export const roleLabels: Record<string, string> = {
  OWNER: "Owner",
  CUSTOMER_SERVICE: "Customer Service",
  INSTRUCTOR: "Instruktur",
  STUDENT: "Siswa",
}

export const courseTypeLabels: Record<string, string> = {
  MANUAL: "Manual",
  AUTOMATIC: "Matic",
  BOTH: "Manual & Matic",
}

export const paymentStatusLabels: Record<string, string> = {
  PENDING: "Menunggu Konfirmasi",
  CONFIRMED: "Dikonfirmasi",
  REJECTED: "Ditolak",
  REFUNDED: "Dikembalikan",
}

export const scheduleStatusLabels: Record<string, string> = {
  SCHEDULED: "Terjadwal",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
  RESCHEDULED: "Dijadwal Ulang",
}

export const courseStatusLabels: Record<string, string> = {
  ACTIVE: "Aktif",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
  SUSPENDED: "Ditangguhkan",
}

export const lessonTypeLabels: Record<string, string> = {
  THEORY: "Teori",
  PRACTICE: "Praktik",
  EXAM: "Ujian",
}
