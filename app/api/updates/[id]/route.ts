import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigError } from "@/lib/api-guard";
import { STATUSES } from "@/lib/types";

export const dynamic = "force-dynamic";

const SELECT =
  "*, team_member:team_members(id,name,role), account:accounts(id,name,industry,supplier_crm_id)";

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/updates/:id — inline edits (status, supplier CRM flag).
 * Every change writes an immutable activity_logs row (SECURITY.md audit rule).
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const cfgError = supabaseConfigError();
  if (cfgError) return cfgError;

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("sales_updates")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (fetchError)
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!existing)
    return NextResponse.json({ error: "Update not found" }, { status: 404 });

  const changes: Record<string, unknown> = {};
  const logs: Array<{
    action: string;
    old_value: string | null;
    new_value: string | null;
  }> = [];

  if (typeof body.status === "string" && body.status !== existing.status) {
    if (!STATUSES.includes(body.status as (typeof STATUSES)[number])) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${STATUSES.join(", ")}` },
        { status: 400 },
      );
    }
    changes.status = body.status;
    logs.push({
      action: "status_changed",
      old_value: existing.status,
      new_value: body.status,
    });
  }

  if (
    typeof body.supplier_crm_updated === "boolean" &&
    body.supplier_crm_updated !== existing.supplier_crm_updated
  ) {
    changes.supplier_crm_updated = body.supplier_crm_updated;
    changes.supplier_crm_updated_at = body.supplier_crm_updated
      ? new Date().toISOString()
      : null;
    logs.push({
      action: "supplier_crm_flagged",
      old_value: String(existing.supplier_crm_updated),
      new_value: String(body.supplier_crm_updated),
    });
  }

  if (typeof body.notes === "string" && body.notes.trim() !== (existing.notes ?? "")) {
    changes.notes = body.notes.trim() === "" ? null : body.notes.trim();
    logs.push({
      action: "notes_edited",
      old_value: existing.notes,
      new_value: (changes.notes as string | null) ?? null,
    });
  }

  if (Object.keys(changes).length === 0) {
    return NextResponse.json({ error: "No changes to apply" }, { status: 400 });
  }

  const { data: updated, error: updateError } = await supabase
    .from("sales_updates")
    .update(changes)
    .eq("id", id)
    .select(SELECT)
    .single();
  if (updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 });

  const actor =
    typeof body.actor_team_member_id === "string" && body.actor_team_member_id
      ? body.actor_team_member_id
      : null;
  await supabase.from("activity_logs").insert(
    logs.map((log) => ({
      actor_team_member_id: actor,
      target_table: "sales_updates",
      target_id: id,
      ...log,
    })),
  );

  return NextResponse.json({ update: updated });
}

/** DELETE /api/updates/:id — human-only action per AGENTIC_LAYER.md; logged. */
export async function DELETE(request: NextRequest, { params }: Params) {
  const cfgError = supabaseConfigError();
  if (cfgError) return cfgError;

  const { id } = await params;
  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("sales_updates")
    .select("id,status")
    .eq("id", id)
    .maybeSingle();
  if (fetchError)
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!existing)
    return NextResponse.json({ error: "Update not found" }, { status: 404 });

  const { error: deleteError } = await supabase
    .from("sales_updates")
    .delete()
    .eq("id", id);
  if (deleteError)
    return NextResponse.json({ error: deleteError.message }, { status: 500 });

  await supabase.from("activity_logs").insert({
    actor_team_member_id: null,
    target_table: "sales_updates",
    target_id: id,
    action: "update_deleted",
    old_value: existing.status,
    new_value: null,
  });

  return NextResponse.json({ ok: true });
}
