"use client";

import { useEffect, useState } from "react";
import { getBarangayConfig, fallbackBarangayConfig } from "@/lib/barangay-config";

export default function Logo({ size = "md", withName = true }) {
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

  const dim = size === "lg" ? "h-11 w-11" : size === "sm" ? "h-8 w-8" : "h-9 w-9";

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`${dim} rounded-2xl overflow-hidden bg-[rgb(var(--text))] text-[rgb(var(--bg))] flex items-center justify-center font-semibold flex-shrink-0`}
        aria-hidden
      >
        {cfg?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cfg.logoUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          cfg?.logoInitials || "BP"
        )}
      </div>
      {withName && (
        <div className="leading-tight">
          <div className="font-semibold text-[rgb(var(--text))]">
            {cfg?.name || "Barangay Portal"}
          </div>
          <div className="text-xs text-[rgb(var(--text-muted))]">
            Resident Services
          </div>
        </div>
      )}
    </div>
  );
}
