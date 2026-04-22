"use client";

import { createClient } from "@supabase/supabase-js";

let _client;

/**
 * Lazily create a singleton Supabase browser client. We defer creation
 * so that if the env vars aren't set yet the rest of the app still
 * renders (useful during setup).
 */
export function getSupabase() {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      "Supabase env vars missing. Copy .env.example to .env.local and fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  _client = createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return _client;
}

/** The slug of the barangay this deployment serves. */
export function getBarangaySlug() {
  if (!process.env.NEXT_PUBLIC_BARANGAY_SLUG) {
    throw new Error("NEXT_PUBLIC_BARANGAY_SLUG is not set in .env.local");
  }
  return process.env.NEXT_PUBLIC_BARANGAY_SLUG;
}
