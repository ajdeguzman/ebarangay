"use client";

import { useEffect, useRef, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { useToast } from "@/components/Toast";
import {
  fallbackBarangayConfig,
  getBarangayConfig,
  saveBarangayConfig,
  clearBarangayConfigCache,
} from "@/lib/barangay-config";
import { getSupabase } from "@/lib/supabase";

const ACCENT_PRESETS = [
  "#3b63f6", // indigo
  "#2563eb", // blue
  "#0ea5e9", // sky
  "#14b8a6", // teal
  "#10b981", // emerald
  "#f59e0b", // amber
  "#f97316", // orange
  "#f43f5e", // rose
  "#a855f7", // purple
  "#64748b", // slate
  "#111118", // near-black
];

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [cfg, setCfg] = useState(fallbackBarangayConfig);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    getBarangayConfig()
      .then((c) => {
        if (cancelled) return;
        setCfg(c);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const update = (path) => (e) => {
    const value = e.target.value;
    setCfg((c) => {
      const next = { ...c };
      if (path.includes(".")) {
        const [a, b] = path.split(".");
        next[a] = { ...next[a], [b]: value };
      } else {
        next[path] = value;
      }
      return next;
    });
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveBarangayConfig(cfg);
      toast("Barangay settings saved.", "success");
    } catch (err) {
      toast(err.message || "Could not save settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
    if (!allowed.includes(file.type)) {
      toast("Please upload a PNG, JPG, WebP, or SVG image.", "error");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast("Logo must be under 2 MB.", "error");
      return;
    }

    setLogoUploading(true);
    try {
      const supabase = getSupabase();
      const ext = file.name.split(".").pop();
      const path = `${cfg.slug}/logo.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("logos")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("logos")
        .getPublicUrl(path);

      // Bust the cache so Logo components re-fetch
      clearBarangayConfigCache();
      const updated = await saveBarangayConfig({ logoUrl: urlData.publicUrl });
      setCfg(updated);
      toast("Logo uploaded.", "success");
    } catch (err) {
      toast(err.message || "Upload failed.", "error");
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const handleLogoRemove = async () => {
    setLogoUploading(true);
    try {
      const supabase = getSupabase();
      // Best-effort delete from storage (may 404 if already gone)
      if (cfg.logoUrl) {
        const urlPath = new URL(cfg.logoUrl).pathname;
        const storagePath = urlPath.split("/object/public/logos/")[1];
        if (storagePath) {
          await supabase.storage.from("logos").remove([storagePath]);
        }
      }
      clearBarangayConfigCache();
      const updated = await saveBarangayConfig({ logoUrl: null });
      setCfg(updated);
      toast("Logo removed.", "success");
    } catch (err) {
      toast(err.message || "Could not remove logo.", "error");
    } finally {
      setLogoUploading(false);
    }
  };

  if (!loaded) {
    return (
      <AdminSidebar>
        <div className="h-6 w-40 bg-[rgb(var(--surface-2))] rounded animate-pulse" />
      </AdminSidebar>
    );
  }

  return (
    <AdminSidebar>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Barangay settings</h1>
        <p className="text-[rgb(var(--text-muted))] text-sm">
          Brand this portal for your barangay. These values appear across the
          resident-facing pages.
        </p>
      </div>

      <form onSubmit={save} className="space-y-6">
        {/* Logo upload — outside the main form so its button doesn't submit */}
        <div className="bp-card p-6 space-y-4">
          <h3 className="font-semibold">Barangay logo</h3>
          <p className="text-sm text-[rgb(var(--text-muted))]">
            Upload a logo image (PNG, JPG, WebP, or SVG, max 2 MB). When no
            logo is set the initials below are shown instead.
          </p>
          <div className="flex items-center gap-4">
            {/* Preview */}
            <div className="h-16 w-16 rounded-2xl overflow-hidden bg-[rgb(var(--text))] text-[rgb(var(--bg))] flex items-center justify-center font-semibold text-lg flex-shrink-0">
              {cfg.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cfg.logoUrl} alt="Logo preview" className="w-full h-full object-cover" />
              ) : (
                cfg.logoInitials || "BP"
              )}
            </div>

            <div className="flex flex-col gap-2">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <button
                type="button"
                disabled={logoUploading}
                onClick={() => logoInputRef.current?.click()}
                className="bp-btn-secondary text-sm"
              >
                {logoUploading ? "Uploading…" : cfg.logoUrl ? "Replace logo" : "Upload logo"}
              </button>
              {cfg.logoUrl && (
                <button
                  type="button"
                  disabled={logoUploading}
                  onClick={handleLogoRemove}
                  className="text-sm text-rose-500 hover:underline disabled:opacity-50"
                >
                  Remove logo
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bp-card p-6 space-y-4">
          <h3 className="font-semibold">Accent color</h3>
          <p className="text-sm text-[rgb(var(--text-muted))]">
            Used for buttons and interactive elements across the portal.
          </p>
          <div className="flex flex-wrap gap-2">
            {ACCENT_PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  setCfg((c) => ({ ...c, accentColor: color }));
                  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
                  if (m) {
                    document.documentElement.style.setProperty(
                      "--accent",
                      `${parseInt(m[1], 16)} ${parseInt(m[2], 16)} ${parseInt(m[3], 16)}`
                    );
                  }
                }}
                className="h-8 w-8 rounded-full border-2 transition"
                style={{
                  backgroundColor: color,
                  borderColor: cfg.accentColor === color ? color : "transparent",
                  outline: cfg.accentColor === color ? `3px solid ${color}` : "none",
                  outlineOffset: "2px",
                }}
                title={color}
              />
            ))}
            {/* Custom color */}
            <label className="h-8 w-8 rounded-full border-2 border-[rgb(var(--border))] overflow-hidden cursor-pointer flex items-center justify-center" title="Custom color">
              <input
                type="color"
                value={cfg.accentColor || "#3b63f6"}
                className="opacity-0 absolute w-px h-px"
                onChange={(e) => {
                  const color = e.target.value;
                  setCfg((c) => ({ ...c, accentColor: color }));
                  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
                  if (m) {
                    document.documentElement.style.setProperty(
                      "--accent",
                      `${parseInt(m[1], 16)} ${parseInt(m[2], 16)} ${parseInt(m[3], 16)}`
                    );
                  }
                }}
              />
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[rgb(var(--text-muted))]">
                <circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/>
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
              </svg>
            </label>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <div
              className="h-9 w-9 rounded-2xl flex-shrink-0"
              style={{ backgroundColor: cfg.accentColor || "#3b63f6" }}
            />
            <span className="text-sm font-mono text-[rgb(var(--text-muted))]">
              {cfg.accentColor || "#3b63f6"}
            </span>
            <span className="text-sm text-[rgb(var(--text-muted))]">— preview updates live</span>
          </div>
        </div>

        <div className="bp-card p-6 space-y-4">
          <h3 className="font-semibold">Identity</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Barangay name">
              <input className="bp-input" value={cfg.name || ""} onChange={update("name")} />
            </Field>
            <Field label="Short name">
              <input className="bp-input" value={cfg.shortName || ""} onChange={update("shortName")} />
            </Field>
            <Field label="Municipality">
              <input className="bp-input" value={cfg.municipality || ""} onChange={update("municipality")} />
            </Field>
            <Field label="Province">
              <input className="bp-input" value={cfg.province || ""} onChange={update("province")} />
            </Field>
            <Field label="Logo initials (2 letters, used when no logo is uploaded)">
              <input
                className="bp-input"
                maxLength={3}
                value={cfg.logoInitials || ""}
                onChange={update("logoInitials")}
              />
            </Field>
            <Field label="Tagline">
              <input className="bp-input" value={cfg.tagline || ""} onChange={update("tagline")} />
            </Field>
          </div>
        </div>

        <div className="bp-card p-6 space-y-4">
          <h3 className="font-semibold">Contact</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Address">
              <input className="bp-input" value={cfg.address || ""} onChange={update("address")} />
            </Field>
            <Field label="Phone">
              <input className="bp-input" value={cfg.contactPhone || ""} onChange={update("contactPhone")} />
            </Field>
            <Field label="Email">
              <input className="bp-input" type="email" value={cfg.contactEmail || ""} onChange={update("contactEmail")} />
            </Field>
          </div>
        </div>

        <div className="bp-card p-6 space-y-4">
          <h3 className="font-semibold">Officials</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Barangay Captain">
              <input className="bp-input" value={cfg.officials?.captain || ""} onChange={update("officials.captain")} />
            </Field>
            <Field label="Barangay Secretary">
              <input className="bp-input" value={cfg.officials?.secretary || ""} onChange={update("officials.secretary")} />
            </Field>
          </div>
        </div>

        <div className="flex justify-end">
          <button disabled={saving} className="bp-btn-primary">
            {saving ? "Saving…" : "Save settings"}
          </button>
        </div>
      </form>
    </AdminSidebar>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="bp-label">{label}</span>
      {children}
    </label>
  );
}
