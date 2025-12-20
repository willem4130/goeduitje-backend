import { NextResponse } from 'next/server'
import { db } from '@/db'
import { pricingTiers } from '@/db/schema'
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
    const tierId = parseInt(id, 10)

    if (isNaN(tierId)) {
      return NextResponse.json({ error: 'Invalid pricing tier ID' }, { status: 400 })
    }

    const tier = await db
      .select()
      .from(pricingTiers)
      .where(eq(pricingTiers.id, tierId))
      .limit(1)

    if (tier.length === 0) {
      return NextResponse.json({ error: 'Pricing tier not found' }, { status: 404 })
    }

    return NextResponse.json({ pricingTier: tier[0] })
  } catch (error) {
    console.error('Failed to fetch pricing tier:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pricing tier' },
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
    const tierId = parseInt(id, 10)

    if (isNaN(tierId)) {
      return NextResponse.json({ error: 'Invalid pricing tier ID' }, { status: 400 })
    }

    const body = await request.json()

    // Build update object with only provided fields
    const updateData: any = {}

    if (body.activityId !== undefined) updateData.activityId = body.activityId
    if (body.minParticipants !== undefined) updateData.minParticipants = body.minParticipants
    if (body.maxParticipants !== undefined) updateData.maxParticipants = body.maxParticipants
    if (body.pricePerPerson !== undefined) updateData.pricePerPerson = body.pricePerPerson
    if (body.totalPrice !== undefined) updateData.totalPrice = body.totalPrice

    const updatedTier = await db
      .update(pricingTiers)
      .set(updateData)
      .where(eq(pricingTiers.id, tierId))
      .returning()

    if (updatedTier.length === 0) {
      return NextResponse.json({ error: 'Pricing tier not found' }, { status: 404 })
    }

    return NextResponse.json({ pricingTier: updatedTier[0] })
  } catch (error) {
    console.error('Failed to update pricing tier:', error)
    return NextResponse.json(
      { error: 'Failed to update pricing tier' },
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
    const tierId = parseInt(id, 10)

    if (isNaN(tierId)) {
      return NextResponse.json({ error: 'Invalid pricing tier ID' }, { status: 400 })
    }

    const deletedTier = await db
      .delete(pricingTiers)
      .where(eq(pricingTiers.id, tierId))
      .returning()

    if (deletedTier.length === 0) {
      return NextResponse.json({ error: 'Pricing tier not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete pricing tier:', error)
    return NextResponse.json(
      { error: 'Failed to delete pricing tier' },
      { status: 500 }
    )
  }
}
