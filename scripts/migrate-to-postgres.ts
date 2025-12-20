#!/usr/bin/env tsx
/**
 * Migrate data from SQLite to PostgreSQL
 *
 * This script reads all shows from the SQLite database (dutch-queen.db)
 * and inserts them into the PostgreSQL database (Neon).
 *
 * Usage:
 *   1. Ensure DATABASE_URL is set in .env.local with Neon connection string
 *   2. Run: npx tsx scripts/migrate-to-postgres.ts
 */

import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { shows } from '../src/db/schema'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function migrateToPostgres() {
  console.log('🚀 Starting SQLite → PostgreSQL migration...\n')

  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL not found in .env.local')
    console.error('   Please add your Neon connection string to .env.local')
    process.exit(1)
  }

  try {
    // 1. Connect to SQLite database
    console.log('📂 Connecting to SQLite database (dutch-queen.db)...')
    const sqlite = new Database('dutch-queen.db', { readonly: true })

    // 2. Read all shows from SQLite
    console.log('📊 Reading shows from SQLite...')
    const sqliteShows = sqlite.prepare('SELECT * FROM shows').all() as any[]
    console.log(`   Found ${sqliteShows.length} shows\n`)

    if (sqliteShows.length === 0) {
      console.log('⚠️  No shows found in SQLite database')
      sqlite.close()
      return
    }

    // 3. Connect to PostgreSQL (Neon)
    console.log('🐘 Connecting to PostgreSQL (Neon)...')
    const connection = postgres(process.env.DATABASE_URL, { prepare: false })
    const db = drizzle(connection)

    // 4. Transform SQLite data to PostgreSQL format
    console.log('🔄 Transforming data...')
    const transformedShows = sqliteShows.map(show => ({
      bandId: show.band_id,
      title: show.title,
      date: show.date,
      time: show.time,
      venueName: show.venue_name,
      venueCity: show.venue_city,
      venueCountry: show.venue_country || 'Netherlands',
      venueAddress: show.venue_address || null,
      ticketUrl: show.ticket_url || null,
      soldOut: Boolean(show.sold_out),
      isPast: Boolean(show.is_past),
      createdAt: new Date(show.created_at || new Date()),
    }))

    // 5. Insert into PostgreSQL
    console.log('💾 Inserting shows into PostgreSQL...')
    let successCount = 0
    let errorCount = 0

    for (const show of transformedShows) {
      try {
        await db.insert(shows).values(show)
        successCount++
        process.stdout.write(`\r   Progress: ${successCount}/${sqliteShows.length}`)
      } catch (error: any) {
        errorCount++
        console.error(`\n   ❌ Error inserting show "${show.title}":`, error.message)
      }
    }

    console.log('\n')
    console.log('✅ Migration completed!')
    console.log(`   Migrated: ${successCount} shows`)
    if (errorCount > 0) {
      console.log(`   Errors: ${errorCount} shows`)
    }

    // 6. Verify migration
    console.log('\n🔍 Verifying migration...')
    const verifyResult = await db.select().from(shows)
    console.log(`   PostgreSQL now has ${verifyResult.length} shows`)

    // 7. Close connections
    sqlite.close()
    await connection.end()

    console.log('\n🎉 Migration successful!')
    console.log('\n📝 Next steps:')
    console.log('   1. Verify data in PostgreSQL')
    console.log('   2. Update src/db/index.ts to use PostgreSQL')
    console.log('   3. Run: npm run dev')
    console.log('   4. Test the admin panel')

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Run migration
migrateToPostgres()
