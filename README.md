# Barangay Portal

A modern, multi-tenant-ready barangay services portal. Residents register, log in, and request documents online. Admins review and process requests. Built with **Next.js 14** (App Router), **Tailwind CSS**, and **Supabase** (Postgres + Auth + Row-Level Security).

## Features

- **Resident registration & login** with email confirmation.
- **Document requests** — Barangay Clearance, Certificate of Residency, Certificate of Indigency, Business Permit.
- **Resident dashboard** — stats, request history, live status tracking (Pending → Processing → Ready → Released).
- **Admin view** — overview dashboard, requests queue with approve/reject/ready/released flow, residents directory, and a barangay settings page for re-branding.
- **Multi-tenant** — every deployment serves one barangay (by `slug`), but the schema and UI support many.
- **Row-Level Security** enforced in Postgres so residents can only see their own data and admins can only see their own barangay.
- **Dark / light theme** that follows the system preference.

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

Go to [supabase.com](https://supabase.com) → **New project**. Once it's ready, grab the values from **Project settings → API**:

- Project URL
- `anon` public API key

### 3. Configure environment

```bash
cp .env.example .env.local
```

Then edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
NEXT_PUBLIC_BARANGAY_SLUG=san-isidro
```

`NEXT_PUBLIC_BARANGAY_SLUG` tells this deployment which barangay row to use. Keep it as `san-isidro` for the seeded default, or change it after you add your own row.

### 4. Run the schema

Open **SQL Editor** in your Supabase dashboard, paste the contents of [`supabase/schema.sql`](./supabase/schema.sql), and run it. This creates:

- `barangays`, `residents`, `admins`, `document_requests` tables
- A signup trigger that auto-creates a resident profile when a new user registers
- Row-Level Security policies so residents only see their own data and admins only see their own barangay
- A seed row for `slug = 'san-isidro'`

The script is idempotent — safe to re-run.

### 5. Create an admin account

Residents can sign themselves up from `/register`. Admins are provisioned manually:

1. In the Supabase dashboard, go to **Authentication → Users → Add user**. Enter an email + password and tick **Auto confirm user**.
2. Open **SQL Editor**, paste [`supabase/create-admin.sql`](./supabase/create-admin.sql), replace the placeholder email, and run it. This inserts a row into `public.admins` linking the auth user to your barangay.

### 6. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- Residents: register at `/register`, then sign in at `/login`.
- Admins: sign in at `/admin/login`.

## Architecture

```
app/
  page.js                        landing
  register/                      resident registration
  login/                         resident login
  (resident)/dashboard/          resident dashboard
  (resident)/dashboard/request/  new document request
  admin/login/                   admin sign in
  admin/dashboard/               overview + requests queue
  admin/residents/               residents directory
  admin/settings/                branding settings
components/
  Header.jsx, AdminSidebar.jsx
  ThemeProvider.jsx, ThemeToggle.jsx, Toast.jsx
  Logo.jsx, StatusBadge.jsx
lib/
  supabase.js                    Supabase browser client (singleton)
  barangay-config.js             tenant config loader
  storage.js                     async data layer (residents, requests, auth)
supabase/
  schema.sql                     full schema + RLS + triggers + seed
  create-admin.sql               grant an auth user admin rights
```

### Multi-tenant design

Every deployment points at one barangay via `NEXT_PUBLIC_BARANGAY_SLUG`. The `barangays` table holds the branding (name, municipality, tagline, officials, logo initials, contact info) which `getBarangayConfig()` reads on the client and admins edit at `/admin/settings`.

To add more barangays, insert additional rows into `public.barangays` and deploy a second instance with a different `NEXT_PUBLIC_BARANGAY_SLUG`. The same Supabase project can serve any number of barangays — RLS makes sure they can't see each other's data.

### Data layer

`lib/storage.js` exposes a clean async API (`createResident`, `loginResident`, `getRequests`, `createRequest`, `updateRequestStatus`, …). Every function calls Supabase directly from the browser using the `anon` key, and RLS enforces who can read/write what. No component talks to Supabase directly.

### Auth flow

- **Residents** sign up via `supabase.auth.signUp()`. Profile fields are attached as `user_metadata`. The `handle_new_user()` trigger sees `barangay_slug` in the metadata and inserts a matching row into `public.residents`.
- **Admins** sign in with the same `signInWithPassword`. The login handler then checks that a row exists in `public.admins` for the current user — if not, it signs them back out.

With email confirmation on (default), residents must click the link in the confirmation email before `/login` will let them in. To disable this during development, turn off email confirmation in **Authentication → Providers → Email**.

## Production checklist

- [ ] Disable anonymous sign-ups you don't want (Authentication → Providers).
- [ ] Configure the Site URL and Redirect URLs in **Authentication → URL Configuration** to your deployed domain.
- [ ] Review RLS policies in `supabase/schema.sql` before adding new tables.
- [ ] Set up email templates in **Authentication → Email Templates** for brand-consistent confirmation / reset mails.
- [ ] Rotate the anon key if it was ever committed to a public repo.

## Roadmap

- Printable document PDFs with QR verification.
- SMS / email notifications when a request is ready for pickup.
- OR-number / receipt tracking for paid documents.
- Household grouping and family member management.
- Analytics dashboard (trends over time, per-document volume).
- Multi-admin roles (Captain, Secretary, Clerk) with granular permissions.

## Styling

Tailwind with a small design-token layer in `app/globals.css` (`--bg`, `--surface`, `--text`, `--border`, …) so theming stays clean between light and dark modes. Palette: minimalist black / white with neutral surfaces.
