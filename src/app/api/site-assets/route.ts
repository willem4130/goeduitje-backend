import { NextResponse } from 'next/server'
import { db } from '@/db'
import { mediaGallery } from '@/db/schema'
import { eq, or, sql } from 'drizzle-orm'

/**
 * GET /api/site-assets
 *
 * Returns all site assets (logos, hero videos/posters, OG images)
 * structured for easy frontend consumption.
 *
 * This endpoint is public and cached for performance.
 */
export async function GET() {
  try {
    // Fetch all site-* category items
    const items = await db
      .select()
      .from(mediaGallery)
      .where(
        or(
          eq(mediaGallery.category, 'site-logo'),
          eq(mediaGallery.category, 'site-hero-video'),
          eq(mediaGallery.category, 'site-hero-poster'),
          eq(mediaGallery.category, 'site-og')
        )
      )

    // Structure the response for easy frontend consumption
    const assets: {
      logos: { nav?: string; footer?: string }
      hero: {
        videos: { desktop?: { mp4?: string; webm?: string }; mobile?: { mp4?: string; webm?: string } }
        posters: { desktop?: string; mobile?: string }
      }
      og: { opengraph?: string; twitter?: string }
    } = {
      logos: {},
      hero: {
        videos: { desktop: {}, mobile: {} },
        posters: {},
      },
      og: {},
    }

    for (const item of items) {
      const tags = (item.tags as string[]) || []

      switch (item.category) {
        case 'site-logo':
          if (tags.includes('nav')) assets.logos.nav = item.blobUrl
          if (tags.includes('footer')) assets.logos.footer = item.blobUrl
          break

        case 'site-hero-poster':
          if (tags.includes('desktop')) assets.hero.posters.desktop = item.blobUrl
          if (tags.includes('mobile')) assets.hero.posters.mobile = item.blobUrl
          break

        case 'site-hero-video':
          if (tags.includes('desktop')) {
            if (tags.includes('mp4') || item.mimeType === 'video/mp4') {
              assets.hero.videos.desktop!.mp4 = item.blobUrl
            }
            if (tags.includes('webm') || item.mimeType === 'video/webm') {
              assets.hero.videos.desktop!.webm = item.blobUrl
            }
          }
          if (tags.includes('mobile')) {
            if (tags.includes('mp4') || item.mimeType === 'video/mp4') {
              assets.hero.videos.mobile!.mp4 = item.blobUrl
            }
            if (tags.includes('webm') || item.mimeType === 'video/webm') {
              assets.hero.videos.mobile!.webm = item.blobUrl
            }
          }
          break

        case 'site-og':
          if (tags.includes('og') || tags.includes('opengraph')) assets.og.opengraph = item.blobUrl
          if (tags.includes('twitter')) assets.og.twitter = item.blobUrl
          break
      }
    }

    // Return with cache headers (cache for 5 minutes, revalidate in background)
    return NextResponse.json(assets, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('GET /api/site-assets error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch site assets' },
      { status: 500 }
    )
  }
}
