"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import {
  getBarangayConfig,
  fallbackBarangayConfig,
  DOCUMENT_TYPES,
  COMPLAINT_CATEGORIES,
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
              "A modern portal for every juan."}{" "}
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

        {/* Services overview */}
        <section className="max-w-5xl mx-auto px-4 mb-16">
          <h2 className="text-xl font-semibold mb-2">Our services</h2>
          <p className="text-[rgb(var(--text-muted))] text-sm mb-6">
            Everything you need from the barangay, available online.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <ServiceCard
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              }
              title="Document Requests"
              description="Request barangay certificates and clearances from home. Pick up when ready."
              badge={`${DOCUMENT_TYPES.length} documents`}
              color="blue"
            />
            <ServiceCard
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              }
              title="File a Complaint"
              description="Report noise disturbances, property disputes, sanitation issues, and more."
              badge={`${COMPLAINT_CATEGORIES.length} categories`}
              color="rose"
            />
            <ServiceCard
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              }
              title="Resident Profile"
              description="Manage your personal information and upload your ID for faster document processing."
              badge="ID verification"
              color="emerald"
            />
          </div>
        </section>

        {/* Document types */}
        <section className="max-w-5xl mx-auto px-4 mb-16">
          <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
            <div>
              <h2 className="text-xl font-semibold">
                Documents you can request
              </h2>
              <p className="text-[rgb(var(--text-muted))] text-sm">
                Submit online, claim at the barangay hall.
              </p>
            </div>
            <Link href="/login" className="bp-btn-secondary !py-2 !px-4 text-sm">
              Request a document →
            </Link>
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

        {/* Complaint categories */}
        <section className="max-w-5xl mx-auto px-4 mb-16">
          <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
            <div>
              <h2 className="text-xl font-semibold">File a complaint</h2>
              <p className="text-[rgb(var(--text-muted))] text-sm">
                Report issues in the barangay. We handle every complaint with confidentiality.
              </p>
            </div>
            <Link href="/login" className="bp-btn-secondary !py-2 !px-4 text-sm">
              File a complaint →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {COMPLAINT_CATEGORIES.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl p-4 border border-[rgb(var(--border))] bg-[rgb(var(--surface))] hover:bg-[rgb(var(--surface-2))] transition flex items-center gap-3"
              >
                <span className="h-8 w-8 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
                  <ComplaintIcon id={c.id} />
                </span>
                <span className="text-sm font-medium">{c.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-5xl mx-auto px-4 mt-4 mb-24">
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
                title: "Request or report",
                desc: "Pick a document to request, or file a complaint — both tracked in your dashboard.",
              },
              {
                step: "3",
                title: "Track & claim",
                desc: "Get real-time status updates as the barangay processes your request or resolves your complaint.",
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

/* ------------------------------------------------------------------ */
/* Service card                                                         */
/* ------------------------------------------------------------------ */

const COLOR_MAP = {
  blue:    { bg: "bg-blue-100 dark:bg-blue-900/30",    icon: "text-blue-600 dark:text-blue-400"    },
  rose:    { bg: "bg-rose-100 dark:bg-rose-900/30",    icon: "text-rose-600 dark:text-rose-400"    },
  emerald: { bg: "bg-emerald-100 dark:bg-emerald-900/30", icon: "text-emerald-600 dark:text-emerald-400" },
};

function ServiceCard({ icon, title, description, badge, color }) {
  const { bg, icon: iconColor } = COLOR_MAP[color] || COLOR_MAP.blue;
  return (
    <div className="rounded-2xl p-6 border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
      <div className={`h-11 w-11 rounded-xl ${bg} ${iconColor} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <div className="font-semibold mb-1">{title}</div>
      <p className="text-sm text-[rgb(var(--text-muted))] leading-snug mb-3">{description}</p>
      <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${bg} ${iconColor}`}>
        {badge}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Complaint category icons                                             */
/* ------------------------------------------------------------------ */

function ComplaintIcon({ id }) {
  const cls = "text-rose-600 dark:text-rose-400";
  const props = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", className: cls };
  switch (id) {
    case "noise":
      return <svg {...props}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>;
    case "property":
      return <svg {...props}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>;
    case "sanitation":
      return <svg {...props}><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>;
    case "illegal_structure":
      return <svg {...props}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><line x1="12" y1="2" x2="12" y2="22" /></svg>;
    case "public_order":
      return <svg {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
    default:
      return <svg {...props}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;
  }
}
