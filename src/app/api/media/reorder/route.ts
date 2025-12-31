import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { mediaGallery } from '@/db/schema'
import { eq } from 'drizzle-orm'

// PATCH /api/media/reorder - Update display order for multiple items
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { items } = body as { items: { id: number; displayOrder: number }[] }

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Invalid request: items array required' },
        { status: 400 }
      )
    }

    // Update each item's display order
    for (const item of items) {
      await db
        .update(mediaGallery)
        .set({ displayOrder: item.displayOrder, updatedAt: new Date() })
        .where(eq(mediaGallery.id, item.id))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PATCH /api/media/reorder error:', error)
    return NextResponse.json(
      { error: 'Failed to reorder media items' },
      { status: 500 }
    )
  }
}
