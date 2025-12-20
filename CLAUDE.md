# Goeduitje Workshop Management - Backend CMS

**CRITICAL**: This is the backend CMS for Goeduitje workshop management. Completely separate from the frontend website.

## ⚠️ ABSOLUTE WARNINGS - READ FIRST

### Repository Separation Rules

**THIS REPOSITORY**:
- Name: `goeduitje-backend` (to be created on GitHub)
- Purpose: Workshop CMS, admin dashboard, quote generation
- Port: **3003**
- Database: **Separate PostgreSQL instance** (different from frontend)
- Never contains frontend UI code

**FRONTEND REPOSITORY** (separate):
- Name: `goeduitje-nl-rebuild`
- Repository: https://github.com/willem4130/goeduitje-nl-rebuild.git
- Port: **3000**
- Database: **Separate Prisma database**
- Never contains backend admin code

**NEVER COMMIT TO**:
- https://github.com/willem4130/dutch-queen-admin.git
- This repo was cloned as READ-ONLY reference for structure
- We initialized a NEW git repository (removed original .git)
- This is now a completely independent project

### Backend vs Frontend Commits

**Backend commits (this repo):**
- Workshop request management
- Quote generation (AI + PDF)
- Confirmed workshop execution tracking
- Feedback collection
- Media gallery admin
- Email automation (Resend)
- Admin dashboard UI

**Frontend commits (goeduitje-nl-rebuild):**
- Public-facing website
- Workshop request form
- Activity pages
- Contact pages
- Public photo gallery
- Never contains admin/CMS code

## Project Overview

Admin platform for managing Goeduitje workshop requests, quote generation, execution tracking, and customer feedback.

### Business Flow
1. **Customer submits request** → Frontend form → Backend creates `workshopRequest`
2. **Quote generation** → Status change triggers AI email + PDF quote
3. **Booking confirmation** → Auto-creates `confirmedWorkshop` record
4. **Workshop execution** → Track materials, attendance, outcomes
5. **Post-workshop** → Collect feedback, generate photo gallery

## Tech Stack

