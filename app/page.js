"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import {
  getBarangayConfig,
  fallbackBarangayConfig,
  DOCUMENT_TYPES,
} from "@/lib/barangay-config";

export default function HomePage() {
  const [cfg, setCfg] = useState(fallbackBarangayConfig);

  useEffect(() => {
    let cancelled = false;
    getBarangayConfig()
      .then((c) => !cancelled && setCfg(c))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Header />

      <main>
        <section className="max-w-3xl mx-auto px-4 pt-24 pb-20 text-center animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
            {cfg?.name || "Barangay Portal"} Services,
            <br />
            <span className="text-[rgb(var(--text-muted))]">
              without the line.
            </span>
          </h1>
          <p className="mt-6 text-lg text-[rgb(var(--text-muted))] max-w-xl mx-auto">
            {cfg?.tagline ||
              "A modern portal for every juan and juana."}{" "}
            Register once, request documents from home, and track status in
            real time.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <Link href="/register" className="bp-btn-primary">
              Create an account
            </Link>
            <Link href="/login" className="bp-btn-secondary">
              Log in
            </Link>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4">
          <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
            <div>
              <h2 className="text-xl font-semibold">
                Documents you can request
              </h2>
              <p className="text-[rgb(var(--text-muted))] text-sm">
                Submit online, claim at the barangay hall.
              </p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {DOCUMENT_TYPES.map((d) => (
              <div
                key={d.id}
                className="rounded-2xl p-5 border border-[rgb(var(--border))] bg-[rgb(var(--surface))] hover:bg-[rgb(var(--surface-2))] transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold">{d.name}</div>
                    <p className="text-sm text-[rgb(var(--text-muted))] mt-1 leading-snug">
                      {d.description}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-[rgb(var(--text-muted))] shrink-0">
                    {d.fee === 0 ? "Free" : `₱${d.fee}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 mt-16 mb-24">
          <h2 className="text-xl font-semibold mb-6">How it works</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Register",
                desc: "Create your account and confirm your email. One account per resident.",
              },
              {
                step: "2",
                title: "Submit a request",
                desc: "Pick a document, enter your purpose, submit. It appears in your dashboard instantly.",
              },
              {
                step: "3",
                title: "Track & claim",
                desc: "Get status updates as the barangay processes your request. Claim when ready.",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="rounded-2xl p-5 border border-[rgb(var(--border))] bg-[rgb(var(--surface))]"
              >
                <div className="text-sm font-medium text-[rgb(var(--text-muted))]">
                  Step {s.step}
                </div>
                <div className="font-semibold mt-1">{s.title}</div>
                <p className="text-sm text-[rgb(var(--text-muted))] mt-1">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
