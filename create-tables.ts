import dotenv from 'dotenv'
// Load environment variables BEFORE importing db
dotenv.config({ path: '.env.local' })

import { db } from './src/db'
import { sql } from 'drizzle-orm'

async function createTables() {
  console.log('📊 Creating new database tables...\n')

  try {
    // Create activities table
    console.log('1️⃣  Creating activities table...')
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        activity_name TEXT NOT NULL,
        base_price DECIMAL(10,2) NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        min_participants INTEGER DEFAULT 1,
        max_participants INTEGER,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `)
    console.log('✅ Activities table created')

    // Create pricing_tiers table
    console.log('\n2️⃣  Creating pricing_tiers table...')
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS pricing_tiers (
        id SERIAL PRIMARY KEY,
        activity_id INTEGER NOT NULL REFERENCES activities(id),
        min_participants INTEGER NOT NULL,
        max_participants INTEGER,
        price_per_person DECIMAL(10,2),
        total_price DECIMAL(10,2),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `)
    console.log('✅ Pricing tiers table created')

    // Create locations table
    console.log('\n3️⃣  Creating locations table...')
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS locations (
        id SERIAL PRIMARY KEY,
        location_name TEXT NOT NULL,
        city TEXT NOT NULL,
        min_capacity INTEGER,
        max_capacity INTEGER,
        base_price_excl_vat DECIMAL(10,2) NOT NULL,
        base_price_incl_vat DECIMAL(10,2) NOT NULL,
        vat_status TEXT DEFAULT 'regular',
        drinks_policy TEXT NOT NULL,
        goeduitje_drinks_available BOOLEAN DEFAULT false,
        address TEXT,
        contact_person TEXT,
        contact_phone TEXT,
        contact_email TEXT,
        notes TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `)
    console.log('✅ Locations table created')

    // Create drinks_pricing table
    console.log('\n4️⃣  Creating drinks_pricing table...')
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS drinks_pricing (
        id SERIAL PRIMARY KEY,
        location_id INTEGER NOT NULL REFERENCES locations(id),
        item_type TEXT NOT NULL,
        item_name TEXT NOT NULL,
        price_excl_vat DECIMAL(10,2),
        price_incl_vat DECIMAL(10,2),
        unit TEXT DEFAULT 'per_item',
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `)
    console.log('✅ Drinks pricing table created')

    console.log('\n🎉 All tables created successfully!')

  } catch (error) {
    console.error('❌ Table creation failed:', error)
    throw error
  }
}

createTables().then(() => {
  console.log('\n✅ Tables ready for data import!')
  process.exit(0)
}).catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
