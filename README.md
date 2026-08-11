# Peptrace

Peptrace is organized as a TypeScript monorepo for the admin panel and shared
API contracts.

## Workspaces

- `apps/admin` - React and Vite admin panel for vendor, peptide, lab testing,
  account, and billing operations.
- `apps/api` - NestJS API for auth, tenant, vendor, peptide, lab testing,
  account, authorization, and billing routes.
- `packages/domain` - Shared Peptrace models, typed sample records, route
  surfaces, and dashboard selectors.
- `packages/api-client` - Browser-compatible client for the Peptrace API routes.

## Scripts

```sh
npm install
npm run dev:admin
npm run dev:api
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
- `admin` on `http://localhost:5173`

The API route index is served at `http://localhost:3000/api`.

## Admin Login

The admin login is backed by the `AdminUser` table in Postgres. Local seed data
creates this development account:

- Email: `admin@peptrace.com`
- Password: `Admin@123`

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` before running `npm run db:seed` to
create a different seeded admin account.

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
