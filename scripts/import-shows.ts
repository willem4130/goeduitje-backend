import { db } from '../src/db'
import { shows } from '../src/db/schema'
import * as fs from 'fs'
import * as path from 'path'

const FULL_BAND_JSON = path.join(__dirname, '../../dutch-queen-full-band-v4/content/bands/the-dutch-queen/data/shows.json')
const UNPLUGGED_JSON = path.join(__dirname, '../../Queenwebsite_v3_UNPLUGGED/content/bands/the-dutch-queen-unplugged/data/shows.json')

function parseDate(dateStr: string): string {
  // Convert "Dec 4, 2025" to "2025-12-04"
  // Parse in local timezone to avoid date shifting
  const date = new Date(dateStr + ' 12:00:00')
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function importShows() {
  console.log('Importing shows from JSON files...\n')

  // Import Full Band shows
  if (fs.existsSync(FULL_BAND_JSON)) {
    const fullBandData = JSON.parse(fs.readFileSync(FULL_BAND_JSON, 'utf-8'))
    const upcomingShows = fullBandData.upcoming || []
    const pastShows = fullBandData.past || []
    const allShows = [...upcomingShows, ...pastShows]

    console.log(`Found ${allShows.length} Full Band shows (${upcomingShows.length} upcoming, ${pastShows.length} past)`)

    for (const show of allShows) {
      const showDate = parseDate(show.date)
      const isPast = new Date(showDate) < new Date()
      const soldOut = show.status === 'sold-out'

      await db.insert(shows).values({
        bandId: 'full-band',
        title: `The Dutch Queen at ${show.venue}`,
        date: showDate,
        time: show.time || '20:00',
        venueName: show.venue,
        venueCity: show.city,
        venueCountry: 'Netherlands',
        venueAddress: null,
        ticketUrl: show.ticketUrl || null,
        soldOut: soldOut,
        featured: false,
        isPast: isPast,
        createdAt: new Date().toISOString(),
      })

      console.log(`  ✓ Imported: ${show.venue} - ${show.date}`)
    }
  }

  // Import Unplugged shows
  if (fs.existsSync(UNPLUGGED_JSON)) {
    const unpluggedData = JSON.parse(fs.readFileSync(UNPLUGGED_JSON, 'utf-8'))
    const upcomingShows = unpluggedData.upcoming || []
    const pastShows = unpluggedData.past || []
    const allShows = [...upcomingShows, ...pastShows]

    console.log(`\nFound ${allShows.length} Unplugged shows (${upcomingShows.length} upcoming, ${pastShows.length} past)`)

    for (const show of allShows) {
      const showDate = parseDate(show.date)
      const isPast = new Date(showDate) < new Date()
      const soldOut = show.status === 'sold-out'

      await db.insert(shows).values({
        bandId: 'unplugged',
        title: `The Dutch Queen Unplugged at ${show.venue}`,
        date: showDate,
        time: show.time || '20:00',
        venueName: show.venue,
        venueCity: show.city,
        venueCountry: 'Netherlands',
        venueAddress: null,
        ticketUrl: show.ticketUrl || null,
        soldOut: soldOut,
        featured: false,
        isPast: isPast,
        createdAt: new Date().toISOString(),
      })

      console.log(`  ✓ Imported: ${show.venue} - ${show.date}`)
    }
  }

  console.log('\n✅ Import complete!')
  process.exit(0)
}

importShows().catch(err => {
  console.error('❌ Import failed:', err)
  process.exit(1)
})
