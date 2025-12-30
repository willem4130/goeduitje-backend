import { NextResponse } from 'next/server'
import { db } from '@/db'
import { pageContent } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'crypto'

// Settings structure
type Settings = {
  email: {
    fromName: string
    fromEmail: string
    replyTo: string
    ccAdmin: boolean
    adminEmail: string
  }
  ai: {
    enabled: boolean
    model: string
    autoSendQuotes: boolean
  }
  notifications: {
    newRequestEmail: boolean
    statusChangeEmail: boolean
    dailyDigest: boolean
  }
}

const DEFAULT_SETTINGS: Settings = {
  email: {
    fromName: 'Guus van den Elzen',
    fromEmail: 'guus@goeduitje.nl',
    replyTo: 'guus@goeduitje.nl',
    ccAdmin: true,
    adminEmail: 'info@goeduitje.nl'
  },
  ai: {
    enabled: true,
    model: 'claude-3-sonnet',
    autoSendQuotes: false
  },
  notifications: {
    newRequestEmail: true,
    statusChangeEmail: false,
    dailyDigest: false
  }
}

export async function GET() {
  try {
    // Fetch all settings from PageContent where page='settings'
    const items = await db.select()
      .from(pageContent)
      .where(eq(pageContent.page, 'settings'))

    // Build settings object from database
    const settings: Settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS))

    for (const item of items) {
      const section = item.section as keyof Settings
      const key = item.key
      const value = item.value

      if (settings[section] && key in settings[section]) {
        // Parse booleans
        if (value === 'true') {
          (settings[section] as Record<string, unknown>)[key] = true
        } else if (value === 'false') {
          (settings[section] as Record<string, unknown>)[key] = false
        } else {
          (settings[section] as Record<string, unknown>)[key] = value
        }
      }
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Failed to fetch settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { settings }: { settings: Settings } = body

    // Upsert each setting
    for (const [section, values] of Object.entries(settings)) {
      for (const [key, value] of Object.entries(values as Record<string, unknown>)) {
        const stringValue = String(value)

        // Check if exists
        const existing = await db.select()
          .from(pageContent)
          .where(and(
            eq(pageContent.page, 'settings'),
            eq(pageContent.section, section),
            eq(pageContent.key, key)
          ))

        if (existing.length > 0) {
          // Update
          await db.update(pageContent)
            .set({ value: stringValue, updatedAt: new Date() })
            .where(eq(pageContent.id, existing[0].id))
        } else {
          // Insert
          await db.insert(pageContent).values({
            id: randomUUID(),
            page: 'settings',
            section,
            key,
            value: stringValue,
            type: 'text',
            updatedAt: new Date()
          })
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save settings:', error)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
