"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/client-api";
import { daysSince, overdueLevel } from "@/lib/overdue";
import { SalesUpdate } from "@/lib/types";
import { ToastStack, useToasts } from "@/components/Toast";

const ROW_STYLES: Record<string, string> = {
  ok: "",
  amber: "bg-amber-50",
  red: "bg-red-50",
};

export default function CrmChecklistPage() {
  const [updates, setUpdates] = useState<SalesUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const { toasts, push, dismiss } = useToasts();

  const load = useCallback(async () => {
    const { updates } = await api<{ updates: SalesUpdate[] }>(
      "/api/updates?supplier_crm_updated=false",
    );
    // Stalest first (INTELLIGENCE_LAYER.md ranking rule)
    updates.sort((a, b) =>
      (a.last_activity_date ?? "9999").localeCompare(b.last_activity_date ?? "9999"),
    );
    return updates;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await load();
        if (!cancelled) {
          setUpdates(data);
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
  }, [load]);

  const allSelected = useMemo(
    () => updates.length > 0 && updates.every((u) => selected.has(u.id)),
    [updates, selected],
  );

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(updates.map((u) => u.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function bulkMark() {
    if (selected.size === 0) return;
    setSaving(true);
    try {
      const { updated } = await api<{ updated: number }>(
        "/api/updates/bulk-crm",
        { method: "POST", body: JSON.stringify({ ids: [...selected] }) },
      );
      push("success", `${updated} record${updated === 1 ? "" : "s"} marked as CRM updated ✓`);
      setSelected(new Set());
      setUpdates(await load());
    } catch (err) {
      push("error", err instanceof Error ? err.message : "Bulk update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Supplier CRM Checklist
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Updates not yet pushed to the supplier CRM — stalest first.
          </p>
        </div>
        <button
          onClick={bulkMark}
          disabled={selected.size === 0 || saving}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? "Marking…"
            : `Mark ${selected.size || ""} selected as CRM updated`.replace("  ", " ")}
        </button>
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
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                />
              </th>
              <th className="px-4 py-3 font-semibold">Salesperson</th>
              <th className="px-4 py-3 font-semibold">Account</th>
              <th className="px-4 py-3 font-semibold">Activity</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Period</th>
              <th className="px-4 py-3 font-semibold">Last Activity</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-neutral-100 last:border-0">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-4 animate-pulse rounded bg-neutral-200" />
                    </td>
                  ))}
                </tr>
              ))
            ) : updates.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  {error ? (
                    <div className="px-4 py-16 text-center text-sm text-neutral-400">
                      Data unavailable — fix the connection and reload.
                    </div>
                  ) : (
                  <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
                    <span className="text-3xl" aria-hidden>
                      🎉
                    </span>
                    <p className="font-medium text-neutral-700">
                      All caught up — every update is in the supplier CRM
                    </p>
                    <p className="text-sm text-neutral-500">
                      New unsynced updates will appear here.
                    </p>
                  </div>
                  )}
                </td>
              </tr>
            ) : (
              updates.map((u) => {
                const level = overdueLevel(u.last_activity_date);
                const days = daysSince(u.last_activity_date);
                return (
                  <tr
                    key={u.id}
                    className={`cursor-pointer border-b border-neutral-100 transition last:border-0 hover:bg-neutral-50 ${ROW_STYLES[level]}`}
                    onClick={() => toggleOne(u.id)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label={`Select update for ${u.account?.name ?? "account"}`}
                        checked={selected.has(u.id)}
                        onChange={() => toggleOne(u.id)}
                        className="h-4 w-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      {u.team_member?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      {u.account?.name ?? "—"}
                      {u.account?.supplier_crm_id && (
                        <span className="ml-2 text-xs text-neutral-400">
                          {u.account.supplier_crm_id}
                        </span>
                      )}
                    </td>
                    <td className="max-w-56 px-4 py-3">
                      <div className="text-neutral-900">{u.activity_type}</div>
                      {u.notes && (
                        <div
                          className="truncate text-xs text-neutral-500"
                          title={u.notes}
                        >
                          {u.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{u.status}</td>
                    <td className="px-4 py-3 text-neutral-600">{u.period_label}</td>
                    <td className="px-4 py-3 text-neutral-600">
                      {u.last_activity_date ?? "—"}
                      {level !== "ok" && days !== null && (
                        <span
                          className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                            level === "red"
                              ? "bg-red-200 text-red-800"
                              : "bg-amber-200 text-amber-800"
                          }`}
                        >
                          {days}d
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <ToastStack toasts={toasts} dismiss={dismiss} />
    </main>
  );
}
