import { db } from '../src/db'
import { sessionChanges, sessionChangeStatusHistory } from '../src/db/schema'
import { eq, desc, ne, and } from 'drizzle-orm'

async function restore() {
  console.log('🔄 Restoring statuses from history...')
  console.log('')

  // Get all unique change IDs
  const allChanges = await db.select().from(sessionChanges)
  let restored = 0

  for (const change of allChanges) {
    // Get the most recent non-pending status from history (before reset)
    const [lastStatus] = await db
      .select()
      .from(sessionChangeStatusHistory)
      .where(
        and(
          eq(sessionChangeStatusHistory.changeId, change.id),
          ne(sessionChangeStatusHistory.status, 'pending')
        )
      )
      .orderBy(desc(sessionChangeStatusHistory.createdAt))
      .limit(1)

    if (lastStatus && lastStatus.status !== change.status) {
      await db.update(sessionChanges)
        .set({
          status: lastStatus.status,
          updatedAt: new Date(),
        })
        .where(eq(sessionChanges.id, change.id))

      console.log(`✅ ${change.title}: ${change.status} → ${lastStatus.status}`)
      restored++
    }
  }

  if (restored === 0) {
    console.log('ℹ️  No statuses to restore (all items already at latest status)')
  } else {
    console.log('')
    console.log(`✅ Restored ${restored} items to their previous status`)
  }
}

restore()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Failed:', error)
    process.exit(1)
  })
