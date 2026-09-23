import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { PwaProvider } from "@/components/pwa-provider"

const inter = Inter({ subsets: ["latin"] })

export const viewport: Viewport = {
  themeColor: "#7ADA3A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: "joelmengemudi - Kursus Mengemudi",
  description: "Aplikasi manajemen kursus mengemudi resmi joelmengemudi untuk siswa, instruktur, customer service, dan owner.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "joelmengemudi",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/apple-touch-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="joelmengemudi" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className={`${inter.className} antialiased selection:bg-[#7ADA3A]/30 selection:text-slate-900`}>
        <PwaProvider>{children}</PwaProvider>
      </body>
    </html>
  )
}
