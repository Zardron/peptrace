# Peptrace

Peptrace is organized as a TypeScript monorepo for the admin panel and shared
API contracts.

## Workspaces

- `apps/admin` - React and Vite admin panel that can log into the
  EsteemedEngineering superadmin API or the client white-label API.
- `apps/api` - NestJS superadmin API for EsteemedEngineering platform auth,
  all-client visibility, client companies, and cross-tenant account operations.
- `apps/client-api` - NestJS client API for tenant admin auth and white-label
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

## Dedicated Login Portals

Each company signs in through its own URL. The selected portal determines the
API service, branding, allowed tenant, and browser session namespace:

- EsteemedEngineering: `http://localhost:5173/`
- Peptrace: `http://localhost:5173/peptrace`
- Shamstay BnB: `http://localhost:5173/shamstay-bnb`
- Sham Real Estate Hub: `http://localhost:5173/sham-real-estate-hub`

The root portal accepts only EsteemedEngineering superadmins. Each client portal
accepts only accounts attached to that client in the database.

## Admin Logins

The admin login is backed by the `AdminUser` table in Postgres. Local seed data
creates a platform superadmin plus white-label client accounts:

- EsteemedEngineering superadmin: `admin@esteemedengineering.com` / `Admin@123`
- Peptrace owner: `owner@peptrace.com` / `Admin@123`
- Peptrace admin: `ops@peptrace.com` / `Admin@123`
- Shamstay BnB owner: `owner@shamstaybnb.com` / `Admin@123`
- Shamstay BnB manager: `reservations@shamstaybnb.com` / `Admin@123`
- Sham Real Estate Hub owner: `owner@shamrealestatehub.com` / `Admin@123`
- Sham Real Estate Hub manager: `agents@shamrealestatehub.com` / `Admin@123`

Set `SUPERADMIN_EMAIL` and `ADMIN_PASSWORD` before running `npm run db:seed` to
change the seeded platform account.

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

The admin app reads shared types from `@peptrace/domain`, so backend services
can reuse the same contracts as they come online.
