/**
 * Update isPast field for all shows based on current date
 * Run this script daily via cron or manually when needed
 */

import { db } from '../src/db'
import { shows } from '../src/db/schema'
import { sql } from 'drizzle-orm'

async function updatePastShows() {
  console.log('🔄 Updating isPast field for all shows...')

  try {
    // Get today's date in YYYY-MM-DD format (local timezone)
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    console.log(`📅 Today's date: ${todayStr}`)

    // Update shows where date < today AND isPast = false
    const markAsPast = await db
      .update(shows)
      .set({ isPast: true })
      .where(sql`${shows.date} < ${todayStr} AND ${shows.isPast} = false`)
      .returning({ id: shows.id, title: shows.title, date: shows.date })

    // Update shows where date >= today AND isPast = true (in case manually set)
    const markAsUpcoming = await db
      .update(shows)
      .set({ isPast: false })
      .where(sql`${shows.date} >= ${todayStr} AND ${shows.isPast} = true`)
      .returning({ id: shows.id, title: shows.title, date: shows.date })

    console.log(`\n✅ Updated ${markAsPast.length} shows to PAST`)
    if (markAsPast.length > 0) {
      markAsPast.forEach((show) => {
        console.log(`   - ${show.title} (${show.date})`)
      })
    }

    console.log(`\n✅ Updated ${markAsUpcoming.length} shows to UPCOMING`)
    if (markAsUpcoming.length > 0) {
      markAsUpcoming.forEach((show) => {
        console.log(`   - ${show.title} (${show.date})`)
      })
    }

    console.log('\n✨ Update complete!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error updating shows:', error)
    process.exit(1)
  }
}

updatePastShows()
