import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { db } from '@/db'
import { mediaGallery, type NewMedia } from '@/db/schema'

// POST /api/media/upload - Upload media to Vercel Blob and save to database
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/') && !file.type.startsWith('audio/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images, videos, and audio are allowed.' },
        { status: 400 }
      )
    }

    // Upload to Vercel Blob
    const blob = await put(`media/${Date.now()}-${file.name}`, file, {
      access: 'public',
    })

    // Get image dimensions if it's an image
    let width: number | undefined
    let height: number | undefined

    // For images, we could extract dimensions here if needed
    // For now, we'll leave it to be set manually or via client-side extraction

    // Parse form data
    const caption = formData.get('caption') as string || null
    const altText = formData.get('altText') as string || null
    const category = formData.get('category') as string || 'workshop'
    const showOnWebsite = formData.get('showOnWebsite') === 'true'
    const featuredOnHomepage = formData.get('featuredOnHomepage') === 'true'
    const workshopId = formData.get('workshopId') ? parseInt(formData.get('workshopId') as string) : null

    // Create database record
    const newMedia: NewMedia = {
      workshopId,
      blobUrl: blob.url,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      width,
      height,
      caption,
      altText,
      category: category as 'workshop' | 'setup' | 'cooking' | 'results' | 'group' | 'food' | 'venue',
      isPublic: false,
      showOnWebsite,
      featuredOnHomepage,
      uploadedBy: 'admin', // Could be extracted from session if auth is implemented
    }

    const [media] = await db.insert(mediaGallery).values(newMedia).returning()

    return NextResponse.json(media, { status: 201 })
  } catch (error) {
    console.error('POST /api/media/upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload media' },
      { status: 500 }
    )
  }
}
