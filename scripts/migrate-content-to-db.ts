import { db } from '../src/db'
import { bandProfiles, contacts } from '../src/db/schema'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { eq } from 'drizzle-orm'

const BANDS = [
  { id: 'full-band', folder: 'the-dutch-queen' },
  { id: 'unplugged', folder: 'the-dutch-queen-unplugged' },
]

async function loadJson(path: string) {
  const content = await readFile(path, 'utf-8')
  return JSON.parse(content)
}

async function migrateContent() {
  console.log('Starting content migration...')

  for (const band of BANDS) {
    console.log(`\nMigrating ${band.id}...`)
    const contentPath = join(process.cwd(), 'content', band.folder)

    // Load JSON files
    const [profile, about, social, contact] = await Promise.all([
      loadJson(join(contentPath, 'band-profile.json')),
      loadJson(join(contentPath, 'data/about.json')),
      loadJson(join(contentPath, 'data/social.json')),
      loadJson(join(contentPath, 'data/contact.json')),
    ])

    // Upsert band profile
    const existingProfile = await db.select().from(bandProfiles).where(eq(bandProfiles.bandId, band.id))

    if (existingProfile.length > 0) {
      await db.update(bandProfiles)
        .set({
          name: profile.name,
          tagline: profile.tagline,
          genre: profile.genre,
          established: profile.established,
          theme: profile.theme,
          hero: profile.hero,
          seo: profile.seo,
          branding: profile.branding,
          about: about,
          updatedAt: new Date(),
        })
        .where(eq(bandProfiles.bandId, band.id))
      console.log(`Updated band profile for ${band.id}`)
    } else {
      await db.insert(bandProfiles).values({
        bandId: band.id,
        name: profile.name,
        tagline: profile.tagline,
        genre: profile.genre,
        established: profile.established,
        theme: profile.theme,
        hero: profile.hero,
        seo: profile.seo,
        branding: profile.branding,
        about: about,
      })
      console.log(`Created band profile for ${band.id}`)
    }

    // Upsert contact info
    const existingContact = await db.select().from(contacts).where(eq(contacts.bandId, band.id))

    if (existingContact.length > 0) {
      await db.update(contacts)
        .set({
          email: contact.email,
          phone: contact.phone,
          address: contact.address,
          socialLinks: social,
          updatedAt: new Date(),
        })
        .where(eq(contacts.bandId, band.id))
      console.log(`Updated contact info for ${band.id}`)
    } else {
      await db.insert(contacts).values({
        bandId: band.id,
        email: contact.email,
        phone: contact.phone,
        address: contact.address,
        socialLinks: social,
      })
      console.log(`Created contact info for ${band.id}`)
    }
  }

  console.log('\n✅ Content migration completed!')
}

migrateContent().catch((error) => {
  console.error('Migration failed:', error)
  process.exit(1)
})
