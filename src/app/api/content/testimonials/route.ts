import { NextResponse } from 'next/server'
import { db } from '@/db'
import { testimonial } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { randomUUID } from 'crypto'

export async function GET() {
  try {
    const items = await db.select().from(testimonial).orderBy(desc(testimonial.createdAt))
    return NextResponse.json({ items })
  } catch (error) {
    console.error('Failed to fetch testimonials:', error)
    return NextResponse.json({ error: 'Failed to fetch testimonials' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const newItem = await db.insert(testimonial).values({
      id: randomUUID(),
      quote: body.quote,
      author: body.author,
      role: body.role,
      company: body.company,
      rating: body.rating ?? 5,
      image: body.image,
      isFeatured: body.isFeatured ?? false,
      isPublished: body.isPublished ?? true,
      updatedAt: new Date(),
    }).returning()
    return NextResponse.json({ item: newItem[0] }, { status: 201 })
  } catch (error) {
    console.error('Failed to create testimonial:', error)
    return NextResponse.json({ error: 'Failed to create testimonial' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const updated = await db.update(testimonial)
      .set({
        quote: body.quote,
        author: body.author,
        role: body.role,
        company: body.company,
        rating: body.rating,
        image: body.image,
        isFeatured: body.isFeatured,
        isPublished: body.isPublished,
        updatedAt: new Date(),
      })
      .where(eq(testimonial.id, body.id))
      .returning()
    return NextResponse.json({ item: updated[0] })
  } catch (error) {
    console.error('Failed to update testimonial:', error)
    return NextResponse.json({ error: 'Failed to update testimonial' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.delete(testimonial).where(eq(testimonial.id, id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete testimonial:', error)
    return NextResponse.json({ error: 'Failed to delete testimonial' }, { status: 500 })
  }
}
