"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Header from "@/components/Header";
import { useToast } from "@/components/Toast";
import { loginResident } from "@/lib/storage";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    if (searchParams.get("reason") === "no-profile") {
      toast(
        "Your account was created but your resident profile is missing. Please contact the barangay office or try registering again.",
        "error"
      );
    }
  }, [searchParams, toast]);
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await loginResident(form.email, form.password);
      toast("Logged in. Welcome back!", "success");
      router.push("/dashboard");
    } catch (err) {
      toast(err.message || "Could not log in.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="max-w-md mx-auto px-4 py-16 animate-fade-in">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="text-[rgb(var(--text-muted))] mt-2">
            Log in to your resident account.
          </p>
        </div>
        <form onSubmit={onSubmit} className="bp-card p-6 md:p-8 space-y-4">
          <label className="block">
            <span className="bp-label">Email</span>
            <input
              type="email"
              required
              className="bp-input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label className="block">
            <div className="flex items-center justify-between mb-1">
              <span className="bp-label mb-0">Password</span>
              <Link
                href="/forgot-password"
                className="text-xs text-[rgb(var(--text-muted))] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                className="bp-input pr-10"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.029 10.029 0 0 0 3.3-4.38 1.651 1.651 0 0 0 0-1.185A10.004 10.004 0 0 0 9.999 3a9.956 9.956 0 0 0-4.744 1.194L3.28 2.22ZM7.752 6.69l1.092 1.092a2.5 2.5 0 0 1 3.374 3.373l1.091 1.092a4 4 0 0 0-5.557-5.557Z" clipRule="evenodd" />
                    <path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 0 1-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 0 1 0-1.186A10.007 10.007 0 0 1 2.839 6.02L6.07 9.252a4 4 0 0 0 4.678 4.678Z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                    <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41Z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </label>
          <button disabled={submitting} className="bp-btn-primary w-full">
            {submitting ? "Logging in…" : "Log in"}
          </button>
          <p className="text-sm text-center text-[rgb(var(--text-muted))]">
            No account yet?{" "}
            <Link
              href="/register"
              className="text-[rgb(var(--text))] font-medium hover:underline"
            >
              Register here
            </Link>
          </p>
        </form>
      </main>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
