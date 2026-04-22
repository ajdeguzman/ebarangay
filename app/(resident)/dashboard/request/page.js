"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { useToast } from "@/components/Toast";
import { DOCUMENT_TYPES } from "@/lib/barangay-config";
import { createRequest, getCurrentResident } from "@/lib/storage";

export default function RequestDocumentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [resident, setResident] = useState(null);
  const [selected, setSelected] = useState("clearance");
  const [purpose, setPurpose] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await getCurrentResident();
        if (!r) {
          if (!cancelled) router.replace("/login");
          return;
        }
        if (!cancelled) setResident(r);
      } catch {
        if (!cancelled) router.replace("/login");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!resident) {
    return (
      <>
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-10">
          <div className="h-6 w-32 bg-[rgb(var(--surface-2))] rounded animate-pulse" />
        </main>
      </>
    );
  }

  const selectedDoc = DOCUMENT_TYPES.find((d) => d.id === selected);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!purpose.trim()) {
      toast("Please enter the purpose for this document.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await createRequest({
        residentId: resident.id,
        residentName: `${resident.firstName} ${resident.lastName}`,
        documentType: selected,
        purpose: purpose.trim(),
        remarks: remarks.trim(),
      });
      toast("Request submitted! Track its status in your dashboard.", "success");
      router.push("/dashboard");
    } catch (err) {
      toast(err.message || "Could not submit request.", "error");
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-10 animate-fade-in">
        <Link
          href="/dashboard"
          className="text-sm text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]"
        >
          ← Back to dashboard
        </Link>
        <div className="mt-3 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">Request a document</h1>
          <p className="text-[rgb(var(--text-muted))] mt-2">
            Choose the document you need and tell us what it's for.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="bp-card p-6">
            <div className="font-semibold mb-3">1. Select document</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {DOCUMENT_TYPES.map((d) => (
                <button
                  type="button"
                  key={d.id}
                  onClick={() => setSelected(d.id)}
                  className={`text-left rounded-2xl p-4 border transition ${
                    selected === d.id
                      ? "border-[rgb(var(--text))] bg-[rgb(var(--surface-2))]"
                      : "border-[rgb(var(--border))] hover:bg-[rgb(var(--surface-2))]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{d.name}</div>
                    <span className="text-xs font-medium text-[rgb(var(--text-muted))]">
                      {d.fee === 0 ? "Free" : `₱${d.fee}`}
                    </span>
                  </div>
                  <p className="text-sm text-[rgb(var(--text-muted))] mt-1 leading-snug">
                    {d.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="bp-card p-6 space-y-4">
            <div className="font-semibold">2. Purpose & details</div>
            <label className="block">
              <span className="bp-label">
                Purpose of request <span className="text-rose-500">*</span>
              </span>
              <input
                className="bp-input"
                required
                placeholder="e.g. For employment, scholarship, opening bank account…"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="bp-label">Additional remarks</span>
              <textarea
                className="bp-input min-h-[110px]"
                placeholder="Anything the barangay office should know? (optional)"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </label>
          </div>

          <div className="bp-card p-6">
            <div className="font-semibold mb-2">Summary</div>
            <div className="text-sm">
              <div className="flex justify-between py-1">
                <span className="text-[rgb(var(--text-muted))]">Resident</span>
                <span className="font-medium">
                  {resident.firstName} {resident.lastName}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[rgb(var(--text-muted))]">Document</span>
                <span className="font-medium">{selectedDoc?.name}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[rgb(var(--text-muted))]">Fee</span>
                <span className="font-medium">
                  {selectedDoc?.fee === 0 ? "Free" : `₱${selectedDoc?.fee}`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button disabled={submitting} className="bp-btn-primary">
              {submitting ? "Submitting…" : "Submit request"}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
