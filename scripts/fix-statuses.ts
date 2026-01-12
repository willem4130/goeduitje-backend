/**
 * Fix statuses and add new in_progress items
 */

import { db } from '../src/db'
import { sessionChanges } from '../src/db/schema'
import { eq, like } from 'drizzle-orm'
import { randomUUID } from 'crypto'

async function fix() {
  console.log('🔧 Fixing statuses...')

  // 1. Reset all items to 'pending'
  await db.update(sessionChanges).set({ status: 'pending', updatedAt: new Date() })
  console.log('  ✓ All items set to pending')

  // 2. Set "Theory of Change" to in_progress
  await db.update(sessionChanges)
    .set({ status: 'in_progress', updatedAt: new Date() })
    .where(like(sessionChanges.title, '%Theory of Change%'))
  console.log('  ✓ Theory of Change set to in_progress')

  // 3. Add new in_progress items
  const newItems = [
    {
      id: randomUUID(),
      title: 'Alle recepten toevoegen',
      description: 'Recepten pagina vullen met echte recepten uit de workshops.',
      category: 'Content',
      filesChanged: ['prisma/seed-recipes.ts', 'src/app/recepten/page.tsx'],
      changeDetails: ['Recepten database vullen', 'Afbeeldingen toevoegen'],
      viewUrl: 'https://goeduitje-nl-rebuild.vercel.app/recepten',
      status: 'in_progress' as const,
      addedBy: 'developer',
      updatedAt: new Date(),
    },
    {
      id: randomUUID(),
      title: 'Alle SEO paginas toevoegen',
      description: 'SEO-geoptimaliseerde landingspaginas voor zoekwoorden.',
      category: 'Content',
      filesChanged: ['src/app/(seo)/', 'src/lib/seo-keywords.ts'],
      changeDetails: ['Kookworkshop landingspaginas', 'Locatie-specifieke paginas', 'Meta tags optimaliseren'],
      viewUrl: null,
      status: 'in_progress' as const,
      addedBy: 'developer',
      updatedAt: new Date(),
    },
  ]

  for (const item of newItems) {
    await db.insert(sessionChanges).values(item)
    console.log(`  ✓ Added: ${item.title}`)
  }

  console.log('\n✅ Done!')
}

fix()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Failed:', error)
    process.exit(1)
  })
