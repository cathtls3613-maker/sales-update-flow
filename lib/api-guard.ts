import { NextResponse } from "next/server";

/**
 * Returns a 503 response if Supabase env vars are missing so API routes fail
 * with a clear message instead of an opaque crash (TEST_PLAN error state).
 */
export function supabaseConfigError(): NextResponse | null {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.json(
      {
        error:
          "Database is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in the environment, then reload.",
      },
      { status: 503 },
    );
  }
  return null;
}
