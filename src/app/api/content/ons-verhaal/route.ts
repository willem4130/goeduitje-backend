import { NextResponse } from 'next/server'
import { db } from '@/db'
import { pageContent } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { ONS_VERHAAL_STRUCTURE } from '@/lib/ons-verhaal-structure'

const PAGE_NAME = 'ons-verhaal'

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
