# Agentic Layer — Sales Update Flow

## Risk Levels & Actions

### Low Risk — Auto (no approval needed)
- Generate AI summary from notes → store in `ai_summary` + source + confidence + `review_status = 'unreviewed'`
- Tag activity type from notes if left blank
- Flag record as overdue based on date rule

### Medium Risk — Light Approval (manager confirms before execution)
- Draft overdue reminder message to a salesperson
- Auto-create a follow-up task when status is set to "Blocked"
- Bulk-set supplier CRM updated for a period after manager confirms

### High Risk — Always Approval
- Send email/Slack notification to a team member
- Post a summary report to a shared channel

### Critical — Human Only
- Delete any sales update record
- Modify audit log entries (not permitted)

## Approval Flow
Draft → shown to manager in UI → manager clicks Approve → action executes → written to `activity_logs`

## Named Tools (approved list)
- `generate_summary(update_id)` — calls LLM, writes ai_summary fields
- `flag_overdue(update_id)` — sets overdue status based on date rule
- `draft_reminder(member_id, period)` — creates draft message, surfaces for approval
- `bulk_mark_crm_updated(update_ids[])` — requires manager approval

## Audit Log Fields (every agent action)
`actor`, `tool_name`, `target_id`, `input_snapshot`, `output_snapshot`, `approved_by`, `executed_at`

## v1
Only rule-based flags (low risk, no LLM calls). Agent tools are wired in Sprint 5.
