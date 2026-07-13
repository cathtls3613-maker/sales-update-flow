"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/client-api";
import { overdueLevel } from "@/lib/overdue";
import { SalesUpdate, STATUSES } from "@/lib/types";

interface RepSummary {
  memberId: string;
  name: string;
  role: string;
  counts: Record<string, number>;
  total: number;
  overdue: number;
  crmGaps: number;
}

export default function SummaryPage() {
  const [updates, setUpdates] = useState<SalesUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { updates } = await api<{ updates: SalesUpdate[] }>("/api/updates");
        if (!cancelled) {
          setUpdates(updates);
          setError(null);
        }
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const periods = useMemo(
    () => [...new Set(updates.map((u) => u.period_label))].sort(),
    [updates],
  );

  const rows: RepSummary[] = useMemo(() => {
    const filtered = period
      ? updates.filter((u) => u.period_label === period)
      : updates;
    const byMember = new Map<string, RepSummary>();
    for (const u of filtered) {
      const id = u.team_member?.id ?? "unknown";
      let row = byMember.get(id);
      if (!row) {
        row = {
          memberId: id,
          name: u.team_member?.name ?? "Unknown",
          role: u.team_member?.role ?? "salesperson",
          counts: Object.fromEntries(STATUSES.map((s) => [s, 0])),
          total: 0,
          overdue: 0,
          crmGaps: 0,
        };
        byMember.set(id, row);
      }
      row.counts[u.status] = (row.counts[u.status] ?? 0) + 1;
      row.total += 1;
      if (overdueLevel(u.last_activity_date) !== "ok") row.overdue += 1;
      if (!u.supplier_crm_updated) row.crmGaps += 1;
    }
    // INTELLIGENCE_LAYER.md: reps sorted by overdue count
    return [...byMember.values()].sort(
      (a, b) => b.overdue - a.overdue || a.name.localeCompare(b.name),
    );
  }, [updates, period]);

  const completionRate = (row: RepSummary) =>
    row.total === 0 ? 0 : Math.round(((row.counts.Done ?? 0) / row.total) * 100);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Monthly Summary
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Updates grouped by salesperson — counts by status per period.
          </p>
        </div>
        <select
          aria-label="Filter by period"
          className="rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-sm text-neutral-700 focus:border-indigo-500 focus:outline-none"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          <option value="">All periods</option>
          {periods.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <strong>Couldn&apos;t load data:</strong> {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
              <th className="px-4 py-3 font-semibold">Salesperson</th>
              {STATUSES.map((s) => (
                <th key={s} className="px-4 py-3 text-center font-semibold">
                  {s}
                </th>
              ))}
              <th className="px-4 py-3 text-center font-semibold">Total</th>
              <th className="px-4 py-3 text-center font-semibold">Completion</th>
              <th className="px-4 py-3 text-center font-semibold">Overdue</th>
              <th className="px-4 py-3 text-center font-semibold">CRM Gaps</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-neutral-100 last:border-0">
                  {Array.from({ length: 9 }).map((_, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-4 animate-pulse rounded bg-neutral-200" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  {error ? (
                    <div className="px-4 py-16 text-center text-sm text-neutral-400">
                      Data unavailable — fix the connection and reload.
                    </div>
                  ) : (
                  <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
                    <span className="text-3xl" aria-hidden>
                      📊
                    </span>
                    <p className="font-medium text-neutral-700">
                      Nothing to summarise{period ? ` for ${period}` : ""} yet
                    </p>
                    <p className="text-sm text-neutral-500">
                      Log updates on the dashboard and they&apos;ll roll up here.
                    </p>
                  </div>
                  )}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.memberId}
                  className="border-b border-neutral-100 last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-neutral-900">
                    {row.name}
                    {row.role === "manager" && (
                      <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase text-indigo-600">
                        manager
                      </span>
                    )}
                  </td>
                  {STATUSES.map((s) => (
                    <td
                      key={s}
                      className={`px-4 py-3 text-center ${
                        (row.counts[s] ?? 0) > 0
                          ? "font-semibold text-neutral-900"
                          : "text-neutral-300"
                      }`}
                    >
                      {row.counts[s] ?? 0}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center font-semibold text-neutral-900">
                    {row.total}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        completionRate(row) >= 50
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {completionRate(row)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.overdue > 0 ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                        {row.overdue}
                      </span>
                    ) : (
                      <span className="text-neutral-300">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.crmGaps > 0 ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-800">
                        {row.crmGaps}
                      </span>
                    ) : (
                      <span className="text-neutral-300">0</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
