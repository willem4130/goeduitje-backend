import { pgTable, serial, text, timestamp, boolean, integer, jsonb, decimal } from 'drizzle-orm/pg-core'

// ============================================================
// WORKSHOP REQUESTS TABLE
// Primary table for incoming workshop inquiries
// ============================================================
export const workshopRequests = pgTable('workshop_requests', {
  id: serial('id').primaryKey(),

  // Status Workflow State Machine
  // leeg → informatie verstrekt → offerte gemaakt (TRIGGER: AI email + PDF) → bevestigde opdracht (TRIGGER: create confirmedWorkshop)
  status: text('status', {
    enum: ['leeg', 'informatie verstrekt', 'offerte gemaakt', 'bevestigde opdracht']
  }).notNull().default('leeg'),

  // Contact Information
  contactName: text('contact_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  organization: text('organization'),

  // Workshop Details
  activityType: text('activity_type').notNull(), // 'kookworkshop' or 'stadsspel'
  preferredDate: text('preferred_date'), // ISO date string
  alternativeDate: text('alternative_date'), // ISO date string
  participants: integer('participants').notNull(),
  ageGroup: text('age_group'),

  // Location
  location: text('location'), // Customer's preferred location/city
  hasOwnLocation: boolean('has_own_location').default(false),
  travelDistance: integer('travel_distance'), // in km from Nijmegen

  // Special Requirements
  specialRequirements: text('special_requirements'),
  dietaryRestrictions: text('dietary_restrictions'),
  accessibilityNeeds: text('accessibility_needs'),

  // Pricing
  quotedPrice: decimal('quoted_price', { precision: 10, scale: 2 }),
  locationFee: decimal('location_fee', { precision: 10, scale: 2 }),
  finalPrice: decimal('final_price', { precision: 10, scale: 2 }),
  priceIncludesVat: boolean('price_includes_vat').default(false),

  // Automation Fields
  quoteEmailSentAt: timestamp('quote_email_sent_at'),
  quotePdfUrl: text('quote_pdf_url'), // Vercel Blob URL
  aiGeneratedEmailContent: text('ai_generated_email_content'), // Store for review/resend

  // Metadata
  notes: text('notes'), // Internal admin notes
  source: text('source').default('website'), // website, phone, email, referral
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ============================================================
// CONFIRMED WORKSHOPS TABLE
// Tracks execution of booked workshops
// Auto-created when workshopRequest.status → 'bevestigde opdracht'
// ============================================================
export const confirmedWorkshops = pgTable('confirmed_workshops', {
  id: serial('id').primaryKey(),
  requestId: integer('request_id').references(() => workshopRequests.id).notNull(),

  // Execution Details
  confirmedDate: text('confirmed_date').notNull(), // ISO date string
  startTime: text('start_time'), // HH:MM format
  endTime: text('end_time'), // HH:MM format
  actualParticipants: integer('actual_participants'),

  // Location Details
  locationName: text('location_name'),
  locationAddress: text('location_address'),
  locationCity: text('location_city'),
  locationContactPerson: text('location_contact_person'),
  locationContactPhone: text('location_contact_phone'),

  // Materials
  materialsUsed: jsonb('materials_used'), // [{item: string, quantity: number, cost: number}]
  materialsCost: decimal('materials_cost', { precision: 10, scale: 2 }),

  // Staff
  leadInstructor: text('lead_instructor').default('Guus van den Elzen'),
  assistants: jsonb('assistants'), // Array of assistant names

  // Outcomes
  workshopNotes: text('workshop_notes'), // How it went, highlights, issues
  customerSatisfaction: integer('customer_satisfaction'), // 1-5 rating (quick admin rating)

  // References
  customerFeedbackId: integer('customer_feedback_id').references(() => feedback.id),

  // Financial
  paymentStatus: text('payment_status', {
    enum: ['pending', 'partial', 'paid']
  }).notNull().default('pending'),
  paymentDate: text('payment_date'), // ISO date string
  paymentMethod: text('payment_method'), // invoice, bank transfer, etc.
  invoiceUrl: text('invoice_url'), // Future: Vercel Blob URL for invoice PDF

  // Metadata
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ============================================================
// FEEDBACK TABLE
// Post-workshop customer reviews
// ============================================================
export const feedback = pgTable('feedback', {
  id: serial('id').primaryKey(),
  workshopId: integer('workshop_id').references(() => confirmedWorkshops.id).notNull(),

  // Customer Info (denormalized for easy access)
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  organization: text('organization'),

  // Ratings (1-5 stars)
  overallRating: integer('overall_rating').notNull(), // Required
  instructorRating: integer('instructor_rating'),
  contentRating: integer('content_rating'),
  organizationRating: integer('organization_rating'),
  valueForMoneyRating: integer('value_for_money_rating'),

  // Written Feedback
  bestAspects: text('best_aspects'), // What they loved
  improvements: text('improvements'), // What could be better
  testimonial: text('testimonial'), // Public quote (if approved)
  additionalComments: text('additional_comments'),

  // Recommendation
  wouldRecommend: boolean('would_recommend').notNull().default(true),
  wouldBookAgain: boolean('would_book_again').default(true),

  // Permissions
  allowPublicDisplay: boolean('allow_public_display').default(false), // Can show on website
  allowPhotoSharing: boolean('allow_photo_sharing').default(false), // Can share workshop photos
  allowNameDisplay: boolean('allow_name_display').default(false), // Show name with testimonial

  // Follow-up
  requestedFollowUp: boolean('requested_follow_up').default(false),
  followUpNotes: text('follow_up_notes'),

  // Metadata
  submittedAt: timestamp('submitted_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ============================================================
// MEDIA GALLERY TABLE
// Workshop photos for customer galleries and website
// ============================================================
export const mediaGallery = pgTable('media_gallery', {
  id: serial('id').primaryKey(),
  workshopId: integer('workshop_id').references(() => confirmedWorkshops.id),

  // Vercel Blob Storage
  blobUrl: text('blob_url').notNull(), // Full URL from Vercel Blob
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size'), // in bytes
  mimeType: text('mime_type').notNull(),

  // Image Metadata
  width: integer('width'),
  height: integer('height'),
  caption: text('caption'),
  altText: text('alt_text'),
  takenAt: timestamp('taken_at'),

  // Organization
  displayOrder: integer('display_order').default(0),
  category: text('category', {
    enum: ['workshop', 'setup', 'cooking', 'results', 'group', 'food', 'venue']
  }).default('workshop'),

  // Tagging
  tags: jsonb('tags'), // Array of strings for search/filtering

  // Permissions & Display
  isPublic: boolean('is_public').default(false), // Customer can view in their private gallery
  showOnWebsite: boolean('show_on_website').default(false), // Display on public website
  featuredOnHomepage: boolean('featured_on_homepage').default(false),

  // Uploaded By
  uploadedBy: text('uploaded_by'),
  uploadedAt: timestamp('uploaded_at').notNull().defaultNow(),

  // Metadata
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ============================================================
// USERS TABLE (Admin Authentication)
// ============================================================
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', {
    enum: ['admin', 'instructor', 'viewer']
  }).notNull().default('admin'),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ============================================================
// TYPE EXPORTS
// ============================================================
export type WorkshopRequest = typeof workshopRequests.$inferSelect
export type NewWorkshopRequest = typeof workshopRequests.$inferInsert

export type ConfirmedWorkshop = typeof confirmedWorkshops.$inferSelect
export type NewConfirmedWorkshop = typeof confirmedWorkshops.$inferInsert

export type Feedback = typeof feedback.$inferSelect
export type NewFeedback = typeof feedback.$inferInsert

export type Media = typeof mediaGallery.$inferSelect
export type NewMedia = typeof mediaGallery.$inferInsert

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
