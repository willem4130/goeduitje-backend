import { NextResponse } from 'next/server'
import { db } from '@/db'
import { shows } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

// GET all shows
export async function GET() {
  try {
    const allShows = await db.select().from(shows).orderBy(desc(shows.date))
    return NextResponse.json(allShows)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch shows' }, { status: 500 })
  }
}

// POST create new show
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Auto-calculate isPast
    const showDate = new Date(body.date)
    const isPast = showDate < new Date()

    const result = await db.insert(shows).values({
      ...body,
      isPast,
      createdAt: new Date().toISOString(),
    }).returning()

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create show' }, { status: 500 })
  }
}
