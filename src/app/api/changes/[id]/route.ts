import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { sessionChanges, sessionChangeFeedback } from '@/db/schema'
import { eq } from 'drizzle-orm'

// GET /api/changes/[id] - Get single change with feedback
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const [change] = await db.select().from(sessionChanges).where(eq(sessionChanges.id, id))

    if (!change) {
      return NextResponse.json({ error: 'Change not found' }, { status: 404 })
    }

    // Get associated feedback
    const feedback = await db.select().from(sessionChangeFeedback)
      .where(eq(sessionChangeFeedback.changeId, id))

    return NextResponse.json({ change, feedback })
  } catch (error) {
    console.error('Failed to fetch change:', error)
    return NextResponse.json({ error: 'Failed to fetch change' }, { status: 500 })
  }
}

// PATCH /api/changes/[id] - Update change (status, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const updated = await db.update(sessionChanges)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(sessionChanges.id, id))
      .returning()

    if (!updated.length) {
      return NextResponse.json({ error: 'Change not found' }, { status: 404 })
    }

    return NextResponse.json({ item: updated[0] })
  } catch (error) {
    console.error('Failed to update change:', error)
    return NextResponse.json({ error: 'Failed to update change' }, { status: 500 })
  }
}

// DELETE /api/changes/[id] - Delete change
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // First delete associated feedback
    await db.delete(sessionChangeFeedback).where(eq(sessionChangeFeedback.changeId, id))

    // Then delete the change
    await db.delete(sessionChanges).where(eq(sessionChanges.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete change:', error)
    return NextResponse.json({ error: 'Failed to delete change' }, { status: 500 })
  }
}
