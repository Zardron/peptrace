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
- **Member** — registered user (auth via user-base); access to membership
  features and account pages.
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
| Membership | userId, tier, status, renewsAt | belongs to User | app DB (user ref from user-base) |
| User | id, email, roles | owns Membership, Account | shared-services/user-base |

## Shared services

| Service | Used for | Integration (endpoints, env vars, credentials) |
| ------- | -------- | ---------------------------------------------- |
| shared-services/user-base | Sign-up/login (AuthModal), account identity, credentials for other EsteemedEngineering apps | api/ delegates auth to user-base; env: `USER_BASE_URL`, service credential |
| shared-services/admin-portal | Admin management of products, vendors, tests, memberships | admin-portal reverse-proxies to this app's api/; admin endpoints must be admin-role protected |

## API surface

| Route group | Purpose | Auth required |
| ----------- | ------- | ------------- |
| `GET /health` | Liveness check | no |
| `/auth` | Login/signup/session via user-base | no |
| `/products` | List/detail peptide products with test counts | no |
| `/leaderboards` | Per-product vendor rankings (rank, pricePerMg, rating) | no |
| `/vendors` | Vendor profiles; product testing submissions | submission: yes |
| `/membership` | Membership tiers, subscribe/manage | yes |
| `/account` | Current user's account pages data | yes |
| `/admin` | Product/vendor/test/membership management (admin-portal) | admin |

## Out of scope

- Payment processing internals (handled externally / via membership provider).
- Lab operations; test results are ingested, not produced, by the app.
