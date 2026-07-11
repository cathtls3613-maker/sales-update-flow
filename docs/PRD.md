# PRD — Sales Update Flow

## Problem
The sales team tracks weekly and monthly activity updates across spreadsheets and chat. Records are duplicated, statuses go stale, and the supplier CRM is updated inconsistently. There is no single shared view.

## Target User
Internal sales team (3–10 people) and their direct manager. Not a public product.

## Core Objects
- **TeamMember** — name, email, role (salesperson / manager)
- **Account** — company name, industry, supplier CRM ID
- **SalesUpdate** — links a team member + account; fields: activity type, status, notes, period, supplier_crm_updated flag, last activity date
- **ActivityLog** — immutable record of every status change or flag toggle

## MVP Must-Haves
- [ ] Any team member can submit a new sales update (account, activity type, status, notes, period)
- [ ] Dashboard lists all updates — visible without login (demo-first)
- [ ] Inline status change persists to DB immediately
- [ ] "Supplier CRM updated" toggle persists per record
- [ ] Filter by salesperson, status, and period
- [ ] Seed data makes the app look alive on first load
- [ ] All screens handle loading / empty / error states

## Non-Goals (v1)
- Email or Slack notifications
- Direct API integration with supplier CRM
- AI summaries
- Multi-tenant / billing

## Success Criteria
A salesperson opens the app, submits a new update for an account, sets status to "In Progress", and marks the supplier CRM as updated — the record appears on the shared dashboard immediately, visible to the manager without a page reload or spreadsheet.

## Definition of Done
The end-to-end scenario above passes manually: form submits → row exists in DB → dashboard reflects it → status and supplier CRM toggle update in DB on change → no dead buttons, no login wall blocking the view.
