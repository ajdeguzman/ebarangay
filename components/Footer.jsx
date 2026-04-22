"use client";

import { useEffect, useState } from "react";
import { getBarangayConfig } from "@/lib/barangay-config";

export default function Footer() {
  const [cfg, setCfg] = useState(null);
  useEffect(() => setCfg(getBarangayConfig()), []);
  if (!cfg) return null;
  return (
    <footer className="mt-20 border-t border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
      <div className="max-w-6xl mx-auto px-4 py-10 grid gap-6 md:grid-cols-3 text-sm text-[rgb(var(--text-muted))]">
        <div>
          <div className="font-semibold text-[rgb(var(--text))]">
            {cfg.name}
          </div>
          <div>{cfg.municipality}</div>
          <div>{cfg.province}</div>
        </div>
        <div>
          <div className="font-semibold text-[rgb(var(--text))] mb-1">
            Contact
          </div>
          <div>{cfg.address}</div>
          <div>{cfg.contactPhone}</div>
          <div>{cfg.contactEmail}</div>
        </div>
        <div>
          <div className="font-semibold text-[rgb(var(--text))] mb-1">
            Office Hours
          </div>
          <div>Mon – Fri · 8:00 AM – 5:00 PM</div>
          <div>Sat · 8:00 AM – 12:00 NN</div>
        </div>
      </div>
      <div className="text-center text-xs text-[rgb(var(--text-muted))] pb-6">
        © {new Date().getFullYear()} {cfg.name}. Powered by Barangay Portal.
      </div>
    </footer>
  );
}
