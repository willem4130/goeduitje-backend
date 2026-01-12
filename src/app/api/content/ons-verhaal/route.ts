import { NextResponse } from 'next/server'
import { db } from '@/db'
import { pageContent } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'crypto'

const PAGE_NAME = 'ons-verhaal'

// Content structure definition for the Ons Verhaal page
export const ONS_VERHAAL_STRUCTURE = {
  hero: {
    label: 'Hero Sectie',
    description: 'De header van de pagina met titel en intro',
    fields: [
      { key: 'badge', label: 'Badge Tekst', type: 'text', placeholder: 'Sociale Onderneming' },
      { key: 'title', label: 'Titel', type: 'text', placeholder: 'Ons Verhaal' },
      { key: 'description', label: 'Beschrijving', type: 'textarea', placeholder: 'Wij zijn een sociale onderneming...' },
      { key: 'image_left', label: 'Afbeelding Links (URL)', type: 'url', placeholder: '/images/workshops/koffie-thee.jpg' },
      { key: 'image_right', label: 'Afbeelding Rechts (URL)', type: 'url', placeholder: '/images/workshops/the-game.jpg' },
      { key: 'floating_badge', label: 'Floating Badge Tekst', type: 'text', placeholder: 'Met passie gemaakt' },
    ],
  },
  video: {
    label: 'Video Sectie',
    description: 'Video showcase met titel en labels',
    fields: [
      { key: 'title', label: 'Sectie Titel', type: 'text', placeholder: 'Bekijk ons in actie' },
      { key: 'subtitle', label: 'Subtitel', type: 'text', placeholder: 'Een impressie van onze workshops en activiteiten' },
      { key: 'video_url', label: 'Video URL', type: 'url', placeholder: '/images/workshops/workshop 1.mp4' },
      { key: 'label', label: 'Video Label', type: 'text', placeholder: 'Kookworkshop' },
      { key: 'sublabel', label: 'Video Sublabel', type: 'text', placeholder: 'Samen koken, samen groeien' },
    ],
  },
  doen: {
    label: 'Doen & Bijzonder Eten',
    description: 'Eerste content sectie over de activiteiten',
    fields: [
      { key: 'title', label: 'Titel', type: 'text', placeholder: 'Doen én bijzonder eten' },
      { key: 'description', label: 'Beschrijving', type: 'textarea', placeholder: 'Onze bedrijfsuitjes bestaan uit...' },
      { key: 'image', label: 'Afbeelding URL', type: 'url', placeholder: '/images/workshops/beachvolleybal.jpg' },
      { key: 'image_label', label: 'Afbeelding Label', type: 'text', placeholder: 'Actieve teambuilding' },
    ],
  },
  ervaring: {
    label: 'Ervaring Opdoen',
    description: 'Sectie over werkervaring voor medewerkers',
    fields: [
      { key: 'title', label: 'Titel', type: 'text', placeholder: 'Ervaring opdoen' },
      { key: 'description1', label: 'Beschrijving 1', type: 'textarea', placeholder: 'Onze medewerkers organiseren en begeleiden...' },
      { key: 'description2', label: 'Beschrijving 2', type: 'textarea', placeholder: 'Dit biedt een praktische omgeving...' },
      { key: 'link_text', label: 'Link Tekst', type: 'text', placeholder: 'Benieuwd naar onze medewerkers?' },
    ],
  },
  culturen: {
    label: 'Nieuwe Culturen',
    description: 'Sectie over culturele uitwisseling',
    fields: [
      { key: 'title', label: 'Titel', type: 'text', placeholder: 'Nieuwe culturen leren kennen' },
      { key: 'description1', label: 'Beschrijving 1', type: 'textarea', placeholder: 'Tijdens onze workshops en activiteiten...' },
      { key: 'description2', label: 'Beschrijving 2', type: 'textarea', placeholder: 'Daarmee vergroten wij de kennis...' },
    ],
  },
  visie: {
    label: 'Onze Visie',
    description: 'Visie kaart in de rechter kolom',
    fields: [
      { key: 'title', label: 'Titel', type: 'text', placeholder: 'Onze visie' },
      { key: 'paragraph1', label: 'Paragraaf 1', type: 'textarea', placeholder: 'Wij streven naar een samenleving...' },
      { key: 'paragraph2', label: 'Paragraaf 2', type: 'textarea', placeholder: 'Door het potentieel van statushouders...' },
      { key: 'paragraph3', label: 'Paragraaf 3', type: 'textarea', placeholder: 'We zien een toekomst voor ons...' },
      { key: 'image', label: 'Afbeelding URL', type: 'url', placeholder: '/images/workshops/design-tshirt.jpg' },
      { key: 'image_label', label: 'Afbeelding Label', type: 'text', placeholder: 'Creatieve workshops' },
    ],
  },
  missie: {
    label: 'Onze Missie',
    description: 'Missie kaart in de rechter kolom',
    fields: [
      { key: 'title', label: 'Titel', type: 'text', placeholder: 'Onze missie' },
      { key: 'description', label: 'Beschrijving', type: 'textarea', placeholder: 'Het is onze missie om statushouders...' },
    ],
  },
  impact: {
    label: 'Onze Impact',
    description: 'Impact kaart met link naar impact pagina',
    fields: [
      { key: 'title', label: 'Titel', type: 'text', placeholder: 'Onze impact' },
      { key: 'description', label: 'Beschrijving', type: 'textarea', placeholder: 'Wil je meer weten over de impact...' },
      { key: 'footnote', label: 'Voetnoot', type: 'text', placeholder: 'Goeduitje is geregistreerd in de Code Sociale Ondernemingen.' },
    ],
  },
  quote: {
    label: 'Pull Quote',
    description: 'Inspirerend citaat sectie',
    fields: [
      { key: 'text', label: 'Citaat Tekst', type: 'textarea', placeholder: 'Samen bouwen we bruggen tussen culturen...' },
      { key: 'author', label: 'Auteur', type: 'text', placeholder: 'Goeduitje Team' },
    ],
  },
  teasers: {
    label: 'Teaser Kaarten',
    description: 'Meer Ontdekken sectie met links naar andere paginas',
    fields: [
      { key: 'section_title', label: 'Sectie Titel', type: 'text', placeholder: 'Meer Ontdekken' },
      { key: 'section_subtitle', label: 'Sectie Subtitel', type: 'text', placeholder: 'Leer meer over onze impact en ontmoet het team' },
      { key: 'impact_title', label: 'Impact Kaart Titel', type: 'text', placeholder: 'Onze Impact' },
      { key: 'impact_description', label: 'Impact Kaart Beschrijving', type: 'textarea', placeholder: 'Ontdek hoe we samen met statushouders...' },
      { key: 'team_title', label: 'Team Kaart Titel', type: 'text', placeholder: 'Onze Medewerkers' },
      { key: 'team_description', label: 'Team Kaart Beschrijving', type: 'textarea', placeholder: 'Ontmoet de mensen achter Goeduitje...' },
    ],
  },
  cta: {
    label: 'Call to Action',
    description: 'Onderste CTA sectie met knop',
    fields: [
      { key: 'title', label: 'Titel', type: 'text', placeholder: 'Klaar voor een uitje met impact?' },
      { key: 'description', label: 'Beschrijving', type: 'textarea', placeholder: 'Ontdek onze unieke bedrijfsuitjes...' },
      { key: 'button_text', label: 'Knop Tekst', type: 'text', placeholder: 'Bekijk onze uitjes' },
    ],
  },
  footnote: {
    label: 'Voetnoot',
    description: 'Definitie van statushouder onderaan de pagina',
    fields: [
      { key: 'text', label: 'Voetnoot Tekst', type: 'textarea', placeholder: '*statushouder: Asielzoeker die een verblijfsvergunning heeft...' },
    ],
  },
}

