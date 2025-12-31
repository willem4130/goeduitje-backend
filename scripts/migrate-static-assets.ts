/**
 * Migration script to upload static assets from frontend /public/ to Vercel Blob
 * and create database records.
 *
 * Run with: npx tsx scripts/migrate-static-assets.ts
 *
 * Prerequisites:
 * - BLOB_READ_WRITE_TOKEN in .env
 * - DATABASE_URL in .env
 */

import { put } from '@vercel/blob'
import { db } from '../src/db/index.js'
import { mediaGallery } from '../src/db/schema.js'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

// ES module compatibility
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Path to frontend public folder
const FRONTEND_PUBLIC = path.resolve(__dirname, '../../goeduitje-nl-rebuild/public')

// Define assets to migrate with their categories and tags
const ASSETS_TO_MIGRATE = [
  // Hero Videos
  {
    path: 'videos/hero/hero-background.mp4',
    category: 'site-hero-video',
    tags: ['desktop'],
    caption: 'Hero Background Video (Desktop)',
    altText: 'Goeduitje workshop background video',
  },
  {
    path: 'videos/hero/hero-background.webm',
    category: 'site-hero-video',
    tags: ['desktop', 'webm'],
    caption: 'Hero Background Video WebM (Desktop)',
    altText: 'Goeduitje workshop background video',
  },
  {
    path: 'videos/hero/hero-background-mobile.mp4',
    category: 'site-hero-video',
    tags: ['mobile'],
    caption: 'Hero Background Video (Mobile)',
    altText: 'Goeduitje workshop background video mobile',
  },
  {
    path: 'videos/hero/hero-background-mobile.webm',
    category: 'site-hero-video',
    tags: ['mobile', 'webm'],
    caption: 'Hero Background Video WebM (Mobile)',
    altText: 'Goeduitje workshop background video mobile',
  },
  // Hero Posters
  {
    path: 'images/hero/hero-poster.jpg',
    category: 'site-hero-poster',
    tags: ['desktop'],
    caption: 'Hero Poster (Desktop)',
    altText: 'Goeduitje workshop hero image',
  },
  {
    path: 'images/hero/hero-poster-mobile.jpg',
    category: 'site-hero-poster',
    tags: ['mobile'],
    caption: 'Hero Poster (Mobile)',
    altText: 'Goeduitje workshop hero image mobile',
  },
  // Logos
  {
    path: 'images/logo/logo-nav.png',
    category: 'site-logo',
    tags: ['nav'],
    caption: 'Navigation Logo',
    altText: 'Goeduitje.nl - uitjes met een verhaal, om te janken zo goed',
  },
  {
    path: 'images/logo/logo-footer.png',
    category: 'site-logo',
    tags: ['footer'],
    caption: 'Footer Logo',
    altText: 'Goeduitje.nl - uitjes met een verhaal, om te janken zo goed',
  },
  // OG Images
  {
    path: 'og-image.png',
    category: 'site-og',
    tags: ['og'],
    caption: 'Open Graph Image',
    altText: 'Goeduitje.nl - Teambuilding en Kookworkshops',
  },
  {
    path: 'twitter-image.png',
    category: 'site-og',
    tags: ['twitter'],
    caption: 'Twitter Card Image',
    altText: 'Goeduitje.nl - Teambuilding en Kookworkshops',
  },
  // Workshop Images
  {
    path: 'images/workshops/beachvolleybal.jpg',
    category: 'workshop',
    tags: ['beachvolleybal', 'outdoor'],
    caption: 'Beachvolleybal Workshop',
    altText: 'Beachvolleybal teambuilding activiteit',
  },
  {
    path: 'images/workshops/design-tshirt.jpg',
    category: 'workshop',
    tags: ['design', 'creatief'],
    caption: 'Design T-shirt Workshop',
    altText: 'Creatieve t-shirt design workshop',
  },
  {
    path: 'images/workshops/koffie-thee.jpg',
    category: 'workshop',
    tags: ['koffie', 'thee', 'proeverij'],
    caption: 'Koffie & Thee Workshop',
    altText: 'Koffie en thee proeverij workshop',
  },
  {
    path: 'images/workshops/the-game.jpg',
    category: 'workshop',
    tags: ['game', 'stadsspel'],
    caption: 'The Game - Stadsspel',
    altText: 'The Game stadsspel teambuilding',
  },
]

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
  }
  return mimeTypes[ext] || 'application/octet-stream'
}

async function migrateAsset(asset: (typeof ASSETS_TO_MIGRATE)[0], displayOrder: number) {
  const fullPath = path.join(FRONTEND_PUBLIC, asset.path)

  // Check if file exists
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Skipping (not found): ${asset.path}`)
    return null
  }

  const fileName = path.basename(asset.path)
  const fileBuffer = fs.readFileSync(fullPath)
  const fileSize = fileBuffer.length
  const mimeType = getMimeType(asset.path)

  console.log(`📤 Uploading: ${fileName} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`)

  try {
    // Upload to Vercel Blob
    const blob = await put(fileName, fileBuffer, {
      access: 'public',
      contentType: mimeType,
    })

    console.log(`✅ Uploaded: ${blob.url}`)

    // Insert into database
    const [inserted] = await db
      .insert(mediaGallery)
      .values({
        blobUrl: blob.url,
        fileName: fileName,
        fileSize: fileSize,
        mimeType: mimeType,
        caption: asset.caption,
        altText: asset.altText,
        category: asset.category as any,
        tags: asset.tags,
        displayOrder: displayOrder,
        showOnWebsite: true,
        isPublic: true,
      })
      .returning()

    console.log(`💾 DB record created: ID ${inserted.id}`)
    return inserted
  } catch (error) {
    console.error(`❌ Failed to migrate ${asset.path}:`, error)
    return null
  }
}

async function main() {
  console.log('🚀 Starting static asset migration...\n')
  console.log(`📁 Source: ${FRONTEND_PUBLIC}\n`)

  let successCount = 0
  let failCount = 0

  for (let i = 0; i < ASSETS_TO_MIGRATE.length; i++) {
    const asset = ASSETS_TO_MIGRATE[i]
    const result = await migrateAsset(asset, i)
    if (result) {
      successCount++
    } else {
      failCount++
    }
    console.log('')
  }

  console.log('━'.repeat(50))
  console.log(`✅ Successfully migrated: ${successCount}`)
  console.log(`❌ Failed/Skipped: ${failCount}`)
  console.log('━'.repeat(50))

  process.exit(0)
}

main().catch((error) => {
  console.error('Migration failed:', error)
  process.exit(1)
})
