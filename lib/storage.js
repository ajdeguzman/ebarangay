"use client";

/**
 * Supabase-backed data layer.
 *
 * Every export is async. Components should `await` them inside useEffect
 * / event handlers. Row-Level Security in the database enforces the
 * tenant boundary — the queries here just describe intent.
 */

import { getSupabase, getBarangaySlug } from "./supabase";
import { getBarangayConfig } from "./barangay-config";

/* ------------------------------------------------------------------ */
/* Row ↔ app-object mappers                                            */
/* ------------------------------------------------------------------ */

function residentRow(r) {
  if (!r) return null;
  return {
    id: r.id,
    userId: r.user_id,
    barangayId: r.barangay_id,
    firstName: r.first_name,
    middleName: r.middle_name || "",
    lastName: r.last_name,
    birthdate: r.birthdate,
    sex: r.sex,
    civilStatus: r.civil_status,
    contact: r.contact,
    email: r.email,
    purok: r.purok,
    streetAddress: r.street_address,
    yearsOfResidency: r.years_of_residency,
    avatarUrl: r.avatar_url || null,
    createdAt: r.created_at,
  };
}

function requestRow(r) {
  if (!r) return null;
  return {
    id: r.id,
    barangayId: r.barangay_id,
    residentId: r.resident_id,
    residentName: r.resident_name,
    documentType: r.document_type,
    purpose: r.purpose,
    remarks: r.remarks || "",
    status: r.status,
    history: r.history || [],
    createdAt: r.created_at,
  };
}

/* ------------------------------------------------------------------ */
/* Residents                                                           */
/* ------------------------------------------------------------------ */

/**
 * Sign up a new resident. Profile fields are passed as user_metadata;
 * a database trigger inserts the row into `public.residents`.
 *
 * With email confirmation enabled, the user must confirm via email
 * before they can log in.
 */
export async function createResident(data) {
  const supabase = getSupabase();
  const { email, password, ...profile } = data;
  const { data: signup, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo:
        typeof window !== "undefined"
          ? `${window.location.origin}/login`
          : undefined,
      data: {
        barangay_slug: getBarangaySlug(),
        first_name: profile.firstName,
        middle_name: profile.middleName || null,
        last_name: profile.lastName,
        birthdate: profile.birthdate,
        sex: profile.sex,
        civil_status: profile.civilStatus,
        contact: profile.contact,
        purok: profile.purok,
        street_address: profile.streetAddress,
        years_of_residency: String(profile.yearsOfResidency ?? ""),
      },
    },
  });
  if (error) throw error;
  return signup;
}

