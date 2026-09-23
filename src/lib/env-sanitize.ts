/**
 * Memastikan semua environment variable Auth/URL memiliki format protocol valid (https://)
 * Mencegah TypeError [ERR_INVALID_URL]: Invalid URL saat NextAuth memproses reqWithEnvURL di Vercel.
 */
function sanitizeUrl(val?: string): string | undefined {
  if (!val) return undefined
  let s = String(val).trim().replace(/^["']|["']$/g, "")
  if (!s || s === "undefined" || s === "null") return undefined

  if (!s.startsWith("http://") && !s.startsWith("https://")) {
    s = `https://${s.replace(/^\/+/, "")}`
  }

  try {
    const parsed = new URL(s)
    return parsed.origin
  } catch {
    return undefined
  }
}

// 1. Sanitasi NEXTAUTH_URL
const cleanNextAuth = sanitizeUrl(process.env.NEXTAUTH_URL)
if (cleanNextAuth) {
  process.env.NEXTAUTH_URL = cleanNextAuth
} else if (process.env.NEXTAUTH_URL) {
  delete process.env.NEXTAUTH_URL
}

// 2. Sanitasi AUTH_URL
const cleanAuth = sanitizeUrl(process.env.AUTH_URL)
if (cleanAuth) {
  process.env.AUTH_URL = cleanAuth
} else if (process.env.AUTH_URL) {
  delete process.env.AUTH_URL
}

// 3. Fallback AUTH_SECRET dari NEXTAUTH_SECRET
if (!process.env.AUTH_SECRET && process.env.NEXTAUTH_SECRET) {
  process.env.AUTH_SECRET = process.env.NEXTAUTH_SECRET
}

// 4. Force AUTH_TRUST_HOST true untuk Vercel Serverless
process.env.AUTH_TRUST_HOST = "true"

export {}
