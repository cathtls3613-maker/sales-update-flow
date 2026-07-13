export type OverdueLevel = "ok" | "amber" | "red";

export function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const then = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(then.getTime())) return null;
  return Math.floor((Date.now() - then.getTime()) / 86_400_000);
}

/** Rule from INTELLIGENCE_LAYER.md: > 7 days → amber, > 14 days → red. */
export function overdueLevel(dateStr: string | null): OverdueLevel {
  const days = daysSince(dateStr);
  if (days === null) return "ok";
  if (days > 14) return "red";
  if (days > 7) return "amber";
  return "ok";
}
