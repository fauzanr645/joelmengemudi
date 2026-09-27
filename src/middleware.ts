import "@/lib/env-sanitize"
import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

export default auth((req) => {
  try {
    const { pathname } = req.nextUrl
    const isLoggedIn = !!req.auth
    const userRole = (req.auth?.user as any)?.role

    const redirectTo = (path: string, callback?: string) => {
      const targetUrl = req.nextUrl.clone()
      targetUrl.pathname = path
      targetUrl.search = ""
      if (callback) {
        targetUrl.searchParams.set("callbackUrl", callback)
      }
      return NextResponse.redirect(targetUrl)
    }

    if (pathname.startsWith("/api/")) {
      const ip = getClientIp(req)
      const rateLimit = checkRateLimit(`api-flood:${ip}`, 180, 60_000)
      if (!rateLimit.allowed) {
        return NextResponse.json(
          { error: "Terlalu banyak permintaan API. Harap tunggu beberapa saat." },
          { status: 429 }
        )
      }
    }

    if (
      pathname === "/" ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/api/auth") ||
      pathname.startsWith("/images") ||
      pathname.startsWith("/icons") ||
      pathname.startsWith("/uploads") ||
      pathname.endsWith(".webp") ||
      pathname.endsWith(".png") ||
      pathname.endsWith(".ico") ||
      pathname.endsWith(".json") ||
      pathname.endsWith(".js") ||
      pathname.endsWith(".html")
    ) {

      if (isLoggedIn && pathname === "/login") {
        if (userRole === "OWNER") return redirectTo("/owner")
        if (userRole === "CUSTOMER_SERVICE") return redirectTo("/cs")
        if (userRole === "INSTRUCTOR") return redirectTo("/instructor")
        if (userRole === "STUDENT") return redirectTo("/student")
      }
      return NextResponse.next()
    }

    if (!isLoggedIn) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      return redirectTo("/login", pathname)
    }

    const getRoleDashboard = (role: string) => {
      switch (role) {
        case "OWNER":
          return "/owner"
        case "CUSTOMER_SERVICE":
          return "/cs"
        case "INSTRUCTOR":
          return "/instructor"
        case "STUDENT":
          return "/student"
        default:
          return "/"
      }
    }

    if (pathname.startsWith("/owner") && userRole !== "OWNER") {
      return redirectTo(getRoleDashboard(userRole))
    }

    if (pathname.startsWith("/cs") && userRole !== "CUSTOMER_SERVICE" && userRole !== "OWNER") {
      return redirectTo(getRoleDashboard(userRole))
    }

    if (
      pathname.startsWith("/instructor") &&
      userRole !== "INSTRUCTOR" &&
      userRole !== "OWNER"
    ) {
      return redirectTo(getRoleDashboard(userRole))
    }

    if (pathname.startsWith("/student") && userRole !== "STUDENT" && userRole !== "OWNER") {
      return redirectTo(getRoleDashboard(userRole))
    }

    return NextResponse.next()
  } catch (err) {
    console.error("Middleware error caught safely:", err)
    return NextResponse.next()
  }
})

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|js)$).*)",
  ],
}

