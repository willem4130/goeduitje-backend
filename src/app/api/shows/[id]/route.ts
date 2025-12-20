import { NextResponse } from 'next/server'
import { db } from '@/db'
import { shows } from '@/db/schema'
import { eq } from 'drizzle-orm'

// GET single show
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const show = await db.select().from(shows).where(eq(shows.id, parseInt(id))).limit(1)

  if (!show.length) {
    return NextResponse.json({ error: 'Show not found' }, { status: 404 })
  }

  return NextResponse.json(show[0])
}

// PUT update show
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()

  // Auto-calculate isPast
  const showDate = new Date(body.date)
  const isPast = showDate < new Date()

  const result = await db.update(shows)
    .set({ ...body, isPast })
    .where(eq(shows.id, parseInt(id)))
    .returning()

  return NextResponse.json(result[0])
}

// DELETE show
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.delete(shows).where(eq(shows.id, parseInt(id)))

  return NextResponse.json({ success: true })
}
