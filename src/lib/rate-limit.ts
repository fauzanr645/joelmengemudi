interface RateLimitRecord {
  count: number
  resetTime: number
}

const store = new Map<string, RateLimitRecord>()

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

export function checkRateLimit(
  identifier: string,
  limit: number = 60,
  windowMs: number = 60_000
): RateLimitResult {
  const now = Date.now()
  const record = store.get(identifier)

  if (!record || now > record.resetTime) {

    const resetTime = now + windowMs
    store.set(identifier, { count: 1, resetTime })
    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetTime,
    }
  }

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

