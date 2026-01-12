# Goeduitje Backend - Admin CMS

Admin dashboard for Goeduitje workshop management. Handles workshop requests, AI-powered quote generation, content management, media gallery, email automation, and development change tracking.

## Project Structure

```
src/
├── app/
│   ├── api/                      # REST API endpoints
│   │   ├── auth/[...nextauth]/   # NextAuth authentication
│   │   ├── changes/              # Development changes CRUD + feedback
│   │   ├── content/              # FAQ, team, testimonials, recipes, pages
│   │   ├── workshops/            # Requests + confirmed + quote preview
│   │   ├── media/                # Media CRUD (Vercel Blob)
│   │   ├── site-assets/          # Site assets API for frontend
│   │   ├── google-reviews/       # Reviews visibility toggle
│   │   ├── dashboard/stats/      # Dashboard statistics
│   │   ├── activities/           # Activity types CRUD
│   │   ├── locations/            # Locations + drinks pricing
│   │   └── pricing/              # Pricing tiers CRUD
│   ├── content/                  # CMS pages (faq, kpi, pages, recipes, team)
│   ├── workshops/                # Workshop request management
│   ├── wijzigingen/              # Development changes admin page
│   ├── media/                    # Media gallery admin (grouped sections)
│   ├── google-reviews/           # Reviews admin
│   ├── feedback/                 # Contact form submissions
│   └── page.tsx                  # Dashboard
├── components/
│   ├── ui/                       # shadcn/ui (DO NOT MODIFY)
│   ├── Navigation.tsx            # Collapsible sidebar
│   ├── EditMediaSheet.tsx        # Media edit panel with categories
│   └── UploadMediaSheet.tsx      # Media upload with step-by-step flow
├── db/
│   ├── schema.ts                 # Drizzle ORM schemas
│   └── index.ts                  # Database connection
├── lib/
│   ├── ai.ts                     # Claude API integration
│   ├── email.ts                  # Resend email
│   ├── media-categories.ts       # Media category definitions
│   ├── pdf.ts                    # Puppeteer PDF generation
│   └── prompt-builder.ts         # Dynamic AI prompts
├── prompts/                      # AI prompt templates
└── scripts/
    ├── migrate-site-assets.ts    # Migrate static files to Vercel Blob
    ├── seed-session-changes.ts   # Seed initial changes from SESSION_CHANGES.html
    ├── reset-statuses.ts         # Reset statuses (creates backup first)
    ├── restore-statuses.ts       # Restore statuses from backup
    └── update-change-status.ts   # Update single item status by title
```

## Tech Stack

Next.js 15 + React 19 + TypeScript | Drizzle ORM + PostgreSQL (Neon) | Claude AI | Resend | Puppeteer PDF | shadcn/ui + Tailwind CSS 3

## Code Quality - Zero Tolerance

```bash
npm run type-check && npm run lint
```

Fix ALL errors before continuing. No exceptions.

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
```

## Wijzigingen (Development Changes)

Client-facing changelog for tracking and approving development changes. Accessible at `/wijzigingen`.

### Features
- **Status workflow**: pending → approved/needs_changes
- **Quick actions**: One-click approve/reject buttons
- **Feedback system**: Text + multiple screenshots per feedback item
- **Soft delete**: Items go to "Verwijderd" tab, can be restored
- **Multiple screenshots**: Unlimited images per change or feedback

### Database Tables

| Table | Purpose |
|-------|---------|
| `session_changes` | Development changes with status, category, screenshots |
| `session_change_feedback` | Client feedback with text and screenshots |
| `session_change_status_history` | Backup of all status changes for restore capability |

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/changes` | List all changes (filter: `?status=pending`, `?deleted=true`) |
| POST | `/api/changes` | Create change (FormData with multiple screenshots) |
| GET | `/api/changes/[id]` | Get single change with feedback |
| PATCH | `/api/changes/[id]` | Update status, restore (`{restore: true}`) |
| DELETE | `/api/changes/[id]` | Soft delete (or `?permanent=true` for hard delete) |
| GET | `/api/changes/[id]/feedback` | List feedback for change |
| POST | `/api/changes/[id]/feedback` | Add feedback (FormData with multiple screenshots) |
| DELETE | `/api/changes/[id]/feedback?feedbackId=xxx` | Delete feedback |

