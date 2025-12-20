import puppeteer from 'puppeteer'

interface WorkshopRequestData {
  id: number
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
  quotedPrice?: string | null
  locationFee?: string | null
  finalPrice?: string | null
  priceIncludesVat?: boolean | null
  dietaryRestrictions?: string | null
  specialRequirements?: string | null
}

export async function generateQuotePDF(
  requestData: WorkshopRequestData,
  emailContent: string
): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()

    // Generate HTML for PDF
    const html = generateQuoteHTML(requestData, emailContent)

    await page.setContent(html, {
      waitUntil: 'networkidle0',
    })

    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
    })

    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}

function generateQuoteHTML(data: WorkshopRequestData, emailContent: string): string {
  const currentDate = new Date().toLocaleDateString('nl-NL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offerte Goeduitje - ${data.contactName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #333;
      line-height: 1.6;
      padding: 20px;
    }

    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #d97706;
    }

    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #d97706;
      margin-bottom: 10px;
    }

    .subtitle {
      font-size: 14px;
      color: #666;
    }

    .info-section {
      margin-bottom: 30px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 15px;
    }

    .info-label {
      font-weight: 600;
      color: #555;
      min-width: 150px;
    }

    .info-value {
      flex: 1;
      text-align: right;
    }

    .section-title {
      font-size: 20px;
      font-weight: 700;
      color: #d97706;
      margin: 30px 0 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #f59e0b;
    }

    .email-content {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #d97706;
      margin: 20px 0;
      white-space: pre-wrap;
      font-size: 14px;
      line-height: 1.8;
    }

    .price-box {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border: 2px solid #d97706;
    }

    .price-row {
      display: flex;
      justify-content: space-between;
      margin: 10px 0;
      font-size: 16px;
    }

    .price-total {
      font-size: 24px;
      font-weight: 700;
      color: #d97706;
      margin-top: 15px;
      padding-top: 15px;
      border-top: 2px solid #d97706;
    }

    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #666;
    }

    .contact-info {
      margin: 15px 0;
    }

    .note {
      background: #fffbeb;
      padding: 15px;
      border-radius: 6px;
      border-left: 4px solid #f59e0b;
      margin: 15px 0;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Goeduitje</div>
    <div class="subtitle">Kookworkshops & Stadsspellen</div>
  </div>

  <div class="info-section">
    <h2 class="section-title">Offertegegevens</h2>
    <div class="info-row">
      <span class="info-label">Offerte nummer:</span>
      <span class="info-value">#${String(data.id).padStart(5, '0')}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Datum:</span>
      <span class="info-value">${currentDate}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Klant:</span>
      <span class="info-value">${data.contactName}</span>
    </div>
    ${data.organization ? `
    <div class="info-row">
      <span class="info-label">Organisatie:</span>
      <span class="info-value">${data.organization}</span>
    </div>
    ` : ''}
    <div class="info-row">
      <span class="info-label">Email:</span>
      <span class="info-value">${data.email}</span>
    </div>
    ${data.phone ? `
    <div class="info-row">
      <span class="info-label">Telefoon:</span>
      <span class="info-value">${data.phone}</span>
    </div>
    ` : ''}
  </div>

  <div class="info-section">
    <h2 class="section-title">Workshop Details</h2>
    <div class="info-row">
      <span class="info-label">Type activiteit:</span>
      <span class="info-value">${data.activityType === 'kookworkshop' ? 'Kookworkshop' : data.activityType === 'stadsspel' ? 'Stadsspel' : data.activityType}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Aantal deelnemers:</span>
      <span class="info-value">${data.participants} personen</span>
    </div>
    ${data.preferredDate ? `
    <div class="info-row">
      <span class="info-label">Gewenste datum:</span>
      <span class="info-value">${formatDate(data.preferredDate)}</span>
    </div>
    ` : ''}
    ${data.location ? `
    <div class="info-row">
      <span class="info-label">Locatie:</span>
      <span class="info-value">${data.location}</span>
    </div>
    ` : ''}
  </div>

  ${data.quotedPrice || data.finalPrice ? `
  <div class="price-box">
    <h2 class="section-title" style="border: none; margin-top: 0;">Prijsoverzicht</h2>
    ${data.quotedPrice ? `
    <div class="price-row">
      <span>Workshop prijs:</span>
      <span>€ ${data.quotedPrice}</span>
    </div>
    ` : ''}
    ${data.locationFee ? `
    <div class="price-row">
      <span>Locatiehuur:</span>
      <span>€ ${data.locationFee}</span>
    </div>
    ` : ''}
    ${data.finalPrice ? `
    <div class="price-row price-total">
      <span>Totaal ${data.priceIncludesVat ? 'incl. BTW' : 'excl. BTW'}:</span>
      <span>€ ${data.finalPrice}</span>
    </div>
    ` : ''}
    <div class="note">
      De prijs is exclusief drankjes. Afhankelijk van de locatie kunnen drankjes ter plaatse besteld worden of zelf meegenomen worden.
    </div>
  </div>
  ` : ''}

  <div class="info-section">
    <h2 class="section-title">Offerte Email</h2>
    <div class="email-content">${emailContent}</div>
  </div>

  <div class="footer">
    <div class="contact-info">
      <strong>Goeduitje</strong><br>
      Guus van den Elzen<br>
      Email: info@goeduitje.nl<br>
      Website: www.goeduitje.nl
    </div>
    <p style="margin-top: 20px; font-size: 11px; color: #999;">
      Deze offerte is 14 dagen geldig vanaf de datum van uitgifte.
    </p>
  </div>
</body>
</html>
`
}

function formatDate(isoDate: string): string {
  try {
    const date = new Date(isoDate)
    return date.toLocaleDateString('nl-NL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return isoDate
  }
}
