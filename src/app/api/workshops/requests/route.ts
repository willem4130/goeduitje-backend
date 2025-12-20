import { NextResponse } from 'next/server'
import { db } from '@/db'
import { workshopRequests } from '@/db/schema'
import { desc, eq, sql } from 'drizzle-orm'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // Fetch requests with optional status filter
    const requests = status
      ? await db.select().from(workshopRequests).where(eq(workshopRequests.status, status as any)).orderBy(desc(workshopRequests.createdAt))
      : await db.select().from(workshopRequests).orderBy(desc(workshopRequests.createdAt))

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Failed to fetch workshop requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workshop requests' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const newRequest = await db
      .insert(workshopRequests)
      .values({
        status: 'leeg', // Default initial status
        contactName: body.contactName,
        email: body.email,
        phone: body.phone,
        organization: body.organization,
        activityType: body.activityType,
        preferredDate: body.preferredDate || null, // ISO date string
        alternativeDate: body.alternativeDate || null, // ISO date string
        participants: body.participants,
        ageGroup: body.ageGroup,
        location: body.location,
        travelDistance: body.travelDistance,
        specialRequirements: body.specialRequirements,
        dietaryRestrictions: body.dietaryRestrictions,
        accessibilityNeeds: body.accessibilityNeeds,
        notes: body.notes,
      })
      .returning()

    return NextResponse.json({ request: newRequest[0] }, { status: 201 })
  } catch (error) {
    console.error('Failed to create workshop request:', error)
    return NextResponse.json(
      { error: 'Failed to create workshop request' },
      { status: 500 }
    )
  }
}
