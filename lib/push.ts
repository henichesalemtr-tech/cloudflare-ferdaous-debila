/**
 * lib/push.ts
 * ─────────────────────────────────────────────────────────────────
 * Shared, NON-FATAL Web Push helper.
 *
 * Rules:
 *  - Never throws. Any failure (missing VAPID, dead endpoint, network)
 *    is swallowed so that saving in-app notifications / messages is
 *    never blocked by push delivery.
 *  - Expired endpoints (410 / 404) are cleaned up automatically.
 *  - Deep-link URL is resolved per recipient role: staff → /notifications,
 *    guardians → /guardian-dashboard.
 */

import { db } from '@/db'
import { pushSubscriptions, users } from '@/db/schemas/schema'
import { eq, inArray } from 'drizzle-orm'
import { getVapidConfig } from '@/lib/vapid'

export type PushResult = { sent: number; failed: number; cleaned: number; total: number }

const EMPTY: PushResult = { sent: 0, failed: 0, cleaned: 0, total: 0 }

/** Resolve target user IDs from a notification targetType/targetIds pair. */
export async function resolvePushTargets(
  targetType: string,
  targetIds?: number[] | null,
): Promise<number[] | null> {
  if (targetType === 'teachers') {
    const rows = await db.select({ id: users.id }).from(users).where(eq(users.role, 'teacher'))
    return rows.map(r => r.id)
  }
  if (targetType === 'guardians') {
    const rows = await db.select({ id: users.id }).from(users).where(eq(users.role, 'guardian'))
    return rows.map(r => r.id)
  }
  if (targetType === 'specific') {
    return (targetIds ?? []).map(Number).filter(Boolean)
  }
  return null // all
}

/**
 * Send a push notification to the given user IDs (null = every subscription).
 * Guardians are deep-linked to their own portal, everyone else to /notifications.
 */
export async function sendPushToUsers(
  userIds: number[] | null,
  title: string,
  body: string,
  opts: { url?: string; guardianUrl?: string; icon?: string } = {},
): Promise<PushResult> {
  try {
    if (Array.isArray(userIds) && userIds.length === 0) return EMPTY

    let vapid: ReturnType<typeof getVapidConfig>
    try {
      vapid = getVapidConfig()
    } catch {
      return EMPTY // Web Push not configured — silently skip
    }

    const webpush = (await import('web-push')).default
    webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey)

    // Subscriptions (batched — single query)
    const subs = userIds === null
      ? await db.select({
          userId: pushSubscriptions.userId,
          endpoint: pushSubscriptions.endpoint,
          p256dh: pushSubscriptions.p256dh,
          auth: pushSubscriptions.auth,
        }).from(pushSubscriptions)
      : await db.select({
          userId: pushSubscriptions.userId,
          endpoint: pushSubscriptions.endpoint,
          p256dh: pushSubscriptions.p256dh,
          auth: pushSubscriptions.auth,
        }).from(pushSubscriptions).where(inArray(pushSubscriptions.userId, userIds))

    if (subs.length === 0) return EMPTY

    // Roles for deep-link resolution (batched — single query)
    const subUserIds = [...new Set(subs.map(s => s.userId).filter((id): id is number => id !== null))]
    const roleRows = subUserIds.length > 0
      ? await db.select({ id: users.id, role: users.role }).from(users).where(inArray(users.id, subUserIds))
      : []
    const roleById = new Map(roleRows.map(r => [r.id, r.role]))

    const staffUrl = opts.url ?? '/notifications'
    const guardianUrl = opts.guardianUrl ?? '/guardian-dashboard'
    const icon = opts.icon ?? '/icon-192x192.png'
    const tag = `ferdous-${Date.now()}`
    const expired: string[] = []

    const results = await Promise.allSettled(subs.map(sub => {
      const url = roleById.get(sub.userId ?? -1) === 'guardian' ? guardianUrl : staffUrl
      const payload = JSON.stringify({
        title, body,
        icon, badge: '/icon-192x192.png',
        dir: 'rtl', lang: 'ar',
        data: { url, tag },
      })
      return webpush
        .sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
          { TTL: 86400 },
        )
        .catch((e: { statusCode?: number }) => {
          if (e?.statusCode === 410 || e?.statusCode === 404) expired.push(sub.endpoint)
          throw e
        })
    }))

    if (expired.length > 0) {
      await Promise.allSettled(expired.map(ep =>
        db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, ep))
      ))
    }

    const sent = results.filter(r => r.status === 'fulfilled').length
    return { sent, failed: results.length - sent, cleaned: expired.length, total: subs.length }
  } catch {
    return EMPTY // never block the caller
  }
}

/** Same as sendPushToUsers but skips one user (e.g. the sender). */
export async function sendPushToUsersExcluding(
  userIds: number[] | null,
  excludeUserId: number,
  title: string,
  body: string,
  opts: { url?: string; guardianUrl?: string; icon?: string } = {},
): Promise<PushResult> {
  if (userIds === null) return sendPushToUsers(null, title, body, opts)
  return sendPushToUsers(userIds.filter(id => id !== excludeUserId), title, body, opts)
}
