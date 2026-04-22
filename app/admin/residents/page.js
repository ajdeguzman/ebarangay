"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { useToast } from "@/components/Toast";
import ImageLightbox from "@/components/ImageLightbox";
import {
  getResidents,
  getRequestsByResident,
  verifyResidentId,
  getResidentIdSignedUrl,
  updateResidentFlags,
} from "@/lib/storage";

/* ------------------------------------------------------------------ */
/* Age classification helpers (Philippine BLGU standard)               */
/* ------------------------------------------------------------------ */

function getAge(birthdate) {
  if (!birthdate) return null;
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function classify(resident) {
  const age = getAge(resident.birthdate);
  if (age === null) return "unclassified";
  if (age <= 12) return "children";
  if (age <= 30) return "youth";
  if (age >= 60) return "senior";
  return "unclassified";
}

const CLASSIFICATIONS = [
  { key: "children",      label: "Children",          sub: "ages 0–12",  color: "#3b82f6" },
  { key: "youth",         label: "Youth",             sub: "ages 13–30", color: "#8b5cf6" },
  { key: "senior",        label: "Senior Citizen",    sub: "ages 60+",   color: "#f59e0b" },
  { key: "indigent",      label: "Indigent",          sub: "flagged",    color: "#ef4444" },
  { key: "pwd",           label: "Persons w/ Disability", sub: "flagged", color: "#10b981" },
  { key: "unclassified",  label: "Unclassified",      sub: "ages 31–59 / no birthdate", color: "#94a3b8" },
];

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function AdminResidentsPage() {
  const [residents, setResidents] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getResidents()
      .then((r) => { if (!cancelled) { setResidents(r); setLoaded(true); } })
      .catch(() => setLoaded(true));
    return () => { cancelled = true; };
  }, []);

  const handleResidentUpdate = (updated) => {
    setResidents((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setActive(updated);
  };

  const filtered = residents.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      `${r.firstName} ${r.lastName}`.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.contact?.toLowerCase().includes(q) ||
      r.purok?.toLowerCase().includes(q)
    );
  });

  return (
    <AdminSidebar>
      <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Residents</h1>
          <p className="text-[rgb(var(--text-muted))] text-sm">
            All registered residents of the barangay.
          </p>
        </div>
        <input
          placeholder="Search residents…"
          className="bp-input !py-2 !px-3 text-sm w-72"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Dashboard */}
      {loaded && <ResidentsDashboard residents={residents} />}

      {/* Table */}
      <div className="bp-card overflow-hidden">
        {!loaded ? (
          <div className="p-10 text-center text-sm text-[rgb(var(--text-muted))]">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-[rgb(var(--text-muted))]">
            No residents yet. They'll appear here after they sign up.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[rgb(var(--text-muted))] border-b border-[rgb(var(--border))]">
                  <th className="font-medium px-5 py-3">Name</th>
                  <th className="font-medium px-5 py-3">Contact</th>
                  <th className="font-medium px-5 py-3">Address</th>
                  <th className="font-medium px-5 py-3">ID</th>
                  <th className="font-medium px-5 py-3">Registered</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-[rgb(var(--border))] last:border-0 hover:bg-[rgb(var(--surface-2))]"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full overflow-hidden bg-[rgb(var(--text))] text-[rgb(var(--bg))] flex items-center justify-center text-xs font-semibold flex-shrink-0">
                          {r.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={r.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <>{r.firstName[0]}{r.lastName[0]}</>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{r.firstName} {r.lastName}</div>
                          <div className="text-xs text-[rgb(var(--text-muted))]">{r.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">{r.contact || "—"}</td>
                    <td className="px-5 py-3 text-[rgb(var(--text-muted))]">
                      Purok {r.purok} · {r.streetAddress}
                    </td>
                    <td className="px-5 py-3">
                      {r.idVerified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Verified
                        </span>
                      ) : r.idFrontUrl || r.idBackUrl ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Pending
                        </span>
                      ) : (
                        <span className="text-xs text-[rgb(var(--text-muted))]">None</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-[rgb(var(--text-muted))]">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => setActive(r)} className="bp-btn-ghost !py-1.5 !px-3 text-sm">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {active && (
        <ResidentDrawer
          resident={active}
          onClose={() => setActive(null)}
          onUpdate={handleResidentUpdate}
        />
      )}
    </AdminSidebar>
  );
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                            */
/* ------------------------------------------------------------------ */

function ResidentsDashboard({ residents }) {
  const total = residents.length;
  const male   = residents.filter((r) => r.sex?.toLowerCase() === "male").length;
  const female = residents.filter((r) => r.sex?.toLowerCase() === "female").length;
  const other  = total - male - female;

  const counts = residents.reduce(
    (acc, r) => {
      const bucket = classify(r);
      acc[bucket] = (acc[bucket] || 0) + 1;
      if (r.isIndigent) acc.indigent++;
      if (r.isPwd) acc.pwd++;
      return acc;
    },
    { children: 0, youth: 0, senior: 0, indigent: 0, pwd: 0, unclassified: 0 }
  );

  const maxCount = Math.max(...CLASSIFICATIONS.map((c) => counts[c.key] || 0), 1);

  return (
    <div className="grid gap-4 md:grid-cols-2 mb-6">
      {/* Population card */}
      <div className="bp-card p-6">
        <h2 className="font-semibold mb-4">Total Population</h2>
        <div className="text-5xl font-bold mb-4">{total}</div>
        <div className="space-y-2">
          <SexBar label="Male" count={male} total={total} color="#3b82f6" />
          <SexBar label="Female" count={female} total={total} color="#ec4899" />
          {other > 0 && <SexBar label="Other / Unspecified" count={other} total={total} color="#94a3b8" />}
        </div>
      </div>

      {/* Classification card */}
      <div className="bp-card p-6">
        <h2 className="font-semibold mb-4">Classification</h2>
        <div className="space-y-3">
          {CLASSIFICATIONS.map((c) => {
            const count = counts[c.key] || 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={c.key} className="flex items-center gap-3">
                <div className="w-36 shrink-0">
                  <div className="text-sm font-medium leading-tight">{c.label}</div>
                  <div className="text-xs text-[rgb(var(--text-muted))]">{c.sub}</div>
                </div>
                <div className="flex-1 h-5 rounded-full bg-[rgb(var(--surface-2))] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(count / maxCount) * 100}%`,
                      backgroundColor: c.color,
                    }}
                  />
                </div>
                <div className="w-16 shrink-0 text-right text-sm">
                  <span className="font-semibold">{count}</span>
                  <span className="text-xs text-[rgb(var(--text-muted))] ml-1">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-[rgb(var(--text-muted))] mt-4">
          Indigent and PWD counts may overlap with age groups.
        </p>
      </div>
    </div>
  );
}

function SexBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="w-28 shrink-0 text-[rgb(var(--text-muted))]">{label}</div>
      <div className="flex-1 h-4 rounded-full bg-[rgb(var(--surface-2))] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <div className="w-16 shrink-0 text-right">
        <span className="font-semibold">{count}</span>
        <span className="text-xs text-[rgb(var(--text-muted))] ml-1">{pct}%</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Resident drawer                                                      */
/* ------------------------------------------------------------------ */

function ResidentDrawer({ resident: initialResident, onClose, onUpdate }) {
  const { toast } = useToast();
  const [resident, setResident] = useState(initialResident);
  const [requests, setRequests] = useState([]);
  const [frontUrl, setFrontUrl] = useState(null);
  const [backUrl, setBackUrl] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [savingFlags, setSavingFlags] = useState(false);
  const [flags, setFlags] = useState({
    isIndigent: initialResident.isIndigent,
    isPwd: initialResident.isPwd,
  });

  useEffect(() => {
    let cancelled = false;
    getRequestsByResident(resident.id)
      .then((r) => !cancelled && setRequests(r))
      .catch(() => {});
    return () => { cancelled = true; };
  }, [resident.id]);

  useEffect(() => {
    if (resident.idFrontUrl) {
      getResidentIdSignedUrl(resident.idFrontUrl).then(setFrontUrl).catch(() => {});
    } else { setFrontUrl(null); }
    if (resident.idBackUrl) {
      getResidentIdSignedUrl(resident.idBackUrl).then(setBackUrl).catch(() => {});
    } else { setBackUrl(null); }
  }, [resident.idFrontUrl, resident.idBackUrl]);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const updated = await verifyResidentId(resident.id);
      setResident(updated);
      onUpdate(updated);
      toast("ID verified. The resident has been notified.", "success");
    } catch (err) {
      toast(err.message || "Could not verify ID.", "error");
    } finally {
      setVerifying(false);
    }
  };

  const handleSaveFlags = async () => {
    setSavingFlags(true);
    try {
      const updated = await updateResidentFlags(resident.id, flags);
      setResident(updated);
      onUpdate(updated);
      toast("Classification updated.", "success");
    } catch (err) {
      toast(err.message || "Could not update classification.", "error");
    } finally {
      setSavingFlags(false);
    }
  };

  const flagsChanged =
    flags.isIndigent !== resident.isIndigent || flags.isPwd !== resident.isPwd;

  const hasId = resident.idFrontUrl || resident.idBackUrl;
  const age = getAge(resident.birthdate);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={onClose} />
      <div className="ml-auto w-full max-w-md bg-[rgb(var(--bg))] h-full shadow-2xl flex flex-col animate-slide-up">

        {/* Header */}
        <div className="p-5 border-b border-[rgb(var(--border))] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full overflow-hidden bg-[rgb(var(--text))] text-[rgb(var(--bg))] flex items-center justify-center font-semibold flex-shrink-0">
              {resident.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={resident.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <>{resident.firstName[0]}{resident.lastName[0]}</>
              )}
            </div>
            <div>
              <div className="font-semibold">
                {resident.firstName} {resident.middleName} {resident.lastName}
              </div>
              <div className="text-xs text-[rgb(var(--text-muted))]">
                Resident since {new Date(resident.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="bp-btn-ghost !py-2 !px-3">✕</button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto flex-1">

          {/* Personal details */}
          <div className="space-y-3">
            <Row label="Email" value={resident.email} />
            <Row label="Mobile" value={resident.contact} />
            <Row
              label="Age / Birthdate"
              value={resident.birthdate ? `${age} yrs · ${resident.birthdate}` : "—"}
            />
            <Row label="Sex" value={resident.sex} />
            <Row label="Civil status" value={resident.civilStatus} />
            <Row label="Address" value={`Purok ${resident.purok}, ${resident.streetAddress}`} />
            <Row label="Years of residency" value={resident.yearsOfResidency != null ? `${resident.yearsOfResidency} years` : "—"} />
          </div>

          {/* Classification flags */}
          <div className="border-t border-[rgb(var(--border))] pt-5">
            <div className="text-sm font-semibold mb-3">Classification</div>
            <div className="space-y-2">
              <FlagToggle
                label="Indigent"
                description="Socioeconomically disadvantaged resident"
                checked={flags.isIndigent}
                onChange={(v) => setFlags((f) => ({ ...f, isIndigent: v }))}
              />
              <FlagToggle
                label="Person with Disability (PWD)"
                description="Registered under RA 7277"
                checked={flags.isPwd}
                onChange={(v) => setFlags((f) => ({ ...f, isPwd: v }))}
              />
            </div>
            {flagsChanged && (
              <button
                onClick={handleSaveFlags}
                disabled={savingFlags}
                className="bp-btn-primary mt-3 w-full"
              >
                {savingFlags ? "Saving…" : "Save classification"}
              </button>
            )}
          </div>

          {/* ID Verification */}
          <div className="border-t border-[rgb(var(--border))] pt-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold">ID Verification</div>
              {resident.idVerified ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Verified
                </span>
              ) : hasId ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Pending review
                </span>
              ) : (
                <span className="text-xs text-[rgb(var(--text-muted))]">Not submitted</span>
              )}
            </div>
            {hasId ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <IdPreview label="Front" url={frontUrl} />
                  <IdPreview label="Back" url={backUrl} />
                </div>
                {!resident.idVerified && (
                  <button onClick={handleVerify} disabled={verifying} className="bp-btn-primary w-full">
                    {verifying ? "Verifying…" : "Verify ID"}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm text-[rgb(var(--text-muted))]">
                This resident has not submitted an ID yet.
              </p>
            )}
          </div>

          {/* Request history */}
          <div className="border-t border-[rgb(var(--border))] pt-5">
            <div className="text-xs text-[rgb(var(--text-muted))] mb-2">
              Request history ({requests.length})
            </div>
            {requests.length === 0 ? (
              <div className="text-sm text-[rgb(var(--text-muted))]">No requests yet.</div>
            ) : (
              <ul className="space-y-2">
                {requests.map((r) => (
                  <li key={r.id} className="rounded-xl border border-[rgb(var(--border))] p-3 text-sm">
                    <div className="font-medium">{r.purpose}</div>
                    <div className="text-xs text-[rgb(var(--text-muted))]">
                      {new Date(r.createdAt).toLocaleString()} · {r.status}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small components                                                     */
/* ------------------------------------------------------------------ */

function FlagToggle({ label, description, checked, onChange }) {
  return (
    <label className="flex items-start gap-3 rounded-xl border border-[rgb(var(--border))] p-3 cursor-pointer hover:bg-[rgb(var(--surface-2))] transition">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-[rgb(var(--text))]"
      />
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-[rgb(var(--text-muted))]">{description}</div>
      </div>
    </label>
  );
}

function IdPreview({ label, url }) {
  const [preview, setPreview] = useState(false);
  return (
    <div>
      <div className="text-xs text-[rgb(var(--text-muted))] mb-1">{label}</div>
      {url ? (
        <>
          <button type="button" onClick={() => setPreview(true)} className="w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={label} className="w-full h-28 cursor-zoom-in rounded-lg border border-[rgb(var(--border))] object-cover transition hover:opacity-80" />
          </button>
          {preview && <ImageLightbox src={url} alt={label} onClose={() => setPreview(false)} />}
        </>
      ) : (
        <div className="w-full h-28 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] flex items-center justify-center text-xs text-[rgb(var(--text-muted))]">
          Loading…
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-[rgb(var(--text-muted))]">{label}</span>
      <span className="font-medium text-right">{value || "—"}</span>
    </div>
  );
}
