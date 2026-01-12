import { db } from '../src/db'
import { sessionChanges, sessionChangeStatusHistory } from '../src/db/schema'
import { ne } from 'drizzle-orm'
import { randomUUID } from 'crypto'

async function reset() {
  console.log('🔧 Resetting statuses to pending (except in_progress)...')
  console.log('⚠️  WARNING: This will reset all client approvals/rejections!')
  console.log('')

  // First, backup ALL current statuses to history
  const allItems = await db.select().from(sessionChanges)
  console.log(`📦 Backing up ${allItems.length} items to status history...`)

  for (const item of allItems) {
    await db.insert(sessionChangeStatusHistory).values({
      id: randomUUID(),
      changeId: item.id,
      status: item.status,
      changedBy: 'system',
      note: 'Backup before reset script',
    })
  }
  console.log('✅ Backup complete!')

  // Reset all non-in_progress items to pending
  const result = await db.update(sessionChanges)
    .set({ status: 'pending', updatedAt: new Date() })
    .where(ne(sessionChanges.status, 'in_progress'))
    .returning()

  console.log(`✅ Reset ${result.length} items to pending`)
  console.log('')
  console.log('💡 To restore statuses, run: npm run restore:statuses')
}

reset()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Failed:', error)
    process.exit(1)
  })
