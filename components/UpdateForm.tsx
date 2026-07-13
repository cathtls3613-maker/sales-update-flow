"use client";

import { useState } from "react";
import { api } from "@/lib/client-api";
import {
  ACTIVITY_TYPE_SUGGESTIONS,
  Account,
  PeriodType,
  SalesUpdate,
  STATUSES,
  TeamMember,
} from "@/lib/types";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function defaultPeriodLabel(periodType: PeriodType): string {
  const now = new Date();
  if (periodType === "monthly") {
    return `${now.toLocaleString("en", { month: "long" })} ${now.getFullYear()}`;
  }
  const week = Math.ceil(now.getDate() / 7);
  return `${MONTHS[now.getMonth()]} W${week} ${now.getFullYear()}`;
}

interface Props {
  members: TeamMember[];
  accounts: Account[];
  onClose: () => void;
  onCreated: (update: SalesUpdate) => void;
}

export default function UpdateForm({ members, accounts, onClose, onCreated }: Props) {
  const [teamMemberId, setTeamMemberId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [activityType, setActivityType] = useState("");
  const [status, setStatus] = useState<string>("Pending");
  const [notes, setNotes] = useState("");
  const [periodType, setPeriodType] = useState<PeriodType>("weekly");
  const [periodLabel, setPeriodLabel] = useState(defaultPeriodLabel("weekly"));
  const [lastActivityDate, setLastActivityDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [crmUpdated, setCrmUpdated] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function switchPeriodType(next: PeriodType) {
    // Only replace the label if the user hasn't customised it
    if (periodLabel === defaultPeriodLabel(periodType)) {
      setPeriodLabel(defaultPeriodLabel(next));
    }
    setPeriodType(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!teamMemberId) errors.teamMemberId = "Select a salesperson";
    if (!accountId) errors.accountId = "Select an account";
    if (!activityType.trim()) errors.activityType = "Activity type is required";
    if (!periodLabel.trim()) errors.periodLabel = "Period is required";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const { update } = await api<{ update: SalesUpdate }>("/api/updates", {
        method: "POST",
        body: JSON.stringify({
          team_member_id: teamMemberId,
          account_id: accountId,
          activity_type: activityType,
          status,
          notes,
          period_label: periodLabel,
          period_type: periodType,
          last_activity_date: lastActivityDate || undefined,
          supplier_crm_updated: crmUpdated,
        }),
      });
      onCreated(update);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";
  const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500";
  const errorClass = "mt-1 text-xs text-red-600";

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">New Update</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            ✕
          </button>
        </div>

        {submitError && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="f-member" className={labelClass}>Salesperson *</label>
              <select
                id="f-member"
                className={inputClass}
                value={teamMemberId}
                onChange={(e) => setTeamMemberId(e.target.value)}
              >
                <option value="">Select…</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                    {m.role === "manager" ? " (manager)" : ""}
                  </option>
                ))}
              </select>
              {fieldErrors.teamMemberId && (
                <p className={errorClass}>{fieldErrors.teamMemberId}</p>
              )}
            </div>
            <div>
              <label htmlFor="f-account" className={labelClass}>Account *</label>
              <select
                id="f-account"
                className={inputClass}
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
              >
                <option value="">Select…</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              {fieldErrors.accountId && (
                <p className={errorClass}>{fieldErrors.accountId}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="f-activity" className={labelClass}>Activity type *</label>
              <input
                id="f-activity"
                className={inputClass}
                list="activity-suggestions"
                placeholder="e.g. Follow-up Call"
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
              />
              <datalist id="activity-suggestions">
                {ACTIVITY_TYPE_SUGGESTIONS.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
              {fieldErrors.activityType && (
                <p className={errorClass}>{fieldErrors.activityType}</p>
              )}
            </div>
            <div>
              <label htmlFor="f-status" className={labelClass}>Status *</label>
              <select
                id="f-status"
                className={inputClass}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="f-notes" className={labelClass}>Notes</label>
            <textarea
              id="f-notes"
              className={`${inputClass} min-h-20 resize-y`}
              placeholder="What happened? Next steps?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="f-period-type" className={labelClass}>Period type *</label>
              <select
                id="f-period-type"
                className={inputClass}
                value={periodType}
                onChange={(e) => switchPeriodType(e.target.value as PeriodType)}
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label htmlFor="f-period" className={labelClass}>Period *</label>
              <input
                id="f-period"
                className={inputClass}
                placeholder="e.g. Jul W4 2025"
                value={periodLabel}
                onChange={(e) => setPeriodLabel(e.target.value)}
              />
              {fieldErrors.periodLabel && (
                <p className={errorClass}>{fieldErrors.periodLabel}</p>
              )}
            </div>
            <div>
              <label htmlFor="f-date" className={labelClass}>Activity date</label>
              <input
                id="f-date"
                type="date"
                className={inputClass}
                value={lastActivityDate}
                onChange={(e) => setLastActivityDate(e.target.value)}
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={crmUpdated}
              onChange={(e) => setCrmUpdated(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
            />
            Supplier CRM already updated
          </label>

          <div className="flex justify-end gap-2 border-t border-neutral-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
