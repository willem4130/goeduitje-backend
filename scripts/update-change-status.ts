import { db } from '../src/db'
import { sessionChanges } from '../src/db/schema'
import { ilike, eq } from 'drizzle-orm'

/**
 * Update status of a wijzigingen item by title (case-insensitive partial match)
 *
 * Usage: npx tsx scripts/update-change-status.ts "title search" "new_status"
 * Example: npx tsx scripts/update-change-status.ts "alle recepten" "pending"
 *
 * Valid statuses: pending, approved, needs_changes, in_progress
 */

async function updateChangeStatus() {
  const [, , titleSearch, newStatus] = process.argv

  if (!titleSearch || !newStatus) {
    console.log('Usage: npx tsx scripts/update-change-status.ts "title search" "new_status"')
    console.log('')
    console.log('Valid statuses: pending, approved, needs_changes, in_progress')
    console.log('')
    console.log('Example: npx tsx scripts/update-change-status.ts "alle recepten" "pending"')
    process.exit(1)
  }

  const validStatuses = ['pending', 'approved', 'needs_changes', 'in_progress']
  if (!validStatuses.includes(newStatus)) {
    console.error(`❌ Invalid status: "${newStatus}"`)
    console.log(`Valid statuses: ${validStatuses.join(', ')}`)
    process.exit(1)
  }

  console.log(`🔍 Searching for items matching: "${titleSearch}"...`)

  // Find items matching the title (case-insensitive)
  const items = await db.select().from(sessionChanges)
    .where(ilike(sessionChanges.title, `%${titleSearch}%`))

  if (items.length === 0) {
    console.log('❌ No items found matching that title')
    process.exit(1)
  }

  console.log(`\nFound ${items.length} item(s):`)
  items.forEach((item, i) => {
    console.log(`  ${i + 1}. "${item.title}" (current status: ${item.status})`)
  })

  // Update all matching items
  console.log(`\n🔄 Updating status to "${newStatus}"...`)

  for (const item of items) {
    await db.update(sessionChanges)
      .set({
        status: newStatus as 'pending' | 'approved' | 'needs_changes' | 'in_progress',
        updatedAt: new Date()
      })
      .where(eq(sessionChanges.id, item.id))
    console.log(`  ✅ Updated: "${item.title}"`)
  }

  console.log('\n✅ Done!')
}

updateChangeStatus()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Failed:', error)
    process.exit(1)
  })
