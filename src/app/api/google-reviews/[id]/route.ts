import { NextResponse } from 'next/server'
import { db } from '@/db'
import { googleReview } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const updated = await db.update(googleReview)
      .set({
        isVisible: body.isVisible,
        updatedAt: new Date(),
      })
      .where(eq(googleReview.id, id))
      .returning()

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    return NextResponse.json({ item: updated[0] })
  } catch (error) {
    console.error('Failed to update Google review:', error)
    return NextResponse.json({ error: 'Failed to update Google review' }, { status: 500 })
  }
}
