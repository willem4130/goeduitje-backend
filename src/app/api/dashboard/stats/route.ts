import { NextResponse } from 'next/server'
import { db } from '@/db'
import { workshopRequests, confirmedWorkshops, mediaGallery } from '@/db/schema'
import { count, sql, eq } from 'drizzle-orm'

// Helper to safely query a table that might not exist
async function safeCount(queryFn: () => Promise<{ count: number }[]>): Promise<number> {
  try {
    const result = await queryFn()
    return result[0]?.count || 0
  } catch {
    return 0
  }
}

export async function GET() {
  try {
    // Get stats with fallbacks if tables don't exist
    const [pendingRequests, quotesSent, confirmedCount, mediaItems] = await Promise.all([
      safeCount(() => db.select({ count: count() }).from(workshopRequests)
        .where(sql`${workshopRequests.status} IN ('leeg', 'informatie verstrekt')`)),
      safeCount(() => db.select({ count: count() }).from(workshopRequests)
        .where(eq(workshopRequests.status, 'offerte gemaakt'))),
      safeCount(() => db.select({ count: count() }).from(confirmedWorkshops)),
      safeCount(() => db.select({ count: count() }).from(mediaGallery)),
    ])

    // Get recent workshop requests (last 5) - handle if table doesn't exist
    let recentRequests: unknown[] = []
    try {
      recentRequests = await db
        .select()
        .from(workshopRequests)
        .orderBy(sql`${workshopRequests.createdAt} DESC`)
        .limit(5)
    } catch {
      recentRequests = []
    }

    // Get requests by status - handle if table doesn't exist
    let requestsByStatus: Record<string, number> = {}
    try {
      const statusResults = await db
        .select({
          status: workshopRequests.status,
          count: count(),
        })
        .from(workshopRequests)
        .groupBy(workshopRequests.status)

      requestsByStatus = statusResults.reduce((acc, item) => {
        acc[item.status] = item.count
        return acc
      }, {} as Record<string, number>)
    } catch {
      requestsByStatus = {}
    }

    return NextResponse.json({
      stats: {
        pendingRequests,
        quotesSent,
        confirmedWorkshops: confirmedCount,
        mediaItems,
      },
      recentRequests,
      requestsByStatus,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    // Return empty stats instead of 500 error
    return NextResponse.json({
      stats: {
        pendingRequests: 0,
        quotesSent: 0,
        confirmedWorkshops: 0,
        mediaItems: 0,
      },
      recentRequests: [],
      requestsByStatus: {},
    })
  }
}
