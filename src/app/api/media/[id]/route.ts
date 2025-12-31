import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { mediaGallery } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { del } from '@vercel/blob'

// GET /api/media/[id] - Get single media item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const mediaId = parseInt(id)

    if (isNaN(mediaId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const [media] = await db
      .select()
      .from(mediaGallery)
      .where(eq(mediaGallery.id, mediaId))

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    return NextResponse.json(media)
  } catch (error) {
    console.error('GET /api/media/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media item' },
      { status: 500 }
    )
  }
}

// PUT /api/media/[id] - Update media item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const mediaId = parseInt(id)

    if (isNaN(mediaId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const body = await request.json()

    const [updated] = await db
      .update(mediaGallery)
      .set({
        caption: body.caption,
        altText: body.altText,
        category: body.category,
        tags: body.tags,
        showOnWebsite: body.showOnWebsite,
        featuredOnHomepage: body.featuredOnHomepage,
        updatedAt: new Date(),
      })
      .where(eq(mediaGallery.id, mediaId))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PUT /api/media/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to update media item' },
      { status: 500 }
    )
  }
}

// DELETE /api/media/[id] - Delete media item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const mediaId = parseInt(id)

    if (isNaN(mediaId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    // Get the media item first to get the blob URL
    const [media] = await db
      .select()
      .from(mediaGallery)
      .where(eq(mediaGallery.id, mediaId))

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    // Delete from Vercel Blob
    try {
      await del(media.blobUrl)
    } catch (blobError) {
      console.error('Failed to delete blob:', blobError)
      // Continue with database deletion even if blob deletion fails
    }

    // Delete from database
    await db.delete(mediaGallery).where(eq(mediaGallery.id, mediaId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/media/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to delete media item' },
      { status: 500 }
    )
  }
}
