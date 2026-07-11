# Security — Sales Update Flow

## Secret Handling
- Supabase service-role key: server-side only (Next.js API routes / Edge Functions). Never imported into client components.
- Public anon key used in browser — only valid because RLS enforces what it can read/write.
- All LLM API keys (Sprint 5): server-side env vars only, never exposed to frontend.

## Permission Model
- **v1 (demo):** Open RLS policies — anyone can read and write. Safe for internal preview only.
- **Lock-down sprint:** `auth.uid() = user_id` write policies. Salespeople write own records; managers read all via separate policy. Role checked server-side on every write route.
- Agent tools inherit the session's role — a salesperson's session cannot trigger manager-only bulk actions.

## Approved Tools Rule
Agent may only call named tools listed in AGENTIC_LAYER.md. No `eval`, no `run_any`, no `send_any`. Each tool call is logged before execution.

## Audit Principle
Every status change, flag toggle, and agent action writes an immutable row to `activity_logs`. Logs are append-only (no update/delete policy on that table at lock-down).

## Honest Gaps (act before real data goes in)
- Per-user isolation is NOT active until the lock-down sprint. Do not store real customer data before that sprint is complete and verified.
- If auth or RLS behaviour is uncertain, stop and verify with a Supabase support resource before proceeding.
