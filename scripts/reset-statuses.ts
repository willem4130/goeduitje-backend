import { db } from '../src/db'
import { sessionChanges } from '../src/db/schema'
import { ne } from 'drizzle-orm'

async function reset() {
  console.log('🔧 Resetting statuses to pending (except in_progress)...')

  // Reset all non-in_progress items to pending
  const result = await db.update(sessionChanges)
    .set({ status: 'pending', updatedAt: new Date() })
    .where(ne(sessionChanges.status, 'in_progress'))
    .returning()

  console.log(`✅ Reset ${result.length} items to pending`)
}

reset()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Failed:', error)
    process.exit(1)
  })
