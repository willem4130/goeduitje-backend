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

### 4 Core Tables

#### 1. workshopRequests
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

#### 2. confirmedWorkshops
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

#### 3. feedback
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

#### 4. mediaGallery
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

## AI Email Generation

### Guus's System Prompt
Location: `/Users/willemvandenberg/Dev/Goeduitjeweb/Masterprompt antwoordmail aanvraag_2025.12.11.docx`

**Trigger**: When `workshopRequest.status` changes to `'offerte gemaakt'`

**Process**:
1. Extract request details from database
2. Load Guus's system prompt from .docx
3. Call Anthropic API with prompt + request data
4. Generate personalized quote email
5. Generate PDF quote using Puppeteer
6. Upload PDF to Vercel Blob
7. Send email via Resend with PDF attachment
8. Update request: `quoteEmailSentAt`, `quotePdfUrl`

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

### Phase 1 (Week 1): Foundation
- ✅ Setup backend repo
- ✅ Create CLAUDE.md
- [ ] Extract Guus's system prompt
- [ ] Create Drizzle schema (4 tables)
- [ ] Setup environment variables
- [ ] Create /commit command

### Phase 2 (Week 2): Core Backend
- [ ] workshopRequest CRUD endpoints
- [ ] Status workflow state machine
- [ ] Database migrations

### Phase 3 (Week 3): Email & PDF
- [ ] AI email generation (Anthropic)
- [ ] Puppeteer PDF quotes
- [ ] Resend integration
- [ ] Automated quote delivery

### Phase 4 (Week 4): Confirmed Workshops
- [ ] confirmedWorkshop auto-creation
- [ ] Execution tracking UI
- [ ] Workshop calendar view

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

## Related Documentation

- **Implementation Plan**: `/Users/willemvandenberg/.claude/plans/reflective-juggling-yeti.md`
- **Frontend Repo**: https://github.com/willem4130/goeduitje-nl-rebuild.git
- **Frontend CLAUDE.md**: `/Users/willemvandenberg/Dev/Goeduitjeweb/goeduitje-nl-rebuild/CLAUDE.md`
- **Guus's Prompt**: `/Users/willemvandenberg/Dev/Goeduitjeweb/Masterprompt antwoordmail aanvraag_2025.12.11.docx`

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
