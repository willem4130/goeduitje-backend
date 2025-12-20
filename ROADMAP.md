# The Dutch Queen - Band Management Platform Transformation

## Vision
Transform this basic admin panel into a comprehensive band management platform with beautiful UI, sales pipeline, social media management, AI content generation, and analytics.

## Current State → Target State

**Current** (Basic Admin):
- Next.js admin with SQLite database
- Shows management only (CRUD)
- Simple table UI with inline CSS
- Deployed but non-functional (SQLite doesn't work serverless)
- Static content in JSON files

**Target** (Full Platform):
- PostgreSQL database (Neon) with 11+ tables
- Beautiful glassmorphism UI matching frontend
- Tile-based dashboard for all features
- Venue discovery via web scraping
- Email campaigns & social media scheduling
- AI-powered content generation
- Analytics dashboard with automation

---

## Architecture Decisions

### Database: PostgreSQL (Neon)
- **Why**: Serverless, production-ready, free tier (0.5GB storage)
- **Migration**: SQLite → PostgreSQL via Drizzle
- **Cost**: $0 (free tier sufficient)

### Web Scraping: Custom Puppeteer (NOT Apify)
- **Why**: Save $49/month, full control, potential product opportunity
- **Tech**: Puppeteer/Playwright
- **Cost**: $0-10/month (only if proxies needed)
- **Targets**: partyflock.nl, festivalinfo.nl, podiuminfo.nl

### Monthly Budget: ~$30/month
- Email (Resend): $0-20 (20K free, then $1/1K)
- AI (OpenAI): $10-20 (GPT-4 usage-based)
- Social (Direct APIs): $0 (free) OR Buffer $6/month
- Database (Neon): $0 (free tier)
- **Total: $10-40/month** (vs $75-115 with Apify)

---

## 6-Week Implementation Roadmap

### PHASE 1: Foundation & Database (Week 1)

**Goal**: Migrate to PostgreSQL and expand schema

**Tasks**:
1. ✅ Create Neon account and database
2. ✅ Update `drizzle.config.ts` for PostgreSQL
3. ✅ Expand `src/db/schema.ts` with 10 new tables:
   - Content: bandProfiles, aboutContent, bandMembers, socialContent, socialPlatforms, contactContent
   - Platform: venues, campaigns, socialPosts, aiTemplates, scraperJobs
4. ✅ Enhance Shows table: bookingStatus, financial, performance, contactLog
5. ✅ Create `scripts/migrate-to-postgres.ts`
6. ✅ Create `scripts/migrate-json-to-db.ts`
7. ✅ Run migrations and verify

**Files**:
- `drizzle.config.ts`
- `src/db/schema.ts`
- `scripts/migrate-to-postgres.ts`
- `scripts/migrate-json-to-db.ts`

---

### PHASE 2: UI/UX Transformation (Week 2)

**Goal**: Beautiful UI matching frontend aesthetic

**Tasks**:
1. ✅ Install Tailwind CSS: `npm install tailwindcss@latest autoprefixer postcss framer-motion lucide-react`
2. ✅ Create `tailwind.config.ts` with custom colors (black bg, amber/teal/purple accents)
3. ✅ Create `postcss.config.mjs`
4. ✅ Create `src/app/globals.css` with glassmorphism utilities
5. ✅ Build UI component library (10 components):
   - Button, Card, Input, Select, Checkbox, Modal, Badge, Spinner, IconButton, DashboardTile
6. ✅ Redesign `src/app/page.tsx` with tile-based dashboard
7. ✅ Redesign shows pages with card grid (replace table)

**Design System**:
- Background: `#000000` (black)
- Accents: amber-900, teal-800, purple-600
- Glassmorphism: `bg-white/5 backdrop-blur-md`
- Transitions: 300ms duration
- Hover: `scale-[1.02]` with glow shadows

**Files**:
- `tailwind.config.ts`
- `postcss.config.mjs`
- `src/app/globals.css`
- `src/components/ui/*` (10 components)
- `src/app/page.tsx`

---

### PHASE 3: Content Management (Week 3)

**Goal**: Admin UI for all content types

**New Pages**:
1. ✅ `src/app/profile/[bandId]/page.tsx` - Band profile editor
2. ✅ `src/app/about/[bandId]/page.tsx` - About content + members
3. ✅ `src/app/social/[bandId]/page.tsx` - Social media manager
4. ✅ `src/app/contact/[bandId]/page.tsx` - Contact editor

**New API Endpoints**:
- `/api/profile/[bandId]` - GET, PUT
- `/api/about/[bandId]` - GET, PUT
- `/api/members` - GET all, POST
- `/api/members/[id]` - GET, PUT, DELETE
- `/api/social/[bandId]` - GET, PUT
- `/api/platforms` - GET all, POST
- `/api/platforms/[id]` - GET, PUT, DELETE
- `/api/contact/[bandId]` - GET, PUT

**Update**:
- `src/app/api/bands/[bandId]/route.ts` - Query DB instead of JSON files

**Validation**:
- Create `src/lib/validation.ts` with Zod schemas

---

### PHASE 4: Sales Pipeline (Week 4)

**Goal**: Venue discovery and campaign management

**Tasks**:
1. ✅ Build venue management UI: `src/app/venues/page.tsx`
2. ✅ Build venue detail page: `src/app/venues/[id]/page.tsx`
3. ✅ Create custom Puppeteer scraper: `src/lib/scraper.ts`
4. ✅ Build scraper config UI: `src/app/scraper/page.tsx`
5. ✅ Build campaign manager: `src/app/campaigns/page.tsx`
6. ✅ Integrate Resend for email: `src/app/api/email/send/route.ts`
7. ✅ Create cron job: `src/app/api/cron/scraper/route.ts`

**Scraper Targets**:
- partyflock.nl (Dutch festivals)
- festivalinfo.nl (Festival listings)
- podiuminfo.nl (Venue database)

**Files**:
- `src/lib/scraper.ts`
- `src/app/venues/*`
- `src/app/campaigns/*`
- `src/app/scraper/*`
- `src/app/api/email/send/route.ts`
- `src/app/api/cron/scraper/route.ts`

---

### PHASE 5: Social & AI (Week 5)

**Goal**: Social scheduling and AI content generation

**Tasks**:
1. ✅ Build social post scheduler: `src/app/social-posts/page.tsx`
2. ✅ Implement publishing: `src/app/api/social/publish/route.ts`
3. ✅ Choose: Direct platform APIs (free) OR Buffer ($6/month)
4. ✅ Create AI generator: `src/app/api/ai/generate/route.ts`
5. ✅ Build template manager: `src/app/templates/page.tsx`
6. ✅ Add "Generate with AI" buttons to forms
7. ✅ Create social analytics cron: `src/app/api/cron/social-analytics/route.ts`

**AI Templates** (examples):
- Social post - show announcement
- Email - venue outreach
- Email - follow-up

**Social Publishing Options**:
- **Option A** (Free): Facebook Graph API, Instagram Graph API, Twitter API v2
- **Option B** ($6/month): Buffer API (easier but costs)

**Files**:
- `src/app/social-posts/*`
- `src/app/templates/*`
- `src/app/api/social/publish/route.ts`
- `src/app/api/ai/generate/route.ts`
- `src/app/api/cron/social-analytics/route.ts`

---

### PHASE 6: Analytics & Automation (Week 6)

**Goal**: Unified dashboard and automated workflows

**Tasks**:
1. ✅ Build analytics dashboard: `src/app/analytics/page.tsx`
2. ✅ Create analytics endpoint: `src/app/api/analytics/dashboard/route.ts`
3. ✅ Add Chart.js or Recharts for visualizations
4. ✅ Configure Vercel cron jobs in `vercel.json`
5. ✅ Create cron endpoints:
   - `/api/cron/social-analytics` (daily 2am)
   - `/api/cron/scraper` (weekly Monday 3am)
   - `/api/cron/campaigns` (every 15min)
   - `/api/cron/reminders` (daily 9am)
   - `/api/cron/archive` (daily midnight)
6. ✅ Build notifications system

**Analytics Widgets**:
- Shows performance (revenue, attendance)
- Sales pipeline funnel
- Campaign metrics (open rate, conversion)
- Social media growth charts
- Venue database stats

**Files**:
- `src/app/analytics/page.tsx`
- `src/app/api/analytics/dashboard/route.ts`
- `src/app/api/cron/*` (5 cron jobs)
- `vercel.json`

---

## Database Schema Reference

### Existing (Enhanced)
**shows** - Add: bookingStatus, financial (fee, deposit, expenses, netRevenue), performance (attendance, rating), contactLog

### New Content Tables (6)
1. **bandProfiles** - name, tagline, genre, theme, hero, SEO, branding
2. **bandSeo** - metaTitle, metaDescription, keywords, ogImage
3. **bandBranding** - logoMain, logoIcon, favicon
4. **aboutContent** - descriptions, story (founding, mission, vision)
5. **bandMembers** - name, role, bio, image, sortOrder
6. **achievements** - year, achievement, sortOrder
7. **socialContent** - preferredOrder, display settings
8. **socialPlatforms** - platform, url, handle, active
9. **contactContent** - primary/booking/press/management contacts, location, office

### New Platform Tables (5)
1. **venues** - name, type, location, contacts, leadStatus, bookingRequirements, rating
2. **campaigns** - name, type, content, targets, metrics (open rate, response rate)
3. **socialPosts** - title, content, platforms, scheduledDate, analytics
4. **aiTemplates** - name, category, prompt, variables, model settings
5. **scraperJobs** - name, type, targetUrl, selectors, filters, schedule, results

---

## Critical Files Reference

**Database**:
- `drizzle.config.ts`
- `src/db/schema.ts` (11+ tables)
- `src/db/index.ts`
- `scripts/migrate-to-postgres.ts`
- `scripts/migrate-json-to-db.ts`

**Design System**:
- `tailwind.config.ts`
- `postcss.config.mjs`
- `src/app/globals.css`
- `src/components/ui/*` (Button, Card, Input, Modal, etc.)

**Pages**:
- `src/app/page.tsx` (dashboard)
- `src/app/profile/[bandId]/*`
- `src/app/about/[bandId]/*`
- `src/app/social/[bandId]/*`
- `src/app/contact/[bandId]/*`
- `src/app/venues/*`
- `src/app/campaigns/*`
- `src/app/social-posts/*`
- `src/app/analytics/*`

**APIs**:
- `src/app/api/bands/[bandId]/route.ts` (update to use DB)
- `src/app/api/profile/*`, `about/*`, `social/*`, `contact/*`
- `src/app/api/venues/*`, `campaigns/*`, `social-posts/*`
- `src/app/api/ai/generate/route.ts`
- `src/app/api/email/send/route.ts`
- `src/app/api/social/publish/route.ts`
- `src/app/api/analytics/dashboard/route.ts`
- `src/app/api/cron/*`

**Utilities**:
- `src/lib/validation.ts` (Zod schemas)
- `src/lib/scraper.ts` (Puppeteer)
- `src/lib/ai.ts` (AI helpers)
- `src/lib/email.ts` (Email templates)
- `src/lib/social.ts` (Social API wrappers)

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://[neon-connection]

# Email
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=booking@thedutchqueen.com

# AI
OPENAI_API_KEY=sk-xxxxx

# Social Media (Option A: Direct APIs - Free)
FACEBOOK_ACCESS_TOKEN=xxxxx
FACEBOOK_PAGE_ID=xxxxx
INSTAGRAM_BUSINESS_ACCOUNT_ID=xxxxx
TWITTER_BEARER_TOKEN=xxxxx

# Social Media (Option B: Buffer - $6/month)
BUFFER_ACCESS_TOKEN=xxxxx
BUFFER_FACEBOOK_PROFILE_ID=xxxxx
BUFFER_INSTAGRAM_PROFILE_ID=xxxxx

# Auth (re-enable later)
NEXTAUTH_SECRET=[32-char-random]
NEXTAUTH_URL=http://localhost:3003
```

---

## Testing Checklist

### Phase 1: Database
- [ ] Neon database created and connected
- [ ] Schema migrated (11 tables)
- [ ] Shows migrated from SQLite
- [ ] JSON content imported
- [ ] All tables populated
- [ ] API returns DB data

### Phase 2: UI/UX
- [ ] Tailwind CSS working
- [ ] All 10 components built
- [ ] Dashboard displays tiles
- [ ] Navigation works
- [ ] Responsive design
- [ ] Glassmorphism renders
- [ ] 60fps animations

### Phase 3: Content
- [ ] Profile editor works
- [ ] About editor works
- [ ] Social manager works
- [ ] Contact editor works
- [ ] All CRUD operations
- [ ] Validation working

### Phase 4: Pipeline
- [ ] Venue list/filters
- [ ] Add/edit venue
- [ ] Campaign creation
- [ ] Email sending
- [ ] Scraper executes
- [ ] Lead tracking

### Phase 5: Social & AI
- [ ] Post scheduler
- [ ] Platform publishing
- [ ] Analytics collection
- [ ] AI generation
- [ ] Templates working
- [ ] Content usable

### Phase 6: Analytics
- [ ] Dashboard loads
- [ ] Charts render
- [ ] Filters work
- [ ] Cron jobs run
- [ ] Notifications send
- [ ] Auto-archive works

---

## Success Metrics

**Month 1**:
- 50+ venues in database
- 2+ campaigns sent
- 10+ social posts scheduled
- All content in database (no JSON)
- 5+ hours/week saved

**Month 3**:
- 200+ venues
- 10+ campaigns with metrics
- 40+ social posts
- 3+ bookings from campaigns
- Analytics trending
- 20+ hours/week saved

**Month 6**:
- 500+ venues
- 30+ campaigns
- Measurable social growth
- Predictable pipeline
- Consider scraper product
- Platform ROI positive

---

## Future Enhancements (Phase 7+)

1. Mobile app (React Native)
2. Contract management (DocuSign)
3. Setlist tracking
4. Fan database & email lists
5. Merchandise inventory
6. Tour route optimization
7. Competitor analysis
8. Predictive analytics (ML)
9. Custom Apify actor (sellable product)
10. White-label platform for other bands

---

## ROI Calculation

**Time Saved**: ~50 hours/month
- Venue research: 5 hrs/week
- Social posting: 3 hrs/week
- Email outreach: 4 hrs/week
- Analytics: 2 hrs/week

**Value**: $2,500/month (at $50/hr)
**Cost**: $30/month average
**ROI**: 8,233%

---

## Next Steps

1. Create Neon account
2. Install Tailwind: `npm install tailwindcss@latest autoprefixer postcss framer-motion lucide-react`
3. Update Drizzle config for PostgreSQL
4. Expand database schema
5. Start Phase 1 migration

**Full plan**: `/Users/willemvandenberg/.claude/plans/soft-bubbling-robin.md`
