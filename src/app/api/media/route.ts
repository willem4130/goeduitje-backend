import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { mediaGallery, type NewMedia } from '@/db/schema'
import { desc, eq, and, like, or } from 'drizzle-orm'

// GET /api/media - List all media items
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const bandId = searchParams.get('bandId')
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    let query = db.select().from(mediaGallery)

    // Build where conditions
    const conditions = []

    if (bandId) {
      conditions.push(eq(mediaGallery.bandId, bandId))
    }

    if (type) {
      conditions.push(eq(mediaGallery.type, type))
    }

    if (category) {
      conditions.push(eq(mediaGallery.category, category))
    }

    if (search) {
      conditions.push(
        or(
          like(mediaGallery.title, `%${search}%`),
          like(mediaGallery.description, `%${search}%`)
        )
      )
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any
    }

    const items = await query.orderBy(mediaGallery.displayOrder, desc(mediaGallery.createdAt))

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
      bandId: body.bandId,
      title: body.title || null,
      description: body.description || null,
      url: body.url,
      thumbnailUrl: body.thumbnailUrl || null,
      type: body.type,
      category: body.category || null,
      tags: body.tags || null,
      fileSize: body.fileSize || null,
      mimeType: body.mimeType || null,
      width: body.width || null,
      height: body.height || null,
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
