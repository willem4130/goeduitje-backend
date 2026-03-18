import { NextResponse } from 'next/server'
import { db } from '@/db'
import { workshopConfig } from '@/db/schema'
import { eq } from 'drizzle-orm'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const config = await db.select().from(workshopConfig).where(eq(workshopConfig.id, id)).limit(1)
    if (config.length === 0) {
      return NextResponse.json({ error: 'Workshop config not found' }, { status: 404 })
    }
    return NextResponse.json({ config: config[0] })
  } catch (error) {
    console.error('Failed to fetch workshop config:', error)
    return NextResponse.json({ error: 'Failed to fetch workshop config' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    await db.delete(workshopConfig).where(eq(workshopConfig.id, id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete workshop config:', error)
    return NextResponse.json({ error: 'Failed to delete workshop config' }, { status: 500 })
  }
}