export async function resetPassword(email) {
  const supabase = getSupabase();
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/reset-password`
      : undefined;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
  if (error) throw error;
}

export async function updatePassword(newPassword) {
  const supabase = getSupabase();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function loginResident(email, password) {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function logoutResident() {
  const supabase = getSupabase();
  await supabase.auth.signOut();
}

/**
 * Returns the currently-logged-in resident's profile row, or null if
 * not authenticated or not a resident (e.g. admin-only account).
 */
export async function getCurrentResident() {
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("residents")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  return residentRow(data);
}

/**
 * Upload a new avatar for the current resident. Returns the updated resident row.
 * Path pattern: avatars/<user_id>/avatar.<ext>
 */
export async function uploadResidentAvatar(file) {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const ext = file.name.split(".").pop();
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadErr) throw uploadErr;

  const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);

  const { data, error } = await supabase
    .from("residents")
    .update({ avatar_url: urlData.publicUrl })
    .eq("user_id", user.id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return residentRow(data);
}

/** Remove the current resident's avatar. Returns the updated resident row. */
export async function removeResidentAvatar(currentAvatarUrl) {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  if (currentAvatarUrl) {
    const urlPath = new URL(currentAvatarUrl).pathname;
    const storagePath = urlPath.split("/object/public/avatars/")[1];
    if (storagePath) {
      await supabase.storage.from("avatars").remove([storagePath]);
    }
  }

  const { data, error } = await supabase
    .from("residents")
    .update({ avatar_url: null })
    .eq("user_id", user.id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return residentRow(data);
}

/** Admin: list all residents of the current barangay. */
export async function getResidents() {
  const supabase = getSupabase();
  const cfg = await getBarangayConfig();
  const { data, error } = await supabase
    .from("residents")
    .select("*")
    .eq("barangay_id", cfg.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(residentRow);
}

export async function getResidentById(id) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("residents")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return residentRow(data);
}

/* ------------------------------------------------------------------ */
/* Admin session                                                       */
/* ------------------------------------------------------------------ */

/**
 * Log in an admin. Uses the same auth system; then verifies the user
 * is listed in `public.admins` for the current barangay. If not, they
 * are signed out and an error is thrown.
 */
export async function loginAdmin(email, password) {
  const supabase = getSupabase();
  const { data: signin, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;

  const { data: adminRow, error: adminErr } = await supabase
    .from("admins")
    .select("user_id, name, barangay_id")
    .eq("user_id", signin.user.id)
    .maybeSingle();
  if (adminErr) throw adminErr;
  if (!adminRow) {
    await supabase.auth.signOut();
    throw new Error("This account isn't an admin of this barangay.");
  }
  return { email: signin.user.email, name: adminRow.name };
}

/**
 * If the current session belongs to an admin of this barangay, return
 * their info. Otherwise return null.
 */
export async function getAdminSession() {
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("admins")
    .select("user_id, name, barangay_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) return null;
  if (!data) return null;
  return { email: user.email, name: data.name };
}

export async function logoutAdmin() {
  const supabase = getSupabase();
  await supabase.auth.signOut();
}

/* ------------------------------------------------------------------ */
/* Document requests                                                   */
/* ------------------------------------------------------------------ */

/** Admin: all requests for the current barangay, newest first. */
export async function getRequests() {
  const supabase = getSupabase();
  const cfg = await getBarangayConfig();
  const { data, error } = await supabase
    .from("document_requests")
    .select("*")
    .eq("barangay_id", cfg.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(requestRow);
}

/** Resident: their own request history. */
export async function getRequestsByResident(residentId) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("document_requests")
    .select("*")
    .eq("resident_id", residentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(requestRow);
}

export async function createRequest({
  residentId,
  residentName,
  documentType,
  purpose,
  remarks,
}) {
  const supabase = getSupabase();
  const cfg = await getBarangayConfig();
  const now = new Date().toISOString();
  const payload = {
    barangay_id: cfg.id,
    resident_id: residentId,
    resident_name: residentName,
    document_type: documentType,
    purpose,
    remarks: remarks || null,
    status: "pending",
    history: [
      { at: now, status: "pending", note: "Request submitted by resident." },
    ],
  };
  const { data, error } = await supabase
    .from("document_requests")
    .insert(payload)
    .select()
    .maybeSingle();
  if (error) throw error;
  return requestRow(data);
}

export async function updateRequestStatus(id, status, note = "") {
  const supabase = getSupabase();
  // fetch current history, append, write back
  const { data: cur, error: readErr } = await supabase
    .from("document_requests")
    .select("history")
    .eq("id", id)
    .maybeSingle();
  if (readErr) throw readErr;
  const history = [
    ...((cur && cur.history) || []),
    { at: new Date().toISOString(), status, note },
  ];
  const { data, error } = await supabase
    .from("document_requests")
    .update({ status, history })
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return requestRow(data);
}

/* ------------------------------------------------------------------ */
/* Complaints                                                          */
/* ------------------------------------------------------------------ */

function complaintRow(r) {
  if (!r) return null;
  return {
    id: r.id,
    barangayId: r.barangay_id,
    residentId: r.resident_id,
    residentName: r.resident_name,
    subject: r.subject,
    category: r.category,
    description: r.description,
    status: r.status,
    history: r.history || [],
    createdAt: r.created_at,
  };
}

export async function createComplaint({ residentId, residentName, subject, category, description }) {
  const supabase = getSupabase();
  const cfg = await getBarangayConfig();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("complaints")
    .insert({
      barangay_id: cfg.id,
      resident_id: residentId,
      resident_name: residentName,
      subject,
      category,
      description,
      status: "pending",
      history: [{ at: now, status: "pending", note: "Complaint filed by resident." }],
    })
    .select()
    .maybeSingle();
  if (error) throw error;
  return complaintRow(data);
}

export async function getComplaintsByResident(residentId) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("complaints")
    .select("*")
    .eq("resident_id", residentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(complaintRow);
}

export async function getComplaints() {
  const supabase = getSupabase();
  const cfg = await getBarangayConfig();
  const { data, error } = await supabase
    .from("complaints")
    .select("*")
    .eq("barangay_id", cfg.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(complaintRow);
}

export async function updateComplaintStatus(id, status, note = "") {
  const supabase = getSupabase();
  const { data: cur, error: readErr } = await supabase
    .from("complaints")
    .select("history")
    .eq("id", id)
    .maybeSingle();
  if (readErr) throw readErr;
  const history = [
    ...((cur && cur.history) || []),
    { at: new Date().toISOString(), status, note },
  ];
  const { data, error } = await supabase
    .from("complaints")
    .update({ status, history })
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return complaintRow(data);
}

/* ------------------------------------------------------------------ */
/* Auth state helper — subscribe to session changes                    */
/* ------------------------------------------------------------------ */

export function onAuthChange(cb) {
  const supabase = getSupabase();
  const { data } = supabase.auth.onAuthStateChange((_ev, session) =>
    cb(session)
  );
  return () => data.subscription.unsubscribe();
}
