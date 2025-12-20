import { generateQuoteEmail } from './src/lib/ai.ts'

const testRequest = {
  contactName: 'Jan de Vries',
  email: 'jan@example.nl',
  phone: '06-12345678',
  organization: 'Bedrijf XYZ',
  activityType: 'kookworkshop',
  preferredDate: '2025-02-15',
  participants: 12,
  location: 'Nijmegen',
  hasOwnLocation: false,
  dietaryRestrictions: 'Vegetarische opties graag',
  specialRequirements: 'Kunnen we de workshop in de middag doen?'
}

console.log('Testing AI Quote Generation...')
console.log('Test Request:', testRequest)
console.log('\nGenerating email...\n')

try {
  const email = await generateQuoteEmail(testRequest)
  console.log('='.repeat(80))
  console.log('GENERATED EMAIL:')
  console.log('='.repeat(80))
  console.log(email)
  console.log('='.repeat(80))
  console.log('\n✅ Email generated successfully!')
} catch (error) {
  console.error('❌ Error:', error.message)
  console.error(error)
}
