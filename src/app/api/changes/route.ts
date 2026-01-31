import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { db } from '@/db'
import { sessionChanges } from '@/db/schema'
import { eq, asc, isNull, isNotNull } from 'drizzle-orm'
import { randomUUID } from 'crypto'

// GET /api/changes - Get all changes
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const showDeleted = searchParams.get('deleted') === 'true'

    let items
    if (showDeleted) {
      // Show only deleted items
      items = await db.select().from(sessionChanges)
        .where(isNotNull(sessionChanges.deletedAt))
        .orderBy(asc(sessionChanges.createdAt))
    } else if (status && status !== 'all') {
      // Filter by status, exclude deleted
      items = await db.select().from(sessionChanges)
        .where(eq(sessionChanges.status, status as 'pending' | 'approved' | 'needs_changes' | 'in_progress' | 'fixed_review'))
        .orderBy(asc(sessionChanges.createdAt))
      // Filter out deleted items in JS (drizzle doesn't support AND easily)
      items = items.filter(i => !i.deletedAt)
    } else {
      // All non-deleted items
      items = await db.select().from(sessionChanges)
        .where(isNull(sessionChanges.deletedAt))
        .orderBy(asc(sessionChanges.createdAt))
    }

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Failed to fetch changes:', error)
    return NextResponse.json({ error: 'Failed to fetch changes' }, { status: 500 })
  }
}

// POST /api/changes - Create new change (supports FormData with multiple screenshots)
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || ''

    let title: string
    let description: string | null = null
    let category: string | null = null
    let viewUrl: string | null = null
    let filesChanged: string[] = []
    let changeDetails: string[] = []
    let addedBy: string = 'developer'
    const screenshotUrls: string[] = []
    const screenshotPaths: string[] = []

    if (contentType.includes('multipart/form-data')) {
      // Handle FormData with potential file uploads
      const formData = await request.formData()

      title = formData.get('title') as string
      description = formData.get('description') as string | null
      category = formData.get('category') as string | null
      viewUrl = formData.get('viewUrl') as string | null
      addedBy = (formData.get('addedBy') as string) || 'developer'

      const filesChangedStr = formData.get('filesChanged') as string | null
      const changeDetailsStr = formData.get('changeDetails') as string | null
      filesChanged = filesChangedStr ? filesChangedStr.split('\n').filter(Boolean) : []
      changeDetails = changeDetailsStr ? changeDetailsStr.split('\n').filter(Boolean) : []

      // Handle multiple screenshot uploads
      const id = randomUUID()
      const files = formData.getAll('screenshots') as File[]

      // Also check for single 'screenshot' field for backwards compatibility
      const singleFile = formData.get('screenshot') as File | null
      if (singleFile && singleFile.size > 0) {
        files.push(singleFile)
      }

      for (const file of files) {
        if (file && file.size > 0 && file.type.startsWith('image/')) {
          const blobPath = `changes/${id}/${Date.now()}-${file.name}`
          const blob = await put(blobPath, file, { access: 'public' })
          screenshotUrls.push(blob.url)
          screenshotPaths.push(blobPath)
        }
      }
    } else {
      // Handle JSON body
      const body = await request.json()
      title = body.title
      description = body.description
      category = body.category
      viewUrl = body.viewUrl
      filesChanged = body.filesChanged || []
      changeDetails = body.changeDetails || []
      addedBy = body.addedBy || 'developer'
    }

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const newItem = await db.insert(sessionChanges).values({
      id: randomUUID(),
      title,
      description,
      category,
      filesChanged,
      changeDetails,
      viewUrl,
      screenshotUrls: screenshotUrls.length > 0 ? screenshotUrls : null,
      screenshotPaths: screenshotPaths.length > 0 ? screenshotPaths : null,
      status: 'pending',
      addedBy,
      updatedAt: new Date(),
    }).returning()

    return NextResponse.json({ item: newItem[0] }, { status: 201 })
  } catch (error) {
    console.error('Failed to create change:', error)
    return NextResponse.json({ error: 'Failed to create change' }, { status: 500 })
  }
}
