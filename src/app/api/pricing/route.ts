import { NextResponse } from 'next/server'
import { db } from '@/db'
import { pricingTiers, activities } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'

export async function GET() {
  try {
    // Fetch all pricing tiers with activity names
    const allTiers = await db
      .select({
        id: pricingTiers.id,
        activityId: pricingTiers.activityId,
        minParticipants: pricingTiers.minParticipants,
        maxParticipants: pricingTiers.maxParticipants,
        pricePerPerson: pricingTiers.pricePerPerson,
        totalPrice: pricingTiers.totalPrice,
        createdAt: pricingTiers.createdAt,
        updatedAt: pricingTiers.updatedAt,
        activityName: activities.activityName,
        activityCategory: activities.category,
      })
      .from(pricingTiers)
      .leftJoin(activities, eq(pricingTiers.activityId, activities.id))
      .orderBy(desc(pricingTiers.createdAt))

    return NextResponse.json({ pricingTiers: allTiers })
  } catch (error) {
    console.error('Failed to fetch pricing tiers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pricing tiers' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const newTier = await db
      .insert(pricingTiers)
      .values({
        activityId: body.activityId,
        minParticipants: body.minParticipants,
        maxParticipants: body.maxParticipants || null,
        pricePerPerson: body.pricePerPerson || null,
        totalPrice: body.totalPrice || null,
      })
      .returning()

    return NextResponse.json({ pricingTier: newTier[0] }, { status: 201 })
  } catch (error) {
    console.error('Failed to create pricing tier:', error)
    return NextResponse.json(
      { error: 'Failed to create pricing tier' },
      { status: 500 }
    )
  }
}
