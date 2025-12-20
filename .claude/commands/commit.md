---
name: commit
description: Run checks, commit with AI message, and push to BACKEND repo
---

⚠️ **BACKEND REPO ONLY** - For frontend changes, use frontend repo's /commit

**Repository**: goeduitje-backend (to be created on GitHub)
**Port**: 3003 (backend) - NOT 3000 (frontend)

1. Run quality checks:
   ```bash
   npm run lint && npm run type-check
   ```
   Fix ALL errors before continuing.

2. Test backend functionality:
   ```bash
   # Ensure dev server runs without errors
   npm run dev
   # Check http://localhost:3003
   # Verify no console errors
   ```

3. Review changes: `git status` and `git diff`

4. Generate commit message following Conventional Commits:
   - Format: `type: description`
   - Types: feat/fix/docs/style/refactor/test/chore
   - Be specific and concise (one line)
   - Example: `feat: add workshop request status workflow endpoint`

5. Commit and push to **BACKEND** repo:
   ```bash
   git add -A
   git commit -m "[your generated message]"
   git push origin main
   ```

---

## Critical Rules

**THIS BACKEND REPO IS FOR:**
✅ Workshop request management
✅ Quote generation (AI + PDF)
✅ Confirmed workshops tracking
✅ Admin dashboard
✅ Workshop database schema (Drizzle ORM)
✅ Email automation (Resend)
✅ Media gallery backend
✅ Feedback collection backend

**FRONTEND REPO IS FOR:**
❌ Public website UI
❌ Workshop booking form (user-facing)
❌ Activity pages
❌ Contact pages
❌ Public photo gallery

**NEVER:**
- ❌ Commit frontend UI code to this backend repo
- ❌ Commit backend admin code to frontend repo
- ❌ Use frontend database credentials in backend
- ❌ Mix backend port (3003) with frontend port (3000)

---

## Before Every Commit - Verify:

1. ✅ Port 3003 (NOT 3000)
2. ✅ Backend database URL (separate from frontend)
3. ✅ All lint/type errors fixed
4. ✅ Server restarts without errors
5. ✅ Commit to correct repo (goeduitje-backend, NOT goeduitje-nl-rebuild)

---

## Repository URLs

- **THIS REPO (Backend)**: `willem4130/goeduitje-backend` (to be created)
- **Frontend Repo**: https://github.com/willem4130/goeduitje-nl-rebuild.git
- **Reference (READ-ONLY)**: https://github.com/willem4130/dutch-queen-admin.git
