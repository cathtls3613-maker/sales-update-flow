create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  role text not null default 'salesperson'
);

alter table team_members enable row level security;
drop policy if exists "team_members_v1_read" on team_members;
create policy "team_members_v1_read" on team_members for select using (true);
drop policy if exists "team_members_v1_write" on team_members;
create policy "team_members_v1_write" on team_members for all using (true) with check (true);

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  name text not null,
  industry text,
  supplier_crm_id text
);

alter table accounts enable row level security;
drop policy if exists "accounts_v1_read" on accounts;
create policy "accounts_v1_read" on accounts for select using (true);
drop policy if exists "accounts_v1_write" on accounts;
create policy "accounts_v1_write" on accounts for all using (true) with check (true);

create table if not exists sales_updates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  team_member_id uuid references team_members(id),
  account_id uuid references accounts(id),
  activity_type text not null,
  status text not null default 'Pending',
  notes text,
  period_label text not null,
  period_type text not null default 'weekly',
  last_activity_date date,
  supplier_crm_updated boolean not null default false,
  supplier_crm_updated_at timestamptz,
  ai_summary text,
  ai_summary_source text,
  ai_summary_confidence numeric,
  ai_summary_review_status text default 'unreviewed'
);

alter table sales_updates enable row level security;
drop policy if exists "sales_updates_v1_read" on sales_updates;
create policy "sales_updates_v1_read" on sales_updates for select using (true);
drop policy if exists "sales_updates_v1_write" on sales_updates;
create policy "sales_updates_v1_write" on sales_updates for all using (true) with check (true);

create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  actor_team_member_id uuid references team_members(id),
  target_table text not null,
  target_id uuid not null,
  action text not null,
  old_value text,
  new_value text
);

alter table activity_logs enable row level security;
drop policy if exists "activity_logs_v1_read" on activity_logs;
create policy "activity_logs_v1_read" on activity_logs for select using (true);
drop policy if exists "activity_logs_v1_write" on activity_logs;
create policy "activity_logs_v1_write" on activity_logs for all using (true) with check (true);

insert into team_members (id, name, email, role) values
  ('a1000000-0000-0000-0000-000000000001', 'Jamie Tan', 'jamie@example.com', 'salesperson'),
  ('a1000000-0000-0000-0000-000000000002', 'Sara Lim', 'sara@example.com', 'salesperson'),
  ('a1000000-0000-0000-0000-000000000003', 'Marcus Wong', 'marcus@example.com', 'salesperson'),
  ('a1000000-0000-0000-0000-000000000004', 'Priya Nair', 'priya@example.com', 'manager')
on conflict (id) do nothing;

insert into accounts (id, name, industry, supplier_crm_id) values
  ('b1000000-0000-0000-0000-000000000001', 'Apex Retail Sdn Bhd', 'Retail', 'SUP-001'),
  ('b1000000-0000-0000-0000-000000000002', 'BrightTech Solutions', 'Technology', 'SUP-002'),
  ('b1000000-0000-0000-0000-000000000003', 'ClearPath Logistics', 'Logistics', 'SUP-003'),
  ('b1000000-0000-0000-0000-000000000004', 'DeltaFoods Group', 'F&B', 'SUP-004'),
  ('b1000000-0000-0000-0000-000000000005', 'EverGreen Properties', 'Real Estate', 'SUP-005')
on conflict (id) do nothing;

insert into sales_updates (team_member_id, account_id, activity_type, status, notes, period_label, period_type, last_activity_date, supplier_crm_updated) values
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Follow-up Call', 'Done', 'Confirmed Q3 order. Next meeting in 2 weeks.', 'Jul W3 2025', 'weekly', '2025-07-14', true),
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002', 'Demo Presentation', 'In Progress', 'Demo delivered. Awaiting internal approval from client.', 'Jul W3 2025', 'weekly', '2025-07-15', false),
  ('a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000003', 'Proposal Sent', 'Pending', 'Proposal emailed. No response yet.', 'Jul W3 2025', 'weekly', '2025-07-13', false),
  ('a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000004', 'Site Visit', 'Done', 'Visited warehouse. Good fit for new product line.', 'Jul W3 2025', 'weekly', '2025-07-16', true),
  ('a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000005', 'Contract Negotiation', 'Blocked', 'Legal review pending on client side. Escalated to manager.', 'Jul W3 2025', 'weekly', '2025-07-10', false),
  ('a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 'Cold Outreach', 'Done', 'Initial contact made. Interested in Q4 promo bundle.', 'July 2025', 'monthly', '2025-07-12', true);