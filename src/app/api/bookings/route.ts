import { NextResponse } from 'next/server'
import { db } from '@/db'
import { booking } from '@/db/schema'
import { desc } from 'drizzle-orm'

export async function GET() {
  try {
    const allBookings = await db
      .select()
      .from(booking)
      .orderBy(desc(booking.createdAt))

    return NextResponse.json({ bookings: allBookings })
  } catch (error) {
    console.error('Failed to fetch bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}
