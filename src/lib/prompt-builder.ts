import { db } from '@/db'
import { activities, pricingTiers, locations, drinksPricing } from '@/db/schema'
import { eq, and, lte, gte, sql, or } from 'drizzle-orm'
import fs from 'fs/promises'
import path from 'path'

/**
 * Builds a dynamic system prompt for quote generation
 * Queries database for activities, locations, and pricing
 */
export async function buildSystemPrompt(workshopRequest: {
  activityType: string
  participants: number
  location?: string | null
}): Promise<string> {
  // Load base prompt template
  const promptTemplatePath = path.join(process.cwd(), 'src', 'prompts', 'guus-quote-prompt-template.txt')
  const baseTemplate = await fs.readFile(promptTemplatePath, 'utf-8')

  // Query database for dynamic data
  const [activityData, locationData, pricingData] = await Promise.all([
    getActivityInfo(workshopRequest.activityType),
    getLocationInfo(workshopRequest.location, workshopRequest.participants),
    getPricingInfo(workshopRequest.activityType, workshopRequest.participants)
  ])

  // Build dynamic sections
  const pricingSection = buildPricingSection(pricingData)
  const locationsSection = buildLocationsSection(locationData)
  const activitySection = buildActivitySection(activityData)

  // Combine template with dynamic data
  const systemPrompt = `${baseTemplate}

${activitySection}

${pricingSection}

${locationsSection}

Gebruik bovenstaande richtlijnen en schrijf een antwoordmail op onderstaande aanvraag:`

  return systemPrompt
}

async function getActivityInfo(activityType: string) {
  const activity = await db
    .select()
    .from(activities)
    .where(eq(activities.category, activityType))
    .limit(1)

  return activity[0] || null
}

async function getLocationInfo(city?: string | null, participants?: number) {
  // Build where conditions
  const whereConditions = [eq(locations.isActive, true)]
  if (city) {
    whereConditions.push(eq(locations.city, city))
  }

  const results = await db
    .select({
      location: locations,
      drinks: drinksPricing
    })
    .from(locations)
    .leftJoin(drinksPricing, eq(drinksPricing.locationId, locations.id))
    .where(and(...whereConditions))

  // Group by location
  const locationMap = new Map()
  for (const row of results) {
    const locId = row.location.id
    if (!locationMap.has(locId)) {
      locationMap.set(locId, {
        ...row.location,
        drinks: []
      })
    }
    if (row.drinks) {
      locationMap.get(locId).drinks.push(row.drinks)
    }
  }

  return Array.from(locationMap.values())
}

async function getPricingInfo(activityType: string, participants: number) {
  // First get the activity ID
  const activity = await db
    .select()
    .from(activities)
    .where(eq(activities.category, activityType))
    .limit(1)

  if (!activity[0]) return null

  // Get pricing tiers for this activity
  const tiers = await db
    .select()
    .from(pricingTiers)
    .where(eq(pricingTiers.activityId, activity[0].id))
    .orderBy(pricingTiers.minParticipants)

  return {
    activity: activity[0],
    tiers,
    applicableTier: findApplicableTier(tiers, participants)
  }
}

function findApplicableTier(tiers: any[], participants: number) {
  for (const tier of tiers) {
    if (participants >= tier.minParticipants) {
      if (!tier.maxParticipants || participants <= tier.maxParticipants) {
        return tier
      }
    }
  }
  return null
}

function buildActivitySection(activity: any): string {
  if (!activity) return ''

  return `4. Beschrijving activiteiten
- **${activity.activityName}**: ${activity.description || 'Interactieve workshop waarbij deelnemers samen werken.'}`
}

