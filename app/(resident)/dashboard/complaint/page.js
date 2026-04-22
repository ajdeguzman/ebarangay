"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { useToast } from "@/components/Toast";
import { COMPLAINT_CATEGORIES } from "@/lib/barangay-config";
import { createComplaint, getCurrentResident } from "@/lib/storage";

export default function FileComplaintPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [resident, setResident] = useState(null);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("noise");
  const [description, setDescription] = useState("");
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

  const idUploaded = resident.idFrontUrl && resident.idBackUrl;
  if (!resident.idVerified) {
    return (
      <>
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-10 animate-fade-in">
          <Link href="/dashboard" className="text-sm text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]">
            ← Back to dashboard
          </Link>
          <div className="mt-3 mb-8">
            <h1 className="text-3xl md:text-4xl font-bold">File a complaint</h1>
          </div>
          <div className="bp-card p-8 text-center">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-[rgb(var(--surface-2))] flex items-center justify-center mb-4 text-[rgb(var(--text-muted))]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 10h.01M12 10h.01M8 10h.01M2 14h20"/></svg>
            </div>
            <h2 className="text-lg font-semibold mb-2">ID verification required</h2>
            {idUploaded ? (
              <p className="text-[rgb(var(--text-muted))] text-sm max-w-sm mx-auto">
                Your ID is currently <span className="font-medium text-amber-600 dark:text-amber-400">pending review</span> by the barangay office. You can file complaints once your identity has been verified.
              </p>
            ) : (
              <p className="text-[rgb(var(--text-muted))] text-sm max-w-sm mx-auto">
                You must upload a valid government-issued ID and have it verified by the barangay office before you can file a complaint.
              </p>
            )}
            <Link href="/profile" className="bp-btn-primary inline-flex mt-6">
              {idUploaded ? "View ID status" : "Upload your ID"}
            </Link>
          </div>
        </main>
      </>
    );
  }

  const selectedCategory = COMPLAINT_CATEGORIES.find((c) => c.id === category);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim()) {
      toast("Please enter a subject.", "error");
      return;
    }
    if (!description.trim()) {
      toast("Please describe the complaint.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await createComplaint({
        residentId: resident.id,
        residentName: `${resident.firstName} ${resident.lastName}`,
        subject: subject.trim(),
        category,
        description: description.trim(),
      });
      toast("Complaint filed! Track its status in your dashboard.", "success");
      router.push("/dashboard");
    } catch (err) {
      toast(err.message || "Could not file complaint.", "error");
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
          <h1 className="text-3xl md:text-4xl font-bold">File a complaint</h1>
          <p className="text-[rgb(var(--text-muted))] mt-2">
            Describe the issue and the barangay office will look into it.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="bp-card p-6 space-y-4">
            <div className="font-semibold">Complaint details</div>
            <label className="block">
              <span className="bp-label">
                Subject <span className="text-rose-500">*</span>
              </span>
              <input
                className="bp-input"
                required
                placeholder="e.g. Neighbor dumping waste near the road"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="bp-label">Category</span>
              <select
                className="bp-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {COMPLAINT_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="bp-label">
                Description <span className="text-rose-500">*</span>
              </span>
              <textarea
                className="bp-input min-h-[140px]"
                required
                placeholder="Describe the incident — when it happened, who is involved, and any other relevant details."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
          </div>

          <div className="bp-card p-6">
            <div className="font-semibold mb-2">Summary</div>
            <div className="text-sm">
              <div className="flex justify-between py-1">
                <span className="text-[rgb(var(--text-muted))]">Filed by</span>
                <span className="font-medium">
                  {resident.firstName} {resident.lastName}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[rgb(var(--text-muted))]">Category</span>
                <span className="font-medium">{selectedCategory?.label}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button disabled={submitting} className="bp-btn-primary">
              {submitting ? "Submitting…" : "File complaint"}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
