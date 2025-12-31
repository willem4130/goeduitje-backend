# Goeduitje Backend - Admin CMS

Admin dashboard for Goeduitje workshop management. Handles workshop requests, AI-powered quote generation, content management, and email automation.

## Project Structure

```
src/
├── app/
│   ├── api/                      # REST API endpoints
│   │   ├── auth/[...nextauth]/   # NextAuth authentication
│   │   ├── content/              # FAQ, team, testimonials, recipes, pages
│   │   ├── workshops/            # Requests + confirmed + quote preview
│   │   ├── google-reviews/       # Reviews visibility toggle
│   │   ├── media/                # Media upload (Vercel Blob)
│   │   ├── dashboard/stats/      # Dashboard statistics
│   │   ├── activities/           # Activity types CRUD
│   │   ├── locations/            # Locations + drinks pricing
│   │   ├── pricing/              # Pricing tiers CRUD
│   │   └── settings/             # System settings
│   ├── content/                  # CMS pages (faq, kpi, pages, recipes, team)
│   ├── workshops/                # Workshop request management
│   ├── media/                    # Media gallery admin
│   ├── google-reviews/           # Reviews admin
│   ├── feedback/                 # Contact form submissions
│   ├── settings/                 # System settings UI
│   └── page.tsx                  # Dashboard
├── components/
│   ├── ui/                       # shadcn/ui (DO NOT MODIFY)
│   ├── Navigation.tsx            # Collapsible sidebar
│   └── *Sheet.tsx                # CRUD side panels
├── db/
│   ├── schema.ts                 # Drizzle ORM schemas
│   └── index.ts                  # Database connection
├── lib/
│   ├── ai.ts                     # Claude API integration
│   ├── email.ts                  # Resend email
│   ├── pdf.ts                    # Puppeteer PDF generation
│   └── prompt-builder.ts         # Dynamic AI prompts
└── prompts/                      # AI prompt templates
```

## Tech Stack

Next.js 15 + React 19 + TypeScript | Drizzle ORM + PostgreSQL (Neon) | Claude AI | Resend | Puppeteer PDF | shadcn/ui + Tailwind CSS 3

## Code Quality - Zero Tolerance

```bash
npm run type-check && npm run lint
```

Fix ALL errors before continuing. No exceptions.

## Key Automations

- **Status → 'offerte gemaakt'**: Triggers AI email + PDF quote generation
- **Status → 'bevestigde opdracht'**: Auto-creates confirmedWorkshop record

## Organization Rules

- API routes → `/src/app/api/[resource]/route.ts`
- Admin pages → `/src/app/[section]/page.tsx`
- Components → `/src/components/`, use Sheet pattern for CRUD
- Database schemas → `/src/db/schema.ts` (Drizzle)
- Max 300 lines per file

## Database

**Shared with Frontend**: Both repos connect to same Neon PostgreSQL.
- Frontend Prisma: manages migrations (SOURCE OF TRUTH)
- Backend Drizzle: read/write only (NEVER run migrations)

```bash
npm run db:push      # Push schema changes (sync only)
npm run db:studio    # View database
```

## Never Do

- Run Drizzle migrations (Prisma in frontend is source of truth)
- Modify `/src/components/ui/` (shadcn managed)
- Skip type-check before committing
- Use Tailwind v4 (incompatible with Next.js 15)

## Deployment

**Production**: https://goeduitje-backend.vercel.app
Push to `main` → Vercel auto-deploys
