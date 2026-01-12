import { NextRequest, NextResponse } from 'next/server'
import { put, del } from '@vercel/blob'
import { db } from '@/db'
import { sessionChangeFeedback } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { randomUUID } from 'crypto'

// GET /api/changes/[id]/feedback - Get all feedback for a change
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const feedback = await db.select().from(sessionChangeFeedback)
      .where(eq(sessionChangeFeedback.changeId, id))
      .orderBy(desc(sessionChangeFeedback.createdAt))

    return NextResponse.json({ feedback })
  } catch (error) {
    console.error('Failed to fetch feedback:', error)
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 })
  }
}

// POST /api/changes/[id]/feedback - Add feedback with optional screenshot
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: changeId } = await params
    const formData = await request.formData()

    const feedbackText = formData.get('feedbackText') as string | null
    const file = formData.get('screenshot') as File | null

    // Validate - need at least text or screenshot
    if (!feedbackText && !file) {
      return NextResponse.json(
        { error: 'Feedback text or screenshot required' },
        { status: 400 }
      )
    }

    let screenshotUrl: string | null = null
    let screenshotPath: string | null = null

    // Upload screenshot to Vercel Blob if provided
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'Only image files are allowed for screenshots' },
          { status: 400 }
        )
      }

      // Upload to Vercel Blob organized by changeId
      const blobPath = `feedback/${changeId}/${Date.now()}-${file.name}`
      const blob = await put(blobPath, file, {
        access: 'public',
      })

      screenshotUrl = blob.url
      screenshotPath = blobPath
    }

    // Create feedback record
    const [feedback] = await db.insert(sessionChangeFeedback).values({
      id: randomUUID(),
      changeId,
      feedbackText,
      screenshotUrl,
      screenshotPath,
    }).returning()

    return NextResponse.json({ feedback }, { status: 201 })
  } catch (error) {
    console.error('Failed to create feedback:', error)
    return NextResponse.json({ error: 'Failed to create feedback' }, { status: 500 })
  }
}

// DELETE /api/changes/[id]/feedback?feedbackId=xxx - Delete a feedback item
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const feedbackId = searchParams.get('feedbackId')

    if (!feedbackId) {
      return NextResponse.json({ error: 'feedbackId required' }, { status: 400 })
    }

    // Get feedback to check for screenshot
    const [feedback] = await db.select().from(sessionChangeFeedback)
      .where(eq(sessionChangeFeedback.id, feedbackId))

    if (!feedback) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })
    }

    // Delete screenshot from Blob if exists
    if (feedback.screenshotUrl) {
      try {
        await del(feedback.screenshotUrl)
      } catch (e) {
        console.error('Failed to delete blob:', e)
        // Continue anyway - blob might already be deleted
      }
    }

    // Delete feedback record
    await db.delete(sessionChangeFeedback).where(eq(sessionChangeFeedback.id, feedbackId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete feedback:', error)
    return NextResponse.json({ error: 'Failed to delete feedback' }, { status: 500 })
  }
}
