"use client";

import { useEffect } from "react";
import { getBarangayConfig } from "@/lib/barangay-config";

function hexToRgbTriplet(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m
    ? `${parseInt(m[1], 16)} ${parseInt(m[2], 16)} ${parseInt(m[3], 16)}`
    : null;
}

export default function AccentProvider() {
  useEffect(() => {
    getBarangayConfig()
      .then((cfg) => {
        const triplet = hexToRgbTriplet(cfg.accentColor);
        if (triplet) {
          document.documentElement.style.setProperty("--accent", triplet);
        }
      })
      .catch(() => {});
  }, []);

  return null;
}
