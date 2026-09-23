interface RateLimitRecord {
  count: number
  resetTime: number
}

// In-memory store for rate limiting
const store = new Map<string, RateLimitRecord>()

// Periodic cleanup every 5 minutes to prevent memory leak
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetTime: number
}

/**
 * Memeriksa apakah request dari identifier (IP atau userId) masih dalam batas rate limit.
 * @param identifier Kunci unik (contoh: "login:192.168.1.1" atau "upload:user-id")
 * @param limit Batas maksimal request dalam jendela waktu
 * @param windowMs Durasi jendela waktu dalam milidetik (contoh: 60_000 untuk 1 menit)
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 60,
  windowMs: number = 60_000
): RateLimitResult {
  const now = Date.now()
  const record = store.get(identifier)

  if (!record || now > record.resetTime) {
    // Buat jendela baru
    const resetTime = now + windowMs
    store.set(identifier, { count: 1, resetTime })
    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetTime,
    }
  }

  // Jendela masih berjalan
  if (record.count >= limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetTime: record.resetTime,
    }
  }

  record.count += 1
  return {
    allowed: true,
    limit,
    remaining: limit - record.count,
    resetTime: record.resetTime,
  }
}

/**
 * Ekstrak IP klien dari header request Next.js
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  const realIp = request.headers.get("x-real-ip")
  if (realIp) {
    return realIp.trim()
  }
  return "127.0.0.1"
}
