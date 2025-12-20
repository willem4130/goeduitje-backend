import { db } from '../src/db'
import { mediaGallery } from '../src/db/schema'
import { sql } from 'drizzle-orm'

async function removeDuplicates() {
  console.log('Finding duplicate media items...')

  // Get all media items
  const allMedia = await db.select().from(mediaGallery)
  console.log(`Total media items: ${allMedia.length}`)

  // Group by URL to find duplicates
  const urlMap = new Map<string, typeof allMedia>()

  for (const item of allMedia) {
    if (!urlMap.has(item.url)) {
      urlMap.set(item.url, [])
    }
    urlMap.get(item.url)!.push(item)
  }

  // Find duplicates
  const duplicates: number[] = []
  for (const [url, items] of urlMap.entries()) {
    if (items.length > 1) {
      console.log(`\nDuplicate URL: ${url}`)
      console.log(`Found ${items.length} copies:`)
      items.forEach(item => console.log(`  - ID ${item.id}: ${item.title}`))

      // Keep the one with lowest ID (oldest), delete the rest
      const sorted = items.sort((a, b) => a.id - b.id)
      const toDelete = sorted.slice(1)
      duplicates.push(...toDelete.map(item => item.id))
      console.log(`  Keeping ID ${sorted[0].id}, deleting ${toDelete.map(i => i.id).join(', ')}`)
    }
  }

  if (duplicates.length === 0) {
    console.log('\nNo duplicates found!')
    return
  }

  console.log(`\n\nTotal duplicates to delete: ${duplicates.length}`)
  console.log('Deleting duplicates...')

  // Delete duplicates
  await db.delete(mediaGallery).where(
    sql`${mediaGallery.id} IN (${sql.join(duplicates.map(id => sql`${id}`), sql`, `)})`
  )

  console.log('✅ Duplicates removed!')

  // Show final count
  const remaining = await db.select().from(mediaGallery)
  console.log(`\nFinal media count: ${remaining.length}`)

  process.exit(0)
}

removeDuplicates().catch(console.error)
