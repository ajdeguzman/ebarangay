"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { useToast } from "@/components/Toast";
import { loginAdmin } from "@/lib/storage";

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await loginAdmin(form.email, form.password);
      toast("Signed in as administrator.", "success");
      router.push("/admin/dashboard");
    } catch (err) {
      toast(err.message || "Could not log in.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-[rgb(var(--border))]">
        <Link href="/" className="flex items-center">
          <Logo />
        </Link>
        <ThemeToggle />
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-sm space-y-4 animate-fade-in"
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold">Admin sign in</h2>
            <p className="text-sm text-[rgb(var(--text-muted))] mt-1">
              Authorized barangay staff only.
            </p>
          </div>
          <label className="block">
            <span className="bp-label">Email</span>
            <input
              required
              type="email"
              className="bp-input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="bp-label">Password</span>
            <input
              required
              type="password"
              className="bp-input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>
          <button disabled={submitting} className="bp-btn-primary w-full">
            {submitting ? "Signing in…" : "Sign in"}
          </button>
          <p className="text-xs text-[rgb(var(--text-muted))] text-center">
            Admin accounts are provisioned by your barangay. If you need
            access, contact the office.
          </p>
        </form>
      </div>
    </main>
  );
}
