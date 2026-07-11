# Intelligence Layer — Sales Update Flow

## Messy Inputs
- Free-text notes from salespeople (varied length, quality, language)
- Inconsistent activity type labels across reps
- Dates sometimes missing or approximate

## Auto-Structure Schema (applied when AI summary is generated)
```json
{
  "period": "Jul W3 2025",
  "rep": "Jamie Tan",
  "account": "Apex Retail Sdn Bhd",
  "key_outcome": "Q3 order confirmed",
  "next_action": "Follow-up meeting in 2 weeks",
  "sentiment": "positive",
  "risk_flag": false,
  "source": "gpt-4o",
  "confidence": 0.87,
  "review_status": "unreviewed"
}
```

## Events to Track
- Update submitted (rep, account, period, status)
- Status changed (old → new)
- Supplier CRM flag toggled
- Record overdue (no update in 7 days)

## Scoring Rules (rule-based v1)
- **Overdue score:** days since `last_activity_date` > 7 → flag amber; > 14 → flag red
- **Completion rate:** (Done records / total records) per rep per period
- **Supplier CRM gap:** count of records where `supplier_crm_updated = false` per rep

## What Gets Ranked
- Reps sorted by overdue count on manager dashboard
- Accounts sorted by last activity date (stalest first)

## v1 vs Later
- **v1:** Rule-based overdue flags, completion rate counter — no AI calls
- **Later:** AI summary generation per update; sentiment tagging; auto-suggested next actions
