import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { mediaGallery } from '@/db/schema'
import { eq } from 'drizzle-orm'

// GET /api/media/[id] - Get single media item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const [media] = await db
      .select()
      .from(mediaGallery)
      .where(eq(mediaGallery.id, parseInt(id)))

    if (!media) {
      return NextResponse.json(
        { error: 'Media item not found' },
        { status: 404 }
      )
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
    const body = await request.json()

    const updateData: Partial<typeof mediaGallery.$inferInsert> = {
      title: body.title,
      description: body.description,
      category: body.category,
      tags: body.tags,
    }

    const [updated] = await db
      .update(mediaGallery)
      .set(updateData)
      .where(eq(mediaGallery.id, parseInt(id)))
      .returning()

    if (!updated) {
      return NextResponse.json(
        { error: 'Media item not found' },
        { status: 404 }
      )
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
    await db.delete(mediaGallery).where(eq(mediaGallery.id, parseInt(id)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/media/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to delete media item' },
      { status: 500 }
    )
  }
}
