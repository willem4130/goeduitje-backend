import { NextResponse } from 'next/server'
import { db } from '@/db'
import { pageContent } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'
import { randomUUID } from 'crypto'

export async function GET() {
  try {
    const items = await db.select().from(pageContent).orderBy(asc(pageContent.page), asc(pageContent.section), asc(pageContent.key))
    return NextResponse.json({ items })
  } catch (error) {
    console.error('Failed to fetch page content:', error)
    return NextResponse.json({ error: 'Failed to fetch page content' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const newItem = await db.insert(pageContent).values({
      id: randomUUID(),
      page: body.page,
      section: body.section,
      key: body.key,
      value: body.value,
      type: body.type ?? 'text',
      updatedAt: new Date(),
    }).returning()
    return NextResponse.json({ item: newItem[0] }, { status: 201 })
  } catch (error) {
    console.error('Failed to create page content:', error)
    return NextResponse.json({ error: 'Failed to create page content' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const updated = await db.update(pageContent)
      .set({
        page: body.page,
        section: body.section,
        key: body.key,
        value: body.value,
        type: body.type,
        updatedAt: new Date(),
      })
      .where(eq(pageContent.id, body.id))
      .returning()
    return NextResponse.json({ item: updated[0] })
  } catch (error) {
    console.error('Failed to update page content:', error)
    return NextResponse.json({ error: 'Failed to update page content' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.delete(pageContent).where(eq(pageContent.id, id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete page content:', error)
    return NextResponse.json({ error: 'Failed to delete page content' }, { status: 500 })
  }
}
