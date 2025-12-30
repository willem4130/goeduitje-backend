import { NextResponse } from 'next/server'
import { db } from '@/db'
import { pageContent } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'crypto'

// Default site stats
const DEFAULT_STATS = {
  companiesCount: '80+',
  activitiesCount: '200+'
}

// GET - Fetch site stats (public endpoint)
export async function GET() {
  try {
    const items = await db.select()
      .from(pageContent)
      .where(eq(pageContent.page, 'site-stats'))

    // Build stats object from database
    const stats = { ...DEFAULT_STATS }

    for (const item of items) {
      if (item.key === 'companiesCount') {
        stats.companiesCount = item.value
      } else if (item.key === 'activitiesCount') {
        stats.activitiesCount = item.value
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
    const { stats } = body as { stats: typeof DEFAULT_STATS }

    // Upsert companiesCount
    const existingCompanies = await db.select()
      .from(pageContent)
      .where(and(
        eq(pageContent.page, 'site-stats'),
        eq(pageContent.section, 'public'),
        eq(pageContent.key, 'companiesCount')
      ))

    if (existingCompanies.length > 0) {
      await db.update(pageContent)
        .set({ value: stats.companiesCount, updatedAt: new Date() })
        .where(eq(pageContent.id, existingCompanies[0].id))
    } else {
      await db.insert(pageContent).values({
        id: randomUUID(),
        page: 'site-stats',
        section: 'public',
        key: 'companiesCount',
        value: stats.companiesCount,
        type: 'text',
        updatedAt: new Date()
      })
    }

    // Upsert activitiesCount
    const existingActivities = await db.select()
      .from(pageContent)
      .where(and(
        eq(pageContent.page, 'site-stats'),
        eq(pageContent.section, 'public'),
        eq(pageContent.key, 'activitiesCount')
      ))

    if (existingActivities.length > 0) {
      await db.update(pageContent)
        .set({ value: stats.activitiesCount, updatedAt: new Date() })
        .where(eq(pageContent.id, existingActivities[0].id))
    } else {
      await db.insert(pageContent).values({
        id: randomUUID(),
        page: 'site-stats',
        section: 'public',
        key: 'activitiesCount',
        value: stats.activitiesCount,
        type: 'text',
        updatedAt: new Date()
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save site stats:', error)
    return NextResponse.json({ error: 'Failed to save site stats' }, { status: 500 })
  }
}
