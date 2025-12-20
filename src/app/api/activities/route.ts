import { NextResponse } from 'next/server'
import { db } from '@/db'
import { activities } from '@/db/schema'
import { desc } from 'drizzle-orm'

export async function GET() {
  try {
    const allActivities = await db
      .select()
      .from(activities)
      .orderBy(desc(activities.createdAt))

    return NextResponse.json({ activities: allActivities })
  } catch (error) {
    console.error('Failed to fetch activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const newActivity = await db
      .insert(activities)
      .values({
        activityName: body.activityName,
        basePrice: body.basePrice,
        category: body.category,
        description: body.description || null,
        minParticipants: body.minParticipants || 1,
        maxParticipants: body.maxParticipants || null,
        isActive: body.isActive !== undefined ? body.isActive : true,
      })
      .returning()

    return NextResponse.json({ activity: newActivity[0] }, { status: 201 })
  } catch (error) {
    console.error('Failed to create activity:', error)
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    )
  }
}
