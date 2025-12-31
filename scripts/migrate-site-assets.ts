/**
 * Migration Script: Upload frontend static assets to Vercel Blob
 *
 * This script:
 * 1. Reads static files from frontend /public/ folder
 * 2. Uploads them to Vercel Blob
 * 3. Creates MediaGallery records in the database
 *
 * Run with: npx tsx scripts/migrate-site-assets.ts
 */

import { put } from '@vercel/blob'
import { db } from '../src/db'
import { mediaGallery } from '../src/db/schema'
import { eq, and } from 'drizzle-orm'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Frontend public directory (relative to this script)
const FRONTEND_PUBLIC = path.resolve(__dirname, '../../goeduitje-nl-rebuild/public')

// Assets to migrate with their metadata
const SITE_ASSETS = [
  // Logos
  {
    localPath: 'images/logo/logo-nav.png',
    blobPath: 'site/logo-nav.png',
    category: 'site-logo' as const,
    tags: ['nav'],
    altText: 'Goeduitje.nl navigation logo',
  },
  {
    localPath: 'images/logo/logo-footer.png',
    blobPath: 'site/logo-footer.png',
    category: 'site-logo' as const,
    tags: ['footer'],
    altText: 'Goeduitje.nl footer logo',
  },

  // Hero posters
  {
    localPath: 'images/hero/hero-poster.jpg',
    blobPath: 'site/hero-poster-desktop.jpg',
    category: 'site-hero-poster' as const,
    tags: ['desktop'],
    altText: 'Hero background image desktop',
  },
  {
    localPath: 'images/hero/hero-poster-mobile.jpg',
    blobPath: 'site/hero-poster-mobile.jpg',
    category: 'site-hero-poster' as const,
    tags: ['mobile'],
    altText: 'Hero background image mobile',
  },

  // Hero videos - MP4
  {
    localPath: 'videos/hero/hero-background.mp4',
    blobPath: 'site/hero-video-desktop.mp4',
    category: 'site-hero-video' as const,
    tags: ['desktop', 'mp4'],
    altText: 'Hero background video desktop',
  },
  {
    localPath: 'videos/hero/hero-background-mobile.mp4',
    blobPath: 'site/hero-video-mobile.mp4',
    category: 'site-hero-video' as const,
    tags: ['mobile', 'mp4'],
    altText: 'Hero background video mobile',
  },

  // Hero videos - WebM
  {
    localPath: 'videos/hero/hero-background.webm',
    blobPath: 'site/hero-video-desktop.webm',
    category: 'site-hero-video' as const,
    tags: ['desktop', 'webm'],
    altText: 'Hero background video desktop webm',
  },
  {
    localPath: 'videos/hero/hero-background-mobile.webm',
    blobPath: 'site/hero-video-mobile.webm',
    category: 'site-hero-video' as const,
    tags: ['mobile', 'webm'],
    altText: 'Hero background video mobile webm',
  },

  // OG Images
  {
    localPath: 'og-image.png',
    blobPath: 'site/og-image.png',
    category: 'site-og' as const,
    tags: ['og', 'opengraph'],
    altText: 'Goeduitje.nl Open Graph image',
  },
  {
    localPath: 'twitter-image.png',
    blobPath: 'site/twitter-image.png',
    category: 'site-og' as const,
    tags: ['twitter'],
    altText: 'Goeduitje.nl Twitter card image',
  },
]

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  const mimeTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
  }
  return mimeTypes[ext] || 'application/octet-stream'
}

async function migrateAsset(asset: typeof SITE_ASSETS[0]) {
  const fullPath = path.join(FRONTEND_PUBLIC, asset.localPath)

  // Check if file exists
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Skipping (not found): ${asset.localPath}`)
    return null
  }

  // Check if already migrated (by blobPath pattern)
  const existing = await db.select()
    .from(mediaGallery)
    .where(
      and(
        eq(mediaGallery.category, asset.category),
        eq(mediaGallery.fileName, path.basename(asset.blobPath))
      )
    )
    .limit(1)

  if (existing.length > 0) {
    console.log(`⏭️  Already exists: ${asset.localPath} → ${existing[0].blobUrl}`)
    return existing[0]
  }

  // Read file
  const fileBuffer = fs.readFileSync(fullPath)
  const mimeType = getMimeType(fullPath)

  console.log(`📤 Uploading: ${asset.localPath} (${(fileBuffer.length / 1024).toFixed(1)} KB)`)

  // Upload to Vercel Blob
  const blob = await put(asset.blobPath, fileBuffer, {
    access: 'public',
    contentType: mimeType,
  })

  console.log(`✅ Uploaded: ${blob.url}`)

  // Create database record
  const [media] = await db.insert(mediaGallery).values({
    blobUrl: blob.url,
    fileName: path.basename(asset.blobPath),
    fileSize: fileBuffer.length,
    mimeType,
    category: asset.category,
    tags: asset.tags,
    altText: asset.altText,
    isPublic: true,
    showOnWebsite: true,
  }).returning()

  console.log(`💾 DB record created: ID ${media.id}`)

  return media
}

async function main() {
  console.log('🚀 Starting site assets migration...\n')
  console.log(`📁 Frontend public: ${FRONTEND_PUBLIC}\n`)

  const results = {
    uploaded: 0,
    skipped: 0,
    alreadyExists: 0,
    errors: 0,
  }

  for (const asset of SITE_ASSETS) {
    try {
      const result = await migrateAsset(asset)
      if (result) {
        if (result.id) {
          results.uploaded++
        } else {
          results.alreadyExists++
        }
      } else {
        results.skipped++
      }
    } catch (error) {
      console.error(`❌ Error uploading ${asset.localPath}:`, error)
      results.errors++
    }
    console.log('')
  }

  console.log('📊 Migration Summary:')
  console.log(`   Uploaded: ${results.uploaded}`)
  console.log(`   Already existed: ${results.alreadyExists}`)
  console.log(`   Skipped (not found): ${results.skipped}`)
  console.log(`   Errors: ${results.errors}`)

  // Output the blob URLs for frontend config
  console.log('\n📋 Blob URLs for frontend:')
  const allMedia = await db.select()
    .from(mediaGallery)
    .where(eq(mediaGallery.category, 'site-logo'))

  const siteMedia = await db.select()
    .from(mediaGallery)
    .where(
      // Get all site-* categories
      eq(mediaGallery.isPublic, true)
    )

  for (const m of siteMedia) {
    if (m.category?.startsWith('site-')) {
      console.log(`   ${m.category} [${(m.tags as string[])?.join(', ')}]: ${m.blobUrl}`)
    }
  }

  process.exit(0)
}

main().catch((error) => {
  console.error('Migration failed:', error)
  process.exit(1)
})
