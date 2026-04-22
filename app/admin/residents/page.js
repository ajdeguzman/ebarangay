"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { getResidents, getRequestsByResident } from "@/lib/storage";

export default function AdminResidentsPage() {
  const [residents, setResidents] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getResidents()
      .then((r) => {
        if (cancelled) return;
        setResidents(r);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, []);

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

      <div className="bp-card overflow-hidden">
        {!loaded ? (
          <div className="p-10 text-center text-sm text-[rgb(var(--text-muted))]">
            Loading…
          </div>
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
                          <div className="font-medium">
                            {r.firstName} {r.lastName}
                          </div>
                          <div className="text-xs text-[rgb(var(--text-muted))]">
                            {r.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">{r.contact}</td>
                    <td className="px-5 py-3 text-[rgb(var(--text-muted))]">
                      Purok {r.purok} · {r.streetAddress}
                    </td>
                    <td className="px-5 py-3 text-[rgb(var(--text-muted))]">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => setActive(r)}
                        className="bp-btn-ghost !py-1.5 !px-3 text-sm"
                      >
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
        <ResidentDrawer resident={active} onClose={() => setActive(null)} />
      )}
    </AdminSidebar>
  );
}

function ResidentDrawer({ resident, onClose }) {
  const [requests, setRequests] = useState([]);
  useEffect(() => {
    let cancelled = false;
    getRequestsByResident(resident.id)
      .then((r) => !cancelled && setRequests(r))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [resident.id]);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 bg-black/40 animate-fade-in"
        onClick={onClose}
      />
      <div className="ml-auto w-full max-w-md bg-[rgb(var(--bg))] h-full shadow-2xl flex flex-col animate-slide-up">
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
                {resident.firstName} {resident.middleName}{" "}
                {resident.lastName}
              </div>
              <div className="text-xs text-[rgb(var(--text-muted))]">
                Resident since{" "}
                {new Date(resident.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="bp-btn-ghost !py-2 !px-3">
            ✕
          </button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <Row label="Email" value={resident.email} />
          <Row label="Mobile" value={resident.contact} />
          <Row label="Birthdate" value={resident.birthdate} />
          <Row label="Sex" value={resident.sex} />
          <Row label="Civil status" value={resident.civilStatus} />
          <Row
            label="Address"
            value={`Purok ${resident.purok}, ${resident.streetAddress}`}
          />
          <Row
            label="Years of residency"
            value={`${resident.yearsOfResidency} years`}
          />
          <div>
            <div className="text-xs text-[rgb(var(--text-muted))] mb-2">
              Request history ({requests.length})
            </div>
            {requests.length === 0 ? (
              <div className="text-sm text-[rgb(var(--text-muted))]">
                No requests yet.
              </div>
            ) : (
              <ul className="space-y-2">
                {requests.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-xl border border-[rgb(var(--border))] p-3 text-sm"
                  >
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

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-[rgb(var(--text-muted))]">{label}</span>
      <span className="font-medium text-right">{value || "—"}</span>
    </div>
  );
}
