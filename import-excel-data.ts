import dotenv from 'dotenv'
// Load environment variables BEFORE importing db
dotenv.config({ path: '.env.local' })

import XLSX from 'xlsx'
import path from 'path'
import { db } from './src/db'
import { activities, pricingTiers, locations, drinksPricing } from './src/db/schema'
import { sql } from 'drizzle-orm'

const excelDir = '/Users/willemvandenberg/Dev/Goeduitjeweb/Databases backend/Real databases locations and prices'

async function importData() {
  console.log('📊 Importing Excel Data to Database...\n')

  try {
    // Read Structured Database
    const structuredFile = path.join(excelDir, '251220_Databases_backend_Structured.xlsx')
    const structuredWorkbook = XLSX.readFile(structuredFile)

    // Import Activities
    console.log('1️⃣  Importing Activities...')
    const activitiesSheet = structuredWorkbook.Sheets['Activities']
    const activitiesData = XLSX.utils.sheet_to_json(activitiesSheet)

    for (const row of activitiesData as any[]) {
      await db.insert(activities).values({
        activityName: row.activity_name,
        basePrice: String(row.base_price),
        category: row.category,
        description: row.description,
        minParticipants: row.min_participants || 1,
        maxParticipants: row.max_participants,
      }).onConflictDoNothing()
    }
    console.log(`✅ Imported ${activitiesData.length} activities`)

    // Import Pricing Tiers
    console.log('\n2️⃣  Importing Pricing Tiers...')
    const tiersSheet = structuredWorkbook.Sheets['Pricing_Tiers']
    const tiersData = XLSX.utils.sheet_to_json(tiersSheet)

    for (const row of tiersData as any[]) {
      const [min, max] = row.participant_range.split('-').map((n: string) => parseInt(n))
      await db.insert(pricingTiers).values({
        activityId: row.activity_id,
        minParticipants: min,
        maxParticipants: max || null,
        pricePerPerson: row.price_per_person ? String(row.price_per_person) : null,
        totalPrice: null,
      }).onConflictDoNothing()
    }
    console.log(`✅ Imported ${tiersData.length} pricing tiers`)

    // Read Locations Database
    const locationsFile = path.join(excelDir, 'Locatieprijzen_Database.xlsx')
    const locationsWorkbook = XLSX.readFile(locationsFile)

    // Import Locations
    console.log('\n3️⃣  Importing Locations...')
    const locationsSheet = locationsWorkbook.Sheets['Locations']
    const locationsData = XLSX.utils.sheet_to_json(locationsSheet)

    for (const row of locationsData as any[]) {
      await db.insert(locations).values({
        locationName: row.location_name,
        city: row.city,
        minCapacity: row.min_capacity,
        maxCapacity: row.max_capacity,
        basePriceExclVat: String(row.base_price_excl_vat),
        basePriceInclVat: String(row.base_price_incl_vat),
        vatStatus: row.vat_status === 'exempt' ? 'exempt' : 'regular',
        drinksPolicy: row.drinks_policy,
        goeduitjeDrinksAvailable: row.goeduitje_drinks_available === 'yes',
      }).onConflictDoNothing()
    }
    console.log(`✅ Imported ${locationsData.length} locations`)

    // Import Drinks Pricing
    console.log('\n4️⃣  Importing Drinks Pricing...')
    const drinksSheet = locationsWorkbook.Sheets['Drinks_Pricing']
    const drinksData = XLSX.utils.sheet_to_json(drinksSheet)

    for (const row of drinksData as any[]) {
      await db.insert(drinksPricing).values({
        locationId: row.location_id,
        itemType: row.item_type,
        itemName: row.item_name,
        priceExclVat: row.price_excl_vat ? String(row.price_excl_vat) : null,
        priceInclVat: row.price_incl_vat ? String(row.price_incl_vat) : null,
        unit: row.unit || 'per_item',
        notes: row.notes,
      }).onConflictDoNothing()
    }
    console.log(`✅ Imported ${drinksData.length} drinks pricing records`)

    console.log('\n🎉 All data imported successfully!')

  } catch (error) {
    console.error('❌ Import failed:', error)
    throw error
  }
}

importData().then(() => {
  console.log('\n✅ Import complete!')
  process.exit(0)
}).catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
