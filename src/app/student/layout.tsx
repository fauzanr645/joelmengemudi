import { Sidebar } from "@/components/ui/sidebar"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import {
  LayoutDashboard,
  Calendar,
  CreditCard,
  BookOpen,
  Award,
} from "lucide-react"
import { StudentFloatingWA } from "@/components/student-floating-wa"
import { PushPermissionBanner } from "@/components/push-permission-banner"

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user || (session.user as any).role !== "STUDENT") {
    redirect("/login")
  }

  const items = [
    { label: "Dashboard", href: "/student", icon: <LayoutDashboard size={20} /> },
    { label: "Kursus", href: "/student/courses", icon: <BookOpen size={20} /> },
    { label: "Jadwal", href: "/student/schedules", icon: <Calendar size={20} /> },
    { label: "Pembayaran", href: "/student/payments", icon: <CreditCard size={20} /> },
    { label: "Layanan SIM", href: "/student/sim-services", icon: <Award size={20} /> },
  ]

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <Sidebar
        items={items}
        role={(session.user as any).role}
        userName={session.user.name || "Siswa"}
        branchName={(session.user as any).branchName}
      />
      <main className="lg:pl-64 min-h-screen pt-14 lg:pt-0 pb-20 lg:pb-0">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          <PushPermissionBanner />
          {children}
        </div>
      </main>

      {/* Floating WA Chat to CS */}
      <StudentFloatingWA
        studentName={session.user.name || "Siswa"}
        branchName={(session.user as any).branchName}
      />
    </div>
  )
}
