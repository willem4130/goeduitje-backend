import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { mediaGallery, type NewMedia } from '@/db/schema'
import { desc, eq, and, like, or } from 'drizzle-orm'

// GET /api/media - List all media items
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const workshopId = searchParams.get('workshopId')
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    let query = db.select().from(mediaGallery)

    // Build where conditions
    const conditions = []

    if (workshopId) {
      conditions.push(eq(mediaGallery.workshopId, parseInt(workshopId)))
    }

    if (category) {
      conditions.push(eq(mediaGallery.category, category as any))
    }

    if (search && mediaGallery.caption && mediaGallery.altText) {
      conditions.push(
        or(
          like(mediaGallery.caption, `%${search}%`),
          like(mediaGallery.altText, `%${search}%`)
        )
      )
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any
    }

    const items = await query.orderBy(desc(mediaGallery.displayOrder), desc(mediaGallery.createdAt))

    return NextResponse.json(items)
  } catch (error) {
    console.error('GET /api/media error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media items' },
      { status: 500 }
    )
  }
}

// POST /api/media - Create new media item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const newMedia: NewMedia = {
      workshopId: body.workshopId || null,
      blobUrl: body.blobUrl,
      fileName: body.fileName,
      mimeType: body.mimeType,
      fileSize: body.fileSize || null,
      width: body.width || null,
      height: body.height || null,
      caption: body.caption || null,
      altText: body.altText || null,
      category: body.category || 'workshop',
      tags: body.tags || null,
      isPublic: body.isPublic || false,
      showOnWebsite: body.showOnWebsite || false,
      uploadedBy: body.uploadedBy || null,
    }

    const [media] = await db.insert(mediaGallery).values(newMedia).returning()

    return NextResponse.json(media, { status: 201 })
  } catch (error) {
    console.error('POST /api/media error:', error)
    return NextResponse.json(
      { error: 'Failed to create media item' },
      { status: 500 }
    )
  }
}
