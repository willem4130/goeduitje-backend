import { NextResponse } from 'next/server'
import { db } from '@/db'
import { activities } from '@/db/schema'
import { eq } from 'drizzle-orm'

type RouteParams = {
  params: Promise<{ id: string }>
}

export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const activityId = parseInt(id, 10)

    if (isNaN(activityId)) {
      return NextResponse.json({ error: 'Invalid activity ID' }, { status: 400 })
    }

    const activity = await db
      .select()
      .from(activities)
      .where(eq(activities.id, activityId))
      .limit(1)

    if (activity.length === 0) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    return NextResponse.json({ activity: activity[0] })
  } catch (error) {
    console.error('Failed to fetch activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const activityId = parseInt(id, 10)

    if (isNaN(activityId)) {
      return NextResponse.json({ error: 'Invalid activity ID' }, { status: 400 })
    }

    const body = await request.json()

    // Build update object with only provided fields
    const updateData: any = {}

    if (body.activityName !== undefined) updateData.activityName = body.activityName
    if (body.basePrice !== undefined) updateData.basePrice = body.basePrice
    if (body.category !== undefined) updateData.category = body.category
    if (body.description !== undefined) updateData.description = body.description
    if (body.minParticipants !== undefined) updateData.minParticipants = body.minParticipants
    if (body.maxParticipants !== undefined) updateData.maxParticipants = body.maxParticipants
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    const updatedActivity = await db
      .update(activities)
      .set(updateData)
      .where(eq(activities.id, activityId))
      .returning()

    if (updatedActivity.length === 0) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    return NextResponse.json({ activity: updatedActivity[0] })
  } catch (error) {
    console.error('Failed to update activity:', error)
    return NextResponse.json(
      { error: 'Failed to update activity' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const activityId = parseInt(id, 10)

    if (isNaN(activityId)) {
      return NextResponse.json({ error: 'Invalid activity ID' }, { status: 400 })
    }

    const deletedActivity = await db
      .delete(activities)
      .where(eq(activities.id, activityId))
      .returning()

    if (deletedActivity.length === 0) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete activity:', error)
    return NextResponse.json(
      { error: 'Failed to delete activity' },
      { status: 500 }
    )
  }
}
