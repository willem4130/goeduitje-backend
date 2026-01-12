import { NextRequest, NextResponse } from 'next/server'
import { del } from '@vercel/blob'
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

// PATCH /api/changes/[id] - Update change (status, restore, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Handle restore action
    if (body.restore === true) {
      const updated = await db.update(sessionChanges)
        .set({
          deletedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(sessionChanges.id, id))
        .returning()

      if (!updated.length) {
        return NextResponse.json({ error: 'Change not found' }, { status: 404 })
      }

      return NextResponse.json({ item: updated[0], restored: true })
    }

    // Regular update
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

// DELETE /api/changes/[id] - Soft delete or permanent delete
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const permanent = searchParams.get('permanent') === 'true'

    // Get the change first
    const [change] = await db.select().from(sessionChanges).where(eq(sessionChanges.id, id))
    if (!change) {
      return NextResponse.json({ error: 'Change not found' }, { status: 404 })
    }

    if (permanent) {
      // Permanent delete - remove from database
      // Delete all screenshots from Blob
      if (change.screenshotUrls && change.screenshotUrls.length > 0) {
        for (const url of change.screenshotUrls) {
          try {
            await del(url)
          } catch (e) {
            console.error('Failed to delete blob:', e)
          }
        }
      }

      // Delete associated feedback and their screenshots
      const feedbacks = await db.select().from(sessionChangeFeedback)
        .where(eq(sessionChangeFeedback.changeId, id))

      for (const fb of feedbacks) {
        if (fb.screenshotUrls && fb.screenshotUrls.length > 0) {
          for (const url of fb.screenshotUrls) {
            try {
              await del(url)
            } catch (e) {
              console.error('Failed to delete feedback blob:', e)
            }
          }
        }
      }

      await db.delete(sessionChangeFeedback).where(eq(sessionChangeFeedback.changeId, id))
      await db.delete(sessionChanges).where(eq(sessionChanges.id, id))

      return NextResponse.json({ success: true, permanent: true })
    } else {
      // Soft delete - just set deletedAt timestamp
      await db.update(sessionChanges)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(sessionChanges.id, id))

      return NextResponse.json({ success: true, softDeleted: true })
    }
  } catch (error) {
    console.error('Failed to delete change:', error)
    return NextResponse.json({ error: 'Failed to delete change' }, { status: 500 })
  }
}
