import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { mediaGallery } from '@/db/schema'
import { eq } from 'drizzle-orm'

/**
 * PATCH /api/media/reorder - Update display order for media items
 *
 * Accepts an array of { id, displayOrder } objects and updates the database.
 * Used for drag-and-drop reordering in masonry grid.
 */
export async function PATCH(request: NextRequest) {
  try {
    const { items } = await request.json()

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Invalid request: items must be an array' },
        { status: 400 }
      )
    }

    // Validate items structure
    for (const item of items) {
      if (typeof item.id !== 'number' || typeof item.displayOrder !== 'number') {
        return NextResponse.json(
          { error: 'Invalid item structure: id and displayOrder must be numbers' },
          { status: 400 }
        )
      }
    }

    // Update each item's display order
    const updatePromises = items.map((item) =>
      db
        .update(mediaGallery)
        .set({
          displayOrder: item.displayOrder,
          updatedAt: new Date(),
        })
        .where(eq(mediaGallery.id, item.id))
    )

    await Promise.all(updatePromises)

    return NextResponse.json({
      success: true,
      updated: items.length,
    })
  } catch (error) {
    console.error('PATCH /api/media/reorder error:', error)
    return NextResponse.json(
      { error: 'Failed to reorder media items' },
      { status: 500 }
    )
  }
}
