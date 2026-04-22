"use client";

import { REQUEST_STATUSES } from "@/lib/barangay-config";

const toneClass = {
  amber:
    "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  blue: "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300",
  emerald:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  slate:
    "bg-slate-200 text-slate-800 dark:bg-slate-500/15 dark:text-slate-300",
  rose: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300",
};

export default function StatusBadge({ status, statuses = REQUEST_STATUSES }) {
  const info = statuses[status] || REQUEST_STATUSES[status] || { label: status, tone: "slate" };
  return (
    <span className={`bp-badge ${toneClass[info.tone] || toneClass.slate}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {info.label}
    </span>
  );
}
