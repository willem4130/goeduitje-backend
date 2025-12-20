import dotenv from 'dotenv'
import { generateQuoteEmail } from './src/lib/ai'
import { generateQuotePDF } from './src/lib/pdf'
import fs from 'fs/promises'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Debug: Check if API key is loaded
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY not found in environment!')
  process.exit(1)
}
console.log('✅ API keys loaded successfully\n')

const testRequest = {
  id: 999,
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
  specialRequirements: 'Kunnen we de workshop in de middag doen?',
  ageGroup: null,
  alternativeDate: null,
  accessibilityNeeds: null,
  quotedPrice: null,
  locationFee: null,
  finalPrice: null,
  priceIncludesVat: null,
}

async function test() {
  console.log('🧪 Testing Quote Generation System\n')
  console.log('Test Request:', JSON.stringify(testRequest, null, 2))
  console.log('\n' + '='.repeat(80))

  try {
    // Test 1: AI Email Generation
    console.log('\n📧 Step 1: Generating AI Email with Guus prompt...\n')
    const email = await generateQuoteEmail(testRequest)

    console.log('✅ Email generated successfully!')
    console.log('\n' + '='.repeat(80))
    console.log('GENERATED EMAIL CONTENT:')
    console.log('='.repeat(80))
    console.log(email)
    console.log('='.repeat(80))

    // Save email to file
    await fs.writeFile('test-output-email.txt', email, 'utf-8')
    console.log('\n💾 Email saved to: test-output-email.txt')

    // Test 2: PDF Generation
    console.log('\n📄 Step 2: Generating PDF Quote...\n')
    const pdfBuffer = await generateQuotePDF(testRequest, email)

    console.log('✅ PDF generated successfully!')
    console.log(`📊 PDF size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`)

    // Save PDF to file
    await fs.writeFile('test-output-quote.pdf', pdfBuffer)
    console.log('💾 PDF saved to: test-output-quote.pdf')

    console.log('\n' + '='.repeat(80))
    console.log('🎉 ALL TESTS PASSED!')
    console.log('='.repeat(80))
    console.log('\nGenerated files:')
    console.log('  - test-output-email.txt  (AI-generated email)')
    console.log('  - test-output-quote.pdf  (PDF quote)\n')

  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  }
}

test()
