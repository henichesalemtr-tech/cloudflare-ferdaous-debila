import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { registrationRequests, students, settings } from '@/db/schemas/schema'
import { eq, desc } from 'drizzle-orm'
import { getSession } from '@/lib/auth'

// GET — list all (admin only)
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const rows = await db.select().from(registrationRequests).orderBy(desc(registrationRequests.createdAt))
    return NextResponse.json(rows)
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

// POST — public, no auth required — submit registration request
export async function POST(req: NextRequest) {
  try {
    // Check if online registration is enabled
    const [setting] = await db.select().from(settings).where(eq(settings.key, 'online_registration_enabled')).limit(1)
    if (setting?.value === 'false') {
      return NextResponse.json({ error: 'registration_closed' }, { status: 403 })
    }
  
    const body = await req.json()
    const { firstName, lastName, gender, birthDate, birthPlace, address, phone,
      educationalLevel, guardianName, guardianPhone, guardianRelation, guardianEmail, notes } = body
  
    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'الاسم الأول والأخير مطلوبان' }, { status: 400 })
    }
  
    const [created] = await db.insert(registrationRequests).values({
      firstName, lastName, gender: gender ?? null,
      birthDate: birthDate ?? null, birthPlace: birthPlace ?? null,
      address: address ?? null, phone: phone ?? null,
      educationalLevel: educationalLevel ?? null,
      guardianName: guardianName ?? null, guardianPhone: guardianPhone ?? null,
      guardianRelation: guardianRelation ?? null, guardianEmail: guardianEmail ?? null,
      notes: notes ?? null, status: 'pending',
    }).returning()
  
    return NextResponse.json(created, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
