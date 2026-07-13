export const STATUSES = ["Pending", "In Progress", "Done", "Blocked"] as const;
export type Status = (typeof STATUSES)[number];

export const PERIOD_TYPES = ["weekly", "monthly"] as const;
export type PeriodType = (typeof PERIOD_TYPES)[number];

export const ACTIVITY_TYPE_SUGGESTIONS = [
  "Call",
  "Follow-up Call",
  "Demo Presentation",
  "Proposal Sent",
  "Site Visit",
  "Contract Negotiation",
  "Cold Outreach",
  "Email",
  "Meeting",
];

export interface TeamMember {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  role: "salesperson" | "manager" | string;
  created_at: string;
}

export interface Account {
  id: string;
  user_id: string | null;
  name: string;
  industry: string | null;
  supplier_crm_id: string | null;
  created_at: string;
}

export interface SalesUpdate {
  id: string;
  user_id: string | null;
  created_at: string;
  team_member_id: string | null;
  account_id: string | null;
  activity_type: string;
  status: string;
  notes: string | null;
  period_label: string;
  period_type: string;
  last_activity_date: string | null;
  supplier_crm_updated: boolean;
  supplier_crm_updated_at: string | null;
  ai_summary: string | null;
  ai_summary_source: string | null;
  ai_summary_confidence: number | null;
  ai_summary_review_status: string | null;
  team_member: Pick<TeamMember, "id" | "name" | "role"> | null;
  account: Pick<Account, "id" | "name" | "industry" | "supplier_crm_id"> | null;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  created_at: string;
  actor_team_member_id: string | null;
  target_table: string;
  target_id: string;
  action: string;
  old_value: string | null;
  new_value: string | null;
}
