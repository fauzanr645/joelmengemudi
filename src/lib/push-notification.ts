import webpush from "web-push"
import prisma from "@/lib/prisma"

// Inisialisasi VAPID keys untuk Web Push ke perangkat
const vapidPublicKey =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BMarwauV9nlSh4yO2Bx_4JgR4nV3DT8DqeR1KtOL_PUAax2HfSG0cjC5MAUQrfs4JuT6WV6KOqQHbLZAclsBt8A"
const vapidPrivateKey =
  process.env.VAPID_PRIVATE_KEY || "6eesbo97fovZAWf7m5HbPqnEXVdhVpdrM6YHimmO-Ik"
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@joelmengemudi.com"

try {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
} catch (e) {
  console.warn("Failed to set VAPID details:", e)
}

export type NotificationTypeEnum =
  | "PAYMENT"
  | "SCHEDULE"
  | "RESCHEDULE"
  | "VEHICLE_REPORT"
  | "SIM_SERVICE"
  | "ENROLLMENT"
  | "SYSTEM"

export interface SendNotificationPayload {
  title: string
  message: string
  type?: NotificationTypeEnum
  link?: string
  icon?: string
}

/**
 * Kirim notifikasi ke satu pengguna (simpan di database + kirim Web Push ke semua perangkat terdaftar)
 */
export async function sendNotificationToUser(
  userId: string,
  payload: SendNotificationPayload
) {
  try {
    // 1. Simpan ke database
    const notification = await prisma.notification.create({
      data: {
        userId,
        title: payload.title,
        message: payload.message,
        type: payload.type || "SYSTEM",
        link: payload.link || null,
      },
    })

    // 2. Ambil seluruh device subscriptions milik user ini
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    })

    if (subscriptions.length === 0) {
      return notification
    }

    // 3. Kirim Web Push payload ke setiap perangkat
    const pushPayload = JSON.stringify({
      id: notification.id,
      title: payload.title,
      body: payload.message,
      link: payload.link || "/",
      type: payload.type || "SYSTEM",
      icon: payload.icon || "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
    })

    const staleEndpoints: string[] = []

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            pushPayload
          )
        } catch (err: any) {
          // Jika subscription sudah expired / uninstalled di perangkat (HTTP 410 atau 404)
          if (err.statusCode === 410 || err.statusCode === 404) {
            staleEndpoints.push(sub.endpoint)
          } else {
            console.error("Web Push sending error:", err.message)
          }
        }
      })
    )

    // 4. Bersihkan subscription yang sudah mati
    if (staleEndpoints.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: { endpoint: { in: staleEndpoints } },
      })
    }

    return notification
  } catch (error) {
    console.error("sendNotificationToUser error:", error)
    return null
  }
}

/**
 * Kirim notifikasi berdasarkan role & cabang:
 * - OWNER: ke semua Owner
 * - CUSTOMER_SERVICE: ke CS cabang tertentu (atau seluruh CS)
 * - INSTRUCTOR: ke Instruktur
 */
export async function sendNotificationToRole(
  role: "OWNER" | "CUSTOMER_SERVICE" | "INSTRUCTOR" | "STUDENT",
  branchId: string | null | undefined,
  payload: SendNotificationPayload
) {
  try {
    const where: any = { role, isActive: true }
    if (branchId && role !== "OWNER") {
      where.branchId = branchId
    }

    const users = await prisma.user.findMany({
      where,
      select: { id: true },
    })

    return await Promise.all(
      users.map((u) => sendNotificationToUser(u.id, payload))
    )
  } catch (error) {
    console.error("sendNotificationToRole error:", error)
    return []
  }
}
