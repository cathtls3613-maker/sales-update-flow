import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigError } from "@/lib/api-guard";
import { PERIOD_TYPES, STATUSES } from "@/lib/types";

export const dynamic = "force-dynamic";

const SELECT =
  "*, team_member:team_members(id,name,role), account:accounts(id,name,industry,supplier_crm_id)";

/**
 * GET /api/updates — all updates with member + account joined, newest first.
 * Optional filters: ?team_member_id=…&status=…&period=…&supplier_crm_updated=…
 */
export async function GET(request: NextRequest) {
  const cfgError = supabaseConfigError();
  if (cfgError) return cfgError;

  const supabase = await createClient();
  const sp = request.nextUrl.searchParams;

  let query = supabase
    .from("sales_updates")
    .select(SELECT)
    .order("created_at", { ascending: false });

  const memberId = sp.get("team_member_id");
  if (memberId) query = query.eq("team_member_id", memberId);
  const status = sp.get("status");
  if (status) query = query.eq("status", status);
  const period = sp.get("period");
  if (period) query = query.ilike("period_label", `%${period}%`);
  const crm = sp.get("supplier_crm_updated");
  if (crm === "true" || crm === "false")
    query = query.eq("supplier_crm_updated", crm === "true");

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ updates: data });
}

/** POST /api/updates — insert a sales update, log it, return the joined row. */
export async function POST(request: NextRequest) {
  const cfgError = supabaseConfigError();
  if (cfgError) return cfgError;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const required = [
    "team_member_id",
    "account_id",
    "activity_type",
    "status",
    "period_label",
    "period_type",
  ] as const;
  const missing = required.filter(
    (f) => typeof body[f] !== "string" || (body[f] as string).trim() === "",
  );
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields: ${missing.join(", ")}` },
      { status: 400 },
    );
  }
  if (!STATUSES.includes(body.status as (typeof STATUSES)[number])) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${STATUSES.join(", ")}` },
      { status: 400 },
    );
  }
  if (!PERIOD_TYPES.includes(body.period_type as (typeof PERIOD_TYPES)[number])) {
    return NextResponse.json(
      { error: "Invalid period_type. Must be 'weekly' or 'monthly'." },
      { status: 400 },
    );
  }

  const crmUpdated = body.supplier_crm_updated === true;
  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("sales_updates")
    .insert({
      team_member_id: body.team_member_id,
      account_id: body.account_id,
      activity_type: (body.activity_type as string).trim(),
      status: body.status,
      notes:
        typeof body.notes === "string" && body.notes.trim() !== ""
          ? (body.notes as string).trim()
          : null,
      period_label: (body.period_label as string).trim(),
      period_type: body.period_type,
      last_activity_date:
        typeof body.last_activity_date === "string" && body.last_activity_date
          ? body.last_activity_date
          : new Date().toISOString().slice(0, 10),
      supplier_crm_updated: crmUpdated,
      supplier_crm_updated_at: crmUpdated ? new Date().toISOString() : null,
    })
    .select(SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit trail (ARCHITECTURE.md / INTELLIGENCE_LAYER.md: "Update submitted")
  await supabase.from("activity_logs").insert({
    actor_team_member_id: body.team_member_id,
    target_table: "sales_updates",
    target_id: created.id,
    action: "update_submitted",
    old_value: null,
    new_value: created.status,
  });

  return NextResponse.json({ update: created }, { status: 201 });
}
