"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import ImageLightbox from "@/components/ImageLightbox";
import {
  getCurrentResident,
  updateResidentContact,
  changeResidentEmail,
  changeResidentPassword,
  uploadResidentIdCard,
  getResidentIdSignedUrl,
} from "@/lib/storage";
import { useToast } from "@/components/Toast";

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [resident, setResident] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await getCurrentResident();
        if (!r) {
          if (!cancelled) router.replace("/login?reason=no-profile");
          return;
        }
        if (!cancelled) {
          setResident(r);
          setLoaded(true);
        }
      } catch {
        if (!cancelled) router.replace("/login");
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  if (!loaded) {
    return (
      <>
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-10">
          <div className="h-8 w-48 bg-[rgb(var(--surface-2))] rounded mb-6 animate-pulse" />
          <div className="space-y-4">
            <div className="h-40 bg-[rgb(var(--surface-2))] rounded-2xl animate-pulse" />
            <div className="h-40 bg-[rgb(var(--surface-2))] rounded-2xl animate-pulse" />
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-10 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-[rgb(var(--text-muted))] mt-1">Manage your personal info and account settings.</p>
        </div>

        <div className="space-y-6">
          <PersonalInfoCard resident={resident} />
          <ContactForm resident={resident} onUpdate={setResident} toast={toast} />
          <EmailForm currentEmail={resident.email} toast={toast} />
          <PasswordForm toast={toast} />
          <IdSection resident={resident} onUpdate={setResident} toast={toast} />
        </div>
      </main>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Personal Information (read-only)                                     */
/* ------------------------------------------------------------------ */

function PersonalInfoCard({ resident }) {
  const name = [resident.firstName, resident.middleName, resident.lastName]
    .filter(Boolean)
    .join(" ");

  const fields = [
    ["Full name", name || "—"],
    ["Sex", resident.sex || "—"],
    ["Purok / Sitio", resident.purok || "—"],
    ["Street address", resident.streetAddress || "—"],
    [
      "Years of residency",
      resident.yearsOfResidency != null
        ? `${resident.yearsOfResidency} year${resident.yearsOfResidency !== 1 ? "s" : ""}`
        : "—",
    ],
    [
      "Member since",
      resident.createdAt
        ? new Date(resident.createdAt).toLocaleDateString("en-PH", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "—",
    ],
  ];

  return (
    <div className="bp-card p-6">
      <div className="mb-4">
        <h2 className="font-semibold">Personal Information</h2>
        <p className="text-sm text-[rgb(var(--text-muted))] mt-0.5">
          To update this information, contact the barangay office.
        </p>
      </div>
      <dl className="grid gap-y-4 gap-x-8 md:grid-cols-2">
        {fields.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-medium text-[rgb(var(--text-muted))] uppercase tracking-wide">{label}</dt>
            <dd className="mt-0.5 text-sm">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Contact & Status                                                     */
/* ------------------------------------------------------------------ */

function ContactForm({ resident, onUpdate, toast }) {
  const [form, setForm] = useState({
    contact: resident.contact || "",
    civilStatus: resident.civilStatus || "",
    birthdate: resident.birthdate || "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateResidentContact(form);
      onUpdate(updated);
      toast("Contact info updated.", "success");
    } catch (err) {
      toast(err.message || "Could not update.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="bp-card p-6 space-y-4">
      <div>
        <h2 className="font-semibold">Contact & Status</h2>
        <p className="text-sm text-[rgb(var(--text-muted))] mt-0.5">Update your phone number, civil status, and birthdate.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="bp-label">Mobile number</span>
          <input className="bp-input" placeholder="09XX XXX XXXX" value={form.contact} onChange={set("contact")} />
        </label>
        <label className="block">
          <span className="bp-label">Civil status</span>
          <select className="bp-input" value={form.civilStatus} onChange={set("civilStatus")}>
            <option value="">Select…</option>
            <option>Single</option>
            <option>Married</option>
            <option>Widowed</option>
            <option>Separated</option>
          </select>
        </label>
        <label className="block">
          <span className="bp-label">Birthdate</span>
          <input type="date" className="bp-input" value={form.birthdate || ""} onChange={set("birthdate")} />
        </label>
      </div>
      <div className="flex justify-end">
        <button disabled={saving} className="bp-btn-primary">
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Email address                                                        */
/* ------------------------------------------------------------------ */

function EmailForm({ currentEmail, toast }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(null);
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (trimmed === currentEmail) {
      toast("That's already your current email.", "error");
      return;
    }
    setSaving(true);
    try {
      await changeResidentEmail(trimmed);
      setSent(trimmed);
      setEmail("");
    } catch (err) {
      toast(err.message || "Could not update email.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bp-card p-6 space-y-4">
      <div>
        <h2 className="font-semibold">Email address</h2>
        <p className="text-sm text-[rgb(var(--text-muted))] mt-0.5">
          Current: <span className="text-[rgb(var(--text))] font-medium">{currentEmail}</span>
        </p>
      </div>
      {sent ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
          A confirmation link was sent to <b>{sent}</b>. Click it to complete the change. You can still log in with your current email until then.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="bp-label">New email address</span>
            <input type="email" required className="bp-input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <div className="flex justify-end">
            <button disabled={saving} className="bp-btn-primary">
              {saving ? "Sending…" : "Update email"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Change password                                                      */
/* ------------------------------------------------------------------ */

function PasswordForm({ toast }) {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.next !== form.confirm) {
      toast("New passwords don't match.", "error");
      return;
    }
    if (form.next.length < 6) {
      toast("New password must be at least 6 characters.", "error");
      return;
    }
    setSaving(true);
    try {
      await changeResidentPassword(form.current, form.next);
      setForm({ current: "", next: "", confirm: "" });
      toast("Password updated successfully.", "success");
    } catch (err) {
      toast(err.message || "Could not update password.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="bp-card p-6 space-y-4">
      <div>
        <h2 className="font-semibold">Change password</h2>
        <p className="text-sm text-[rgb(var(--text-muted))] mt-0.5">Enter your current password to set a new one.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="bp-label">Current password</span>
          <input type="password" required className="bp-input" value={form.current} onChange={set("current")} />
        </label>
        <label className="block">
          <span className="bp-label">New password</span>
          <input type="password" required minLength={6} className="bp-input" value={form.next} onChange={set("next")} />
        </label>
        <label className="block">
          <span className="bp-label">Confirm new password</span>
          <input type="password" required minLength={6} className="bp-input" value={form.confirm} onChange={set("confirm")} />
        </label>
      </div>
      <div className="flex justify-end">
        <button disabled={saving} className="bp-btn-primary">
          {saving ? "Updating…" : "Update password"}
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* ID Verification                                                      */
/* ------------------------------------------------------------------ */

function IdSection({ resident, onUpdate, toast }) {
  const [frontUrl, setFrontUrl] = useState(null);
  const [backUrl, setBackUrl] = useState(null);
  const [busy, setBusy] = useState({ front: false, back: false });
  const frontRef = useRef(null);
  const backRef = useRef(null);

  useEffect(() => {
    if (resident.idFrontUrl) {
      getResidentIdSignedUrl(resident.idFrontUrl).then((u) => setFrontUrl(u)).catch(() => {});
    }
    if (resident.idBackUrl) {
      getResidentIdSignedUrl(resident.idBackUrl).then((u) => setBackUrl(u)).catch(() => {});
    }
  }, [resident.idFrontUrl, resident.idBackUrl]);

  const handleUpload = async (e, side) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast("Please upload a PNG, JPG, or WebP image.", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast("File must be under 5 MB.", "error");
      return;
    }
    setBusy((b) => ({ ...b, [side]: true }));
    try {
      const updated = await uploadResidentIdCard(file, side);
      onUpdate(updated);
      const path = side === "front" ? updated.idFrontUrl : updated.idBackUrl;
      const url = await getResidentIdSignedUrl(path);
      if (side === "front") setFrontUrl(url);
      else setBackUrl(url);
      toast(`ID ${side} uploaded successfully.`, "success");
    } catch (err) {
      toast(err.message || "Upload failed.", "error");
    } finally {
      setBusy((b) => ({ ...b, [side]: false }));
      const ref = side === "front" ? frontRef : backRef;
      if (ref.current) ref.current.value = "";
    }
  };

  const hasAny = resident.idFrontUrl || resident.idBackUrl;

  return (
    <div className="bp-card p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">ID Verification</h2>
          <p className="text-sm text-[rgb(var(--text-muted))] mt-0.5">
            Upload a valid government-issued ID (front and back).
          </p>
        </div>
        {resident.idVerified ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Verified
          </span>
        ) : hasAny ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Pending review
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[rgb(var(--surface-2))] px-2.5 py-1 text-xs font-medium text-[rgb(var(--text-muted))]">
            <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--text-muted))]" /> Not submitted
          </span>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <IdCard label="Front of ID" imageUrl={frontUrl} busy={busy.front} inputRef={frontRef} onChange={(e) => handleUpload(e, "front")} />
        <IdCard label="Back of ID" imageUrl={backUrl} busy={busy.back} inputRef={backRef} onChange={(e) => handleUpload(e, "back")} />
      </div>

      <p className="text-xs text-[rgb(var(--text-muted))]">
        Accepted: PNG, JPG, WebP · Max 5 MB per file · Your ID is kept private and only viewable by barangay staff.
      </p>
    </div>
  );
}

function IdCard({ label, imageUrl, busy, inputRef, onChange }) {
  const [preview, setPreview] = useState(false);
  return (
    <div>
      <div className="text-sm font-medium mb-2">{label}</div>
      {imageUrl ? (
        <>
          <div className="group relative overflow-hidden rounded-xl bg-[rgb(var(--surface-2))]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt={label} className="h-40 w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
              <button
                type="button"
                onClick={() => setPreview(true)}
                className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-black"
              >
                Preview
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
                className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-black disabled:opacity-60"
              >
                {busy ? "Uploading…" : "Replace"}
              </button>
            </div>
          </div>
          {preview && <ImageLightbox src={imageUrl} alt={label} onClose={() => setPreview(false)} />}
        </>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[rgb(var(--border))] text-[rgb(var(--text-muted))] transition hover:border-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))] disabled:cursor-not-allowed"
        >
          {busy ? (
            <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
              <span className="text-sm font-medium">Upload {label}</span>
            </>
          )}
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onChange} />
    </div>
  );
}

