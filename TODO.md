# TODO - Goeduitje Backend

## 🚨 CRITICAL - Blob Storage Setup (Not Working)

**Issue**: Vercel Blob Storage not properly configured
**Status**: Blocked - CLI-created blob stores don't appear in dashboard
**Created**: Dec 20, 2024

### Problem:
- PDF generation works ✅ (both local and serverless with @sparticuz/chromium)
- Blob upload fails ❌ (no valid BLOB_READ_WRITE_TOKEN)
- CLI command `vercel blob store add` creates stores but they don't show in dashboard
- Direct URLs to blob stores return 404

### Attempted Solutions:
1. ❌ Created blob store via CLI (`vercel blob store add goeduitje-pdfs`)
2. ❌ Tried accessing via dashboard URL (404 error)
3. ❌ Recreated with explicit scope flag (`--scope willem4130s-projects`)
4. ⏳ Need to try: Create blob store through Vercel Dashboard UI instead

### Next Steps to Fix:
1. In Vercel Dashboard, go to Storage tab
2. Click "Create Database" button
3. Look for "Blob Storage" or "Blob" option
4. Create blob store through UI (not CLI)
5. This should auto-generate BLOB_READ_WRITE_TOKEN environment variable
6. Pull new env vars: `vercel env pull .env.local`
7. Test PDF upload in automation

### Current Workaround:
- Automation sends emails without PDF attachments
- AI email generation works perfectly
- Email sending via Resend works
- PDF generation code is ready (just commented out the upload step)

### Files Involved:
- `src/lib/pdf.ts` - PDF generation (working, serverless-ready)
- `src/app/api/workshops/requests/[id]/status/route.ts:73-159` - Automation workflow
- Package: `@sparticuz/chromium` installed for serverless PDF generation

---

## Other TODOs

### Phase 4 - Confirmed Workshops (Not Started)
- [ ] Execution tracking UI
- [ ] Workshop calendar view
- [ ] Confirmed workshops list page

### Phase 5 - Media & Feedback (Not Started)
- [ ] Media gallery manager
- [ ] Feedback form UI
- [ ] Public feedback display

### Nice to Have
- [ ] Fix ESLint circular structure warning in `.eslintrc.json`
- [ ] Add TypeScript types to `read-excel-data.ts` (dev script, non-critical)
