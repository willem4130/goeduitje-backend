/**
 * Seed script for Ons Verhaal page content
 * Run with: npx tsx scripts/seed-ons-verhaal.ts
 */

import { db } from '../src/db'
import { pageContent } from '../src/db/schema'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'crypto'

const PAGE_NAME = 'ons-verhaal'

// All default content for the Ons Verhaal page
const CONTENT = {
  hero: {
    badge: 'Sociale Onderneming',
    title: 'Ons Verhaal',
    description: 'Wij zijn een sociale onderneming waar statushouders* en asielzoekers uw bedrijfsuitjes organiseren en u een onvergetelijke dag bezorgen.',
    image_left: '/images/workshops/koffie-thee.jpg',
    image_right: '/images/workshops/the-game.jpg',
    floating_badge: 'Met passie gemaakt',
  },
  video: {
    title: 'Bekijk ons in actie',
    subtitle: 'Een impressie van onze workshops en activiteiten',
    video_url: '/images/workshops/workshop 1.mp4',
    label: 'Kookworkshop',
    sublabel: 'Samen koken, samen groeien',
  },
  doen: {
    title: 'Doen én bijzonder eten',
    description: 'Onze bedrijfsuitjes bestaan uit een mix van actieve en minder actieve Uitjes met vaak een cultureel tintje al dan niet gecombineerd met heerlijk eten uit de Arabische of Perzische keuken.',
    image: '/images/workshops/beachvolleybal.jpg',
    image_label: 'Actieve teambuilding',
  },
  ervaring: {
    title: 'Ervaring opdoen',
    description1: 'Onze medewerkers organiseren en begeleiden de workshops en activiteiten, waardoor zij kennismaken met de Nederlandse werkcultuur en gewoonten en contact hebben met deelnemers.',
    description2: 'Dit biedt een praktische omgeving om de taal te oefenen, vaardigheden te ontwikkelen voor de arbeidsmarkt, hun netwerk te vergroten en een waardevolle referentie op te bouwen voor een toekomstige baan bij een Nederlandse organisatie.',
    link_text: 'Benieuwd naar onze medewerkers?',
  },
  culturen: {
    title: 'Nieuwe culturen leren kennen',
    description1: 'Tijdens onze workshops en activiteiten stimuleren wij interactie tussen deelnemers en medewerkers om zodoende deelnemers kennis te laten maken met onze medewerkers, hun cultuur en hun achtergrond.',
    description2: 'Daarmee vergroten wij de kennis van deelnemers over de achtergrond en cultuur van onze medewerkers waardoor zij meer openstaan voor statushouders en asielzoekers en we onze samenleving inclusiever maken.',
  },
  visie: {
    title: 'Onze visie',
    paragraph1: 'Wij streven naar een samenleving waarin diversiteit wordt gevierd en iedereen gelijke kansen heeft op de arbeidsmarkt.',
    paragraph2: 'Door het potentieel van statushouders en asielzoekers te erkennen en te benutten, bouwen we bruggen tussen culturen en versterken we de sociale cohesie.',
    paragraph3: 'We zien een toekomst voor ons waarin onze organisatie een toonaangevende rol speelt in het creëren van inclusieve werkplekken, waar talenten uit alle hoeken van de wereld samenkomen en bijdragen aan gezamenlijke groei en welvaart.',
    image: '/images/workshops/design-tshirt.jpg',
    image_label: 'Creatieve workshops',
  },
  missie: {
    title: 'Onze missie',
    description: 'Het is onze missie om statushouders en asielzoekers in hun baan bij Goeduitje voor te bereiden op een baan die aansluit bij hun kennis, ervaring en interesses en Nederlanders kennis te laten maken met onze medewerkers en hun cultuur zodat zij statushouders en asielzoekers waarderen om hun kennis en kwaliteiten.',
  },
  impact: {
    title: 'Onze impact',
    description: 'Wil je meer weten over de impact die we gemaakt hebben en willen gaan maken? Over onze Theory of Change of onze jaarcijfers?',
    footnote: 'Goeduitje is geregistreerd in de Code Sociale Ondernemingen.',
  },
  quote: {
    text: 'Samen bouwen we bruggen tussen culturen en creëren we onvergetelijke ervaringen',
    author: 'Goeduitje Team',
  },
  teasers: {
    section_title: 'Meer Ontdekken',
    section_subtitle: 'Leer meer over onze impact en ontmoet het team',
    impact_title: 'Onze Impact',
    impact_description: 'Ontdek hoe we samen met statushouders en asielzoekers een positieve impact maken op de samenleving. Bekijk onze Theory of Change en jaarcijfers.',
    team_title: 'Onze Medewerkers',
    team_description: 'Ontmoet de mensen achter Goeduitje. Leer meer over hun achtergrond, cultuur en de unieke vaardigheden die zij meebrengen naar uw bedrijfsuitje.',
  },
  cta: {
    title: 'Klaar voor een uitje met impact?',
    description: 'Ontdek onze unieke bedrijfsuitjes en maak samen met ons het verschil.',
    button_text: 'Bekijk onze uitjes',
  },
  footnote: {
    text: '*statushouder: Asielzoeker die een verblijfsvergunning heeft en in Nederland mag blijven.',
  },
}

async function seed() {
  console.log('🌱 Seeding Ons Verhaal page content...\n')

  let created = 0
  let updated = 0

  for (const [section, fields] of Object.entries(CONTENT)) {
    for (const [key, value] of Object.entries(fields)) {
      // Check if exists
      const existing = await db
        .select()
        .from(pageContent)
        .where(
          and(
            eq(pageContent.page, PAGE_NAME),
            eq(pageContent.section, section),
            eq(pageContent.key, key)
          )
        )

      if (existing.length > 0) {
        // Update existing
        await db
          .update(pageContent)
          .set({ value, updatedAt: new Date() })
          .where(eq(pageContent.id, existing[0].id))
        updated++
        console.log(`  ✏️  Updated: ${section}.${key}`)
      } else {
        // Create new
        await db.insert(pageContent).values({
          id: randomUUID(),
          page: PAGE_NAME,
          section,
          key,
          value,
          type: 'text',
          updatedAt: new Date(),
        })
        created++
        console.log(`  ✅ Created: ${section}.${key}`)
      }
    }
  }

  console.log(`\n✨ Done! Created: ${created}, Updated: ${updated}`)
  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
