# Goeduitje Backend - Quick Start

Admin CMS for managing workshop requests, AI-powered quote generation, and workshop execution tracking.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # RESTful endpoints (workshops, activities, locations, pricing)
│   ├── workshops/         # Workshop management pages
│   ├── activities/        # Activity type management
│   ├── locations/         # Location management
│   └── pricing/           # Pricing tier management
│
├── components/            # React components
│   ├── ui/               # shadcn/ui primitives (button, dialog, sheet, table)
│   ├── WorkshopRequestSheet.tsx      # Detail view side panel
│   ├── ConfirmStatusChangeDialog.tsx # Status confirmation
│   └── QuotePreviewDialog.tsx        # Quote preview modal
│
├── lib/                   # Business logic & utilities
│   ├── ai.ts             # Anthropic Claude integration
│   ├── prompt-builder.ts # Dynamic database-driven prompts
│   ├── email.ts          # Resend email service
│   ├── pdf.ts            # Puppeteer PDF generation
│   └── auth.ts           # NextAuth configuration
│
├── db/                    # Database layer
│   ├── schema.ts         # 8 Drizzle ORM tables
│   └── index.ts          # PostgreSQL connection
│
└── prompts/               # AI prompt templates
    └── guus-quote-prompt-template.txt
```

## Organization Rules

**API Routes** → `/src/app/api/[resource]/route.ts`
- One file per route (GET, POST, PATCH, DELETE)
- Nested: `/api/workshops/requests/[id]/status/route.ts`

**Components** → `/src/components/[Name].tsx`
- UI primitives in `/components/ui/`
- One component per file
- Use shadcn/ui patterns

**Pages** → `/src/app/[route]/page.tsx`
- App Router file convention
- Server components by default
- 'use client' only when needed

**Business Logic** → `/src/lib/[module].ts`
- Single responsibility per file
- Export pure functions
- Database access via Drizzle ORM

## Code Quality - Zero Tolerance

After editing ANY file:

```bash
npm run type-check && npm run lint
```

Fix ALL errors/warnings before continuing.

**Server restart required?** If changes affect API routes or server logic:

```bash
# Stop dev server (Ctrl+C)
npm run dev
# Check terminal for errors
```

## Tech Stack

- **Framework**: Next.js 15.1.4 + React 19 + TypeScript
- **Database**: PostgreSQL (Neon) + Drizzle ORM
- **AI**: Anthropic Claude (dynamic database-driven prompts)
- **Email**: Resend (quote delivery)
- **Storage**: Vercel Blob (PDFs, media)
- **Auth**: NextAuth.js v5
- **UI**: Tailwind CSS + shadcn/ui + Radix UI

## Key Commands

```bash
npm run dev              # Start dev server (port 3003)
npm run build            # Production build
npm run type-check       # TypeScript validation
npm run lint             # ESLint check
npm run db:push          # Push schema to database
npm run db:studio        # Drizzle Studio (database UI)
```

## Quick Reference

**Port**: 3003 (Backend) | 3000 (Frontend - separate repo)
**Database**: PostgreSQL via Drizzle ORM
**API Docs**: See `FRONTEND_API_CONTRACT.md`
**Full Docs**: See `CLAUDE.md` (comprehensive project documentation)
