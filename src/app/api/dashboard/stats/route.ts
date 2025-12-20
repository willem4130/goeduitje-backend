import { NextResponse } from 'next/server'
import { db } from '@/db'
import { workshopRequests, confirmedWorkshops, feedback, mediaGallery } from '@/db/schema'
import { count, sql, and, eq } from 'drizzle-orm'

export async function GET(request: Request) {
  try {
    // Get pending workshop requests (status: 'leeg' or 'informatie verstrekt')
    const pendingRequestsResult = await db
      .select({ count: count() })
      .from(workshopRequests)
      .where(
        sql`${workshopRequests.status} IN ('leeg', 'informatie verstrekt')`
      )

    // Get quotes sent (status: 'offerte gemaakt')
    const quotesSentResult = await db
      .select({ count: count() })
      .from(workshopRequests)
      .where(eq(workshopRequests.status, 'offerte gemaakt'))

    // Get confirmed workshops count
    const confirmedWorkshopsResult = await db
      .select({ count: count() })
      .from(confirmedWorkshops)

    // Get total media items count
    const mediaItemsResult = await db
      .select({ count: count() })
      .from(mediaGallery)

    // Get recent workshop requests (last 5)
    const recentRequests = await db
      .select()
      .from(workshopRequests)
      .orderBy(sql`${workshopRequests.createdAt} DESC`)
      .limit(5)

    // Get requests by status
    const requestsByStatus = await db
      .select({
        status: workshopRequests.status,
        count: count(),
      })
      .from(workshopRequests)
      .groupBy(workshopRequests.status)

    return NextResponse.json({
      stats: {
        pendingRequests: pendingRequestsResult[0]?.count || 0,
        quotesSent: quotesSentResult[0]?.count || 0,
        confirmedWorkshops: confirmedWorkshopsResult[0]?.count || 0,
        mediaItems: mediaItemsResult[0]?.count || 0,
      },
      recentRequests,
      requestsByStatus: requestsByStatus.reduce((acc, item) => {
        acc[item.status] = item.count
        return acc
      }, {} as Record<string, number>),
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
