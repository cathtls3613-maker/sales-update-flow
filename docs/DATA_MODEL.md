# Data Model — Sales Update Flow

## team_members
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | nullable; linked at lock-down sprint |
| name | text | |
| email | text | |
| role | text | 'salesperson' or 'manager' |
| created_at | timestamptz | |

## accounts
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | nullable |
| name | text | |
| industry | text | |
| supplier_crm_id | text | reference ID in supplier system |
| created_at | timestamptz | |

## sales_updates
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | nullable |
| team_member_id | uuid FK → team_members | |
| account_id | uuid FK → accounts | |
| activity_type | text | e.g. Call, Demo, Proposal, Visit |
| status | text | Pending / In Progress / Done / Blocked |
| notes | text | |
| period_label | text | e.g. "Jul W3 2025" |
| period_type | text | 'weekly' or 'monthly' |
| last_activity_date | date | |
| supplier_crm_updated | boolean | default false |
| supplier_crm_updated_at | timestamptz | |
| ai_summary | text | AI field |
| ai_summary_source | text | e.g. 'gpt-4o' |
| ai_summary_confidence | numeric | 0–1 |
| ai_summary_review_status | text | 'unreviewed' / 'approved' / 'rejected' |
| created_at | timestamptz | |

## activity_logs
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | nullable |
| actor_team_member_id | uuid FK → team_members | |
| target_table | text | |
| target_id | uuid | |
| action | text | e.g. 'status_changed', 'supplier_crm_flagged' |
| old_value | text | |
| new_value | text | |
| created_at | timestamptz | |

## RLS (v1 — open for demo)
All tables: permissive SELECT and ALL policies. Replaced with `auth.uid() = user_id` at lock-down sprint.
