import { NextResponse } from 'next/server'
import { db } from '@/db'
import { contactFeedback } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET() {
  try {
    const items = await db.select().from(contactFeedback).orderBy(desc(contactFeedback.createdAt))
    return NextResponse.json({ items })
  } catch (error) {
    console.error('Failed to fetch feedback:', error)
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const updated = await db.update(contactFeedback)
      .set({
        isRead: body.isRead,
        updatedAt: new Date(),
      })
      .where(eq(contactFeedback.id, body.id))
      .returning()
    return NextResponse.json({ item: updated[0] })
  } catch (error) {
    console.error('Failed to update feedback:', error)
    return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.delete(contactFeedback).where(eq(contactFeedback.id, id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete feedback:', error)
    return NextResponse.json({ error: 'Failed to delete feedback' }, { status: 500 })
  }
}
