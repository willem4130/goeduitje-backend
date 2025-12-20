import Anthropic from '@anthropic-ai/sdk'
import { buildSystemPrompt } from './prompt-builder'

interface WorkshopRequestData {
  contactName: string
  email: string
  phone?: string | null
  organization?: string | null
  activityType: string
  preferredDate?: string | null
  alternativeDate?: string | null
  participants: number
  ageGroup?: string | null
  location?: string | null
  hasOwnLocation?: boolean | null
  specialRequirements?: string | null
  dietaryRestrictions?: string | null
  accessibilityNeeds?: string | null
}

export async function generateQuoteEmail(requestData: WorkshopRequestData): Promise<string> {
  // Build dynamic system prompt from database
  const systemPrompt = await buildSystemPrompt({
    activityType: requestData.activityType,
    participants: requestData.participants,
    location: requestData.location
  })

  // Format workshop request data for Claude
  const userMessage = formatRequestForAI(requestData)

  // Initialize Anthropic client
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  // Call Claude API
  const message = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 2048,
    temperature: 0.7,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
  })

  // Extract text response
  const textContent = message.content.find((block) => block.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude API')
  }

  return textContent.text
}

function formatRequestForAI(data: WorkshopRequestData): string {
  const parts: string[] = []

  // Contact info
  parts.push(`Aanvraag van: ${data.contactName}`)
  parts.push(`Email: ${data.email}`)
  if (data.phone) parts.push(`Telefoon: ${data.phone}`)
  if (data.organization) parts.push(`Organisatie: ${data.organization}`)

  parts.push('') // Empty line

  // Workshop details
  parts.push(`Type activiteit: ${data.activityType === 'kookworkshop' ? 'Kookworkshop' : data.activityType === 'stadsspel' ? 'Stadsspel' : data.activityType}`)
  parts.push(`Aantal deelnemers: ${data.participants}`)

  if (data.preferredDate) {
    parts.push(`Gewenste datum: ${formatDate(data.preferredDate)}`)
  }
  if (data.alternativeDate) {
    parts.push(`Alternatieve datum: ${formatDate(data.alternativeDate)}`)
  }

  if (data.ageGroup) parts.push(`Leeftijdsgroep: ${data.ageGroup}`)

  parts.push('') // Empty line

  // Location
  if (data.location) {
    parts.push(`Locatie/plaats: ${data.location}`)
  }
  if (data.hasOwnLocation !== undefined) {
    parts.push(`Heeft eigen locatie: ${data.hasOwnLocation ? 'Ja' : 'Nee'}`)
  }

  parts.push('') // Empty line

  // Special requirements
  if (data.specialRequirements) {
    parts.push(`Bijzonderheden: ${data.specialRequirements}`)
  }
  if (data.dietaryRestrictions) {
    parts.push(`Dieetwensen/allergieën: ${data.dietaryRestrictions}`)
  }
  if (data.accessibilityNeeds) {
    parts.push(`Toegankelijkheid: ${data.accessibilityNeeds}`)
  }

  return parts.join('\n')
}

function formatDate(isoDate: string): string {
  try {
    const date = new Date(isoDate)
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
    return date.toLocaleDateString('nl-NL', options)
  } catch {
    return isoDate
  }
}
