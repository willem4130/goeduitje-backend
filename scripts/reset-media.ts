#!/usr/bin/env tsx

/**
 * Reset Media Script
 *
 * Deletes all media from database and Vercel Blob, then re-runs fresh migration.
 *
 * Usage:
 *   node --env-file=.env.local --import tsx/esm scripts/reset-media.ts
 *
 * What it does:
 * 1. Deletes all records from mediaGallery table
 * 2. Deletes all files from Vercel Blob (gallery/* path)
 * 3. Runs fresh migration from source images
 */

import { config } from 'dotenv'
import { join } from 'path'

// Load .env.local file before any other imports
config({ path: join(process.cwd(), '.env.local') })

import { db } from '../src/db/index.js'
import { mediaGallery } from '../src/db/schema.js'
import { list, del } from '@vercel/blob'
import { readFileSync, readdirSync, statSync } from 'fs'
import { put } from '@vercel/blob'
import sharp from 'sharp'

// Configuration
const FULL_BAND_GALLERY = '/Users/willemvandenberg/Dev/The Dutch Queen/dutch-queen-full-band-v4/public/gallery'
const UNPLUGGED_GALLERY = '/Users/willemvandenberg/Dev/The Dutch Queen/Queenwebsite_v3_UNPLUGGED/public/gallery'

interface ImageFile {
  path: string
  filename: string
  bandId: 'full-band' | 'unplugged'
  displayOrder: number
  fileSize: number
}

interface ImageMetadata {
  width: number
  height: number
  aspectRatio: string
}

/**
 * Step 1: Delete all database records
 */
async function deleteAllDatabaseRecords() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🗑️  STEP 1: Deleting all database records...')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  try {
    const existing = await db.select().from(mediaGallery)
    console.log(`   Found ${existing.length} records in database`)

    if (existing.length === 0) {
      console.log('   ✅ Database already empty')
      return
    }

    await db.delete(mediaGallery)
    console.log(`   ✅ Deleted ${existing.length} records from database`)
  } catch (error) {
    console.error('   ❌ Failed to delete database records:', error)
    throw error
  }
}

/**
 * Step 2: Delete all Vercel Blob files
 */
async function deleteAllBlobFiles() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🗑️  STEP 2: Deleting all Vercel Blob files...')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  try {
    // List all blobs in the gallery/ prefix
    const { blobs } = await list({ prefix: 'gallery/' })
    console.log(`   Found ${blobs.length} files in Vercel Blob`)

    if (blobs.length === 0) {
      console.log('   ✅ Blob storage already empty')
      return
    }

    // Delete all blobs
    let deletedCount = 0
    for (const blob of blobs) {
      try {
        await del(blob.url)
        deletedCount++
        console.log(`   🗑️  Deleted: ${blob.pathname}`)
      } catch (error) {
        console.error(`   ⚠️  Failed to delete ${blob.pathname}:`, error)
      }
    }

    console.log(`\n   ✅ Deleted ${deletedCount}/${blobs.length} files from Vercel Blob`)
  } catch (error) {
    console.error('   ❌ Failed to delete blob files:', error)
    throw error
  }
}

/**
 * Scan a directory and return image files with metadata
 */
function scanGalleryDirectory(dir: string, bandId: 'full-band' | 'unplugged'): ImageFile[] {
  console.log(`\n   📂 Scanning ${dir}...`)

  try {
    const files = readdirSync(dir)

    // Filter for webp images only (they're optimized and smaller)
    const imageFiles = files.filter(f => f.endsWith('.webp') && f.startsWith('gallery-'))

    console.log(`      Found ${imageFiles.length} gallery images`)

    return imageFiles.map(filename => {
      const path = join(dir, filename)
      const stats = statSync(path)

      // Extract number from filename (gallery-1.webp -> 1)
      const match = filename.match(/gallery-(\d+)\.webp/)
      const displayOrder = match ? parseInt(match[1], 10) : 999

      return {
        path,
        filename,
        bandId,
        displayOrder,
        fileSize: stats.size
      }
    }).sort((a, b) => a.displayOrder - b.displayOrder) // Sort by display order
  } catch (error) {
    console.error(`      ❌ Error scanning directory: ${error}`)
    return []
  }
}

/**
 * Extract image metadata (dimensions, aspect ratio) using sharp
 */
async function getImageMetadata(imagePath: string): Promise<ImageMetadata> {
  try {
    const metadata = await sharp(imagePath).metadata()

    const width = metadata.width || 0
    const height = metadata.height || 0

    // Calculate aspect ratio (e.g., "16:9", "4:3", "1:1")
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
    const divisor = gcd(width, height)
    const aspectRatio = `${width / divisor}:${height / divisor}`

    return { width, height, aspectRatio }
  } catch (error) {
    console.error(`      ⚠️  Could not extract metadata:`, error)
    return { width: 0, height: 0, aspectRatio: 'unknown' }
  }
}

/**
 * Upload an image to Vercel Blob
 */
