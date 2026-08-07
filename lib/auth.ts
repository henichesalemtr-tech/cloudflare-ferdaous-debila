import { cookies } from 'next/headers'
import { cache } from 'react'
import { db } from '@/db'
import { users, roles } from '@/db/schemas/schema'
import { eq } from 'drizzle-orm'

export type SessionUser = {
  id: number
  /** الأدوار الأساسية: admin | teacher | guardian — أو أي دور مخصص */
  role: string
  username: string
  fullName: string | null
  teacherId?: number | null
  status?: string
}

/**
 * Load the live user row for a session id.
 * Cached per request (React `cache`) so multiple getSession() calls in the
 * same request only hit the database once.
 */
const loadLiveUser = cache(async (userId: number) => {
  try {
    const [row] = await db
      .select({
        id: users.id,
        role: users.role,
        username: users.username,
        fullName: users.fullName,
        teacherId: users.teacherId,
        status: users.status,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
    return row ?? null
  } catch {
    return null
  }
})

/** Live permissions for a role name (cached per request). */
export const getRolePermissions = cache(async (roleName: string): Promise<string[]> => {
  try {
    const [row] = await db
      .select({ permissions: roles.permissions })
      .from(roles)
      .where(eq(roles.name, roleName))
      .limit(1)
    if (!row?.permissions) return []
    const parsed = JSON.parse(row.permissions)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
})

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')
    if (!sessionCookie?.value) return null
    const data = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString())
    if (!data?.id) return null

    const session = data as SessionUser

    // ── Refresh role / status / teacherId from the database ──────────────
    // The session cookie is a snapshot taken at login time. Without this
    // refresh, changing a user's role (or disabling the account) would only
    // take effect after a re-login.
    const live = await loadLiveUser(session.id)
    if (!live) return session          // DB unreachable → fall back to cookie
    if (live.status && live.status !== 'active') return null  // disabled account

    return {
      ...session,
      role: live.role,
      username: live.username ?? session.username,
      fullName: live.fullName ?? session.fullName,
      teacherId: live.teacherId ?? null,
      status: live.status,
    }
  } catch {
    return null
  }
}

export function createSessionToken(user: SessionUser): string {
  return Buffer.from(JSON.stringify(user)).toString('base64')
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashed = await hashPassword(password)
  return hashed === hash
}
