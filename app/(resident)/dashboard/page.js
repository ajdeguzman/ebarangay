"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import StatusBadge from "@/components/StatusBadge";
import {
  getCurrentResident,
  getRequestsByResident,
  getComplaintsByResident,
  uploadResidentAvatar,
  removeResidentAvatar,
} from "@/lib/storage";
import { DOCUMENT_TYPES, COMPLAINT_CATEGORIES, COMPLAINT_STATUSES } from "@/lib/barangay-config";
import { useToast } from "@/components/Toast";

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [resident, setResident] = useState(null);
  const [requests, setRequests] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await getCurrentResident();
        if (!r) {
          if (!cancelled) router.replace("/login?reason=no-profile");
          return;
        }
        const [reqs, comps] = await Promise.all([
          getRequestsByResident(r.id),
          getComplaintsByResident(r.id),
        ]);
        if (cancelled) return;
        setResident(r);
        setRequests(reqs);
        setComplaints(comps);
        setLoaded(true);
      } catch {
        if (!cancelled) router.replace("/login");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast("Please upload a PNG, JPG, or WebP image.", "error");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast("Photo must be under 2 MB.", "error");
      return;
    }

    setAvatarBusy(true);
    try {
      const updated = await uploadResidentAvatar(file);
      setResident(updated);
      toast("Profile photo updated.", "success");
    } catch (err) {
      toast(err.message || "Upload failed.", "error");
    } finally {
      setAvatarBusy(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleAvatarRemove = async () => {
    setAvatarBusy(true);
    try {
      const updated = await removeResidentAvatar(resident.avatarUrl);
      setResident(updated);
      toast("Profile photo removed.", "success");
    } catch (err) {
      toast(err.message || "Could not remove photo.", "error");
    } finally {
      setAvatarBusy(false);
    }
  };

  if (!loaded) {
    return (
      <>
        <Header />
        <main className="max-w-6xl mx-auto px-4 py-10">
          <div className="h-6 w-40 bg-[rgb(var(--surface-2))] rounded mb-3 animate-pulse" />
          <div className="h-10 w-80 bg-[rgb(var(--surface-2))] rounded animate-pulse" />
        </main>
      </>
    );
  }

  const docNameOf = (id) =>
    DOCUMENT_TYPES.find((d) => d.id === id)?.name || id;

  const categoryLabelOf = (id) =>
    COMPLAINT_CATEGORIES.find((c) => c.id === id)?.label || id;

  const initials = `${resident.firstName?.[0] || ""}${resident.lastName?.[0] || ""}`;

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-10 animate-fade-in">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="group relative flex-shrink-0">
              <div className="h-16 w-16 rounded-full overflow-hidden bg-[rgb(var(--text))] text-[rgb(var(--bg))] text-xl font-semibold flex items-center justify-center">
                {resident.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resident.avatarUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              {/* Overlay on hover */}
              <button
                type="button"
                disabled={avatarBusy}
                onClick={() => avatarInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center disabled:cursor-not-allowed"
                title="Change photo"
              >
                {avatarBusy ? (
                  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                )}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>

            <div>
              <div className="text-sm text-[rgb(var(--text-muted))]">
                Welcome back,
              </div>
              <h1 className="text-3xl md:text-4xl font-bold">
                {resident.firstName} {resident.lastName}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-[rgb(var(--text-muted))]">
                  Sitio {resident.purok} · {resident.streetAddress}
                </p>
                {resident.avatarUrl && (
                  <button
                    type="button"
                    disabled={avatarBusy}
                    onClick={handleAvatarRemove}
                    className="text-xs text-rose-500 hover:underline disabled:opacity-50"
                  >
                    Remove photo
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Link href="/dashboard/complaint" className="bp-btn-secondary">
              + File a complaint
            </Link>
            <Link href="/dashboard/request" className="bp-btn-primary">
              + New request
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Stat label="Total requests" value={requests.length} />
          <Stat
            label="Pending"
            value={requests.filter((r) => r.status === "pending").length}
          />
          <Stat
            label="Processing"
            value={requests.filter((r) => r.status === "processing").length}
          />
          <Stat
            label="Ready to claim"
            value={requests.filter((r) => r.status === "ready").length}
          />
        </div>

        {complaints.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 mb-8">
            <Stat label="Complaints filed" value={complaints.length} />
            <Stat
              label="Under review"
              value={complaints.filter((c) => c.status === "under_review").length}
            />
          </div>
        )}

        <section className="bp-card overflow-hidden mb-6">
          <div className="p-6 border-b border-[rgb(var(--border))] flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Your document requests</h2>
              <p className="text-sm text-[rgb(var(--text-muted))]">
                Track status and history of everything you've requested.
              </p>
            </div>
          </div>

          {requests.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-[rgb(var(--surface-2))] flex items-center justify-center mb-3 text-[rgb(var(--text-muted))]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <div className="font-semibold">No requests yet</div>
              <p className="text-sm text-[rgb(var(--text-muted))] mt-1 mb-4">
                Submit your first document request — it only takes a minute.
              </p>
              <Link href="/dashboard/request" className="bp-btn-primary">
                Request a document
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-[rgb(var(--border))]">
              {requests.map((r) => (
                <li
                  key={r.id}
                  className="p-5 flex items-start justify-between gap-4"
                >
                  <div>
                    <div className="font-semibold">
                      {docNameOf(r.documentType)}
                    </div>
                    <div className="text-sm text-[rgb(var(--text-muted))] mt-0.5">
                      {r.purpose}
                    </div>
                    <div className="text-xs text-[rgb(var(--text-muted))] mt-2">
                      Ref: {r.id.slice(0, 8)} · Submitted{" "}
                      {new Date(r.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bp-card overflow-hidden">
          <div className="p-6 border-b border-[rgb(var(--border))] flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Your complaints</h2>
              <p className="text-sm text-[rgb(var(--text-muted))]">
                Track complaints you've filed with the barangay.
              </p>
            </div>
            <Link href="/dashboard/complaint" className="bp-btn-ghost !py-1.5 !px-3 text-sm">
              + File new
            </Link>
          </div>

          {complaints.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-[rgb(var(--surface-2))] flex items-center justify-center mb-3 text-[rgb(var(--text-muted))]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <div className="font-semibold">No complaints filed</div>
              <p className="text-sm text-[rgb(var(--text-muted))] mt-1 mb-4">
                Use the complaints form to report an issue to the barangay.
              </p>
              <Link href="/dashboard/complaint" className="bp-btn-primary">
                File a complaint
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-[rgb(var(--border))]">
              {complaints.map((c) => (
                <li
                  key={c.id}
                  className="p-5 flex items-start justify-between gap-4"
                >
                  <div>
                    <div className="font-semibold">{c.subject}</div>
                    <div className="text-sm text-[rgb(var(--text-muted))] mt-0.5">
                      {categoryLabelOf(c.category)}
                    </div>
                    <div className="text-xs text-[rgb(var(--text-muted))] mt-2">
                      Ref: {c.id.slice(0, 8)} · Filed{" "}
                      {new Date(c.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <StatusBadge status={c.status} statuses={COMPLAINT_STATUSES} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bp-card p-5">
      <div className="text-sm text-[rgb(var(--text-muted))]">{label}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
    </div>
  );
}
