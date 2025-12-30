import { NextResponse } from 'next/server'
import { db } from '@/db'
import { confirmedWorkshops, workshopRequests } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET() {
  try {
    const workshops = await db
      .select({
        id: confirmedWorkshops.id,
        requestId: confirmedWorkshops.requestId,
        confirmedDate: confirmedWorkshops.confirmedDate,
        startTime: confirmedWorkshops.startTime,
        endTime: confirmedWorkshops.endTime,
        actualParticipants: confirmedWorkshops.actualParticipants,
        locationName: confirmedWorkshops.locationName,
        locationCity: confirmedWorkshops.locationCity,
        leadInstructor: confirmedWorkshops.leadInstructor,
        workshopNotes: confirmedWorkshops.workshopNotes,
        customerSatisfaction: confirmedWorkshops.customerSatisfaction,
        paymentStatus: confirmedWorkshops.paymentStatus,
        completedAt: confirmedWorkshops.completedAt,
        createdAt: confirmedWorkshops.createdAt,
        // Join data from workshop request
        contactName: workshopRequests.contactName,
        email: workshopRequests.email,
        organization: workshopRequests.organization,
        activityType: workshopRequests.activityType,
        participants: workshopRequests.participants,
        finalPrice: workshopRequests.finalPrice,
      })
      .from(confirmedWorkshops)
      .leftJoin(workshopRequests, eq(confirmedWorkshops.requestId, workshopRequests.id))
      .orderBy(desc(confirmedWorkshops.confirmedDate))

    return NextResponse.json({ workshops })
  } catch (error) {
    console.error('Failed to fetch confirmed workshops:', error)
    return NextResponse.json({ error: 'Failed to fetch workshops' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const updated = await db.update(confirmedWorkshops)
      .set({
        confirmedDate: body.confirmedDate,
        startTime: body.startTime,
        endTime: body.endTime,
        actualParticipants: body.actualParticipants,
        locationName: body.locationName,
        locationCity: body.locationCity,
        leadInstructor: body.leadInstructor,
        workshopNotes: body.workshopNotes,
        customerSatisfaction: body.customerSatisfaction,
        paymentStatus: body.paymentStatus,
        completedAt: body.completedAt ? new Date(body.completedAt) : null,
        updatedAt: new Date(),
      })
      .where(eq(confirmedWorkshops.id, body.id))
      .returning()
    return NextResponse.json({ workshop: updated[0] })
  } catch (error) {
    console.error('Failed to update workshop:', error)
    return NextResponse.json({ error: 'Failed to update workshop' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.delete(confirmedWorkshops).where(eq(confirmedWorkshops.id, parseInt(id)))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete workshop:', error)
    return NextResponse.json({ error: 'Failed to delete workshop' }, { status: 500 })
  }
}
