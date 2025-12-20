import { NextResponse } from 'next/server'
import { db } from '@/db'
import { shows, campaigns, socialPosts, mediaGallery } from '@/db/schema'
import { count, sql, and, eq } from 'drizzle-orm'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const bandId = searchParams.get('bandId')

    // Build where clause for shows based on bandId filter
    const showsWhere = bandId && bandId !== 'all'
      ? and(eq(shows.isPast, false), eq(shows.bandId, bandId))
      : eq(shows.isPast, false)

    // Get upcoming shows count
    const upcomingShowsResult = await db
      .select({ count: count() })
      .from(shows)
      .where(showsWhere)

    // Get active campaigns count (not completed or cancelled)
    const activeCampaignsResult = await db
      .select({ count: count() })
      .from(campaigns)
      .where(
        and(
          sql`${campaigns.status} NOT IN ('completed', 'cancelled')`
        )
      )

    // Get scheduled social posts count
    const scheduledPostsResult = await db
      .select({ count: count() })
      .from(socialPosts)
      .where(eq(socialPosts.status, 'scheduled'))

    // Get total media items count
    const mediaItemsResult = await db
      .select({ count: count() })
      .from(mediaGallery)

    // Get recent shows (last 5 upcoming) with band filter
    const recentShows = await db
      .select()
      .from(shows)
      .where(showsWhere)
      .orderBy(sql`${shows.date} ASC`)
      .limit(5)

    // Get active campaigns by status
    const campaignsByStatus = await db
      .select({
        status: campaigns.status,
        count: count(),
      })
      .from(campaigns)
      .where(
        and(
          sql`${campaigns.status} NOT IN ('completed', 'cancelled')`
        )
      )
      .groupBy(campaigns.status)

    return NextResponse.json({
      stats: {
        upcomingShows: upcomingShowsResult[0]?.count || 0,
        activeCampaigns: activeCampaignsResult[0]?.count || 0,
        scheduledPosts: scheduledPostsResult[0]?.count || 0,
        mediaItems: mediaItemsResult[0]?.count || 0,
      },
      recentShows,
      campaignsByStatus: campaignsByStatus.reduce((acc, item) => {
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
