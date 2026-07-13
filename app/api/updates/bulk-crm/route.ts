import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigError } from "@/lib/api-guard";

export const dynamic = "force-dynamic";

/**
 * POST /api/updates/bulk-crm — bulk mark supplier CRM updated (Sprint 3).
 * Writes one activity_logs row per record (TASKS.md requirement).
 */
export async function POST(request: NextRequest) {
  const cfgError = supabaseConfigError();
  if (cfgError) return cfgError;

  let body: { ids?: unknown; actor_team_member_id?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const ids = Array.isArray(body.ids)
    ? body.ids.filter((v): v is string => typeof v === "string")
    : [];
  if (ids.length === 0) {
    return NextResponse.json(
      { error: "Provide a non-empty 'ids' array" },
      { status: 400 },
    );
  }
  if (ids.length > 200) {
    return NextResponse.json(
      { error: "Too many records at once (max 200)" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data: targets, error: fetchError } = await supabase
    .from("sales_updates")
    .select("id")
    .in("id", ids)
    .eq("supplier_crm_updated", false);
  if (fetchError)
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!targets || targets.length === 0) {
    return NextResponse.json({ updated: 0 });
  }

  const targetIds = targets.map((t) => t.id);
  const { error: updateError } = await supabase
    .from("sales_updates")
    .update({
      supplier_crm_updated: true,
      supplier_crm_updated_at: new Date().toISOString(),
    })
    .in("id", targetIds);
  if (updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 });

  const actor =
    typeof body.actor_team_member_id === "string" && body.actor_team_member_id
      ? body.actor_team_member_id
      : null;
  await supabase.from("activity_logs").insert(
    targetIds.map((targetId) => ({
      actor_team_member_id: actor,
      target_table: "sales_updates",
      target_id: targetId,
      action: "supplier_crm_flagged",
      old_value: "false",
      new_value: "true",
    })),
  );

  return NextResponse.json({ updated: targetIds.length });
}
