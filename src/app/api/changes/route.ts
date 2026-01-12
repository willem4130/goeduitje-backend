import { NextResponse } from 'next/server'
import { db } from '@/db'
import { sessionChanges } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'
import { randomUUID } from 'crypto'

// GET /api/changes - Get all changes
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let items
    if (status && status !== 'all') {
      items = await db.select().from(sessionChanges)
        .where(eq(sessionChanges.status, status as 'pending' | 'approved' | 'needs_changes' | 'in_progress'))
        .orderBy(asc(sessionChanges.createdAt))
    } else {
      items = await db.select().from(sessionChanges).orderBy(asc(sessionChanges.createdAt))
    }

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Failed to fetch changes:', error)
    return NextResponse.json({ error: 'Failed to fetch changes' }, { status: 500 })
  }
}

// POST /api/changes - Create new change
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const newItem = await db.insert(sessionChanges).values({
      id: randomUUID(),
      title: body.title,
      description: body.description,
      category: body.category,
      filesChanged: body.filesChanged || [],
      changeDetails: body.changeDetails || [],
      viewUrl: body.viewUrl,
      status: body.status || 'pending',
      addedBy: body.addedBy || 'developer',
      updatedAt: new Date(),
    }).returning()
    return NextResponse.json({ item: newItem[0] }, { status: 201 })
  } catch (error) {
    console.error('Failed to create change:', error)
    return NextResponse.json({ error: 'Failed to create change' }, { status: 500 })
  }
}
