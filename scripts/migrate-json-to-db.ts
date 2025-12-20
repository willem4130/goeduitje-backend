#!/usr/bin/env tsx
/**
 * Migrate data from JSON files to PostgreSQL database
 *
 * This script reads JSON files from the content directory and inserts them
 * into the appropriate PostgreSQL tables (bandProfiles, contacts).
 *
 * Usage:
 *   1. Ensure DATABASE_URL is set in .env.local with Neon connection string
 *   2. Run: npx tsx scripts/migrate-json-to-db.ts
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { bandProfiles, contacts } from '../src/db/schema'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

interface BandProfileJSON {
  id: string
  name: string
  tagline?: string
  genre?: string
  established?: string
  theme?: any
  hero?: any
  seo?: any
  branding?: any
}

interface ContactJSON {
  email: string
  phone?: string | null
  address?: string
  socialLinks?: any
}

async function migrateJSONToDatabase() {
  console.log('🚀 Starting JSON → PostgreSQL migration...\n')

  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL not found in .env.local')
    console.error('   Please add your Neon connection string to .env.local')
    process.exit(1)
  }

  try {
    // Connect to PostgreSQL (Neon)
    console.log('🐘 Connecting to PostgreSQL (Neon)...')
    const connection = postgres(process.env.DATABASE_URL, { prepare: false })
    const db = drizzle(connection)

    const bands = ['the-dutch-queen', 'the-dutch-queen-unplugged']

    // ============================================================
    // 1. Migrate Band Profiles
    // ============================================================
    console.log('\n📊 Migrating Band Profiles...')
    let profilesInserted = 0

    for (const bandDir of bands) {
      try {
        const profilePath = join(process.cwd(), 'content', bandDir, 'band-profile.json')
        const profileData: BandProfileJSON = JSON.parse(readFileSync(profilePath, 'utf-8'))

        // Map the old JSON structure to new database schema
        const bandId = bandDir === 'the-dutch-queen' ? 'full-band' : 'unplugged'

        await db.insert(bandProfiles).values({
          bandId,
          name: profileData.name,
          tagline: profileData.tagline || null,
          bio: null, // Will be added from about.json later
          heroImage: profileData.branding?.logoMain || null,
          logoImage: profileData.branding?.logoIcon || null,
          members: null, // Will be populated later from about.json
          genres: profileData.genre ? [profileData.genre] : null,
          foundedYear: profileData.established ? parseInt(profileData.established) : null,
          websiteUrl: null,
        }).onConflictDoUpdate({
          target: bandProfiles.bandId,
          set: {
            name: profileData.name,
            tagline: profileData.tagline || null,
            updatedAt: new Date(),
          },
        })

        profilesInserted++
        console.log(`   ✅ ${profileData.name}`)
      } catch (error: any) {
        console.error(`   ❌ Error migrating ${bandDir}:`, error.message)
      }
    }

    console.log(`\n   Total profiles migrated: ${profilesInserted}/${bands.length}`)

    // ============================================================
    // 2. Migrate Contacts
    // ============================================================
    console.log('\n📧 Migrating Contacts...')
    let contactsInserted = 0

    for (const bandDir of bands) {
      try {
        const contactPath = join(process.cwd(), 'content', bandDir, 'data', 'contact.json')
        const contactData: ContactJSON = JSON.parse(readFileSync(contactPath, 'utf-8'))

        const bandId = bandDir === 'the-dutch-queen' ? 'full-band' : 'unplugged'

        // Try to read social.json for social links
        let socialLinks = null
        try {
          const socialPath = join(process.cwd(), 'content', bandDir, 'data', 'social.json')
          socialLinks = JSON.parse(readFileSync(socialPath, 'utf-8'))
        } catch (error) {
          // Social.json might not exist
        }

        await db.insert(contacts).values({
          bandId,
          email: contactData.email,
          phone: contactData.phone || null,
          socialLinks: socialLinks || null,
          bookingEmail: contactData.email, // Default to main email
          bookingPhone: contactData.phone || null,
          pressEmail: contactData.email,
          address: contactData.address || null,
          city: null,
          country: 'Netherlands',
          isPublic: true,
        })

        contactsInserted++
        console.log(`   ✅ ${bandDir} contact info`)
      } catch (error: any) {
        console.error(`   ❌ Error migrating ${bandDir} contact:`, error.message)
      }
    }

    console.log(`\n   Total contacts migrated: ${contactsInserted}/${bands.length}`)

    // ============================================================
    // Verify Migration
    // ============================================================
    console.log('\n🔍 Verifying migration...')
    const profilesCount = await db.select().from(bandProfiles)
    const contactsCount = await db.select().from(contacts)

    console.log(`   Band Profiles: ${profilesCount.length}`)
    console.log(`   Contacts: ${contactsCount.length}`)

    // Close connection
    await connection.end()

    console.log('\n✅ Migration completed!')
    console.log('\n📝 Next steps:')
    console.log('   1. Verify data in PostgreSQL')
    console.log('   2. Update API routes to use new database tables')
    console.log('   3. Create admin UI for editing profiles and contacts')

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Run migration
migrateJSONToDatabase()
