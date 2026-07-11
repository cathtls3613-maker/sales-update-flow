# Test Plan — Sales Update Flow

## Core Success Scenario (manual)
1. Open `/` in an incognito window — dashboard loads with seeded rows. ✓ no login wall
2. Click **New Update** → form appears.
3. Select account "Apex Retail", type activity type "Call", status "In Progress", notes "Discussed renewal", period "Jul W4 2025" → click Submit.
4. Toast confirms success. New row appears in the dashboard table. ✓
5. Open Supabase table editor → confirm row exists in `sales_updates`. ✓
6. On the dashboard, change status to "Done" via inline dropdown. ✓ row updates without page reload.
7. Confirm status in Supabase is "Done". ✓
8. Toggle **Supplier CRM ✓** on the same row. ✓ flag updates in DB. ✓ activity_logs has two new rows.
9. Refresh the page → all changes persist. ✓

## Empty State
- Delete all rows in Supabase (or use a clean project) → open `/` → see "No updates yet" empty state with CTA button, not a blank screen.

## Error States
- Disconnect Supabase URL (set wrong env var) → dashboard shows error banner, not a crash.
- Submit form with required fields blank → inline validation errors appear, form does not submit.

## Filter
- With 6+ seed rows, filter by salesperson "Sara Lim" → only Sara's rows shown.
- Filter by status "Blocked" → only blocked rows shown.
- Clear filters → all rows return.

## Overdue Highlight (Sprint 3)
- Set `last_activity_date` on a row to 10 days ago in DB → row appears amber on dashboard.
- Set to 15 days ago → row appears red.

## Lock-Down Checks (Sprint 4)
- Unauthenticated `curl PATCH /api/updates/:id` → 401 response.
- Log in as Salesperson A → cannot edit Salesperson B's record.
- Log in as Manager → can see all records.

## AI Summary (Sprint 5)
- Trigger generate_summary for an update → `ai_summary` populated, `review_status = 'unreviewed'`.
- Open Supabase network tab in browser → no LLM API key visible in any request.
- Manager approves summary → `review_status` updates to 'approved' in DB.
