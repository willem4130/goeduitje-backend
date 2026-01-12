import { pgTable, serial, text, timestamp, boolean, integer, jsonb, decimal, varchar } from 'drizzle-orm/pg-core'

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

  // References (removed customerFeedbackId to avoid circular reference)

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
  // Categories: Site assets + Content
  category: text('category', {
    enum: [
      // Site assets
      'site-logo', 'site-hero-video', 'site-hero-poster', 'site-og',
      // Workshop content
      'workshop-hero', 'workshop-gallery',
      // Page content
      'team-photo', 'testimonial', 'recipe', 'general'
    ]
  }).default('general'),

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
// ACTIVITIES TABLE (Workshop/Activity Types)
// Replaces hardcoded activity types in AI prompt
// ============================================================
export const activities = pgTable('activities', {
  id: serial('id').primaryKey(),
  activityName: text('activity_name').notNull(),
  basePrice: decimal('base_price', { precision: 10, scale: 2 }).notNull(),
  category: text('category').notNull(), // 'cooking_workshop', 'city_game', etc
  description: text('description'),
  minParticipants: integer('min_participants').default(1),
  maxParticipants: integer('max_participants'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ============================================================
// PRICING TIERS TABLE
// Tiered pricing based on participant count
// ============================================================
export const pricingTiers = pgTable('pricing_tiers', {
  id: serial('id').primaryKey(),
  activityId: integer('activity_id').references(() => activities.id).notNull(),
  minParticipants: integer('min_participants').notNull(),
  maxParticipants: integer('max_participants'),
  pricePerPerson: decimal('price_per_person', { precision: 10, scale: 2 }),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ============================================================
// LOCATIONS TABLE
// Available workshop locations
// ============================================================
export const locations = pgTable('locations', {
  id: serial('id').primaryKey(),
  locationName: text('location_name').notNull(),
  city: text('city').notNull(),
  minCapacity: integer('min_capacity'),
  maxCapacity: integer('max_capacity'),
  basePriceExclVat: decimal('base_price_excl_vat', { precision: 10, scale: 2 }).notNull(),
  basePriceInclVat: decimal('base_price_incl_vat', { precision: 10, scale: 2 }).notNull(),
  vatStatus: text('vat_status', {
    enum: ['regular', 'exempt']
  }).default('regular'),
  drinksPolicy: text('drinks_policy', {
    enum: ['flexible', 'via_location', 'mandatory_via_location']
  }).notNull(),
  goeduitjeDrinksAvailable: boolean('goeduitje_drinks_available').default(false),
  address: text('address'),
  contactPerson: text('contact_person'),
  contactPhone: text('contact_phone'),
  contactEmail: text('contact_email'),
  notes: text('notes'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ============================================================
// DRINKS PRICING TABLE
// Location-specific drink prices
// ============================================================
export const drinksPricing = pgTable('drinks_pricing', {
  id: serial('id').primaryKey(),
  locationId: integer('location_id').references(() => locations.id).notNull(),
  itemType: text('item_type').notNull(), // 'beverage', 'package', etc
  itemName: text('item_name').notNull(),
  priceExclVat: decimal('price_excl_vat', { precision: 10, scale: 2 }),
  priceInclVat: decimal('price_incl_vat', { precision: 10, scale: 2 }),
  unit: text('unit').default('per_item'), // 'per_item', 'per_person', etc
  notes: text('notes'),
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

export type Activity = typeof activities.$inferSelect
export type NewActivity = typeof activities.$inferInsert

export type PricingTier = typeof pricingTiers.$inferSelect
export type NewPricingTier = typeof pricingTiers.$inferInsert

export type Location = typeof locations.$inferSelect
export type NewLocation = typeof locations.$inferInsert

export type DrinksPricing = typeof drinksPricing.$inferSelect
export type NewDrinksPricing = typeof drinksPricing.$inferInsert

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

// ============================================================
// CONTENT MANAGEMENT TABLES (shared with frontend)
// These tables are managed by frontend's Prisma migrations
// Backend uses Drizzle for read/write access
// ============================================================

// FAQ entries
export const faq = pgTable('FAQ', {
  id: text('id').primaryKey(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  category: text('category').notNull(),
  sortOrder: integer('sortOrder').default(0).notNull(),
  isPublished: boolean('isPublished').default(true).notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull(),
})

// Team members
export const teamMember = pgTable('TeamMember', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  origin: text('origin'),
  bio: text('bio').notNull(),
  quote: text('quote'),
  image: text('image'),
  sortOrder: integer('sortOrder').default(0).notNull(),
  isPublished: boolean('isPublished').default(true).notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull(),
})

// Custom testimonials
export const testimonial = pgTable('Testimonial', {
  id: text('id').primaryKey(),
  quote: text('quote').notNull(),
  author: text('author').notNull(),
  role: text('role'),
  company: text('company'),
  rating: integer('rating').default(5).notNull(),
  image: text('image'),
  isFeatured: boolean('isFeatured').default(false).notNull(),
  isPublished: boolean('isPublished').default(true).notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull(),
})

// Recipes
export const recipe = pgTable('Recipe', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  imageUrl: text('imageUrl'),
  prepTime: integer('prepTime'),
  cookTime: integer('cookTime'),
  servings: integer('servings'),
  difficulty: text('difficulty'),
  category: text('category'),
  ingredients: jsonb('ingredients').$type<string[]>().default([]),
  steps: jsonb('steps').$type<string[]>().default([]),
  tips: text('tips'),
  isPublished: boolean('isPublished').default(true).notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull(),
})

// Page content - CMS for editable text blocks
export const pageContent = pgTable('PageContent', {
  id: text('id').primaryKey(),
  page: text('page').notNull(),
  section: text('section').notNull(),
  key: text('key').notNull(),
  value: text('value').notNull(),
  type: text('type').default('text').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
})

// Google Reviews
export const googleReview = pgTable('GoogleReview', {
  id: text('id').primaryKey(),
  googleReviewId: text('googleReviewId').notNull().unique(),
  authorName: text('authorName').notNull(),
  authorPhotoUrl: text('authorPhotoUrl'),
  rating: integer('rating').notNull(),
  text: text('text'),
  relativeTime: text('relativeTime').notNull(),
  reviewTime: timestamp('reviewTime').notNull(),
  language: text('language').default('nl').notNull(),
  sortOrder: text('sortOrder').notNull(),
  isVisible: boolean('isVisible').default(true).notNull(),
  fetchedAt: timestamp('fetchedAt').notNull().defaultNow(),
  lastSeenAt: timestamp('lastSeenAt').notNull().defaultNow(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull(),
})

// Workshop catalog
export const workshop = pgTable('Workshop', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  subtitle: text('subtitle').notNull(),
  description: text('description').notNull(),
  longDescription: text('longDescription'),
  image: text('image'),
  video: text('video'),
  duration: text('duration').notNull(),
  groupSize: text('groupSize').notNull(),
  location: text('location').notNull(),
  categories: jsonb('categories').$type<string[]>().default([]),
  includes: jsonb('includes').$type<string[]>().default([]),
  isPublished: boolean('isPublished').default(true).notNull(),
  sortOrder: integer('sortOrder').default(0).notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull(),
})

// Workshop variants
export const workshopVariant = pgTable('WorkshopVariant', {
  id: text('id').primaryKey(),
  workshopId: text('workshopId').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  duration: text('duration').notNull(),
  includes: jsonb('includes').$type<string[]>().default([]),
  sortOrder: integer('sortOrder').default(0).notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull(),
})

// Price tiers
export const priceTier = pgTable('PriceTier', {
  id: text('id').primaryKey(),
  workshopId: text('workshopId').notNull(),
  variantId: text('variantId'),
  groupSize: text('groupSize').notNull(),
  minParticipants: integer('minParticipants'),
  maxParticipants: integer('maxParticipants'),
  priceExclBtw: decimal('priceExclBtw', { precision: 10, scale: 2 }).notNull(),
  priceInclBtw: decimal('priceInclBtw', { precision: 10, scale: 2 }).notNull(),
  sortOrder: integer('sortOrder').default(0).notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull(),
})

// Contact form feedback
export const contactFeedback = pgTable('Feedback', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  subject: text('subject'),
  message: text('message').notNull(),
  rating: integer('rating'),
  isRead: boolean('isRead').default(false).notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull(),
})

// ============================================================
// SESSION CHANGES TABLE
// Tracks development changes for client validation
// Managed via backend admin at /wijzigingen
// ============================================================
export const sessionChanges = pgTable('session_changes', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category'), // Contact, Navigation, Content, Design, Feature, Bug
  filesChanged: text('filesChanged').array(), // Array of file paths (Prisma String[])
  changeDetails: text('changeDetails').array(), // Bullet points (Prisma String[])
  viewUrl: text('viewUrl'), // Link to see change live
  screenshotUrl: text('screenshotUrl'), // Screenshot/image URL (Vercel Blob)
  screenshotPath: text('screenshotPath'), // Blob path for deletion
  status: text('status').default('pending').notNull(), // pending, approved, needs_changes, in_progress
  addedBy: text('addedBy').default('developer'), // developer or client
  deletedAt: timestamp('deletedAt'), // Soft delete timestamp
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull(),
})

// ============================================================
// SESSION CHANGE FEEDBACK TABLE
// Client feedback on changes with screenshots
// ============================================================
export const sessionChangeFeedback = pgTable('session_change_feedback', {
  id: text('id').primaryKey(),
  changeId: text('changeId').notNull(), // Foreign key to session_changes
  feedbackText: text('feedbackText'),
  screenshotUrl: text('screenshotUrl'), // Vercel Blob URL
  screenshotPath: text('screenshotPath'), // Blob path for deletion
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

// Type exports for content tables
export type FAQ = typeof faq.$inferSelect
export type NewFAQ = typeof faq.$inferInsert

export type TeamMember = typeof teamMember.$inferSelect
export type NewTeamMember = typeof teamMember.$inferInsert

export type Testimonial = typeof testimonial.$inferSelect
export type NewTestimonial = typeof testimonial.$inferInsert

export type Recipe = typeof recipe.$inferSelect
export type NewRecipe = typeof recipe.$inferInsert

export type PageContent = typeof pageContent.$inferSelect
export type NewPageContent = typeof pageContent.$inferInsert

export type GoogleReviewRecord = typeof googleReview.$inferSelect
export type NewGoogleReview = typeof googleReview.$inferInsert

export type WorkshopCatalog = typeof workshop.$inferSelect
export type NewWorkshopCatalog = typeof workshop.$inferInsert

export type WorkshopVariantRecord = typeof workshopVariant.$inferSelect
export type NewWorkshopVariant = typeof workshopVariant.$inferInsert

export type PriceTierRecord = typeof priceTier.$inferSelect
export type NewPriceTier = typeof priceTier.$inferInsert

export type ContactFeedback = typeof contactFeedback.$inferSelect
export type NewContactFeedback = typeof contactFeedback.$inferInsert

export type SessionChange = typeof sessionChanges.$inferSelect
export type NewSessionChange = typeof sessionChanges.$inferInsert

export type SessionChangeFeedback = typeof sessionChangeFeedback.$inferSelect
export type NewSessionChangeFeedback = typeof sessionChangeFeedback.$inferInsert
