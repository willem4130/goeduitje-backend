/**
 * Migration Script: Assign Grid Positions to Existing Media
 *
 * This script auto-assigns grid positions (row, column, span) to all existing
 * media gallery images that don't have grid positions set.
 *
 * Default layout: 4 columns, sequential row assignment
 * All images default to span 1 (single cell)
 */

import { db } from '../src/db'
import { mediaGallery } from '../src/db/schema'
import { isNull, eq } from 'drizzle-orm'

const GRID_COLUMNS = 4 // 4-column grid

async function assignGridPositions() {
  console.log('🔍 Finding media items without grid positions...')

  // Get all media items without grid positions
  const mediaItems = await db
    .select()
    .from(mediaGallery)
    .where(isNull(mediaGallery.gridRow))
    .orderBy(mediaGallery.displayOrder, mediaGallery.createdAt)

  console.log(`📦 Found ${mediaItems.length} media items to update`)

  if (mediaItems.length === 0) {
    console.log('✅ All media items already have grid positions!')
    return
  }

  let updatedCount = 0

  // Assign grid positions sequentially
  for (let i = 0; i < mediaItems.length; i++) {
    const item = mediaItems[i]
    const row = Math.floor(i / GRID_COLUMNS)
    const column = i % GRID_COLUMNS

    await db
      .update(mediaGallery)
      .set({
        gridRow: row,
        gridColumn: column,
        gridSpan: 1, // Default span of 1
      })
      .where(eq(mediaGallery.id, item.id))

    updatedCount++
    console.log(
      `  ✓ Updated "${item.title || item.url}" → Row ${row}, Column ${column}, Span 1`
    )
  }

  console.log(`\n✅ Successfully assigned grid positions to ${updatedCount} media items!`)
  console.log(`\nGrid layout: ${GRID_COLUMNS} columns, ${Math.ceil(mediaItems.length / GRID_COLUMNS)} rows`)
}

// Run the script
assignGridPositions()
  .then(() => {
    console.log('\n✨ Migration complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  })