export async function GET() {
  try {
    // Get all content for the ons-verhaal page
    const items = await db
      .select()
      .from(pageContent)
      .where(eq(pageContent.page, PAGE_NAME))

    // Transform to nested object: { section: { key: value } }
    const content: Record<string, Record<string, string>> = {}
    for (const item of items) {
      if (!content[item.section]) {
        content[item.section] = {}
      }
      content[item.section][item.key] = item.value
    }

    return NextResponse.json({
      content,
      structure: ONS_VERHAAL_STRUCTURE,
    })
  } catch (error) {
    console.error('Failed to fetch ons-verhaal content:', error)
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { section, key, value } = body

    // Check if content exists
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
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update ons-verhaal content:', error)
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 })
  }
}

// Bulk update for saving all content at once
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { content } = body as { content: Record<string, Record<string, string>> }

    // Process each section/key
    for (const [section, fields] of Object.entries(content)) {
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
          await db
            .update(pageContent)
            .set({ value, updatedAt: new Date() })
            .where(eq(pageContent.id, existing[0].id))
        } else {
          await db.insert(pageContent).values({
            id: randomUUID(),
            page: PAGE_NAME,
            section,
            key,
            value,
            type: 'text',
            updatedAt: new Date(),
          })
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to bulk update ons-verhaal content:', error)
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 })
  }
}
