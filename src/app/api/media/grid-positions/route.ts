import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { mediaGallery } from '@/db/schema'
import { eq } from 'drizzle-orm'

type GridPositionUpdate = {
  id: number
  gridRow: number
  gridColumn: number
  gridSpan: number
}

// PATCH /api/media/grid-positions - Update grid positions for multiple media items
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const items: GridPositionUpdate[] = body.items

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Items must be an array' },
        { status: 400 }
      )
    }

    // Update each media item's grid position
    for (const item of items) {
      await db
        .update(mediaGallery)
        .set({
          gridRow: item.gridRow,
          gridColumn: item.gridColumn,
          gridSpan: item.gridSpan,
          updatedAt: new Date(),
        })
        .where(eq(mediaGallery.id, item.id))
    }

    return NextResponse.json({
      success: true,
      updated: items.length,
    })
  } catch (error) {
    console.error('PATCH /api/media/grid-positions error:', error)
    return NextResponse.json(
      { error: 'Failed to update grid positions' },
      { status: 500 }
    )
  }
}