function buildPricingSection(pricingData: any): string {
  if (!pricingData || !pricingData.tiers) return ''

  const { activity, tiers } = pricingData

  let section = `5. Automatische prijs ${activity.activityName}\n`

  for (const tier of tiers) {
    const range = tier.maxParticipants
      ? `${tier.minParticipants}–${tier.maxParticipants} personen`
      : `${tier.minParticipants}+ personen`

    if (tier.pricePerPerson) {
      const priceExcl = parseFloat(tier.pricePerPerson)
      const priceIncl = (priceExcl * 1.21).toFixed(2)
      section += `- ${range} → € ${priceExcl.toFixed(0)} excl. btw (€ ${priceIncl} incl. btw) p.p.\n`
    } else if (tier.totalPrice) {
      const priceExcl = parseFloat(tier.totalPrice)
      const priceIncl = (priceExcl * 1.21).toFixed(2)
      section += `- ${range} → € ${priceExcl.toFixed(0)} excl. btw (€ ${priceIncl} incl. btw)\n`
    }
  }

  section += `- Vermeld altijd dat dit exclusief drankjes en locatiehuur is. Geef aan dat het afhankelijk is van de locatie of dat drankjes bij de locatie besteld moeten worden of dat de klant deze zelf mag meenemen. Als het toegestaan is de drankjes zelf mee te nemen dan kan Goeduitje de drank verzorgen voor de klant.\n`

  return section
}

function buildLocationsSection(locationData: any[]): string {
  if (!locationData || locationData.length === 0) return ''

  let section = `6. Locatie-opties\n`
  section += `- Als de klant specifiek aangeeft dat zij geen geschikte locatie hebben of vraagt of wij een locatie hebben, noem dan niet meer dat we bij hen op locatie kunnen koken. Als de klant niet specifiek aangeeft dat zij geen geschikte locatie hebben, benoem dan dat wij bij hen op locatie kunnen koken. Geef daarbij aan dat wij alle benodigdheden voor het koken dan meenemen.\n`
  section += `- Als klant een stad of gemeente noemt die hieronder staat → geef de bijbehorende opties met juiste capaciteit, kosten en drankregeling. Noem dan niet het maximaal aantal personen voor betreffende locatie(s).\n`
  section += `- Als klant géén stad noemt → vraag of de klant de workshop in een bepaalde stad of gemeente wil doen, geef aan dat we in verschillende steden zoals bijvoorbeeld`

  const cities = [...new Set(locationData.map(l => l.city))]
  section += ` ${cities.join(', ')} locaties hebben waar we regelmatig koken.\n`
  section += `- Als klant een andere gemeente noemt → vermeld dat indien ze zelf geen locatie hebben, jullie samen kunnen zoeken naar een geschikte locatie.\n\n`
  section += `**Locatiegegevens:**\n`

  // Group by city
  type LocationWithDrinks = typeof locationData[0]
  const byCity = locationData.reduce((acc, loc) => {
    if (!acc[loc.city]) acc[loc.city] = []
    acc[loc.city].push(loc)
    return acc
  }, {} as Record<string, LocationWithDrinks[]>)

  for (const city of Object.keys(byCity)) {
    const locs = byCity[city]
    section += `- **${city}**\n`
    for (const loc of locs) {
      section += `  - ${loc.locationName} → `
      if (loc.maxCapacity) {
        section += `t/m ${loc.maxCapacity} personen, `
      }
      section += `€ ${parseFloat(loc.basePriceExclVat).toFixed(0)} excl. btw (€ ${parseFloat(loc.basePriceInclVat).toFixed(0)} incl.)`

      // Add drinks policy
      if (loc.drinksPolicy === 'flexible' && loc.goeduitjeDrinksAvailable) {
        section += `, drank zelf meenemen of door Goeduitje verzorgd (supermarktprijzen +50%).`
      } else if (loc.drinksPolicy === 'via_location' || loc.drinksPolicy === 'mandatory_via_location') {
        section += `, drank via locatie`

        // Add drink prices if available
        if (loc.drinks && loc.drinks.length > 0) {
          section += `, indicatie prijzen: `
          const drinkPrices = loc.drinks.map((d: any) => {
            const price = d.priceInclVat ? parseFloat(d.priceInclVat).toFixed(2) : '?'
            return `${d.itemName} €${price}`
          })
          section += drinkPrices.join(' | ')
        }
        section += `.`
      }
      section += `\n`
    }
  }

  return section
}
