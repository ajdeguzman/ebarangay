"use client";

import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import StatusBadge from "@/components/StatusBadge";
import { useToast } from "@/components/Toast";
import {
  getRequests,
  getResidents,
  updateRequestStatus,
  getResidentById,
  getComplaints,
  updateComplaintStatus,
} from "@/lib/storage";
import {
  DOCUMENT_TYPES,
  REQUEST_STATUSES,
  COMPLAINT_CATEGORIES,
  COMPLAINT_STATUSES,
} from "@/lib/barangay-config";

const TABS = [
  { id: "overview",   label: "Overview"   },
  { id: "requests",   label: "Requests"   },
  { id: "complaints", label: "Complaints" },
];

export default function AdminDashboardPage() {
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [residents, setResidents] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [tab, setTab] = useState("overview");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [activeRequest, setActiveRequest] = useState(null);
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const reload = async () => {
    const [reqs, res, comps] = await Promise.all([getRequests(), getResidents(), getComplaints()]);
    setRequests(reqs);
    setResidents(res);
    setComplaints(comps);
    setLoaded(true);
  };

  useEffect(() => {
    reload().catch(() => setLoaded(true));
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab")) setTab(params.get("tab"));
  }, []);

  const stats = useMemo(() => {
    const by = (s) => requests.filter((r) => r.status === s).length;
    return {
      total: requests.length,
      pending: by("pending"),
      processing: by("processing"),
      ready: by("ready"),
      released: by("released"),
      rejected: by("rejected"),
      residents: residents.length,
    };
  }, [requests, residents]);

  const filtered = requests.filter((r) => {
    if (filter !== "all" && r.status !== filter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.residentName?.toLowerCase().includes(q) ||
      r.purpose?.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q)
    );
  });

  const docNameOf = (id) =>
    DOCUMENT_TYPES.find((d) => d.id === id)?.name || id;

  const changeStatus = async (req, status, note) => {
    try {
      await updateRequestStatus(req.id, status, note);
      toast(`Request marked as ${REQUEST_STATUSES[status].label}.`, "success");
      await reload();
      setActiveRequest(null);
    } catch (err) {
      toast(err.message || "Could not update status.", "error");
    }
  };

  const changeComplaintStatus = async (complaint, status, note) => {
    try {
      await updateComplaintStatus(complaint.id, status, note);
      toast(`Complaint marked as ${COMPLAINT_STATUSES[status].label}.`, "success");
      await reload();
      setActiveComplaint(null);
    } catch (err) {
      toast(err.message || "Could not update status.", "error");
    }
  };

  const categoryLabelOf = (id) =>
    COMPLAINT_CATEGORIES.find((c) => c.id === id)?.label || id;

  return (
    <AdminSidebar>
      <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Admin overview</h1>
          <p className="text-[rgb(var(--text-muted))] text-sm">
            Review requests and track barangay activity.
          </p>
        </div>
        <div className="flex gap-1 bg-[rgb(var(--surface-2))] p-1 rounded-xl">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setFilter("all"); setSearch(""); }}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition ${
                tab === t.id
                  ? "bg-[rgb(var(--surface))] shadow-soft"
                  : "text-[rgb(var(--text-muted))]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {!loaded && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bp-card p-5 h-24 animate-pulse bg-[rgb(var(--surface-2))]"
            />
          ))}
        </div>
      )}

      {loaded && tab === "overview" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <Stat label="Residents registered" value={stats.residents} />
            <Stat label="Total requests" value={stats.total} />
            <Stat label="Pending requests" value={stats.pending} />
            <Stat label="Complaints filed" value={complaints.length} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="bp-card p-6 lg:col-span-2">
              <div className="font-semibold mb-4">Status breakdown</div>
              <div className="space-y-3">
                {Object.entries(REQUEST_STATUSES).map(([k, v]) => {
                  const n = requests.filter((r) => r.status === k).length;
                  const pct = stats.total ? (n / stats.total) * 100 : 0;
                  return (
                    <div key={k}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[rgb(var(--text-muted))]">
                          {v.label}
                        </span>
                        <span className="font-medium">{n}</span>
                      </div>
                      <div className="h-2 rounded-full bg-[rgb(var(--surface-2))] overflow-hidden">
                        <div
                          className="h-full bg-[rgb(var(--text))] transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bp-card p-6">
              <div className="font-semibold mb-4">Most-requested documents</div>
              <ul className="space-y-3">
                {DOCUMENT_TYPES.map((d) => {
                  const n = requests.filter(
                    (r) => r.documentType === d.id
                  ).length;
                  return (
                    <li key={d.id} className="flex justify-between text-sm">
                      <span>{d.name}</span>
                      <span className="font-semibold">{n}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="bp-card mt-6 overflow-hidden">
            <div className="p-5 border-b border-[rgb(var(--border))] flex items-center justify-between">
              <div className="font-semibold">Recent requests</div>
              <button
                onClick={() => setTab("requests")}
                className="text-sm text-[rgb(var(--text))] font-medium hover:underline"
              >
                View all →
              </button>
            </div>
            <RequestTable
              rows={requests.slice(0, 6)}
              docNameOf={docNameOf}
              onOpen={setActiveRequest}
            />
          </div>
        </>
      )}

      {loaded && tab === "requests" && (
        <div className="bp-card overflow-hidden">
          <div className="p-5 border-b border-[rgb(var(--border))] flex items-center justify-between flex-wrap gap-3">
            <div className="font-semibold">All requests</div>
            <div className="flex gap-2 flex-wrap">
              <input
                placeholder="Search by resident, purpose, ref…"
                className="bp-input !py-2 !px-3 text-sm w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className="bp-input !py-2 !px-3 text-sm"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All statuses</option>
                {Object.entries(REQUEST_STATUSES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <RequestTable
            rows={filtered}
            docNameOf={docNameOf}
            onOpen={setActiveRequest}
          />
        </div>
      )}

      {loaded && tab === "complaints" && (
        <div className="bp-card overflow-hidden">
          <div className="p-5 border-b border-[rgb(var(--border))] flex items-center justify-between flex-wrap gap-3">
            <div className="font-semibold">All complaints</div>
            <div className="flex gap-2 flex-wrap">
              <select
                className="bp-input !py-2 !px-3 text-sm"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All statuses</option>
                {Object.entries(COMPLAINT_STATUSES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>
          <ComplaintTable
            rows={complaints.filter((c) => filter === "all" || c.status === filter)}
            categoryLabelOf={categoryLabelOf}
            onOpen={setActiveComplaint}
          />
        </div>
      )}

      {activeRequest && (
        <RequestDrawer
          request={activeRequest}
          onClose={() => setActiveRequest(null)}
          onStatusChange={changeStatus}
          docNameOf={docNameOf}
        />
      )}

      {activeComplaint && (
        <ComplaintDrawer
          complaint={activeComplaint}
          onClose={() => setActiveComplaint(null)}
          onStatusChange={changeComplaintStatus}
          categoryLabelOf={categoryLabelOf}
        />
      )}
    </AdminSidebar>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bp-card p-5">
      <div className="text-sm text-[rgb(var(--text-muted))]">{label}</div>
      <div className="text-3xl font-semibold mt-1">{value}</div>
    </div>
  );
}

const STATUS_ORDER = ["pending", "processing", "ready", "released", "rejected"];

function RequestTable({ rows, docNameOf, onOpen }) {
  const [sort, setSort] = useState({ col: "createdAt", dir: "desc" });

  const toggle = (col) =>
    setSort((s) =>
      s.col === col ? { col, dir: s.dir === "asc" ? "desc" : "asc" } : { col, dir: "asc" }
    );

  const sorted = useMemo(() => {
    const { col, dir } = sort;
    return [...rows].sort((a, b) => {
      let av, bv;
      if (col === "residentName") { av = a.residentName?.toLowerCase() ?? ""; bv = b.residentName?.toLowerCase() ?? ""; }
      else if (col === "documentType") { av = docNameOf(a.documentType).toLowerCase(); bv = docNameOf(b.documentType).toLowerCase(); }
      else if (col === "purpose") { av = a.purpose?.toLowerCase() ?? ""; bv = b.purpose?.toLowerCase() ?? ""; }
      else if (col === "createdAt") { av = a.createdAt; bv = b.createdAt; }
      else if (col === "status") { av = STATUS_ORDER.indexOf(a.status); bv = STATUS_ORDER.indexOf(b.status); }
      if (av < bv) return dir === "asc" ? -1 : 1;
      if (av > bv) return dir === "asc" ? 1 : -1;
      return 0;
    });
  }, [rows, sort, docNameOf]);

  const COLS = [
    { key: "residentName", label: "Resident" },
    { key: "documentType", label: "Document" },
    { key: "purpose", label: "Purpose" },
    { key: "createdAt", label: "Submitted" },
    { key: "status", label: "Status" },
  ];

  if (rows.length === 0)
    return (
      <div className="p-10 text-center text-sm text-[rgb(var(--text-muted))]">
        No requests to show.
      </div>
    );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[rgb(var(--text-muted))] border-b border-[rgb(var(--border))]">
            {COLS.map(({ key, label }) => (
              <th key={key} className="font-medium px-5 py-3">
                <button
                  onClick={() => toggle(key)}
                  className="inline-flex items-center gap-1 hover:text-[rgb(var(--text))] transition"
                >
                  {label}
                  <SortIcon active={sort.col === key} dir={sort.dir} />
                </button>
              </th>
            ))}
            <th />
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr
              key={r.id}
              className="border-b border-[rgb(var(--border))] last:border-0 hover:bg-[rgb(var(--surface-2))]"
            >
              <td className="px-5 py-3 font-medium">{r.residentName}</td>
              <td className="px-5 py-3">{docNameOf(r.documentType)}</td>
              <td className="px-5 py-3 text-[rgb(var(--text-muted))] max-w-xs truncate">
                {r.purpose}
              </td>
              <td className="px-5 py-3 text-[rgb(var(--text-muted))]">
                {new Date(r.createdAt).toLocaleDateString()}
              </td>
              <td className="px-5 py-3">
                <StatusBadge status={r.status} />
              </td>
              <td className="px-5 py-3 text-right">
                <button
                  onClick={() => onOpen(r)}
                  className="bp-btn-ghost !py-1.5 !px-3 text-sm"
                >
                  Manage
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SortIcon({ active, dir }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={active ? "text-[rgb(var(--text))]" : "opacity-30"}
    >
      {!active || dir === "asc" ? (
        <path d="M12 5v14M5 12l7-7 7 7" />
      ) : (
        <path d="M12 19V5M5 12l7 7 7-7" />
      )}
    </svg>
  );
}

function RequestDrawer({ request, onClose, onStatusChange, docNameOf }) {
  const [resident, setResident] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getResidentById(request.residentId)
      .then((r) => !cancelled && setResident(r))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [request.residentId]);

  const actions = [
    {
      show: request.status === "pending",
      label: "Approve → Processing",
      onClick: () =>
        onStatusChange(
          request,
          "processing",
          "Approved by admin; processing document."
        ),
      primary: true,
    },
    {
      show: request.status === "pending" || request.status === "processing",
      label: "Reject",
      onClick: () => {
        const note = prompt("Reason for rejection?") || "Rejected by admin.";
        onStatusChange(request, "rejected", note);
      },
      danger: true,
    },
    {
      show: request.status === "processing",
      label: "Mark ready for pickup",
      onClick: () =>
        onStatusChange(request, "ready", "Document ready for claiming."),
      primary: true,
    },
    {
      show: request.status === "ready",
      label: "Mark released",
      onClick: () =>
        onStatusChange(request, "released", "Document claimed by resident."),
      primary: true,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 bg-black/40 animate-fade-in"
        onClick={onClose}
      />
      <div className="ml-auto w-full max-w-md bg-[rgb(var(--bg))] h-full shadow-2xl flex flex-col animate-slide-up">
        <div className="p-5 border-b border-[rgb(var(--border))] flex items-center justify-between">
          <div>
            <div className="text-xs text-[rgb(var(--text-muted))]">
              Request {request.id.slice(0, 8)}
            </div>
            <div className="font-semibold">
              {docNameOf(request.documentType)}
            </div>
          </div>
          <button onClick={onClose} className="bp-btn-ghost !py-2 !px-3">
            ✕
          </button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <div className="text-xs text-[rgb(var(--text-muted))]">Status</div>
            <StatusBadge status={request.status} />
          </div>
          <Field label="Resident">
            {request.residentName}
            {resident && (
              <div className="text-xs text-[rgb(var(--text-muted))]">
                {resident.email} · {resident.contact}
                <br />
                Purok {resident.purok} · {resident.streetAddress}
              </div>
            )}
          </Field>
          <Field label="Purpose">{request.purpose}</Field>
          {request.remarks && (
            <Field label="Remarks">{request.remarks}</Field>
          )}
          <Field label="Submitted">
            {new Date(request.createdAt).toLocaleString()}
          </Field>
          <div>
            <div className="text-xs text-[rgb(var(--text-muted))] mb-2">
              History
            </div>
            <ol className="space-y-3">
              {(request.history || []).map((h, i) => (
                <li key={i} className="flex gap-3">
                  <div className="h-2 w-2 mt-2 rounded-full bg-[rgb(var(--text))] shrink-0" />
                  <div>
                    <div className="text-sm font-medium">
                      {REQUEST_STATUSES[h.status]?.label || h.status}
                    </div>
                    <div className="text-xs text-[rgb(var(--text-muted))]">
                      {new Date(h.at).toLocaleString()}
                    </div>
                    {h.note && (
                      <div className="text-sm mt-0.5">{h.note}</div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="p-5 border-t border-[rgb(var(--border))] space-y-2">
          {actions
            .filter((a) => a.show)
            .map((a, i) => (
              <button
                key={i}
                onClick={a.onClick}
                className={
                  a.primary
                    ? "bp-btn-primary w-full"
                    : a.danger
                    ? "bp-btn-secondary w-full !text-rose-600 dark:!text-rose-300"
                    : "bp-btn-secondary w-full"
                }
              >
                {a.label}
              </button>
            ))}
          {actions.filter((a) => a.show).length === 0 && (
            <div className="text-sm text-[rgb(var(--text-muted))] text-center">
              No further actions available for this status.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="text-xs text-[rgb(var(--text-muted))]">{label}</div>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

const COMPLAINT_STATUS_ORDER = ["pending", "under_review", "resolved", "dismissed"];

function ComplaintTable({ rows, categoryLabelOf, onOpen }) {
  const [sort, setSort] = useState({ col: "createdAt", dir: "desc" });

  const toggle = (col) =>
    setSort((s) =>
      s.col === col ? { col, dir: s.dir === "asc" ? "desc" : "asc" } : { col, dir: "asc" }
    );

  const sorted = useMemo(() => {
    const { col, dir } = sort;
    return [...rows].sort((a, b) => {
      let av, bv;
      if (col === "residentName") { av = a.residentName?.toLowerCase() ?? ""; bv = b.residentName?.toLowerCase() ?? ""; }
      else if (col === "subject") { av = a.subject?.toLowerCase() ?? ""; bv = b.subject?.toLowerCase() ?? ""; }
      else if (col === "category") { av = categoryLabelOf(a.category).toLowerCase(); bv = categoryLabelOf(b.category).toLowerCase(); }
      else if (col === "createdAt") { av = a.createdAt; bv = b.createdAt; }
      else if (col === "status") { av = COMPLAINT_STATUS_ORDER.indexOf(a.status); bv = COMPLAINT_STATUS_ORDER.indexOf(b.status); }
      if (av < bv) return dir === "asc" ? -1 : 1;
      if (av > bv) return dir === "asc" ? 1 : -1;
      return 0;
    });
  }, [rows, sort, categoryLabelOf]);

  const COLS = [
    { key: "residentName", label: "Resident" },
    { key: "subject",      label: "Subject"   },
    { key: "category",     label: "Category"  },
    { key: "createdAt",    label: "Filed"     },
    { key: "status",       label: "Status"    },
  ];

  if (rows.length === 0)
    return (
      <div className="p-10 text-center text-sm text-[rgb(var(--text-muted))]">
        No complaints to show.
      </div>
    );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[rgb(var(--text-muted))] border-b border-[rgb(var(--border))]">
            {COLS.map(({ key, label }) => (
              <th key={key} className="font-medium px-5 py-3">
                <button
                  onClick={() => toggle(key)}
                  className="inline-flex items-center gap-1 hover:text-[rgb(var(--text))] transition"
                >
                  {label}
                  <SortIcon active={sort.col === key} dir={sort.dir} />
                </button>
              </th>
            ))}
            <th />
          </tr>
        </thead>
        <tbody>
          {sorted.map((c) => (
            <tr
              key={c.id}
              className="border-b border-[rgb(var(--border))] last:border-0 hover:bg-[rgb(var(--surface-2))]"
            >
              <td className="px-5 py-3 font-medium">{c.residentName}</td>
              <td className="px-5 py-3 max-w-xs truncate">{c.subject}</td>
              <td className="px-5 py-3 text-[rgb(var(--text-muted))]">{categoryLabelOf(c.category)}</td>
              <td className="px-5 py-3 text-[rgb(var(--text-muted))]">
                {new Date(c.createdAt).toLocaleDateString()}
              </td>
              <td className="px-5 py-3">
                <StatusBadge status={c.status} statuses={COMPLAINT_STATUSES} />
              </td>
              <td className="px-5 py-3 text-right">
                <button
                  onClick={() => onOpen(c)}
                  className="bp-btn-ghost !py-1.5 !px-3 text-sm"
                >
                  Manage
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ComplaintDrawer({ complaint, onClose, onStatusChange, categoryLabelOf }) {
  const [resident, setResident] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getResidentById(complaint.residentId)
      .then((r) => !cancelled && setResident(r))
      .catch(() => {});
    return () => { cancelled = true; };
  }, [complaint.residentId]);

  const actions = [
    {
      show: complaint.status === "pending",
      label: "Start investigation",
      onClick: () => onStatusChange(complaint, "under_review", "Complaint is now under review."),
      primary: true,
    },
    {
      show: complaint.status === "under_review",
      label: "Mark resolved",
      onClick: () => {
        const note = prompt("Resolution notes?") || "Complaint resolved.";
        onStatusChange(complaint, "resolved", note);
      },
      primary: true,
    },
    {
      show: complaint.status === "pending" || complaint.status === "under_review",
      label: "Dismiss",
      onClick: () => {
        const note = prompt("Reason for dismissal?") || "Dismissed by admin.";
        onStatusChange(complaint, "dismissed", note);
      },
      danger: true,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={onClose} />
      <div className="ml-auto w-full max-w-md bg-[rgb(var(--bg))] h-full shadow-2xl flex flex-col animate-slide-up">
        <div className="p-5 border-b border-[rgb(var(--border))] flex items-center justify-between">
          <div>
            <div className="text-xs text-[rgb(var(--text-muted))]">
              Complaint {complaint.id.slice(0, 8)}
            </div>
            <div className="font-semibold">{complaint.subject}</div>
          </div>
          <button onClick={onClose} className="bp-btn-ghost !py-2 !px-3">✕</button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <div className="text-xs text-[rgb(var(--text-muted))]">Status</div>
            <StatusBadge status={complaint.status} statuses={COMPLAINT_STATUSES} />
          </div>
          <Field label="Resident">
            {complaint.residentName}
            {resident && (
              <div className="text-xs text-[rgb(var(--text-muted))]">
                {resident.email} · {resident.contact}
                <br />
                Purok {resident.purok} · {resident.streetAddress}
              </div>
            )}
          </Field>
          <Field label="Category">{categoryLabelOf(complaint.category)}</Field>
          <Field label="Description">
            <p className="text-sm leading-relaxed">{complaint.description}</p>
          </Field>
          <Field label="Filed">
            {new Date(complaint.createdAt).toLocaleString()}
          </Field>
          <div>
            <div className="text-xs text-[rgb(var(--text-muted))] mb-2">History</div>
            <ol className="space-y-3">
              {(complaint.history || []).map((h, i) => (
                <li key={i} className="flex gap-3">
                  <div className="h-2 w-2 mt-2 rounded-full bg-[rgb(var(--text))] shrink-0" />
                  <div>
                    <div className="text-sm font-medium">
                      {COMPLAINT_STATUSES[h.status]?.label || h.status}
                    </div>
                    <div className="text-xs text-[rgb(var(--text-muted))]">
                      {new Date(h.at).toLocaleString()}
                    </div>
                    {h.note && <div className="text-sm mt-0.5">{h.note}</div>}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="p-5 border-t border-[rgb(var(--border))] space-y-2">
          {actions
            .filter((a) => a.show)
            .map((a, i) => (
              <button
                key={i}
                onClick={a.onClick}
                className={
                  a.primary
                    ? "bp-btn-primary w-full"
                    : a.danger
                    ? "bp-btn-secondary w-full !text-rose-600 dark:!text-rose-300"
                    : "bp-btn-secondary w-full"
                }
              >
                {a.label}
              </button>
            ))}
          {actions.filter((a) => a.show).length === 0 && (
            <div className="text-sm text-[rgb(var(--text-muted))] text-center">
              No further actions available for this status.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
