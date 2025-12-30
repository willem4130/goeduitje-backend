import { NextResponse } from 'next/server'
import { db } from '@/db'
import { pageContent } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'crypto'

// Default site stats - organized by category
const DEFAULT_STATS = {
  // Jullie Ervaringen page stats
  companiesCount: '80+',
  activitiesCount: '200+',
  // Homepage social proof stats
  teamsCount: '150+',
  rebookRate: '95%',
  // Hero video KPI stats
  heroActivitiesCount: '41',
  heroParticipantsCount: '516',
  // USP badges (comma-separated)
  uspBadges: 'Maak sociale impact,Op locatie naar keuze,Op maat'
}

// GET - Fetch site stats (public endpoint)
export async function GET() {
  try {
    const items = await db.select()
      .from(pageContent)
      .where(eq(pageContent.page, 'site-stats'))

    // Build stats object from database, starting with defaults
    const stats: Record<string, string> = { ...DEFAULT_STATS }

    // Override with database values
    for (const item of items) {
      if (item.key in DEFAULT_STATS) {
        stats[item.key] = item.value
      }
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Failed to fetch site stats:', error)
    return NextResponse.json({ stats: DEFAULT_STATS })
  }
}

// PUT - Update site stats (admin only)
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { stats } = body as { stats: Record<string, string> }

    // Valid keys that can be updated
    const validKeys = Object.keys(DEFAULT_STATS)

    // Upsert each stat key
    for (const [key, value] of Object.entries(stats)) {
      if (!validKeys.includes(key)) continue

      const existing = await db.select()
        .from(pageContent)
        .where(and(
          eq(pageContent.page, 'site-stats'),
          eq(pageContent.section, 'public'),
          eq(pageContent.key, key)
        ))

      if (existing.length > 0) {
        await db.update(pageContent)
          .set({ value, updatedAt: new Date() })
          .where(eq(pageContent.id, existing[0].id))
      } else {
        await db.insert(pageContent).values({
          id: randomUUID(),
          page: 'site-stats',
          section: 'public',
          key,
          value,
          type: 'text',
          updatedAt: new Date()
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save site stats:', error)
    return NextResponse.json({ error: 'Failed to save site stats' }, { status: 500 })
  }
}
