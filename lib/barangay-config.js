"use client";

import { getSupabase, getBarangaySlug } from "./supabase";

/**
 * Static catalog of document types offered. To add/remove documents,
 * edit here — this is app-wide, not per-tenant (for now).
 */
export const DOCUMENT_TYPES = [
  {
    id: "clearance",
    name: "Barangay Clearance",
    description:
      "General purpose clearance for employment, school, or personal use.",
    fee: 50,
  },
  {
    id: "residency",
    name: "Certificate of Residency",
    description:
      "Proof that you are a bona fide resident of the barangay.",
    fee: 50,
  },
  {
    id: "indigency",
    name: "Certificate of Indigency",
    description:
      "For residents applying for government assistance, scholarships, or medical aid.",
    fee: 0,
  },
  {
    id: "business",
    name: "Business Permit (Barangay)",
    description:
      "Barangay clearance required before applying for a mayor's business permit.",
    fee: 200,
  },
];

export const REQUEST_STATUSES = {
  pending:    { label: "Pending",           tone: "amber"   },
  processing: { label: "Processing",        tone: "blue"    },
  ready:      { label: "Ready for Pickup",  tone: "emerald" },
  released:   { label: "Released",          tone: "slate"   },
  rejected:   { label: "Rejected",          tone: "rose"    },
};

/** Fallback used while the real config is loading. */
export const fallbackBarangayConfig = {
  id: null,
  slug: getBarangaySlug(),
  name: "Barangay Portal",
  shortName: "Portal",
  municipality: "",
  province: "",
  tagline: "A modern portal for your barangay.",
  address: "",
  contactEmail: "",
  contactPhone: "",
  officials: { captain: "", secretary: "" },
  logoInitials: "BP",
  logoUrl: null,
  accentColor: "#3b63f6",
};

function rowToConfig(b) {
  if (!b) return null;
  return {
    id: b.id,
    slug: b.slug,
    name: b.name,
    shortName: b.short_name,
    municipality: b.municipality,
    province: b.province,
    tagline: b.tagline,
    address: b.address,
    contactEmail: b.contact_email,
    contactPhone: b.contact_phone,
    officials: {
      captain: b.captain || "",
      secretary: b.secretary || "",
    },
    logoInitials: b.logo_initials,
    logoUrl: b.logo_url || null,
    accentColor: b.accent_color || "#3b63f6",
  };
}

let _cache = null;

/** Fetch the active barangay config by slug (cached per session). */
export async function getBarangayConfig() {
  if (_cache) return _cache;
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("barangays")
    .select("*")
    .eq("slug", getBarangaySlug())
    .maybeSingle();
  if (error) throw error;
  _cache = rowToConfig(data) || { ...fallbackBarangayConfig };
  return _cache;
}

/** Update the active barangay config. Only admins can do this (RLS). */
export async function saveBarangayConfig(partial) {
  const supabase = getSupabase();
  const current = await getBarangayConfig();
  const payload = {
    name:          partial.name          ?? current.name,
    short_name:    partial.shortName     ?? current.shortName,
    municipality:  partial.municipality  ?? current.municipality,
    province:      partial.province      ?? current.province,
    tagline:       partial.tagline       ?? current.tagline,
    address:       partial.address       ?? current.address,
    contact_email: partial.contactEmail  ?? current.contactEmail,
    contact_phone: partial.contactPhone  ?? current.contactPhone,
    captain:       partial.officials?.captain   ?? current.officials.captain,
    secretary:     partial.officials?.secretary ?? current.officials.secretary,
    logo_initials: partial.logoInitials  ?? current.logoInitials,
    logo_url:      partial.logoUrl       ?? current.logoUrl,
    accent_color:  partial.accentColor   ?? current.accentColor,
  };
  const { data, error } = await supabase
    .from("barangays")
    .update(payload)
    .eq("id", current.id)
    .select()
    .maybeSingle();
  if (error) throw error;
  _cache = rowToConfig(data);
  return _cache;
}

export function clearBarangayConfigCache() {
  _cache = null;
}
