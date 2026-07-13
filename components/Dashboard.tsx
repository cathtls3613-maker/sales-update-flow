"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/client-api";
import { daysSince, overdueLevel } from "@/lib/overdue";
import { Account, SalesUpdate, STATUSES, TeamMember } from "@/lib/types";
import UpdateForm from "@/components/UpdateForm";
import { ToastStack, useToasts } from "@/components/Toast";

const STATUS_STYLES: Record<string, string> = {
  Pending: "bg-neutral-100 text-neutral-700 border-neutral-200",
  "In Progress": "bg-blue-50 text-blue-700 border-blue-200",
  Done: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Blocked: "bg-red-50 text-red-700 border-red-200",
};

const ROW_STYLES: Record<string, string> = {
  ok: "",
  amber: "bg-amber-50",
  red: "bg-red-50",
};

export default function Dashboard() {
  const [updates, setUpdates] = useState<SalesUpdate[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

  const [filterMember, setFilterMember] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { toasts, push, dismiss } = useToasts();

  const fetchUpdates = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterMember) params.set("team_member_id", filterMember);
    if (filterStatus) params.set("status", filterStatus);
    if (filterPeriod.trim()) params.set("period", filterPeriod.trim());
    const qs = params.toString();
    const { updates } = await api<{ updates: SalesUpdate[] }>(
      `/api/updates${qs ? `?${qs}` : ""}`,
    );
    return updates;
  }, [filterMember, filterStatus, filterPeriod]);

  // Initial load: meta + updates
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [meta, updates] = await Promise.all([
          api<{ team_members: TeamMember[]; accounts: Account[] }>("/api/meta"),
          api<{ updates: SalesUpdate[] }>("/api/updates"),
        ]);
        if (cancelled) return;
        setMembers(meta.team_members);
        setAccounts(meta.accounts);
        setUpdates(updates.updates);
        setError(null);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch on filter change (debounced for the period text input)
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        setUpdates(await fetchUpdates());
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchUpdates]);

  async function retry() {
    setLoading(true);
    setError(null);
    try {
      const [meta, fetched] = await Promise.all([
        api<{ team_members: TeamMember[]; accounts: Account[] }>("/api/meta"),
        fetchUpdates(),
      ]);
      setMembers(meta.team_members);
      setAccounts(meta.accounts);
      setUpdates(fetched);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  function markBusy(id: string, busy: boolean) {
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function patchUpdate(
    id: string,
    patch: Partial<Pick<SalesUpdate, "status" | "supplier_crm_updated">>,
    successMessage: string,
  ) {
    const before = updates;
    // Optimistic update
    setUpdates((prev) =>
      prev.map((u) =>
        u.id === id
          ? {
              ...u,
              ...patch,
              supplier_crm_updated_at:
                patch.supplier_crm_updated === undefined
                  ? u.supplier_crm_updated_at
                  : patch.supplier_crm_updated
                    ? new Date().toISOString()
                    : null,
            }
          : u,
      ),
    );
    markBusy(id, true);
    try {
      const { update } = await api<{ update: SalesUpdate }>(
        `/api/updates/${id}`,
        { method: "PATCH", body: JSON.stringify(patch) },
      );
      setUpdates((prev) => prev.map((u) => (u.id === id ? update : u)));
      push("success", successMessage);
    } catch (err) {
      setUpdates(before);
      push("error", err instanceof Error ? err.message : "Update failed");
    } finally {
      markBusy(id, false);
    }
  }

  async function deleteUpdate(id: string) {
    if (!window.confirm("Delete this update? This cannot be undone.")) return;
    markBusy(id, true);
    try {
      await api<{ ok: boolean }>(`/api/updates/${id}`, { method: "DELETE" });
      setUpdates((prev) => prev.filter((u) => u.id !== id));
      push("success", "Update deleted");
    } catch (err) {
      push("error", err instanceof Error ? err.message : "Delete failed");
    } finally {
      markBusy(id, false);
    }
  }

  function handleCreated(update: SalesUpdate) {
    setShowForm(false);
    push("success", "Update logged ✓");
    // Show it immediately; refetch keeps filters/order canonical
    setUpdates((prev) => [update, ...prev.filter((u) => u.id !== update.id)]);
    fetchUpdates()
      .then(setUpdates)
      .catch(() => {});
  }

  const hasFilters = Boolean(filterMember || filterStatus || filterPeriod.trim());
  const selectClass =
    "rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-sm text-neutral-700 focus:border-indigo-500 focus:outline-none";

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Team Dashboard
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Shared live view of every sales update — no login needed.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          + New Update
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>
            <strong>Couldn&apos;t load data:</strong> {error}
          </span>
          <button
            onClick={retry}
            className="shrink-0 rounded-md border border-red-300 px-3 py-1 font-medium hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          aria-label="Filter by salesperson"
          className={selectClass}
          value={filterMember}
          onChange={(e) => setFilterMember(e.target.value)}
        >
          <option value="">All salespeople</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by status"
          className={selectClass}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          aria-label="Filter by period"
          className={`${selectClass} w-40`}
          placeholder="Period, e.g. Jul W3"
          value={filterPeriod}
          onChange={(e) => setFilterPeriod(e.target.value)}
        />
        {hasFilters && (
          <button
            onClick={() => {
              setFilterMember("");
              setFilterStatus("");
              setFilterPeriod("");
            }}
            className="rounded-md px-2.5 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
          >
            Clear filters
          </button>
        )}
        {!loading && !error && (
          <span className="ml-auto text-sm text-neutral-400">
            {updates.length} update{updates.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
              <th className="px-4 py-3 font-semibold">Salesperson</th>
              <th className="px-4 py-3 font-semibold">Account</th>
              <th className="px-4 py-3 font-semibold">Activity</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Period</th>
              <th className="px-4 py-3 text-center font-semibold">Supplier CRM</th>
              <th className="px-4 py-3 font-semibold">Last Activity</th>
              <th className="px-2 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-neutral-100 last:border-0">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-4 animate-pulse rounded bg-neutral-200" />
                    </td>
                  ))}
                </tr>
              ))
            ) : updates.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  {error ? (
                    <div className="px-4 py-16 text-center text-sm text-neutral-400">
                      Data unavailable — fix the connection and retry.
                    </div>
                  ) : (
                  <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
                    <span className="text-3xl" aria-hidden>
                      📋
                    </span>
                    <p className="font-medium text-neutral-700">
                      {hasFilters
                        ? "No updates match these filters"
                        : "No updates yet"}
                    </p>
                    {hasFilters ? (
                      <button
                        onClick={() => {
                          setFilterMember("");
                          setFilterStatus("");
                          setFilterPeriod("");
                        }}
                        className="text-sm font-medium text-indigo-600 hover:underline"
                      >
                        Clear filters
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowForm(true)}
                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                      >
                        Log your first update
                      </button>
                    )}
                  </div>
                  )}
                </td>
              </tr>
            ) : (
              updates.map((u) => {
                const level = overdueLevel(u.last_activity_date);
                const days = daysSince(u.last_activity_date);
                const busy = busyIds.has(u.id);
                return (
                  <tr
                    key={u.id}
                    className={`border-b border-neutral-100 transition last:border-0 ${ROW_STYLES[level]} ${busy ? "opacity-60" : ""}`}
                  >
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      {u.team_member?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      {u.account?.name ?? "—"}
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
                    <td className="px-4 py-3">
                      <select
                        aria-label={`Status for ${u.account?.name ?? "update"}`}
                        disabled={busy}
                        value={u.status}
                        onChange={(e) =>
                          patchUpdate(
                            u.id,
                            { status: e.target.value },
                            `Status → ${e.target.value}`,
                          )
                        }
                        className={`cursor-pointer rounded-full border px-2.5 py-1 text-xs font-semibold focus:outline-none ${STATUS_STYLES[u.status] ?? STATUS_STYLES.Pending}`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{u.period_label}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        aria-label={`Supplier CRM ${u.supplier_crm_updated ? "updated" : "not updated"}`}
                        disabled={busy}
                        onClick={() =>
                          patchUpdate(
                            u.id,
                            { supplier_crm_updated: !u.supplier_crm_updated },
                            u.supplier_crm_updated
                              ? "Supplier CRM unmarked"
                              : "Supplier CRM marked updated ✓",
                          )
                        }
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-md border text-sm transition ${
                          u.supplier_crm_updated
                            ? "border-emerald-300 bg-emerald-100 text-emerald-700"
                            : "border-neutral-300 bg-white text-neutral-300 hover:border-neutral-400"
                        }`}
                      >
                        ✓
                      </button>
                    </td>
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
                    <td className="px-2 py-3">
                      <button
                        aria-label="Delete update"
                        disabled={busy}
                        onClick={() => deleteUpdate(u.id)}
                        className="rounded-md p-1.5 text-neutral-300 transition hover:bg-red-50 hover:text-red-600"
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <UpdateForm
          members={members}
          accounts={accounts}
          onClose={() => setShowForm(false)}
          onCreated={handleCreated}
        />
      )}
      <ToastStack toasts={toasts} dismiss={dismiss} />
    </main>
  );
}
