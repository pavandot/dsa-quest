# DSA Quest — Build Plan & Progress

**Authoritative build-status doc.** `ROADMAP.md` is the _curriculum_ source of
truth; this file tracks _engineering_ progress and what to do next. Update it at
the end of every working session.

_Last updated: 2026-06-13 — Phase E complete (`f92c746`)._

---

## How we work

Built step-by-step from a single master prompt (2026-06-12) as a gamified DSA
platform (Duolingo progression × Brilliant interactivity × NeetCode roadmap ×
LeetCode in-browser solving × RPG progression). **Workflow agreement:** small
phases with explicit confirmation between steps — at each feature, explain
architecture → generate code → explain testing → wait for confirmation. Claude
acts as senior engineering lead/mentor, not just a code generator. Production
quality only; design so future AI features (hints/explanations/mentor/review)
drop in easily.

## Stack & infra

- **Frontend:** Next.js 15 (App Router) · TypeScript (strict) · Tailwind v4 ·
  shadcn/ui (radix-nova) · Monaco editor · TanStack Query · Zustand
- **Backend:** Supabase (Auth / Postgres / Storage) · Vercel hosting
- **Repo:** https://github.com/pavandot/dsa-quest · local `~/Code/vide_coding/dsa-quest`
- **Prod:** https://dsa-quest-two.vercel.app (NOT dsa-quest.vercel.app)
- **Supabase project ref:** `qjpzcznbkxirbkdrfqww` (ap-south-1); creds in
  `.env.local` (untracked). Migrations applied via `npx supabase db push`
  (CLI is linked).

## Architecture conventions

- **Feature-based:** `src/features/<feature>/{server/queries.ts, actions.ts, components/}`.
- **Writes go through the service role only.** User-owned tables have RLS
  read-own policies and NO client insert/update — all mutations flow through
  server actions calling `createAdminClient()` → security-definer SQL functions.
  Clients cannot forge progress/XP.
- **SQL functions are the transaction boundary** (`complete_lesson`,
  `submit_problem_attempt`, `evaluate_achievements`). Each is service-role-only
  (`revoke … from authenticated; grant … to service_role`). To change one, add a
  NEW migration that `create or replace`s it — never edit an applied migration.
- **Types:** `src/lib/database.types.ts` is hand-maintained; when adding an RPC,
  add its entry to the `Functions` block (the typed admin client needs it).
- Browser code execution: Web Worker executor behind an `Executor` interface
  (`src/features/problems/executor/`) so a server/Pyodide executor can drop in.

---

## Phase status

| Phase | Scope | Status |
|-------|-------|--------|
| **A** | Repo, Next.js, tooling, Vercel pipeline | ✅ done |
| **B** | Supabase: 20-table schema + RLS + indexes, curriculum seeded | ✅ done |
| **C** | Auth, dashboard, curriculum engine, progress tracking | ✅ done |
| **D** | Monaco workspace, sandboxed execution, submission flow | ✅ done |
| **E** | Gamification: XP · levels · **review queue** · **achievements** · badges | ✅ done |
| **F** | Production hardening: error tracking, security, caching, analytics, a11y, SEO, CI/CD | ⬜ todo |

### What's built (per phase)

- **A–B:** repo + tooling; full schema (`supabase/migrations/20260612151000_initial_schema.sql`);
  curriculum seeded (5 phases × 4 weeks × 4 chapters; ~400 lessons). 3 problems +
  Week 1 Ch 1 content authored — other 79 chapters are completable skeletons.
- **C:** Supabase SSR auth + middleware route protection; full auth UI; dashboard
  (resume point, streak, XP/level, study heatmap, recent activity, up-next);
  learn map + lesson pages; `complete_lesson` SQL fn (atomic completion, sequential
  unlock, chapter/week/phase rollups, one-time XP, streak).
- **D:** `/practice` list + `/practice/[slug]` workspace (Monaco, progressive
  hints, per-problem drafts in Zustand, Run vs Submit); `submit_problem_attempt`
  SQL fn (attempt history, first-solve XP, streak, activity, review enrollment).
- **E — Reviews (`db12728`):** spaced-repetition 1·3·7·14·30-day ladder + mastery
  (`learning→practicing→mastered`) folded into `submit_problem_attempt`; passing a
  DUE review advances it (+ review XP, +25 mastery bonus), failing lapses it; a
  `due_at<=now` guard = one review event per due window. `/reviews` page
  (`getReviewQueue`: due / upcoming / mastery counts). Workspace toast reflects
  review outcome.
- **E — Achievements (`f92c746`):** `evaluate_achievements(user_id)` SQL fn —
  data-driven jsonb criteria, idempotent awarding (row + XP + activity), returns
  newly-earned; called from `submitAttempt` + `completeLesson` via
  `awardAchievements` helper (fail-safe); unlock toasts; `/achievements` page
  (earned vs locked + progress, grouped by category); 18 seeded achievements.
  Criteria types: `problems_solved, lessons_completed, chapters_completed,
  streak, reviews_completed, problems_mastered, level, tag_solved`.

---

## Remaining plan (next steps, in order)

1. **Admin panel** (role-gated `admin`) — 1–2 steps
   - Lesson editor (edit `lessons.content` blocks + quizzes), problem editor
     (CRUD `problems`: starter/solution code, test cases), curriculum management,
     user stats, achievement management.
   - Gate via `profiles.role = 'admin'` + `is_admin()` (already in schema/RLS).
2. **Phase F — Production hardening** + public landing page
   - Error tracking, security headers, caching strategy, Vercel Analytics,
     accessibility pass, SEO/metadata, CI (GitHub Actions running the `scripts/`
     test suite), and a real public `/` landing page (currently redirects).
3. **Google OAuth** — needs Pavan's Google Cloud OAuth credentials; wiring is
   small (Supabase provider + existing `google-button.tsx`).
4. **Later: interactive visualizations engine** — animated/step-through concept
   visualizers (sliding window, etc.) per the master prompt's "Interactive
   Learning" section.

### Smaller follow-ups / polish
- **Dashboard achievements widget** — master prompt lists "Achievements" on the
  dashboard; `/achievements` page exists but isn't surfaced there yet.
- **Authoring content** — only 3 problems + 1 chapter authored; the platform is
  functional but thin on content. Seeders are idempotent (see below).

### Known tech debt
- `/learn` ships a ~580 KB RSC payload (whole course tree).
- Quiz answers and hidden test cases are sent to the client (inherent to
  browser-side execution; revisit if/when a server executor lands).

---

## Commands

```bash
# dev / checks
npm run dev            # next dev --turbopack
npm run typecheck      # tsc --noEmit
npm run lint           # eslint
npm run build          # production build

# migrations (CLI linked to qjpzcznbkxirbkdrfqww)
npx supabase db push           # apply new migrations in supabase/migrations/
npx supabase migration list    # local vs remote

# seeders (idempotent)
npm run seed:curriculum
npm run seed:content
npm run seed:problems
npm run seed:achievements

# test scripts (run against the live project; use the e2e-test user)
npm run test:auth
npm run test:reviews
npm run test:achievements
npx tsx scripts/complete-lesson-test.mts
npx tsx scripts/submit-attempt-test.mts
npx tsx scripts/dashboard-logic-test.mts
npx tsx scripts/runner-core-test.mts
```

Test account: `e2e-test@dsaquest.dev` (password lives in the prior session's
private notes / Supabase, not in the repo). Test scripts read the service-role
key from `.env.local`.
