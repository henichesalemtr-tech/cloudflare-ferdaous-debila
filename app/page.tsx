import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { settings } from '@/db/schemas/schema'
import { eq } from 'drizzle-orm'
import LandingPage from '@/components/LandingPage'

export default async function Home() {
  const session = await getSession()

  // If logged in → go to dashboard immediately
  if (session) {
    redirect('/dashboard')
  }

  // Check if landing page is enabled
  const [row] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, 'landing_enabled'))
    .limit(1)

  const landingEnabled = row?.value === 'true'

  if (!landingEnabled) {
    redirect('/login')
  }

  return <LandingPage />
}
