import { Sidebar } from "@/components/ui/sidebar"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  GraduationCap,
  Wrench,
} from "lucide-react"
import { PushPermissionBanner } from "@/components/push-permission-banner"

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user || (session.user as any).role !== "INSTRUCTOR") {
    redirect("/login")
  }

  const items = [
    { label: "Dashboard", href: "/instructor", icon: <LayoutDashboard size={20} /> },
    { label: "Jadwal", href: "/instructor/schedules", icon: <Calendar size={20} /> },
    { label: "Penilaian", href: "/instructor/evaluations", icon: <ClipboardList size={20} /> },
    { label: "Siswa", href: "/instructor/students", icon: <GraduationCap size={20} /> },
    { label: "Lapor Mobil", href: "/instructor/vehicle-reports", icon: <Wrench size={20} /> },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        items={items}
        role={(session.user as any).role}
        userName={session.user.name || "Instruktur"}
        branchName={(session.user as any).branchName}
      />
      <main className="lg:pl-64 min-h-screen pt-14 lg:pt-0 pb-20 lg:pb-0">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          <PushPermissionBanner />
          {children}
        </div>
      </main>
    </div>
  )
}
