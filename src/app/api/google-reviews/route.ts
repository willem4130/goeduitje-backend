import { NextResponse } from 'next/server'
import { db } from '@/db'
import { googleReview } from '@/db/schema'
import { desc } from 'drizzle-orm'

export async function GET() {
  try {
    const items = await db.select().from(googleReview).orderBy(desc(googleReview.reviewTime))
    return NextResponse.json({ items })
  } catch (error) {
    console.error('Failed to fetch Google reviews:', error)
    return NextResponse.json({ error: 'Failed to fetch Google reviews' }, { status: 500 })
  }
}
