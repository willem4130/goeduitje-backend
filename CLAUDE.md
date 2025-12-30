# Goeduitje Backend - Admin CMS

Admin dashboard for Goeduitje workshop management. Handles workshop requests, AI-powered quote generation, content management, and email automation.

## Architecture

| Repo | Purpose | Port |
|------|---------|------|
| **goeduitje-backend** (this) | ALL admin functionality | 3003 |
| **goeduitje-nl-rebuild** | Public website only | 3000 |

**Database**: Both repos share the SAME Neon PostgreSQL database.
- Frontend: Prisma ORM (manages migrations)
- Backend: Drizzle ORM (read/write, NO migrations)

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/              # NextAuth authentication
│   │   ├── content/           # FAQ, team, testimonials, recipes CRUD
│   │   ├── workshops/         # Workshop requests + status automation
│   │   ├── activities/        # Activity types CRUD
│   │   ├── locations/         # Locations + drinks pricing CRUD
│   │   └── pricing/           # Pricing tiers CRUD
│   ├── content/               # Content management pages
│   ├── workshops/             # Workshop management pages
│   └── page.tsx               # Dashboard
├── components/
│   ├── ui/                    # shadcn/ui components (DO NOT MODIFY)
│   ├── Navigation.tsx         # Sidebar navigation
│   └── [feature]Sheet.tsx     # CRUD side panels
├── db/
│   ├── schema.ts              # Drizzle ORM schemas
│   └── index.ts               # Database connection
├── lib/
│   ├── ai.ts                  # Claude API integration
│   ├── email.ts               # Resend email sending
│   ├── pdf.ts                 # Puppeteer PDF generation
│   └── prompt-builder.ts      # Dynamic AI prompts from DB
└── prompts/                   # AI prompt templates
```

## Tech Stack

- **Framework**: Next.js 15 + React 19 + TypeScript 5
- **Database**: PostgreSQL (Neon) + Drizzle ORM
- **AI**: Anthropic Claude (quote emails)
- **Email**: Resend
- **PDF**: Puppeteer + @sparticuz/chromium
- **UI**: Tailwind CSS 3 + shadcn/ui + Radix UI

## Code Quality - Zero Tolerance

```bash
npm run type-check && npm run lint
```

Fix ALL errors before continuing. No exceptions.

## Key Automations

**Status → 'offerte gemaakt'**: Triggers AI email + PDF quote generation
**Status → 'bevestigde opdracht'**: Auto-creates confirmedWorkshop record

## Organization Rules

- API routes → `/src/app/api/[resource]/route.ts`
- Admin pages → `/src/app/[section]/page.tsx`
- Components → `/src/components/`, use Sheet pattern for CRUD
- Database schemas → `/src/db/schema.ts` (Drizzle)
- Max 300 lines per file

## Database Commands

```bash
npm run db:push      # Push schema changes
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
