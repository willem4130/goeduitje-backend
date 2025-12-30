import { NextResponse } from 'next/server'
import { db } from '@/db'
import { faq } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'
import { randomUUID } from 'crypto'

export async function GET() {
  try {
    const items = await db.select().from(faq).orderBy(asc(faq.sortOrder))
    return NextResponse.json({ items })
  } catch (error) {
    console.error('Failed to fetch FAQ:', error)
    return NextResponse.json({ error: 'Failed to fetch FAQ' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const newItem = await db.insert(faq).values({
      id: randomUUID(),
      question: body.question,
      answer: body.answer,
      category: body.category,
      sortOrder: body.sortOrder ?? 0,
      isPublished: body.isPublished ?? true,
      updatedAt: new Date(),
    }).returning()
    return NextResponse.json({ item: newItem[0] }, { status: 201 })
  } catch (error) {
    console.error('Failed to create FAQ:', error)
    return NextResponse.json({ error: 'Failed to create FAQ' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const updated = await db.update(faq)
      .set({
        question: body.question,
        answer: body.answer,
        category: body.category,
        sortOrder: body.sortOrder,
        isPublished: body.isPublished,
        updatedAt: new Date(),
      })
      .where(eq(faq.id, body.id))
      .returning()
    return NextResponse.json({ item: updated[0] })
  } catch (error) {
    console.error('Failed to update FAQ:', error)
    return NextResponse.json({ error: 'Failed to update FAQ' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.delete(faq).where(eq(faq.id, id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete FAQ:', error)
    return NextResponse.json({ error: 'Failed to delete FAQ' }, { status: 500 })
  }
}
