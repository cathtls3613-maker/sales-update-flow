# Architecture — Sales Update Flow

## Stack
- **Frontend:** Next.js 14 (App Router) — Vercel
- **Database + Auth:** Supabase (Postgres, RLS, Auth)
- **Styling:** Tailwind CSS
- **No external AI dependency in v1** — core works fully without it

## What to Build Now vs Later
**Now:** Log updates → shared dashboard → status/flag edits → audit trail 
**Next:** Auth + per-user isolation → monthly summary → supplier CRM checklist 
**Later:** AI summaries → overdue alerts → export → direct supplier CRM API push

## Key User Action — Step by Step
1. Salesperson opens `/` — dashboard loads all updates from Supabase
2. Clicks **New Update** → form opens
3. Selects account, types activity notes, picks status + period → submits
4. API route (`POST /api/updates`) validates and inserts row into `sales_updates`
5. Dashboard re-fetches (or optimistic update) — new row appears
6. Salesperson toggles **Supplier CRM ✓** → `PATCH /api/updates/:id` sets flag, writes to `activity_logs`
7. Manager sees the same live state on their screen

## Layer Plan
1. **Data first** — schema, constraints, RLS, seed data
2. **App logic** — CRUD API routes, form validation, filter queries
3. **Smart features later** — AI summary, overdue scoring, email drafts

## Why It Runs Without AI
Every field is user-entered or rule-derived. AI summary is an optional enrichment stored separately; removing it leaves all core workflow intact.
