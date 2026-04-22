"use client";

import Link from "next/link";
import { useState } from "react";
import Header from "@/components/Header";
import { useToast } from "@/components/Toast";
import { resetPassword } from "@/lib/storage";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      toast(err.message || "Could not send reset email.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="max-w-md mx-auto px-4 py-16 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Forgot password</h1>
          <p className="text-[rgb(var(--text-muted))] mt-2">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {sent ? (
          <div className="bp-card p-6 md:p-8 text-center space-y-4">
            <div className="flex justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-green-500">
                <path d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67Z" />
                <path d="M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908Z" />
              </svg>
            </div>
            <p className="font-medium">Check your email</p>
            <p className="text-sm text-[rgb(var(--text-muted))]">
              We sent a password reset link to <strong>{email}</strong>. Check your inbox (and spam folder).
            </p>
            <Link href="/login" className="bp-btn-primary block w-full text-center">
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="bp-card p-6 md:p-8 space-y-4">
            <label className="block">
              <span className="bp-label">Email</span>
              <input
                type="email"
                required
                className="bp-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <button disabled={submitting} className="bp-btn-primary w-full">
              {submitting ? "Sending…" : "Send reset link"}
            </button>
            <p className="text-sm text-center text-[rgb(var(--text-muted))]">
              Remembered it?{" "}
              <Link
                href="/login"
                className="text-[rgb(var(--text))] font-medium hover:underline"
              >
                Back to login
              </Link>
            </p>
          </form>
        )}
      </main>
    </>
  );
}
