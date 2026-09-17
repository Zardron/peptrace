# Peptrace — App Spec

<!--
  This file is read by the Esteemed AI Software Factory.
  The Planner agent uses it to plan changes across ./frontend and ./api;
  the Code Builder agent treats it as binding for backend behavior.
  Keep it current — fill in every section and update it as the app evolves.

  NOTE: this is a best-effort seed generated from the current codebase —
  review and correct it before relying on it.
-->

## Purpose & goals

Peptrace is a peptide vendor transparency platform (hybrid web / iOS / Android
via Capacitor). It tracks peptide products (e.g. Retatrutide), the vendors
selling them, and independent lab tests, and publishes per-product
leaderboards ranking vendors by price per mg and quality rating.

Goals:

- Give buyers a trustworthy ranking of vendors per peptide product.
- Let vendors submit their products for (free) testing.
- Monetize via memberships that unlock deeper data/features.

## Users & roles

- **Visitor** — browses leaderboards and vendor rankings; no account needed.
- **Member** — registered user (auth via Supabase Auth on the Peptrace
  project); access to membership features and account pages.
- **Vendor** — submits products for testing; may claim/manage a vendor profile.
- **Admin** — manages products, vendors, test results and memberships via the
  shared admin-portal.

## Data model

| Entity | Key fields | Relationships | Storage |
| ------ | ---------- | ------------- | ------- |
| Product (peptide) | name, description, testCount, lastUpdated | has many Tests; appears on Leaderboards | app DB |
| Vendor | name, pricePerMg, rating | sells many Products; ranked on Leaderboards | app DB |
| Test (lab result) | productId, vendorId, date, result/purity, lab | belongs to Product and Vendor | app DB |
| Leaderboard entry | productId, vendorId, rank, pricePerMg, rating | derived from Tests | app DB |
| Membership | userId, tier, status, renewsAt | belongs to User | app DB (user ref from Supabase Auth) |
| User (auth) | id, email | Supabase Auth identity; 1:1 with UserAccount | Supabase Auth (`auth.users`) |
| UserAccount | id (= auth user id), email, createdAt, lastSignInAt | owns one UserProfile | app DB (`user_accounts`) |
| UserProfile | accountId, fullName, organization, role, phone, bio, avatarUrl | belongs to UserAccount | app DB (`user_profiles`) |
| ShippingAddress | id, accountId, nickname, recipientName, organization, line1, line2, city, state, postalCode, country, isPrimary | belongs to UserAccount; many per user | app DB (`shipping_addresses`) |

## Shared services

| Service | Used for | Integration (endpoints, env vars, credentials) |
| ------- | -------- | ---------------------------------------------- |
| Supabase Auth (Peptrace project) | Sign-up/login (AuthModal, email OTP), account identity | frontend uses `@supabase/supabase-js` directly; api/ verifies access tokens and provisions `user_accounts`/`user_profiles` rows; env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (frontend), `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (api) |
| shared-services/admin-portal | Admin management of products, vendors, tests, memberships | admin-portal reverse-proxies to this app's api/; admin endpoints must be admin-role protected |

## API surface

| Route group | Purpose | Auth required |
| ----------- | ------- | ------------- |
| `GET /health` | Liveness check | no |
| `/auth` | Session verification; creates `user_accounts`/`user_profiles` on first login | Supabase token |
| `/products` | List/detail peptide products with test counts | no |
| `/leaderboards` | Per-product vendor rankings (rank, pricePerMg, rating) | no |
| `/vendors` | Vendor profiles; product testing submissions | submission: yes |
| `/membership` | Membership tiers, subscribe/manage | yes |
| `/account` | Current user's account pages data: profile read/save, shipping address CRUD + set-primary | yes |
| `/admin` | Product/vendor/test/membership management (admin-portal) | admin |

## Out of scope

- Payment processing internals (handled externally / via membership provider).
- Lab operations; test results are ingested, not produced, by the app.
