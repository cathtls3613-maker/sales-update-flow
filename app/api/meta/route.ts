import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigError } from "@/lib/api-guard";

export const dynamic = "force-dynamic";

/** GET /api/meta — team members + accounts for form selectors and filters. */
export async function GET() {
  const cfgError = supabaseConfigError();
  if (cfgError) return cfgError;

  const supabase = await createClient();
  const [members, accounts] = await Promise.all([
    supabase.from("team_members").select("*").order("name"),
    supabase.from("accounts").select("*").order("name"),
  ]);

  if (members.error || accounts.error) {
    return NextResponse.json(
      { error: members.error?.message ?? accounts.error?.message },
      { status: 500 },
    );
  }
  return NextResponse.json({
    team_members: members.data,
    accounts: accounts.data,
  });
}