async function uploadToBlob(image: ImageFile, metadata: ImageMetadata): Promise<string> {
  try {
    const fileBuffer = readFileSync(image.path)
    const blob = new Blob([fileBuffer], { type: 'image/webp' })

    // Generate a unique filename with band prefix
    const blobFilename = `gallery/${image.bandId}/${image.filename}`

    console.log(`      ⬆️  Uploading ${image.filename} (${(image.fileSize / 1024).toFixed(1)} KB, ${metadata.width}×${metadata.height}, ${metadata.aspectRatio})...`)

    const result = await put(blobFilename, blob, {
      access: 'public',
      contentType: 'image/webp'
    })

    console.log(`      ✅ Uploaded to ${result.url}`)
    return result.url
  } catch (error) {
    console.error(`      ❌ Failed to upload ${image.filename}:`, error)
    throw error
  }
}

/**
 * Insert media record into database
 */
async function insertMediaRecord(image: ImageFile, url: string, metadata: ImageMetadata): Promise<void> {
  try {
    await db.insert(mediaGallery).values({
      bandId: image.bandId,
      title: `Gallery Image ${image.displayOrder}`,
      description: null,
      url,
      thumbnailUrl: url, // Using same URL as we're already using webp
      type: 'image',
      category: 'gallery',
      tags: ['gallery', 'live', 'band'],
      fileSize: image.fileSize,
      mimeType: 'image/webp',
      width: metadata.width,
      height: metadata.height,
      displayOrder: image.displayOrder,
      uploadedBy: 'reset-media-script'
    })

    console.log(`      💾 Inserted database record for ${image.filename}`)
  } catch (error) {
    console.error(`      ❌ Failed to insert database record:`, error)
    throw error
  }
}

/**
 * Step 3: Re-run fresh migration
 */
async function runFreshMigration() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🔄 STEP 3: Running fresh migration...')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  // Scan directories
  const fullBandImages = scanGalleryDirectory(FULL_BAND_GALLERY, 'full-band')
  const unpluggedImages = scanGalleryDirectory(UNPLUGGED_GALLERY, 'unplugged')

  const allImages = [...fullBandImages, ...unpluggedImages]

  console.log('\n   📊 Summary:')
  console.log(`      Full Band: ${fullBandImages.length} images`)
  console.log(`      Unplugged: ${unpluggedImages.length} images`)
  console.log(`      Total: ${allImages.length} images`)
  console.log(`      Total size: ${(allImages.reduce((sum, img) => sum + img.fileSize, 0) / 1024 / 1024).toFixed(2)} MB`)

  console.log('\n   🔄 Starting upload...\n')

  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < allImages.length; i++) {
    const image = allImages[i]
    console.log(`\n   [${i + 1}/${allImages.length}] Processing ${image.bandId}/${image.filename}`)

    try {
      // Extract image metadata
      const metadata = await getImageMetadata(image.path)

      // Upload to Vercel Blob
      const url = await uploadToBlob(image, metadata)

      // Insert into database
      await insertMediaRecord(image, url, metadata)

      successCount++
      console.log(`      ✨ Success!`)
    } catch (error) {
      errorCount++
      console.error(`      💥 Failed to migrate ${image.filename}`)
      console.error(`      Error:`, error)

      // Continue with next image instead of stopping
      continue
    }
  }

  console.log('\n   📈 Migration Results:')
  console.log(`      ✅ Successful: ${successCount}`)
  console.log(`      ❌ Failed: ${errorCount}`)
  console.log(`      📊 Success rate: ${((successCount / allImages.length) * 100).toFixed(1)}%`)

  return { successCount, errorCount, totalImages: allImages.length }
}

/**
 * Main reset function
 */
async function resetMedia() {
  console.log('\n🔄 RESET MEDIA - FULL CLEANUP & FRESH MIGRATION')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // Verify environment
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('\n❌ ERROR: BLOB_READ_WRITE_TOKEN not found in environment variables')
    console.error('   Please make sure .env.local contains BLOB_READ_WRITE_TOKEN')
    process.exit(1)
  }

  if (!process.env.DATABASE_URL) {
    console.error('\n❌ ERROR: DATABASE_URL not found in environment variables')
    console.error('   Please make sure .env.local contains DATABASE_URL')
    process.exit(1)
  }

  console.log('✅ Environment variables verified\n')

  try {
    // Step 1: Delete all database records
    await deleteAllDatabaseRecords()

    // Step 2: Delete all Vercel Blob files
    await deleteAllBlobFiles()

    // Step 3: Re-run fresh migration
    const results = await runFreshMigration()

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n✅ RESET COMPLETE!\n')
    console.log(`📊 Final Results:`)
    console.log(`   ✅ Successfully migrated: ${results.successCount} images`)
    console.log(`   ❌ Failed: ${results.errorCount} images`)
    console.log(`   📈 Success rate: ${((results.successCount / results.totalImages) * 100).toFixed(1)}%`)
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    if (results.errorCount > 0) {
      console.log('⚠️  Some images failed to migrate. Check the error messages above.')
      process.exit(1)
    }

    process.exit(0)
  } catch (error) {
    console.error('\n💥 Fatal error during reset:')
    console.error(error)
    process.exit(1)
  }
}

// Run reset
resetMedia().catch(error => {
  console.error('\n💥 Fatal error:')
  console.error(error)
  process.exit(1)
})
