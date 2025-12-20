import { NextResponse } from 'next/server'
import { db } from '@/db'
import { workshopRequests, confirmedWorkshops } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { generateQuoteEmail } from '@/lib/ai'
import { generateQuotePDF } from '@/lib/pdf'
import { sendQuoteEmail } from '@/lib/email'
import { put } from '@vercel/blob'

type RouteParams = {
  params: Promise<{ id: string }>
}

type WorkshopRequestStatus = 'leeg' | 'informatie verstrekt' | 'offerte gemaakt' | 'bevestigde opdracht'

/**
 * Status Workflow State Machine
 *
 * Transitions:
 * 1. leeg → informatie verstrekt (no automation)
 * 2. informatie verstrekt → offerte gemaakt (TRIGGERS: AI email + PDF quote generation)
 * 3. offerte gemaakt → bevestigde opdracht (TRIGGERS: Auto-create confirmedWorkshop record)
 *
 * This endpoint handles status changes and triggers appropriate automation.
 */
export async function PATCH(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const requestId = parseInt(id, 10)

    if (isNaN(requestId)) {
      return NextResponse.json({ error: 'Invalid request ID' }, { status: 400 })
    }

    const body = await request.json()
    const { status: newStatus } = body as { status: WorkshopRequestStatus }

    if (!newStatus) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    // Validate status value
    const validStatuses: WorkshopRequestStatus[] = ['leeg', 'informatie verstrekt', 'offerte gemaakt', 'bevestigde opdracht']
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
    }

    // Fetch current request
    const currentRequest = await db
      .select()
      .from(workshopRequests)
      .where(eq(workshopRequests.id, requestId))
      .limit(1)

    if (currentRequest.length === 0) {
      return NextResponse.json({ error: 'Workshop request not found' }, { status: 404 })
    }

    const request_data = currentRequest[0]
    const oldStatus = request_data.status

    // Update status
    const updatedRequest = await db
      .update(workshopRequests)
      .set({ status: newStatus })
      .where(eq(workshopRequests.id, requestId))
      .returning()

    // Trigger automation based on new status
    if (newStatus === 'offerte gemaakt' && oldStatus !== 'offerte gemaakt') {
      // PHASE 3: Trigger AI email + PDF quote generation
      console.log(`[STATUS WORKFLOW] Request #${requestId}: Triggering quote generation automation`)

      try {
        // 1. Generate AI email using Guus's prompt
        console.log('[STATUS WORKFLOW] Generating AI email...')
        const emailContent = await generateQuoteEmail({
          contactName: request_data.contactName,
          email: request_data.email,
          phone: request_data.phone,
          organization: request_data.organization,
          activityType: request_data.activityType,
          preferredDate: request_data.preferredDate,
          alternativeDate: request_data.alternativeDate,
          participants: request_data.participants,
          ageGroup: request_data.ageGroup,
          location: request_data.location,
          hasOwnLocation: request_data.hasOwnLocation,
          specialRequirements: request_data.specialRequirements,
          dietaryRestrictions: request_data.dietaryRestrictions,
          accessibilityNeeds: request_data.accessibilityNeeds,
        })

        console.log('[STATUS WORKFLOW] Email generated successfully')

        // TODO: PDF generation temporarily disabled - see TODO.md
        // 2. Generate PDF quote (SKIPPED - Blob storage not configured)
        // console.log('[STATUS WORKFLOW] Generating PDF quote...')
        // const pdfBuffer = await generateQuotePDF(...)

        // 3. Upload PDF to Vercel Blob (SKIPPED - Blob storage not configured)
        // console.log('[STATUS WORKFLOW] Uploading PDF to Vercel Blob...')
        // const blob = await put(...)

        // 4. Send email via Resend (WITHOUT PDF for now)
        console.log('[STATUS WORKFLOW] Sending quote email...')
        const emailResult = await sendQuoteEmail({
          to: request_data.email,
          subject: `Offerte Goeduitje - ${request_data.activityType}`,
          content: emailContent,
          // pdfAttachment: pdfBuffer, // Disabled - see TODO.md
          // pdfFilename: `Offerte-Goeduitje-${request_data.contactName.replace(/\s+/g, '-')}.pdf`,
        })

        console.log(`[STATUS WORKFLOW] Email sent successfully (ID: ${emailResult.id})`)

        // 5. Update request with automation metadata
        await db
          .update(workshopRequests)
          .set({
            quoteEmailSentAt: new Date(),
            // quotePdfUrl: blob.url, // Disabled - see TODO.md
            aiGeneratedEmailContent: emailContent,
          })
          .where(eq(workshopRequests.id, requestId))

        console.log('[STATUS WORKFLOW] Quote automation completed successfully')

        // Return updated request with automation metadata
        const finalRequest = await db
          .select()
          .from(workshopRequests)
          .where(eq(workshopRequests.id, requestId))
          .limit(1)

        return NextResponse.json({
          request: finalRequest[0],
          message: 'Status updated and quote email sent successfully',
          automation: {
            emailSent: true,
            emailId: emailResult.id,
            pdfUrl: blob.url,
          },
        })
      } catch (error) {
        console.error('[STATUS WORKFLOW] Quote automation failed:', error)
        // Don't fail the status update if automation fails
        return NextResponse.json({
          request: updatedRequest[0],
          warning: 'Status updated but quote automation failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    if (newStatus === 'bevestigde opdracht' && oldStatus !== 'bevestigde opdracht') {
      // PHASE 4: Auto-create confirmedWorkshop record
      console.log(`[STATUS WORKFLOW] Request #${requestId}: Auto-creating confirmed workshop record`)

      try {
        // confirmedDate is required - use preferredDate or current date as fallback
        const confirmedDate = request_data.preferredDate || new Date().toISOString().split('T')[0]

        const confirmedWorkshop = await db
          .insert(confirmedWorkshops)
          .values({
            requestId: requestId,
            confirmedDate: confirmedDate,
            // Initialize other fields with defaults
            actualParticipants: request_data.participants || undefined,
            paymentStatus: 'pending',
          })
          .returning()

        console.log(`[STATUS WORKFLOW] Created confirmed workshop #${confirmedWorkshop[0].id}`)

        return NextResponse.json({
          request: updatedRequest[0],
          confirmedWorkshop: confirmedWorkshop[0],
          message: 'Status updated and confirmed workshop created',
        })
      } catch (error) {
        console.error('[STATUS WORKFLOW] Failed to create confirmed workshop:', error)
        // Don't fail the status update if confirmed workshop creation fails
        return NextResponse.json({
          request: updatedRequest[0],
          warning: 'Status updated but failed to create confirmed workshop',
        })
      }
    }

    return NextResponse.json({
      request: updatedRequest[0],
      message: 'Status updated successfully',
    })
  } catch (error) {
    console.error('[STATUS WORKFLOW] Failed to update status:', error)
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    )
  }
}
