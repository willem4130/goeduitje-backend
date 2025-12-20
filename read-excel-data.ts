import dotenv from 'dotenv'
import XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'

dotenv.config({ path: '.env.local' })

const excelDir = '/Users/willemvandenberg/Dev/Goeduitjeweb/Databases backend/Real databases locations and prices'

// Read structured database file
const structuredFile = path.join(excelDir, '251220_Databases_backend_Structured.xlsx')
const locationsFile = path.join(excelDir, 'Locatieprijzen_Database.xlsx')

console.log('📊 Reading Excel Files...\n')

// Read Structured Database
console.log('='.repeat(80))
console.log('FILE 1: 251220_Databases_backend_Structured.xlsx')
console.log('='.repeat(80))

const structuredWorkbook = XLSX.readFile(structuredFile)
console.log('Sheet Names:', structuredWorkbook.SheetNames)

structuredWorkbook.SheetNames.forEach((sheetName) => {
  console.log(`\n--- Sheet: ${sheetName} ---`)
  const worksheet = structuredWorkbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json(worksheet, { defval: null })
  console.log(`Rows: ${data.length}`)
  if (data.length > 0) {
    console.log('Columns:', Object.keys(data[0]))
    console.log('Sample row:', JSON.stringify(data[0], null, 2))
  }
})

// Read Locations/Pricing Database
console.log('\n' + '='.repeat(80))
console.log('FILE 2: Locatieprijzen_Database.xlsx')
console.log('='.repeat(80))

const locationsWorkbook = XLSX.readFile(locationsFile)
console.log('Sheet Names:', locationsWorkbook.SheetNames)

locationsWorkbook.SheetNames.forEach((sheetName) => {
  console.log(`\n--- Sheet: ${sheetName} ---`)
  const worksheet = locationsWorkbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json(worksheet, { defval: null })
  console.log(`Rows: ${data.length}`)
  if (data.length > 0) {
    console.log('Columns:', Object.keys(data[0]))
    console.log('Sample rows:')
    data.slice(0, 3).forEach((row, i) => {
      console.log(`Row ${i + 1}:`, JSON.stringify(row, null, 2))
    })
  }
})

// Save parsed data to JSON for inspection
const outputDir = 'excel-data-output'
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir)
}

structuredWorkbook.SheetNames.forEach((sheetName) => {
  const worksheet = structuredWorkbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json(worksheet, { defval: null })
  fs.writeFileSync(
    path.join(outputDir, `structured-${sheetName}.json`),
    JSON.stringify(data, null, 2)
  )
})

locationsWorkbook.SheetNames.forEach((sheetName) => {
  const worksheet = locationsWorkbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json(worksheet, { defval: null })
  fs.writeFileSync(
    path.join(outputDir, `locations-${sheetName}.json`),
    JSON.stringify(data, null, 2)
  )
})

console.log(`\n✅ Data exported to ${outputDir}/ directory`)
