import { NextResponse } from 'next/server'
import { db } from '@/db'
import { locations, drinksPricing } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'

export async function GET() {
  try {
    // Fetch all locations
    const allLocations = await db
      .select()
      .from(locations)
      .orderBy(desc(locations.createdAt))

    // Fetch drinks pricing for all locations
    const allDrinks = await db
      .select()
      .from(drinksPricing)

    // Group drinks by location ID
    const locationsWithDrinks = allLocations.map(location => ({
      ...location,
      drinks: allDrinks.filter(drink => drink.locationId === location.id)
    }))

    return NextResponse.json({ locations: locationsWithDrinks })
  } catch (error) {
    console.error('Failed to fetch locations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Create location
    const newLocation = await db
      .insert(locations)
      .values({
        locationName: body.locationName,
        city: body.city,
        address: body.address || null,
        minCapacity: body.minCapacity || null,
        maxCapacity: body.maxCapacity || null,
        basePriceExclVat: body.basePriceExclVat,
        basePriceInclVat: body.basePriceInclVat,
        vatStatus: body.vatStatus || 'regular',
        drinksPolicy: body.drinksPolicy,
        goeduitjeDrinksAvailable: body.goeduitjeDrinksAvailable || false,
        contactPerson: body.contactPerson || null,
        contactPhone: body.contactPhone || null,
        contactEmail: body.contactEmail || null,
        notes: body.notes || null,
        isActive: body.isActive !== undefined ? body.isActive : true,
      })
      .returning()

    // Create drinks pricing if provided
    const createdDrinks = []
    if (body.drinks && Array.isArray(body.drinks) && body.drinks.length > 0) {
      for (const drink of body.drinks) {
        const newDrink = await db
          .insert(drinksPricing)
          .values({
            locationId: newLocation[0].id,
            itemType: drink.itemType,
            itemName: drink.itemName,
            priceExclVat: drink.priceExclVat || null,
            priceInclVat: drink.priceInclVat || null,
            unit: drink.unit || 'per_item',
            notes: drink.notes || null,
          })
          .returning()

        createdDrinks.push(newDrink[0])
      }
    }

    return NextResponse.json({
      location: {
        ...newLocation[0],
        drinks: createdDrinks
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create location:', error)
    return NextResponse.json(
      { error: 'Failed to create location' },
      { status: 500 }
    )
  }
}
