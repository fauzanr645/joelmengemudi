import { Sidebar } from "@/components/ui/sidebar"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import {
  LayoutDashboard,
  GraduationCap,
  Calendar,
  CreditCard,
  BookOpen,
  UserCheck,
  Settings,
  Wrench,
  Award,
} from "lucide-react"
import { PushPermissionBanner } from "@/components/push-permission-banner"

export default async function CSLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user || (session.user as any).role !== "CUSTOMER_SERVICE") {
    redirect("/login")
  }

  const items = [
    { label: "Dashboard", href: "/cs", icon: <LayoutDashboard size={20} /> },
    { label: "Siswa", href: "/cs/students", icon: <GraduationCap size={20} /> },
    { label: "Pendaftaran", href: "/cs/enrollments", icon: <BookOpen size={20} /> },
    { label: "Jadwal Siswa", href: "/cs/schedules", icon: <Calendar size={20} /> },
    { label: "Jadwal Instruktur", href: "/cs/instructors", icon: <UserCheck size={20} /> },
    { label: "Kendala Mobil", href: "/cs/vehicle-reports", icon: <Wrench size={20} /> },
    { label: "Layanan SIM", href: "/cs/sim-services", icon: <Award size={20} /> },
    { label: "Pembayaran", href: "/cs/payments", icon: <CreditCard size={20} /> },
    { label: "Pengaturan Akun Siswa", href: "/cs/settings", icon: <Settings size={20} /> },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        items={items}
        role={(session.user as any).role}
        userName={session.user.name || "CS"}
        branchName={(session.user as any).branchName}
      />
      <main className="lg:pl-64 min-h-screen pt-14 lg:pt-0">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          <PushPermissionBanner />
          {children}
        </div>
      </main>
    </div>
  )
}
