import { NextResponse } from 'next/server'
import { db } from '@/db'
import { teamMember } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'
import { randomUUID } from 'crypto'

export async function GET() {
  try {
    const items = await db.select().from(teamMember).orderBy(asc(teamMember.sortOrder))
    return NextResponse.json({ items })
  } catch (error) {
    console.error('Failed to fetch team:', error)
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const newItem = await db.insert(teamMember).values({
      id: randomUUID(),
      name: body.name,
      role: body.role,
      origin: body.origin,
      bio: body.bio,
      quote: body.quote,
      image: body.image,
      sortOrder: body.sortOrder ?? 0,
      isPublished: body.isPublished ?? true,
      updatedAt: new Date(),
    }).returning()
    return NextResponse.json({ item: newItem[0] }, { status: 201 })
  } catch (error) {
    console.error('Failed to create team member:', error)
    return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const updated = await db.update(teamMember)
      .set({
        name: body.name,
        role: body.role,
        origin: body.origin,
        bio: body.bio,
        quote: body.quote,
        image: body.image,
        sortOrder: body.sortOrder,
        isPublished: body.isPublished,
        updatedAt: new Date(),
      })
      .where(eq(teamMember.id, body.id))
      .returning()
    return NextResponse.json({ item: updated[0] })
  } catch (error) {
    console.error('Failed to update team member:', error)
    return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.delete(teamMember).where(eq(teamMember.id, id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete team member:', error)
    return NextResponse.json({ error: 'Failed to delete team member' }, { status: 500 })
  }
}
