import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { shows, mediaGallery, bandProfiles, contacts } from '@/db/schema'
import { eq } from 'drizzle-orm'

// Map frontend bandId to database bandId
const BAND_ID_MAP: Record<string, string> = {
  'the-dutch-queen': 'full-band',
  'the-dutch-queen-unplugged': 'unplugged',
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bandId: string }> }
) {
  try {
    const { bandId } = await params

    // Validate bandId
    if (!BAND_ID_MAP[bandId]) {
      return NextResponse.json(
        { error: 'Invalid band ID' },
        { status: 400 }
      )
    }

    const dbBandId = BAND_ID_MAP[bandId]

    // Load all data from database
    const [allShows, galleryMedia, bandProfile, contactInfo] = await Promise.all([
      db
        .select()
        .from(shows)
        .where(eq(shows.bandId, dbBandId))
        .orderBy(shows.date),
      db
        .select()
        .from(mediaGallery)
        .where(eq(mediaGallery.bandId, dbBandId))
        .orderBy(mediaGallery.displayOrder),
      db
        .select()
        .from(bandProfiles)
        .where(eq(bandProfiles.bandId, dbBandId))
        .limit(1)
        .then(rows => rows[0]),
      db
        .select()
        .from(contacts)
        .where(eq(contacts.bandId, dbBandId))
        .limit(1)
        .then(rows => rows[0])
    ])

    // Transform database shows to frontend format
    const transformedShows = allShows.map((show) => ({
      id: show.id.toString(),
      date: formatDateForFrontend(show.date),
      time: show.time,
      venue: {
        name: show.venueName,
        city: show.venueCity,
        country: show.venueCountry,
        address: show.venueAddress || undefined,
      },
      ticketUrl: show.ticketUrl || undefined,
      soldOut: show.soldOut,
    }))

    // Separate upcoming and past shows using isPast field from database
    const upcoming = transformedShows.filter((_, index) => !allShows[index].isPast)
    const past = transformedShows.filter((_, index) => allShows[index].isPast)

    // Check if band data exists
    if (!bandProfile || !contactInfo) {
      return NextResponse.json(
        { error: 'Band data not found' },
        { status: 404 }
      )
    }

    // Transform database data to frontend format
    const profile = {
      id: bandId,
      name: bandProfile.name,
      tagline: bandProfile.tagline || '',
      genre: bandProfile.genre || '',
      established: bandProfile.established || '',
      theme: bandProfile.theme || {},
      hero: bandProfile.hero || {},
      seo: bandProfile.seo || {},
      branding: bandProfile.branding || {}
    }

    const about = bandProfile.about || {
      title: 'About Us',
      descriptions: { short: '', medium: '', long: '' },
      story: { founding: '', mission: '', vision: '' },
      members: [],
      achievements: []
    }

    const social = (contactInfo.socialLinks as Record<string, string>) || {
      facebook: '',
      instagram: '',
      youtube: '',
      twitter: '',
      spotify: '',
      bandcamp: ''
    }

    const contact = {
      email: contactInfo.email,
      phone: contactInfo.phone || null,
      address: contactInfo.address || null
    }

    // Transform media to frontend format
    const transformedMedia = galleryMedia.map((media) => ({
      id: media.id.toString(),
      url: media.url,
      thumbnailUrl: media.thumbnailUrl || media.url,
      title: media.title || undefined,
      description: media.description || undefined,
      type: media.type,
      category: media.category || undefined,
      tags: (media.tags as string[]) || [],
      width: media.width || undefined,
      height: media.height || undefined,
    }))

    // Return complete BandContent
    return NextResponse.json({
      profile,
      about,
      social,
      contact,
      shows: {
        upcoming,
        past,
        settings: {
          showPastShows: true,
          maxUpcomingDisplay: 15,
          maxPastDisplay: 5,
          autoArchiveAfterDays: 7,
        },
      },
      gallery: {
        images: transformedMedia,
      },
    })
  } catch (error) {
    console.error('Error fetching band content:', error)
    return NextResponse.json(
      { error: 'Failed to fetch band content' },
      { status: 500 }
    )
  }
}

// Helper: Format date from ISO to frontend format (e.g., "Dec 11, 2025")
function formatDateForFrontend(isoDate: string): string {
  const date = new Date(isoDate + ' 12:00:00') // Add time to avoid timezone issues
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }
  return date.toLocaleDateString('en-US', options)
}
