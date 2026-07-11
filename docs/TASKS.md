# Tasks — Sales Update Flow

## Gantt Overview
```
Sprint 1 — DB + Core Log Engine          Week 1
Sprint 2 — Shared Dashboard (v1 ✅)      Week 1–2
Sprint 3 — Monthly Summary + CRM Check   Week 2
Sprint 4 — Lock It Down (Auth + RLS)     Week 3
Sprint 5 — Intelligence + Alerts         Week 4
```

---

## Sprint 1 — DB & Core Log Engine
**Goal:** Schema live, seed data loaded, New Update form persists to DB.

- [ ] Run migration SQL in Supabase (team_members, accounts, sales_updates, activity_logs)
- [ ] Confirm seed rows appear in Supabase table editor
- [ ] Scaffold Next.js project, connect Supabase client
- [ ] `POST /api/updates` — insert row, return created record
- [ ] `GET /api/updates` — list all with team_member + account joined
- [ ] New Update form: account selector, activity type, status, notes, period, supplier CRM flag
- [ ] Form validation (required fields); error and success toast states
- [ ] Loading and error states on form submit

**Definition of Done:** Submit the form with real data → row exists in `sales_updates` table → no JS errors in console.

---

## Sprint 2 — Shared Dashboard ✅ v1 functional milestone
**Goal:** Anyone opening the URL sees all updates live; inline edits persist.

- [ ] Dashboard page (`/`) renders without login — shows all sales_updates
- [ ] Table columns: Salesperson, Account, Activity Type, Status, Period, Supplier CRM ✓, Last Updated
- [ ] Loading skeleton while fetching
- [ ] Empty state with "Log your first update" CTA
- [ ] Error banner if fetch fails
- [ ] Filter bar: salesperson dropdown, status dropdown, period input
- [ ] Inline status dropdown — `PATCH /api/updates/:id` on change, writes activity_log row
- [ ] Inline supplier CRM toggle — `PATCH /api/updates/:id`, writes activity_log row
- [ ] "New Update" button opens form (from Sprint 1); new row appears on dashboard after submit

**Definition of Done:** Open `/` anonymously → see seeded rows → change a status → refresh → new status persists → log row exists in activity_logs.

---

## Sprint 3 — Monthly Summary & Supplier CRM Checklist
**Goal:** Manager-level views for period reporting.

- [ ] `/summary` page: updates grouped by salesperson, counts by status per period
- [ ] `/crm-checklist` page: all records where supplier_crm_updated = false
- [ ] Bulk-select + bulk mark supplier CRM updated (writes activity_log per record)
- [ ] Overdue highlight: last_activity_date > 7 days ago → amber row; > 14 days → red row
- [ ] Empty state on both pages

**Definition of Done:** Summary page shows correct counts matching DB; CRM checklist bulk action updates all selected rows and logs each change.

---

## Sprint 4 — Lock It Down
**Goal:** Auth active, per-user write isolation enforced, demo read still works.

- [ ] Enable Supabase Auth (email+password)
- [ ] Sign-up / login pages (`/login`, `/signup`)
- [ ] On insert, write `auth.uid()` into `user_id` for sales_updates and team_members
- [ ] Replace v1 open write policies with `auth.uid() = user_id` for INSERT/UPDATE/DELETE
- [ ] Manager role: separate RLS policy allowing SELECT on all records
- [ ] Protect write API routes — reject unauthenticated requests with 401
- [ ] activity_logs: add append-only policy (no UPDATE/DELETE)
- [ ] Verify: unauthenticated visitor can read dashboard but cannot submit or edit

**Definition of Done:** Logged-out user sees dashboard (read-only); attempt to PATCH via API without session returns 401; two separate logged-in users cannot edit each other's records.

---

## Sprint 5 — Intelligence & Alerts
**Goal:** Rule-based overdue scoring live; AI summary wired but manager-reviewed.

- [ ] Overdue scoring job (cron or on-fetch): compute days since last_activity_date, surface on dashboard
- [ ] `generate_summary` tool: call LLM with notes → write ai_summary, ai_summary_source, ai_summary_confidence, ai_summary_review_status
- [ ] Manager UI: review AI summaries (approve / reject per record)
- [ ] `draft_reminder` tool: draft message for overdue rep → manager approves before any send
- [ ] Every agent tool call logged to activity_logs with tool_name + input/output snapshot

**Definition of Done:** Overdue records show correct flag colour; AI summary appears on update detail with review_status = 'unreviewed' until manager acts; no LLM key visible in browser network tab.
