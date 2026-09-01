# Peptrace

Peptrace is organized as a TypeScript monorepo for the admin panel and shared
API contracts.

## Workspaces

- `frontend/` — React + TypeScript + Vite web app, wrapped with [Capacitor](https://capacitorjs.com/)
  for iOS and Android. The native projects live in `frontend/ios/` and `frontend/android/`.
- `admin/` - React and Vite admin panel that can log into the
  EsteemedEngineering superadmin API or the client white-label API.
- `api/` - API workspace root. Service bundles are grouped in `api/services/`
  by admin panel, projects, and shared userbase ownership.
- `api/services/admin-panel/platform-api` - NestJS superadmin API for EsteemedEngineering platform auth,
  all-client visibility, client companies, and cross-tenant account operations.
- `api/services/projects/client-api` - NestJS client API for tenant admin auth and white-label
  client panel data for Peptrace, Shamstay BnB, and Sham Real Estate Hub.
- `packages/domain` - Shared Peptrace models, typed sample records, route
  surfaces, and dashboard selectors.
- `packages/api-client` - Browser-compatible client for the Peptrace API routes.

## Scripts

```sh
npm install
npm run dev:admin
npm run dev:api
npm run dev:client-api
npm run build
npm run typecheck
```

## Local Docker

```sh
cp .env.example .env
npm run docker:up
```

Docker Compose starts:

- `postgres` on `localhost:5432`
- `api` on `http://localhost:3000/api`
- `client-api` on `http://localhost:3001/client-api`
- `admin` on `http://localhost:5173`

The superadmin API route index is served at `http://localhost:3000/api`.
The client API route index is served at `http://localhost:3001/client-api`.

## Deployment Stack

`docker-compose.deploy.yml` deploys the production public frontend, admin
panel, platform API, and client API. Configure `PEPTRACE_DOMAIN` for the public
site and `ADMIN_DOMAIN` for the admin panel. The platform API is routed at
`https://$PEPTRACE_DOMAIN/api/*`, and the client API is routed at
`https://$PEPTRACE_DOMAIN/client-api/*`.

Production API containers require `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`,
`SECRET_ENCRYPTION_KEY`, and `DATABASE_CONNECTION_ENCRYPTION_KEY` in the server
environment. The Nest services keep their `/api` and `/client-api` prefixes, so
the reverse proxy must forward those prefixes unchanged.

The live staging API server uses the backend-only
[`docker-compose.api.deploy.yml`](docker-compose.api.deploy.yml) stack instead.
It runs PostgreSQL, the platform API, the client API, and an on-demand `db-init`
service. Its public endpoints are:

- `https://peptrace.stg.esteemed.engineering/api`
- `https://peptrace.stg.esteemed.engineering/client-api`

The `db-init-prod` Docker target is published as
`ghcr.io/peptrace/peptrace-db-init`. Run it through the `tools` Compose profile
before starting updated API images so the schema and repeatable seed data match
the release. See [docs/staging-api.md](docs/staging-api.md) for the exact server
layout, deployment commands, and verification checks.

## Shared Admin Login

The admin app now uses one shared login and one shared frontend. The legacy
client URLs remain as compatibility aliases during migration, but tenant access
is resolved from the authenticated user's active `TenantMembership` records:

- Shared admin: `http://localhost:5173/`
- Compatibility alias: `http://localhost:5173/peptrace`
- Compatibility alias: `http://localhost:5173/shamstay-bnb`
- Compatibility alias: `http://localhost:5173/sham-real-estate-hub`

Client users can switch between workspaces they belong to from the account
menu. Shared auth, user, and tenant endpoints are listed in
[docs/shared-endpoints.md](docs/shared-endpoints.md).

## Admin Logins

The admin login is backed by global `AdminUser` records and tenant-scoped
`TenantMembership` rows in Postgres. Local seed data creates a platform
superadmin plus white-label client accounts:

- EsteemedEngineering superadmin: `admin@esteemedengineering.com` / `Admin@123`
- Peptrace owner: `owner@peptrace.com` / `Admin@123`
- Peptrace admin: `ops@peptrace.com` / `Admin@123`
- Shamstay BnB owner: `owner@shamstaybnb.com` / `Admin@123`
- Shamstay BnB manager: `reservations@shamstaybnb.com` / `Admin@123`
- Sham Real Estate Hub owner: `owner@shamrealestatehub.com` / `Admin@123`
- Sham Real Estate Hub manager: `agents@shamrealestatehub.com` / `Admin@123`

Set `SUPERADMIN_EMAIL` and `ADMIN_PASSWORD` before running `npm run db:seed` to
change the seeded platform account.

For an existing database that already has the base Peptrace tables, apply the
multi-tenant membership backfill before starting the updated APIs:

```sh
npm run db:migrate:multitenancy
npm run db:migrate:services
npm run db:migrate:client-domains
npm run db:migrate:marketplace-features
npm run db:migrate:shamstay-billing
npm run db:seed
```

These migrations create the tenant membership tables, backend service catalog,
project-domain tables, and Shamstay billing tables. Authenticated admin routes
expect those tables to exist.
For a fresh local/demo database, `npm run db:setup` still creates the current
schema with `db:push` and then seeds repeatable demo data.

## Client User Management

Every white-label client uses the same tenant-scoped user API. Send the client
JWT as a bearer token to these `client-api` routes:

- `GET /client-api/users` - list company users with search, role, status, and pagination filters
- `GET /client-api/users/:id` - read one company user
- `POST /client-api/users` - create a company user
- `PATCH /client-api/users/:id` - update profile, role, or active state
- `POST /client-api/users/:id/password` - set a new password
- `DELETE /client-api/users/:id` - deactivate a user without deleting their history

Owners and admins can manage users. Only owners can manage or assign the owner
role. Users cannot deactivate themselves, and each company must retain an
active owner. All reads and writes are restricted to the signed-in user's
company; password hashes are never returned.

## Client Secret Locker

The client API includes a tenant-isolated Secret Locker with encrypted,
immutable versions and audit history. Configure a unique 32-byte base64 master
key before deployment:

```sh
openssl rand -base64 32
SECRET_ENCRYPTION_KEY="paste-generated-value-here"
SECRET_ENCRYPTION_KEY_ID="production-v1"
SECRET_ENCRYPTION_PREVIOUS_KEYS='{}'
```

Production startup fails when the encryption key is missing. Development can
derive a local-only key from `JWT_SECRET`, but that fallback must not be used for
deployed data.

To rotate keys, move the old key into `SECRET_ENCRYPTION_PREVIOUS_KEYS` under
its existing key ID, then configure a new active key and
`SECRET_ENCRYPTION_KEY_ID`. Existing versions continue using their recorded key
ID while newly added versions use the active key.

- `GET|POST /client-api/secrets` - list metadata or create a secret container
- `GET|PATCH /client-api/secrets/:secret` - read or update metadata
- `GET|POST /client-api/secrets/:secret/versions` - list or add immutable versions
- `GET /client-api/secrets/:secret/versions/:version/access` - decrypt an enabled version
- `PATCH /client-api/secrets/:secret/versions/:version` - enable or disable a version
- `DELETE /client-api/secrets/:secret/versions/:version` - permanently destroy its payload
- `GET /client-api/secrets/:secret/grants` - list per-secret access
- `PUT|DELETE /client-api/secrets/:secret/grants/:userId` - grant or revoke access
- `GET /client-api/secrets/audit` - review administrative and payload-access events

Company owners and admins have implicit locker administration. Other active
company users can receive a per-secret `viewer`, `accessor`, or `manager` grant.
Metadata responses never contain encrypted or plaintext values, payload access
uses no-store response headers, and superadmin sessions cannot call client
Secret Locker endpoints.

EsteemedEngineering superadmins can provision a new client secret and its
initial encrypted version from the platform Secret Locker. This uses
`POST /api/system/secrets` with an explicit client tenant. The platform API
returns metadata only; secret values remain accessible through authorized
client-api accounts and are recorded in the tenant audit history.

## Supabase Database

Use the Supabase Dashboard `Connect` button to copy a Postgres connection string
into `DATABASE_URL`. For a long-running NestJS backend, use the direct
connection when your network supports it, or Supavisor session mode if you need
IPv4 compatibility.

```sh
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require" npm run db:setup
```

Do not commit the real Supabase password. Keep it in `.env`, your deployment
secret store, or Docker/hosting environment variables.

## Client Database Assignments

EsteemedEngineering superadmins can open **System Configuration** to assign a
shared platform database or an encrypted dedicated PostgreSQL, Supabase,
MySQL, or MongoDB connection to each client. Apply the control-plane migration
before using this screen and configure a production
`DATABASE_CONNECTION_ENCRYPTION_KEY`.

Provider fields, security controls, and the repository-adapter rollout are
summarized in [docs/shared-endpoints.md](docs/shared-endpoints.md).

The admin app reads shared types from `@peptrace/domain`, so backend services
can reuse the same contracts as they come online.

## Backend Service Endpoints

The backend now has a service catalog that separates shared services from
client-specific service assignments without requiring admin panel changes.

- Platform service definitions and tenant assignments: `/api/services` and
  `/api/clients/:tenantId/services`
- Client service discovery: `/client-api/services`
- Client operations read API: `/client-api/operations`,
  `/client-api/operations/records`, and `/client-api/operations/work-items`
- Peptrace quality read API: `/client-api/quality/vendors`,
  `/client-api/quality/peptides`, `/client-api/quality/labs`,
  `/client-api/quality/tests`, `/client-api/quality/batches`, and
  `/client-api/quality/certificates`
- Shamstay BnB project API: `/client-api/shamstay/properties`,
  `/client-api/shamstay/reservations`, `/client-api/shamstay/turnovers`,
  `/client-api/shamstay/maintenance`, and `/client-api/shamstay/payouts`
- Sham Real Estate Hub project API: `/client-api/real-estate/listings`,
  `/client-api/real-estate/leads`, `/client-api/real-estate/viewings`,
  `/client-api/real-estate/offers`, and `/client-api/real-estate/commissions`

Endpoint docs are split by ownership:

- [docs/shared-endpoints.md](docs/shared-endpoints.md)
- [docs/peptrace-endpoints.md](docs/peptrace-endpoints.md)
- [docs/shamstay-endpoints.md](docs/shamstay-endpoints.md)
- [docs/shamrealestate-endpoints.md](docs/shamrealestate-endpoints.md)
