import { NextResponse } from 'next/server'
import { db } from '@/db'
import { workshopRequests } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { generateQuoteEmail } from '@/lib/ai'
import { buildSystemPrompt } from '@/lib/prompt-builder'

type RouteParams = {
  params: Promise<{ id: string }>
}

export async function POST(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const requestId = parseInt(id, 10)

    if (isNaN(requestId)) {
      return NextResponse.json({ error: 'Invalid request ID' }, { status: 400 })
    }

    // Fetch workshop request
    const workshopRequest = await db
      .select()
      .from(workshopRequests)
      .where(eq(workshopRequests.id, requestId))
      .limit(1)

    if (workshopRequest.length === 0) {
      return NextResponse.json({ error: 'Workshop request not found' }, { status: 404 })
    }

    const requestData = workshopRequest[0]

    // Generate preview email
    const emailContent = await generateQuoteEmail({
      contactName: requestData.contactName,
      email: requestData.email,
      phone: requestData.phone,
      organization: requestData.organization,
      activityType: requestData.activityType,
      preferredDate: requestData.preferredDate,
      alternativeDate: requestData.alternativeDate,
      participants: requestData.participants,
      ageGroup: requestData.ageGroup,
      location: requestData.location,
      hasOwnLocation: requestData.hasOwnLocation,
      specialRequirements: requestData.specialRequirements,
      dietaryRestrictions: requestData.dietaryRestrictions,
      accessibilityNeeds: requestData.accessibilityNeeds,
    })

    // Build dynamic system prompt for display
    const systemPrompt = await buildSystemPrompt({
      activityType: requestData.activityType || '',
      participants: requestData.participants || 0,
      location: requestData.location,
    })

    return NextResponse.json({
      email: emailContent,
      systemPrompt,
      apiModel: 'claude-3-haiku-20240307',
      temperature: 0.7,
      maxTokens: 2048,
      previewNote: '⚠️ Dit is een preview - GEEN email is verstuurd naar de klant',
    })
  } catch (error) {
    console.error('Preview quote generation failed:', error)
    return NextResponse.json(
      { error: 'Failed to generate quote preview', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
