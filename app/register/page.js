"use client";

import Link from "next/link";
import { useState } from "react";
import Header from "@/components/Header";
import { useToast } from "@/components/Toast";
import { createResident } from "@/lib/storage";

export default function RegisterPage() {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState(null);
  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    birthdate: "",
    sex: "",
    civilStatus: "",
    contact: "",
    email: "",
    password: "",
    confirmPassword: "",
    purok: "",
    streetAddress: "",
    yearsOfResidency: "",
  });

  const update = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast("Passwords don't match.", "error");
      return;
    }
    if (form.password.length < 6) {
      toast("Password must be at least 6 characters.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const { confirmPassword, ...data } = form;
      await createResident(data);
      setSentTo(form.email);
      toast("Account created. Check your email to confirm.", "success");
    } catch (err) {
      toast(err.message || "Could not register.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (sentTo) {
    return (
      <>
        <Header />
        <main className="max-w-md mx-auto px-4 py-20 text-center animate-fade-in">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-[rgb(var(--surface-2))] flex items-center justify-center mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold">Check your email</h1>
          <p className="text-[rgb(var(--text-muted))] mt-2">
            We sent a confirmation link to <b>{sentTo}</b>. Click the link to
            activate your account, then come back to log in.
          </p>
          <div className="mt-6">
            <Link href="/login" className="bp-btn-primary">
              Back to log in
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-10 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">
            Create your resident account
          </h1>
          <p className="text-[rgb(var(--text-muted))] mt-2">
            One account lets you request documents and track them online.
          </p>
        </div>

        <form onSubmit={onSubmit} className="bp-card p-6 md:p-8 space-y-6">
          <Section title="Personal information">
            <Grid>
              <Field label="First name" required>
                <input className="bp-input" required value={form.firstName} onChange={update("firstName")} />
              </Field>
              <Field label="Middle name">
                <input className="bp-input" value={form.middleName} onChange={update("middleName")} />
              </Field>
              <Field label="Last name" required>
                <input className="bp-input" required value={form.lastName} onChange={update("lastName")} />
              </Field>
              <Field label="Birthdate" required>
                <input type="date" className="bp-input" required value={form.birthdate} onChange={update("birthdate")} />
              </Field>
              <Field label="Sex" required>
                <select className="bp-input" required value={form.sex} onChange={update("sex")}>
                  <option value="">Select…</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Prefer not to say</option>
                </select>
              </Field>
              <Field label="Civil status" required>
                <select className="bp-input" required value={form.civilStatus} onChange={update("civilStatus")}>
                  <option value="">Select…</option>
                  <option>Single</option>
                  <option>Married</option>
                  <option>Widowed</option>
                  <option>Separated</option>
                </select>
              </Field>
            </Grid>
          </Section>

          <Section title="Address">
            <Grid>
              <Field label="Purok / Sitio" required>
                <input className="bp-input" required placeholder="e.g. Purok 3" value={form.purok} onChange={update("purok")} />
              </Field>
              <Field label="Street address" required>
                <input className="bp-input" required placeholder="House no., street" value={form.streetAddress} onChange={update("streetAddress")} />
              </Field>
              <Field label="Years of residency" required>
                <input type="number" min="0" className="bp-input" required value={form.yearsOfResidency} onChange={update("yearsOfResidency")} />
              </Field>
            </Grid>
          </Section>

          <Section title="Account & contact">
            <Grid>
              <Field label="Mobile number" required>
                <input className="bp-input" required placeholder="09XX XXX XXXX" value={form.contact} onChange={update("contact")} />
              </Field>
              <Field label="Email address" required>
                <input type="email" className="bp-input" required value={form.email} onChange={update("email")} />
              </Field>
              <Field label="Password" required>
                <input type="password" className="bp-input" required minLength={6} value={form.password} onChange={update("password")} />
              </Field>
              <Field label="Confirm password" required>
                <input type="password" className="bp-input" required minLength={6} value={form.confirmPassword} onChange={update("confirmPassword")} />
              </Field>
            </Grid>
          </Section>

          <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
            <p className="text-sm text-[rgb(var(--text-muted))]">
              Already have an account?{" "}
              <Link href="/login" className="text-[rgb(var(--text))] font-medium hover:underline">
                Log in
              </Link>
            </p>
            <button disabled={submitting} className="bp-btn-primary">
              {submitting ? "Creating account…" : "Create account"}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="font-semibold mb-3 text-[rgb(var(--text))]">{title}</h3>
      {children}
    </div>
  );
}

function Grid({ children }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="bp-label">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </span>
      {children}
    </label>
  );
}