- **Framework**: Next.js 15.1.4 (App Router) + React + TypeScript
- **Database**: PostgreSQL (Neon) + Drizzle ORM
- **Storage**: Vercel Blob (workshop photos, quote PDFs)
- **Email**: Resend (quote delivery)
- **PDF**: Puppeteer (quote generation)
- **AI**: Anthropic Claude (email generation using Guus's prompt)
- **Auth**: NextAuth.js v5 (credential-based)
- **UI**: Tailwind CSS + shadcn/ui + Radix UI
- **Port**: 3003

## Database Schema

### 8 Core Tables

#### Core Business Tables

##### 1. workshopRequests
Primary table for incoming workshop inquiries.

```typescript
{
  id: serial,
  status: enum ['leeg', 'informatie verstrekt', 'offerte gemaakt', 'bevestigde opdracht'],
  // Contact Info
  contactName: text,
  email: text,
  phone: text,
  organization: text,
  // Workshop Details
  activityType: text,          // Which workshop they want
  preferredDate: date,
  alternativeDate: date,
  participants: integer,
  ageGroup: text,
  // Location
  location: text,
  travelDistance: integer,
  // Special Requirements
  specialRequirements: text,
  dietaryRestrictions: text,
  accessibilityNeeds: text,
  // Pricing
  quotedPrice: decimal,
  finalPrice: decimal,
  // Automation
  quoteEmailSentAt: timestamp,
  quotePdfUrl: text,           // Vercel Blob URL
  // Metadata
  createdAt: timestamp,
  updatedAt: timestamp,
  notes: text                   // Internal admin notes
}
```

**Status Workflow State Machine:**
- `leeg` → Initial state (no action taken)
- `informatie verstrekt` → Admin has contacted customer
- `offerte gemaakt` → **TRIGGERS**: AI email generation + PDF quote
- `bevestigde opdracht` → **TRIGGERS**: Auto-create confirmedWorkshop record

##### 2. confirmedWorkshops
Tracks execution of booked workshops.

```typescript
{
  id: serial,
  requestId: integer,           // FK to workshopRequests
  // Execution Details
  confirmedDate: date,
  startTime: time,
  endTime: time,
  actualParticipants: integer,
  // Materials
  materialsUsed: json,          // List of supplies used
  materialsCost: decimal,
  // Staff
  leadInstructor: text,
  assistants: text[],
  // Outcomes
  workshopNotes: text,          // How it went
  customerFeedbackId: integer,  // FK to feedback
  photoGalleryId: integer,      // FK to mediaGallery
  // Financial
  paymentStatus: enum ['pending', 'partial', 'paid'],
  paymentDate: date,
  // Metadata
  createdAt: timestamp,
  completedAt: timestamp
}
```

##### 3. feedback
Post-workshop customer reviews.

```typescript
{
  id: serial,
  workshopId: integer,          // FK to confirmedWorkshops
  // Customer Info
  customerName: text,
  customerEmail: text,
  // Ratings (1-5 stars)
  overallRating: integer,
  instructorRating: integer,
  contentRating: integer,
  organizationRating: integer,
  // Written Feedback
  bestAspects: text,
  improvements: text,
  wouldRecommend: boolean,
  testimonial: text,            // Public quote (if approved)
  // Permissions
  allowPublicDisplay: boolean,
  allowPhotoSharing: boolean,
  // Metadata
  submittedAt: timestamp
}
```

##### 4. mediaGallery
Workshop photos for customer galleries.

```typescript
{
  id: serial,
  workshopId: integer,          // FK to confirmedWorkshops
  // Vercel Blob
  blobUrl: text,                // Uploaded image URL
  fileName: text,
  fileSize: integer,
  mimeType: text,
  // Metadata
  caption: text,
  takenAt: timestamp,
  uploadedAt: timestamp,
  // Organization
  displayOrder: integer,
  category: enum ['workshop', 'setup', 'results', 'group'],
  // Permissions
  isPublic: boolean,            // Customer can view in gallery
  showOnWebsite: boolean        // Display on public site
}
```

#### Database-Driven Content Tables

##### 5. activities
Workshop activity types with descriptions.

```typescript
{
  id: serial,
  category: text,               // 'kookworkshop', 'stadsspel', 'pubquiz'
  activityName: text,           // Display name
  description: text,            // Full description for AI prompt
  isActive: boolean,            // Whether activity is currently offered
  createdAt: timestamp,
  updatedAt: timestamp
}
```

##### 6. pricingTiers
Tiered pricing by participant count per activity.

```typescript
{
  id: serial,
  activityId: integer,          // FK to activities
  minParticipants: integer,     // Tier starts at this count
  maxParticipants: integer,     // Tier ends at this count (null = open-ended)
  pricePerPerson: decimal,      // Price per person (if applicable)
  totalPrice: decimal,          // Total price (if flat rate)
  notes: text,                  // Internal notes
  isActive: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Logic**: `findApplicableTier()` matches participant count to appropriate tier. For example:
- 8-14 personen → €50/person
- 15-24 personen → €45/person
- 25+ personen → €40/person

##### 7. locations
Available workshop locations with capacity and pricing.

```typescript
{
  id: serial,
  locationName: text,           // "Grand Café Central"
  city: text,                   // "Utrecht"
  address: text,
  maxCapacity: integer,         // Maximum participants
  basePriceExclVat: decimal,    // Location rental price
  basePriceInclVat: decimal,
  drinksPolicy: enum,           // 'flexible', 'via_location', 'mandatory_via_location', 'self_provided'
  goeduitjeDrinksAvailable: boolean,  // Can Goeduitje provide drinks
  notes: text,                  // Internal notes
  isActive: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

##### 8. drinksPricing
Drink prices per location (for locations with 'via_location' policy).

```typescript
{
  id: serial,
  locationId: integer,          // FK to locations
  itemName: text,               // "Biertje", "Fris", "Koffie/thee"
  priceExclVat: decimal,
  priceInclVat: decimal,
  unit: text,                   // "per stuk", "onbeperkt"
  isActive: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## AI Email Generation

### Database-Driven Dynamic Prompts

**Architecture**:
- Base template: `src/prompts/guus-quote-prompt-template.txt` (structure and tone)
- Dynamic builder: `src/lib/prompt-builder.ts` (queries database and injects data)
- AI generation: `src/lib/ai.ts` (calls Anthropic API with dynamic prompt)

**Flow**:
1. Admin changes status to `'offerte gemaakt'`
2. System calls `buildSystemPrompt({ activityType, participants, location })`
3. Queries database tables: `activities`, `pricingTiers`, `locations`, `drinksPricing`
4. Builds dynamic sections:
   - Activity description from `activities` table
   - Pricing tiers from `pricingTiers` (matched to participant count)
   - Location options from `locations` (filtered by city if provided)
   - Drinks pricing from `drinksPricing` (if applicable)
5. Combines base template with dynamic data
6. Sends to Claude API for email generation

**Key Functions** (`src/lib/prompt-builder.ts`):
- `buildSystemPrompt()` - Main entry point, orchestrates all queries
- `getActivityInfo()` - Queries `activities` table by category
- `getPricingInfo()` - Queries `pricingTiers`, finds applicable tier
- `getLocationInfo()` - Queries `locations` + `drinksPricing`, filters by city
- `findApplicableTier()` - Matches participant count to pricing tier
- `buildActivitySection()` - Formats activity description for prompt
- `buildPricingSection()` - Formats pricing tiers for prompt
- `buildLocationsSection()` - Formats locations with drinks policy for prompt

**Database as Source of Truth**: Admins manage pricing, locations, and activity descriptions via backend UI. Changes immediately reflected in AI-generated quotes. No code changes required to update pricing or add new locations.

### Original Guus's System Prompt
Location: `/Users/willemvandenberg/Dev/Goeduitjeweb/Masterprompt antwoordmail aanvraag_2025.12.11.docx`
Note: Original prompt extracted to `src/prompts/guus-quote-prompt-template.txt` with hardcoded data removed

**Trigger**: When `workshopRequest.status` changes to `'offerte gemaakt'`

**Process**:
1. Extract request details from database
2. Build dynamic system prompt via `buildSystemPrompt()` (queries activities, pricing, locations)
3. Call Anthropic API with dynamic prompt + request data
4. Generate personalized quote email
5. Generate PDF quote using Puppeteer
6. Upload PDF to Vercel Blob
7. Send email via Resend with PDF attachment
8. Update request: `quoteEmailSentAt`, `quotePdfUrl`, `aiGeneratedEmailContent`

### Email Content (AI-Generated)
- Personalized greeting
- Workshop details confirmation
- Pricing breakdown
- Next steps
- Contact information
- PDF quote attachment

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/      # NextAuth authentication
│   │   ├── workshops/
│   │   │   ├── requests/            # Workshop request CRUD
│   │   │   ├── confirmed/           # Confirmed workshop CRUD
│   │   │   └── status/              # Status change endpoint (triggers automation)
│   │   ├── quotes/
│   │   │   ├── generate/            # AI email + PDF generation
│   │   │   └── preview/             # Preview quote before sending
│   │   ├── feedback/                # Feedback CRUD
│   │   └── media/                   # Media upload endpoints
│   ├── page.tsx                     # Dashboard - workshop requests table
│   ├── login/page.tsx               # Admin login
│   ├── layout.tsx                   # Root layout with providers
│   ├── workshops/
│   │   ├── requests/page.tsx        # Requests list view
│   │   ├── confirmed/page.tsx       # Confirmed workshops calendar
│   │   └── [id]/page.tsx            # Workshop detail view
│   ├── feedback/page.tsx            # Feedback management
│   └── media/page.tsx               # Media gallery management
├── components/
│   ├── providers.tsx                # SessionProvider wrapper
│   ├── StatusWorkflowButtons.tsx    # Status state machine UI
│   ├── QuotePreview.tsx             # Preview AI-generated quote
│   └── ui/                          # shadcn components
├── db/
│   ├── index.ts                     # PostgreSQL connection (Drizzle)
│   └── schema.ts                    # Drizzle ORM schema (4 tables)
├── lib/
│   ├── auth.ts                      # NextAuth config
│   ├── ai.ts                        # Anthropic API integration
│   ├── email.ts                     # Resend email sending
│   ├── pdf.ts                       # Puppeteer PDF generation
│   └── utils.ts                     # Utilities
└── prompts/
    └── guus-quote-prompt.txt        # Extracted from .docx
```

## Organization Rules

**Keep code organized and modularized:**
- API routes → `/src/app/api`, one file per resource
- Pages → `/src/app`, using App Router conventions
- Components → `/src/components`, reusable UI elements
- shadcn UI → `/src/components/ui`, one component per file
- Database → `/src/db` (schema and connection)
- Utilities → `/src/lib`
- AI Prompts → `/src/prompts`

**Modularity principles:**
- Single responsibility per file
- Use shadcn Sheet for CRUD operations (side panel editing)
- One API endpoint per file
- Clear, descriptive file names

## Code Quality - Zero Tolerance

After editing ANY file, run:

```bash
npm run lint
npm run type-check
```

Fix ALL errors/warnings before continuing.

**For server-side changes:**
1. Restart dev server: `npm run dev` (port 3003)
2. Check terminal output for errors/warnings
3. Test at http://localhost:3003
4. Fix ALL issues before continuing

**Important:**
- Tailwind config MUST use v3 (v4 incompatible with Next.js 15)
- PostCSS config MUST use CommonJS (module.exports), NOT ESM

## Database Commands

**Push schema changes**:
```bash
npm run db:push
```

**Generate migrations**:
```bash
npm run db:generate
```

**View database**:
```bash
npm run db:studio
```

## Environment Variables

Create `.env.local` with:

```env
# Database (SEPARATE from frontend)
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_SECRET=<your-secret>
NEXTAUTH_URL=http://localhost:3003

# Vercel Blob (media + PDFs)
BLOB_READ_WRITE_TOKEN=<auto-generated-by-vercel>

# Resend (email)
RESEND_API_KEY=<your-resend-key>

# Anthropic (AI email generation)
ANTHROPIC_API_KEY=<your-anthropic-key>
```

## Development Workflow

### Status Change Automation
When admin changes `workshopRequest.status`:

1. **→ 'offerte gemaakt'**:
   - Trigger AI quote email generation
   - Generate PDF quote
   - Send email via Resend
   - Update `quoteEmailSentAt` and `quotePdfUrl`

2. **→ 'bevestigde opdracht'**:
   - Auto-create `confirmedWorkshop` record
   - Copy request details
   - Set initial execution fields
   - Notify admin of new confirmed workshop

### Workshop Execution Flow
1. Admin views confirmed workshop
2. Update execution details (date, participants, materials)
3. Upload workshop photos to media gallery
4. Send feedback request to customer
5. Mark as completed
6. Generate invoice (future feature)

## Implementation Phases

### Phase 1 (Week 1): Foundation ✅ COMPLETED
- ✅ Setup backend repo (GitHub: goeduitje-backend)
- ✅ Create CLAUDE.md
- ✅ Create Drizzle schema (5 tables: workshopRequests, confirmedWorkshops, feedback, mediaGallery, users)
- ✅ Setup environment variables (.env.local)
- ✅ Push schema to Neon database
- ✅ Setup Vercel project + Blob storage
- ✅ Fixed dashboard stats API (removed band-specific code)
- ✅ Updated navigation sidebar
- ✅ Dev server running on port 3003

### Phase 2 (Week 2): Core Backend ✅ COMPLETED
- ✅ workshopRequest CRUD endpoints (GET all, POST, GET by ID, PATCH, DELETE)
- ✅ Status workflow state machine with automation triggers
- ✅ Workshop requests page UI (/workshops)
- ✅ Status filter functionality
- ✅ Removed all band-specific API files (shows, bands)
- ✅ Fixed TypeScript errors (0 errors)
- ✅ Tested CRUD flow (create, read, update status, auto-create confirmedWorkshop)

### Phase 3 (Week 3): Email & PDF ✅ COMPLETED
- ✅ AI email generation (Anthropic) - `/src/lib/ai.ts`
- ✅ Puppeteer PDF quotes - `/src/lib/pdf.ts`
- ✅ Resend integration - `/src/lib/email.ts`
- ✅ Automated quote delivery - Wired into status endpoint
- ✅ Guus's email prompt extracted from .docx - `/src/prompts/guus-quote-prompt-template.txt`
- ✅ Quote automation triggers on status → 'offerte gemaakt'
- ✅ Generates AI email, PDF quote, uploads to Vercel Blob, sends via Resend
- ✅ Updates database with `quoteEmailSentAt`, `quotePdfUrl`, `aiGeneratedEmailContent`

### Phase 3.5 (Dec 20, 2024): Database-Driven Prompts ✅ COMPLETED
- ✅ Created 4 new database tables (`activities`, `pricingTiers`, `locations`, `drinksPricing`)
- ✅ Imported data from Excel files (3 activities, 12 pricing tiers, 11 locations, 11 drinks records)
- ✅ Built dynamic prompt system (`src/lib/prompt-builder.ts`)
- ✅ Created base template without hardcoded data (`src/prompts/guus-quote-prompt-template.txt`)
- ✅ **Integration complete**: Updated `src/lib/ai.ts:22-27` to use `buildSystemPrompt()`
- ✅ Fixed TypeScript errors in `prompt-builder.ts` (Drizzle ORM query chaining, type inference)
- ✅ Tested with `test-quote.ts` - Dynamic prompts working correctly
- ✅ Verified location filtering (Nijmegen), drinks policy, and pricing accuracy

### Phase 3.6 (Dec 18, 2024): Database Management UI ✅ COMPLETED
- ✅ Created API endpoints for activities, locations, and pricing tiers (full CRUD)
- ✅ Built 3 management UI pages with Table + Sheet pattern
- ✅ Updated Navigation with "Content Management" section
- ✅ Zero TypeScript errors in production code
- ✅ All changes committed and pushed to main branch (commit 5675a19)

### Phase 3.7 (Dec 20, 2024): World-Class UX Enhancement ✅ COMPLETED
**Objective**: Transform workshop management UI into world-class admin experience

#### Components Created:
1. **WorkshopRequestSheet** (`src/components/WorkshopRequestSheet.tsx`)
   - Comprehensive detail view with all request fields
   - Edit mode with inline validation
   - Organized sections: Contact, Workshop Details, Location, Special Requirements, Pricing, Internal Notes
   - Beautiful visual hierarchy with icons and badges
   - Status visualization with color-coded badges
   - Automation metadata display (quote sent timestamp, PDF URL, AI email content)
   - Loading states and error handling

2. **ConfirmStatusChangeDialog** (`src/components/ConfirmStatusChangeDialog.tsx`)
   - Prevents accidental email sends with confirmation dialog
   - Clear explanation of what each status change does
   - Visual status transition (current → new)
   - Step-by-step automation breakdown for quote generation
   - Warnings for irreversible actions
   - Customer data preview before sending quotes
   - Estimated processing time display

3. **Enhanced QuotePreviewDialog** (`src/components/QuotePreviewDialog.tsx`)
   - Preview-before-send functionality
   - Three tabs: Email Preview, AI Prompt (dynamic), API Parameters
   - "Send Now" button within preview dialog
   - Test preview generation without sending to customer
   - System prompt visibility showing database-driven content
   - Clear status indicators (sent vs. preview)

4. **Preview Quote API Endpoint** (`src/app/api/workshops/requests/[id]/preview-quote/route.ts`)
   - Generates test quote without sending email
   - Returns AI-generated email content
   - Shows dynamic system prompt for transparency
   - Displays API parameters (model, temperature, max tokens)

#### Workshop Page Overhaul (`src/app/workshops/page.tsx`):
- **Complete rewrite** with world-class UX patterns
- Toast notifications for all actions (success/error feedback)
- Loading states with spinner animations
- Processing indicators (dim rows during operations)
- Smart action buttons contextual to status
- "View Details" button opens comprehensive WorkshopRequestSheet
- "Preview Quote" button before sending
- Confirmation dialogs before destructive actions
- Status filter with count badges
- Empty state with helpful messaging
- Responsive table design

#### UI/UX Improvements:
- ✅ Consistent icon usage (Lucide React)
- ✅ Color-coded status badges
- ✅ Loading spinners for async operations
- ✅ Error boundaries and graceful fallbacks
- ✅ Success/error toast notifications
- ✅ Confirmation dialogs prevent mistakes
- ✅ Inline help text and tooltips
- ✅ Visual hierarchy with sections and separators
- ✅ Accessibility: keyboard navigation, ARIA labels
- ✅ Responsive design (mobile, tablet, desktop)

#### Technical Achievements:
- **Zero TypeScript errors** in application code
- Installed missing Radix UI components (@radix-ui/react-separator)
- Fixed browser tab title (The Dutch Queen → Goeduitje)
- Created comprehensive FRONTEND_API_CONTRACT.md
- Documented field mapping mismatch between frontend form and backend schema
- Provided transformation function for frontend integration

### Phase 4 (Week 4): Confirmed Workshops
- ✅ confirmedWorkshop auto-creation (implemented in Phase 2)
- [ ] Execution tracking UI
- [ ] Workshop calendar view
- [ ] Confirmed workshops list page

### Phase 5 (Week 5): Media & Feedback
- [ ] Vercel Blob media uploads
- [ ] Feedback form endpoint
- [ ] Public feedback display

### Phase 6 (Weeks 6-7): Admin UI
- [ ] Dashboard with request table
- [ ] Status workflow buttons
- [ ] Quote preview modal
- [ ] Workshop detail sheets
- [ ] Media gallery manager

### Phase 7 (Week 8): Testing & Polish
- [ ] E2E tests for automation
- [ ] Error handling
- [ ] Performance optimization
- [ ] Production deployment

## Data Import Sources

**Excel Files** (used for one-time initial import ONLY):
- `/Users/willemvandenberg/Dev/Goeduitjeweb/Databases backend/Real databases locations and prices/251220_Databases_backend_Structured.xlsx`
  - Imported to: `activities` and `pricingTiers` tables
- `/Users/willemvandenberg/Dev/Goeduitjeweb/Databases backend/Real databases locations and prices/Locatieprijzen_Database.xlsx`
  - Imported to: `locations` and `drinksPricing` tables

**IMPORTANT**: Excel files are reference only. Database is now the source of truth. All future updates should be made via backend UI, NOT by re-importing Excel files.

## Related Documentation

- **Implementation Plan**: `/Users/willemvandenberg/.claude/plans/reflective-juggling-yeti.md`
- **Frontend Repo**: https://github.com/willem4130/goeduitje-nl-rebuild.git
- **Frontend CLAUDE.md**: `/Users/willemvandenberg/Dev/Goeduitjeweb/goeduitje-nl-rebuild/CLAUDE.md`
- **Frontend API Contract**: `FRONTEND_API_CONTRACT.md` (in this repo)
- **Guus's Original Prompt**: `/Users/willemvandenberg/Dev/Goeduitjeweb/Masterprompt antwoordmail aanvraag_2025.12.11.docx`
- **Dynamic Prompt Template**: `src/prompts/guus-quote-prompt-template.txt`
- **Dynamic Prompt Builder**: `src/lib/prompt-builder.ts`

## OTAP Pipeline (To Be Configured)

### Development (Local)
- Port: 3003
- Database: Local PostgreSQL
- Branch: `main` (local development)

### Staging (Vercel Preview)
- URL: TBD
- Database: Staging PostgreSQL
- Branch: `staging`
- Deploy: Auto-deploy on push to staging

### Production (Vercel)
- URL: TBD (admin.goeduitje.nl or similar)
- Database: Production PostgreSQL
- Branch: `production`
- Deploy: Manual promotion from staging

## Critical Reminders

1. **NEVER commit to dutch-queen-admin** - That repo is read-only reference
2. **Port 3003** - Backend runs on 3003, frontend on 3000
3. **Separate databases** - Backend and frontend have completely separate databases
4. **Repository separation** - Backend admin vs frontend public website
5. **Status triggers** - Status changes trigger automated actions (emails, record creation)
6. **AI prompt** - Guus's system prompt must be extracted from .docx before use
