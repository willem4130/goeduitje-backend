/**
 * Seed script to migrate SESSION_CHANGES.html data to database
 *
 * Run with: npm run seed:changes
 */

import { db } from '../src/db'
import { sessionChanges } from '../src/db/schema'
import { randomUUID } from 'crypto'

// Data extracted from SESSION_CHANGES.html
const changesData = [
  {
    title: 'Fake Reviews Verwijderd',
    description: 'Alle nep-testimonials zijn verwijderd. Alleen echte Google Reviews worden getoond.',
    category: 'Content',
    filesChanged: ['prisma/seed-testimonials.ts', 'src/app/page.tsx', 'src/app/onze-uitjes/page.tsx'],
    changeDetails: ['4 fake testimonials verwijderd', 'CompactTestimonials component verwijderd'],
    viewUrl: 'https://goeduitje-nl-rebuild.vercel.app/',
    status: 'approved' as const,
  },
  {
    title: 'Kookworkshop Prijzen Aangepast',
    description: 'Vanaf prijs en groepsgrootte aangepast.',
    category: 'Content',
    filesChanged: ['prisma/seed-workshops.ts'],
    changeDetails: ['Vanaf prijs: €30 → €55', 'Groepsgrootte: "8-30 personen" → "vanaf 8 personen"'],
    viewUrl: 'https://goeduitje-nl-rebuild.vercel.app/onze-uitjes/kookworkshop',
    status: 'approved' as const,
  },
  {
    title: 'Uitjes Grid Compacter',
    description: 'Alle 6 uitjes passen nu in een 3x2 matrix.',
    category: 'Design',
    filesChanged: ['src/components/workshop-carousel.tsx'],
    changeDetails: ['Grid layout: 3 kolommen', '16:9 aspect ratio afbeeldingen', 'Beschrijving verwijderd van cards'],
    viewUrl: 'https://goeduitje-nl-rebuild.vercel.app/onze-uitjes',
    status: 'approved' as const,
  },
  {
    title: 'Open Kookworkshops Tab met Agenda',
    description: 'Nieuwe tab voor particulieren met echte workshop data.',
    category: 'Feature',
    filesChanged: ['src/lib/open-workshops.ts', 'src/app/onze-uitjes/[slug]/page.tsx', 'src/app/booking/page.tsx'],
    changeDetails: ['Amber/oranje gradient design', 'Echte agenda met workshop data', 'Direct inschrijven knop'],
    viewUrl: 'https://goeduitje-nl-rebuild.vercel.app/onze-uitjes/kookworkshop#open-kookworkshops',
    status: 'approved' as const,
  },
  {
    title: 'Onze Uitjes Header Aangepast',
    description: 'Tekst en interactie verbeterd.',
    category: 'Content',
    filesChanged: ['src/app/onze-uitjes/page.tsx'],
    changeDetails: ['"Configureer" is nu klikbare button', '"en" veranderd naar "of"'],
    viewUrl: 'https://goeduitje-nl-rebuild.vercel.app/onze-uitjes',
    status: 'approved' as const,
  },
  {
    title: 'Pop-up voor Kleine Groepen',
    description: 'Modal verschijnt bij minder dan 8 personen.',
    category: 'Feature',
    filesChanged: ['src/components/workshop-configurator.tsx'],
    changeDetails: ['Popup na 800ms wachttijd', 'Toont eerste 3 workshop data', 'Prijs €50 p.p. incl. BTW'],
    viewUrl: 'https://goeduitje-nl-rebuild.vercel.app/onze-uitjes#configurator',
    status: 'approved' as const,
  },
  {
    title: 'Voorloop-0 Verwijderd uit Invoerveld',
    description: '"02" wordt automatisch "2".',
    category: 'Bug',
    filesChanged: ['src/components/workshop-configurator.tsx'],
    changeDetails: ['Automatische cleanup van leading zeros'],
    viewUrl: null,
    status: 'approved' as const,
  },
  {
    title: 'Telefoonnummer Verplicht + Redirect',
    description: 'Telefoonnummer is nu verplicht, redirect naar Ervaringen.',
    category: 'Feature',
    filesChanged: ['src/lib/validations/forms.ts', 'src/components/workshop-configurator.tsx'],
    changeDetails: ['Telefoonnummer is verplicht veld', 'Redirect naar Ervaringen pagina na submit'],
    viewUrl: 'https://goeduitje-nl-rebuild.vercel.app/onze-uitjes#configurator',
    status: 'approved' as const,
  },
  {
    title: 'Telefoonnummer in Navigatie + Footer',
    description: 'Contactnummer Guus toegevoegd aan navigatie en footer.',
    category: 'Navigatie',
    filesChanged: ['src/components/top-navigation.tsx', 'src/components/footer.tsx'],
    changeDetails: ['Telefoon icoon met nummer in navigatie', 'Telefoon in footer contactinfo'],
    viewUrl: 'https://goeduitje-nl-rebuild.vercel.app/',
    status: 'approved' as const,
  },
  {
    title: 'Booking Pagina Redesign',
    description: 'Volledig herontworpen met consistente styling.',
    category: 'Design',
    filesChanged: ['src/app/booking/page.tsx'],
    changeDetails: ['Hero sectie met primary gradient', 'Two-column layout', 'ScrollReveal animaties'],
    viewUrl: 'https://goeduitje-nl-rebuild.vercel.app/booking',
    status: 'approved' as const,
  },
  {
    title: 'Ons Verhaal Pagina - Magazine Redesign',
    description: 'Professionele magazine-stijl layout.',
    category: 'Design',
    filesChanged: ['src/app/ons-verhaal/page.tsx'],
    changeDetails: ['Magazine-stijl hero', 'Twee-koloms layout met iconen', 'Pull quote sectie'],
    viewUrl: 'https://goeduitje-nl-rebuild.vercel.app/ons-verhaal',
    status: 'approved' as const,
  },
  {
    title: 'Ons Verhaal - CMS Integratie',
    description: 'Pagina is nu beheerbaar via backend CMS.',
    category: 'Feature',
    filesChanged: ['src/app/content/ons-verhaal/page.tsx', 'src/app/api/content/ons-verhaal/route.ts'],
    changeDetails: ['12 bewerkbare content secties', 'Floating save bar', 'Completion badges'],
    viewUrl: 'https://goeduitje-backend.vercel.app/content/ons-verhaal',
    status: 'approved' as const,
  },
  {
    title: 'Contact Pagina Verbeterd',
    description: 'Directe contactmogelijkheden toegevoegd, footer opgeschoond.',
    category: 'Contact',
    filesChanged: ['src/components/contact-form.tsx', 'src/components/footer.tsx'],
    changeDetails: ['Contact formulier verwijderd uit footer', 'Mail + telefoon iconen in header', "Directe contact tekst met Guus' nummer"],
    viewUrl: 'https://goeduitje-nl-rebuild.vercel.app/contact',
    status: 'approved' as const,
  },
  {
    title: 'Mail Icoon in Top Navigatie',
    description: 'Mail icoon toegevoegd naast telefoon icoon.',
    category: 'Navigatie',
    filesChanged: ['src/components/top-navigation.tsx'],
    changeDetails: ['Mail icoon naast telefoon icoon', 'Klikbaar voor mailto link'],
    viewUrl: 'https://goeduitje-nl-rebuild.vercel.app/',
    status: 'approved' as const,
  },
  {
    title: 'Open Workshops Link Fix',
    description: 'Link in contactformulier verwees naar verkeerde URL.',
    category: 'Bug',
    filesChanged: ['src/components/contact-form.tsx'],
    changeDetails: ['Was: /open-kookworkshops', 'Nu: /booking'],
    viewUrl: null,
    status: 'approved' as const,
  },
  {
    title: 'Theory of Change - Onze Impact',
    description: 'Diagrammen herontworpen naar origineel design.',
    category: 'Design',
    filesChanged: ['src/components/theory-of-change.tsx', 'src/app/onze-impact/page.tsx'],
    changeDetails: ['5-kolom layout', 'Matching kleuren (Brown, Red, Gold)', 'SVG verbindingslijnen'],
    viewUrl: 'https://goeduitje-nl-rebuild.vercel.app/onze-impact',
    status: 'pending' as const, // Has a TODO note
  },
]

async function seed() {
  console.log('🌱 Seeding session changes...')

  for (const change of changesData) {
    await db.insert(sessionChanges).values({
      id: randomUUID(),
      title: change.title,
      description: change.description,
      category: change.category,
      filesChanged: change.filesChanged,
      changeDetails: change.changeDetails,
      viewUrl: change.viewUrl,
      status: change.status,
      addedBy: 'developer',
      updatedAt: new Date(),
    })
    console.log(`  ✓ ${change.title}`)
  }

  console.log(`\n✅ Seeded ${changesData.length} session changes`)
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  })
