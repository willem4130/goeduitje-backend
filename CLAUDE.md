# Goeduitje Backend - Admin CMS

Admin dashboard for Goeduitje workshop management. Handles workshop requests, AI-powered quote generation, content management, media gallery, email automation, and development change tracking.

## Project Structure

```
src/
├── app/
│   ├── api/                      # REST API endpoints
│   │   ├── changes/              # Wijzigingen CRUD + feedback
│   │   ├── content/              # FAQ, team, testimonials, recipes, pages
│   │   ├── workshops/            # Requests + confirmed + quote preview
│   │   ├── media/                # Media CRUD (Vercel Blob)
│   │   ├── google-reviews/       # Reviews visibility toggle
│   │   └── pricing/              # Pricing tiers CRUD
│   ├── wijzigingen/              # Client-facing changes review page
│   ├── google-reviews/           # Reviews admin (visibility control)
│   ├── content/                  # CMS pages
│   └── page.tsx                  # Dashboard
├── db/
│   ├── schema.ts                 # Drizzle ORM schemas
│   └── index.ts                  # Database connection
└── scripts/
    └── update-change-status.ts   # Update wijziging status by title
```

## Tech Stack

Next.js 15 + React 19 + TypeScript | Drizzle ORM + PostgreSQL (Neon) | Claude AI | Resend | shadcn/ui + Tailwind CSS 3

## Code Quality

```bash
npm run type-check && npm run lint
```

Fix ALL errors before committing. No exceptions.

## Database

**Shared with Frontend**: Both repos connect to same Neon PostgreSQL.
- Frontend Prisma: manages migrations (SOURCE OF TRUTH)
- Backend Drizzle: read/write only (NEVER run migrations)

## Wijzigingen System

Client-facing changelog at `/wijzigingen` for tracking and approving development changes.

### Status Workflow

```
pending (Te beoordelen) ──┬──→ approved (Goedgekeurd)
         ↑               │
         │               └──→ needs_changes (Aanpassen)
         │                           │
         │                           ↓
         └─────────────────── fixed_review (Aangepast & opnieuw beoordelen)
```

### Status Values

| Status | Label | Color | Description |
|--------|-------|-------|-------------|
| `pending` | Te beoordelen | Yellow | New items awaiting client review |
| `approved` | Goedgekeurd | Green | Client approved |
| `needs_changes` | Aanpassen | Red | Client wants changes |
| `fixed_review` | Aangepast | Blue | Developer fixed, needs re-review |
| `in_progress` | In ontwikkeling | Grey | Developer WIP |

**Note**: `pending` and `fixed_review` items both appear in "Te beoordelen" tab with visual distinction (yellow vs blue).

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/changes` | List changes (`?status=pending&status=fixed_review` for multiple) |
| POST | `/api/changes` | Create change (FormData with screenshots) |
| PATCH | `/api/changes/[id]` | Update status |
| GET | `/api/changes/[id]/feedback` | List feedback |
| POST | `/api/changes/[id]/feedback` | Add feedback |

### Developer Workflow: Completing Client Feedback

When fixing items with client feedback (`needs_changes` status):

```bash
# 1. Read the client feedback
curl -s "https://goeduitje-backend.vercel.app/api/changes/[id]/feedback" | jq

# 2. Fix the issue in the relevant repo

# 3. Verify on live site (CRITICAL!)
curl -s "https://goeduitje-nl-rebuild.vercel.app/[page]" | grep "expected text"

# 4. Update status to fixed_review via API
curl -X PATCH "https://goeduitje-backend.vercel.app/api/changes/[id]" \
  -H "Content-Type: application/json" \
  -d '{"status": "fixed_review"}'

# 5. Optionally update changeDetails with what was fixed
curl -X PATCH "https://goeduitje-backend.vercel.app/api/changes/[id]" \
  -H "Content-Type: application/json" \
  -d '{"changeDetails": ["Fixed item 1", "Fixed item 2"]}'
```

### Verification Checklist

Before marking as `fixed_review`, verify:

1. **Code changes committed and pushed** to relevant repo
2. **Deployment complete** (check Vercel)
3. **Live site shows correct data** (curl or browser)
4. **API returns expected results** (if applicable)
5. **Client feedback fully addressed** (compare point by point)

## Google Reviews Admin

Control which reviews appear on frontend at `/google-reviews`.

- Toggle `isVisible` to hide fake/unwanted reviews
- Frontend filters by `isVisible: true`
- Fake reviews should be set to `isVisible: false`

## Commit Workflow

```bash
# 1. Make changes
# 2. Run quality checks
npm run type-check && npm run lint

# 3. Commit
git add <files> && git commit --no-verify -m "message"

# 4. Push (auto-deploys to Vercel)
git push
```

## Never Do

- Run Drizzle migrations (Prisma in frontend is source of truth)
- Modify `/src/components/ui/` (shadcn managed)
- Skip type-check before committing
- Mark wijziging as `fixed_review` without verifying on live site

## Deployment

**Production**: https://goeduitje-backend.vercel.app

Push to `main` → Vercel auto-deploys
