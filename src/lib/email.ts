import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendQuoteEmailParams {
  to: string
  subject: string
  content: string
  pdfAttachment?: Buffer
  pdfFilename?: string
}

export async function sendQuoteEmail({
  to,
  subject,
  content,
  pdfAttachment,
  pdfFilename = 'offerte.pdf',
}: SendQuoteEmailParams): Promise<{ id: string; success: boolean }> {
  const htmlContent = content
    .split('\n')
    .map((line) => {
      if (!line.trim()) return '<br>'
      return '<p style="margin: 0 0 10px 0; line-height: 1.6;">' + line + '</p>'
    })
    .join('')

  const emailPayload: any = {
    from: 'Guus van den Elzen - Goeduitje <guus@goeduitje.nl>',
    to: [to],
    subject,
    html: '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="font-family: \'Segoe UI\', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;"><div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #d97706;"><h1 style="color: #d97706; font-size: 28px; margin: 0 0 10px 0;">Goeduitje</h1><p style="color: #666; font-size: 14px; margin: 0;">Kookworkshops & Stadsspellen</p></div><div style="margin: 20px 0;">' + htmlContent + '</div>' + (pdfAttachment ? '<div style="background: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #d97706; margin: 30px 0;"><p style="margin: 0; color: #666;">📎 <strong>Bijlage:</strong> Gedetailleerde offerte in PDF-formaat</p></div>' : '') + '<div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; font-size: 12px; color: #666;"><p style="margin: 5px 0;"><strong>Goeduitje</strong></p><p style="margin: 5px 0;">Guus van den Elzen</p><p style="margin: 5px 0;">Email: info@goeduitje.nl</p><p style="margin: 5px 0;">Website: <a href="https://www.goeduitje.nl" style="color: #d97706; text-decoration: none;">www.goeduitje.nl</a></p></div></body></html>',
  }

  if (pdfAttachment) {
    emailPayload.attachments = [
      {
        filename: pdfFilename,
        content: pdfAttachment,
      },
    ]
  }

  try {
    const response = await resend.emails.send(emailPayload)

    if (response.error) {
      console.error('Resend error:', response.error)
      throw new Error('Failed to send email: ' + response.error.message)
    }

    return {
      id: response.data?.id || '',
      success: true,
    }
  } catch (error) {
    console.error('Email sending failed:', error)
    throw error
  }
}
