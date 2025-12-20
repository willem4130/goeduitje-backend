import { NextResponse } from 'next/server'
import { db } from '@/db'
import { locations, drinksPricing } from '@/db/schema'
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
    const locationId = parseInt(id, 10)

    if (isNaN(locationId)) {
      return NextResponse.json({ error: 'Invalid location ID' }, { status: 400 })
    }

    const location = await db
      .select()
      .from(locations)
      .where(eq(locations.id, locationId))
      .limit(1)

    if (location.length === 0) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // Fetch associated drinks pricing
    const drinks = await db
      .select()
      .from(drinksPricing)
      .where(eq(drinksPricing.locationId, locationId))

    return NextResponse.json({
      location: {
        ...location[0],
        drinks
      }
    })
  } catch (error) {
    console.error('Failed to fetch location:', error)
    return NextResponse.json(
      { error: 'Failed to fetch location' },
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
    const locationId = parseInt(id, 10)

    if (isNaN(locationId)) {
      return NextResponse.json({ error: 'Invalid location ID' }, { status: 400 })
    }

    const body = await request.json()

    // Build update object with only provided fields
    const updateData: any = {}

    if (body.locationName !== undefined) updateData.locationName = body.locationName
    if (body.city !== undefined) updateData.city = body.city
    if (body.address !== undefined) updateData.address = body.address
    if (body.minCapacity !== undefined) updateData.minCapacity = body.minCapacity
    if (body.maxCapacity !== undefined) updateData.maxCapacity = body.maxCapacity
    if (body.basePriceExclVat !== undefined) updateData.basePriceExclVat = body.basePriceExclVat
    if (body.basePriceInclVat !== undefined) updateData.basePriceInclVat = body.basePriceInclVat
    if (body.vatStatus !== undefined) updateData.vatStatus = body.vatStatus
    if (body.drinksPolicy !== undefined) updateData.drinksPolicy = body.drinksPolicy
    if (body.goeduitjeDrinksAvailable !== undefined) updateData.goeduitjeDrinksAvailable = body.goeduitjeDrinksAvailable
    if (body.contactPerson !== undefined) updateData.contactPerson = body.contactPerson
    if (body.contactPhone !== undefined) updateData.contactPhone = body.contactPhone
    if (body.contactEmail !== undefined) updateData.contactEmail = body.contactEmail
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    const updatedLocation = await db
      .update(locations)
      .set(updateData)
      .where(eq(locations.id, locationId))
      .returning()

    if (updatedLocation.length === 0) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // Handle drinks pricing update if provided
    let updatedDrinks = []
    if (body.drinks && Array.isArray(body.drinks)) {
      // Delete existing drinks for this location
      await db
        .delete(drinksPricing)
        .where(eq(drinksPricing.locationId, locationId))

      // Create new drinks
      for (const drink of body.drinks) {
        const newDrink = await db
          .insert(drinksPricing)
          .values({
            locationId: locationId,
            itemType: drink.itemType,
            itemName: drink.itemName,
            priceExclVat: drink.priceExclVat || null,
            priceInclVat: drink.priceInclVat || null,
            unit: drink.unit || 'per_item',
            notes: drink.notes || null,
          })
          .returning()

        updatedDrinks.push(newDrink[0])
      }
    } else {
      // If no drinks provided, fetch existing drinks
      updatedDrinks = await db
        .select()
        .from(drinksPricing)
        .where(eq(drinksPricing.locationId, locationId))
    }

    return NextResponse.json({
      location: {
        ...updatedLocation[0],
        drinks: updatedDrinks
      }
    })
  } catch (error) {
    console.error('Failed to update location:', error)
    return NextResponse.json(
      { error: 'Failed to update location' },
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
    const locationId = parseInt(id, 10)

    if (isNaN(locationId)) {
      return NextResponse.json({ error: 'Invalid location ID' }, { status: 400 })
    }

    // Delete associated drinks pricing first (cascade)
    await db
      .delete(drinksPricing)
      .where(eq(drinksPricing.locationId, locationId))

    // Then delete the location
    const deletedLocation = await db
      .delete(locations)
      .where(eq(locations.id, locationId))
      .returning()

    if (deletedLocation.length === 0) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete location:', error)
    return NextResponse.json(
      { error: 'Failed to delete location' },
      { status: 500 }
    )
  }
}
