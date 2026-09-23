import { Sidebar } from "@/components/ui/sidebar"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import {
  LayoutDashboard,
  Building2,
  Users,
  Car,
  Settings,
  GraduationCap,
  UserCheck,
  Headset,
  BookOpen,
  Wrench,
  Award,
} from "lucide-react"
import { PushPermissionBanner } from "@/components/push-permission-banner"

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user || (session.user as any).role !== "OWNER") {
    redirect("/login")
  }

  const items = [
    { label: "Dashboard", href: "/owner", icon: <LayoutDashboard size={20} /> },
    { label: "Cabang", href: "/owner/branches", icon: <Building2 size={20} /> },
    { label: "Paket Kursus", href: "/owner/courses", icon: <BookOpen size={20} /> },
    { label: "Customer Service", href: "/owner/staff", icon: <Headset size={20} /> },
    { label: "Instruktur", href: "/owner/instructors", icon: <UserCheck size={20} /> },
    { label: "Siswa", href: "/owner/students", icon: <GraduationCap size={20} /> },
    { label: "Kendaraan", href: "/owner/vehicles", icon: <Car size={20} /> },
    { label: "Layanan SIM", href: "/owner/sim-services", icon: <Award size={20} /> },
    { label: "Servis Mobil", href: "/owner/vehicle-reports", icon: <Wrench size={20} /> },
    { label: "Pengaturan", href: "/owner/settings", icon: <Settings size={20} /> },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        items={items}
        role={(session.user as any).role}
        userName={session.user.name || "Owner"}
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
