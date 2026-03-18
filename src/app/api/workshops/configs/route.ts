import { NextResponse } from 'next/server'
import { db } from '@/db'
import { workshopConfig } from '@/db/schema'
import { desc } from 'drizzle-orm'

export async function GET() {
  try {
    const configs = await db.select().from(workshopConfig).orderBy(desc(workshopConfig.createdAt))
    return NextResponse.json({ configs })
  } catch (error) {
    console.error('Failed to fetch workshop configs:', error)
    return NextResponse.json({ error: 'Failed to fetch workshop configs' }, { status: 500 })
  }
}
