import { NextResponse } from 'next/server'
import { db } from '@/db'
import { workshopRequests } from '@/db/schema'
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
    const requestId = parseInt(id, 10)

    if (isNaN(requestId)) {
      return NextResponse.json({ error: 'Invalid request ID' }, { status: 400 })
    }

    const workshopRequest = await db
      .select()
      .from(workshopRequests)
      .where(eq(workshopRequests.id, requestId))
      .limit(1)

    if (workshopRequest.length === 0) {
      return NextResponse.json({ error: 'Workshop request not found' }, { status: 404 })
    }

    return NextResponse.json({ request: workshopRequest[0] })
  } catch (error) {
    console.error('Failed to fetch workshop request:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workshop request' },
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
    const requestId = parseInt(id, 10)

    if (isNaN(requestId)) {
      return NextResponse.json({ error: 'Invalid request ID' }, { status: 400 })
    }

    const body = await request.json()

    // Build update object with only provided fields
    const updateData: any = {}

    if (body.status !== undefined) updateData.status = body.status
    if (body.contactName !== undefined) updateData.contactName = body.contactName
    if (body.email !== undefined) updateData.email = body.email
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.organization !== undefined) updateData.organization = body.organization
    if (body.activityType !== undefined) updateData.activityType = body.activityType
    if (body.preferredDate !== undefined) updateData.preferredDate = body.preferredDate || null // ISO string
    if (body.alternativeDate !== undefined) updateData.alternativeDate = body.alternativeDate || null // ISO string
    if (body.participants !== undefined) updateData.participants = body.participants
    if (body.ageGroup !== undefined) updateData.ageGroup = body.ageGroup
    if (body.location !== undefined) updateData.location = body.location
    if (body.travelDistance !== undefined) updateData.travelDistance = body.travelDistance
    if (body.specialRequirements !== undefined) updateData.specialRequirements = body.specialRequirements
    if (body.dietaryRestrictions !== undefined) updateData.dietaryRestrictions = body.dietaryRestrictions
    if (body.accessibilityNeeds !== undefined) updateData.accessibilityNeeds = body.accessibilityNeeds
    if (body.quotedPrice !== undefined) updateData.quotedPrice = body.quotedPrice
    if (body.finalPrice !== undefined) updateData.finalPrice = body.finalPrice
    if (body.notes !== undefined) updateData.notes = body.notes

    const updatedRequest = await db
      .update(workshopRequests)
      .set(updateData)
      .where(eq(workshopRequests.id, requestId))
      .returning()

    if (updatedRequest.length === 0) {
      return NextResponse.json({ error: 'Workshop request not found' }, { status: 404 })
    }

    return NextResponse.json({ request: updatedRequest[0] })
  } catch (error) {
    console.error('Failed to update workshop request:', error)
    return NextResponse.json(
      { error: 'Failed to update workshop request' },
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
    const requestId = parseInt(id, 10)

    if (isNaN(requestId)) {
      return NextResponse.json({ error: 'Invalid request ID' }, { status: 400 })
    }

    const deletedRequest = await db
      .delete(workshopRequests)
      .where(eq(workshopRequests.id, requestId))
      .returning()

    if (deletedRequest.length === 0) {
      return NextResponse.json({ error: 'Workshop request not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete workshop request:', error)
    return NextResponse.json(
      { error: 'Failed to delete workshop request' },
      { status: 500 }
    )
  }
}