### Scripts

```bash
npm run seed:changes      # Seed from SESSION_CHANGES.html data
npm run reset:statuses    # Reset all statuses to pending (backs up first!)
npm run restore:statuses  # Restore statuses from backup
npm run update:change "title" "status"  # Update specific item by title
```

### Developer Workflow: Completing Features

When you complete a feature that has a corresponding wijzigingen item:

1. **Complete the feature** in the relevant repo (frontend or backend)
2. **Commit and push** the changes
3. **Update the wijzigingen status** to `pending` (Te beoordelen):
   ```bash
   cd goeduitje-backend
   npm run update:change "feature title" "pending"
   ```
4. The item will now appear active (not greyed out) in `/wijzigingen` for client review

Example:
```bash
npm run update:change "alle recepten" "pending"
# Updates: "Alle recepten toevoegen" → status: pending (Te beoordelen)
```

### Status Values
- `pending` - Te beoordelen (yellow, needs client review)
- `approved` - Goedgekeurd (green)
- `needs_changes` - Aanpassen (red, client wants changes)
- `in_progress` - In ontwikkeling (grey, developer WIP)

### Screenshots Storage
- Changes: `changes/{changeId}/{timestamp}-{filename}` in Vercel Blob
- Feedback: `feedback/{changeId}/{feedbackId}/{timestamp}-{filename}` in Vercel Blob

### Status History Backup
All status changes are automatically logged to `session_change_status_history` for recovery purposes.

**How it works:**
- Every status change via the UI is logged with timestamp and who made it
- The `reset:statuses` script backs up all current statuses before resetting
- The `restore:statuses` script restores the most recent non-pending status per item

**Recovery workflow:**
```bash
# If client approvals were accidentally reset:
npm run restore:statuses
```

## Recipes Management

Full CRUD for cooking workshop recipes at `/content/recipes`.

### Features
- Title, slug, description, image URL
- Prep time, cook time, servings, difficulty
- Category selection (Voorgerecht, Hoofdgerecht, Bijgerecht, Dessert)
- Ingredients list (one per line)
- Step-by-step instructions (one per line)
- Tips field
- Publish/unpublish toggle
- Image preview in edit form

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/content/recipes` | List all recipes |
| POST | `/api/content/recipes` | Create recipe |
| PUT | `/api/content/recipes` | Update recipe |
| DELETE | `/api/content/recipes?id=xxx` | Delete recipe |

### Database Schema

```typescript
recipe {
  id, title, slug, description, imageUrl,
  prepTime, cookTime, servings, difficulty, category,
  ingredients[], steps[], tips,
  isPublished, createdAt, updatedAt
}
```

## Media Categories

Backend manages all site assets via `/media` admin. Categories defined in `lib/media-categories.ts`:

| Group | Category | Placement |
|-------|----------|-----------|
| **Site Assets** | `site-logo` | Nav bar & footer |
| | `site-hero-video` | Homepage full-screen background |
| | `site-hero-poster` | Homepage fallback image |
| | `site-og` | Social media link previews |
| **Workshop** | `workshop-hero` | Workshop detail page hero |
| | `workshop-gallery` | Workshop pages & "Onze Impact" |
| **Content** | `team-photo` | "Onze Medewerkers" page |
| | `testimonial` | "Jullie Ervaringen" page |
| | `recipe` | Recipe pages |
| | `general` | Miscellaneous |

**Migration**: `npm run migrate:assets` uploads from frontend `/public/` to Vercel Blob.

## Never Do

- Run Drizzle migrations (Prisma in frontend is source of truth)
- Modify `/src/components/ui/` (shadcn managed)
- Skip type-check before committing
- Use Tailwind v4 (incompatible with Next.js 15)

## Deployment

**Production**: https://goeduitje-backend.vercel.app
Push to `main` → Vercel auto-deploys
