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

// POST /api/changes/[id]/feedback - Add feedback with optional multiple screenshots
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: changeId } = await params
    const formData = await request.formData()

    const feedbackText = formData.get('feedbackText') as string | null

    // Handle multiple screenshot uploads
    const screenshotUrls: string[] = []
    const screenshotPaths: string[] = []

    // Get all files from 'screenshots' field (multiple)
    const files = formData.getAll('screenshots') as File[]

    // Also check for single 'screenshot' field for backwards compatibility
    const singleFile = formData.get('screenshot') as File | null
    if (singleFile && singleFile.size > 0) {
      files.push(singleFile)
    }

    // Validate - need at least text or screenshots
    if (!feedbackText && files.length === 0) {
      return NextResponse.json(
        { error: 'Feedback text or screenshots required' },
        { status: 400 }
      )
    }

    // Upload all screenshots
    const feedbackId = randomUUID()
    for (const file of files) {
      if (file && file.size > 0) {
        if (!file.type.startsWith('image/')) {
          continue // Skip non-image files
        }

        const blobPath = `feedback/${changeId}/${feedbackId}/${Date.now()}-${file.name}`
        const blob = await put(blobPath, file, { access: 'public' })
        screenshotUrls.push(blob.url)
        screenshotPaths.push(blobPath)
      }
    }

    // Create feedback record
    const [feedback] = await db.insert(sessionChangeFeedback).values({
      id: feedbackId,
      changeId,
      feedbackText,
      screenshotUrls: screenshotUrls.length > 0 ? screenshotUrls : null,
      screenshotPaths: screenshotPaths.length > 0 ? screenshotPaths : null,
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

    // Get feedback to check for screenshots
    const [feedback] = await db.select().from(sessionChangeFeedback)
      .where(eq(sessionChangeFeedback.id, feedbackId))

    if (!feedback) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })
    }

    // Delete all screenshots from Blob
    if (feedback.screenshotUrls && feedback.screenshotUrls.length > 0) {
      for (const url of feedback.screenshotUrls) {
        try {
          await del(url)
        } catch (e) {
          console.error('Failed to delete blob:', e)
        }
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
