# Staging API

The staging backend is deployed at `https://peptrace.stg.esteemed.engineering`.
It runs the platform API, client API, and a private PostgreSQL service on the API
server. The database is not published as a host port.

## Service URLs

| Service | Base URL | Health check |
| --- | --- | --- |
| Platform API | `https://peptrace.stg.esteemed.engineering/api` | `https://peptrace.stg.esteemed.engineering/api/health` |
| Client API | `https://peptrace.stg.esteemed.engineering/client-api` | `https://peptrace.stg.esteemed.engineering/client-api/health` |

Both route prefixes are retained by Traefik and passed unchanged to NestJS.
The two base URLs return route-group indexes. Detailed endpoints are documented
in [shared-endpoints.md](shared-endpoints.md),
[peptrace-endpoints.md](peptrace-endpoints.md),
[shamstay-endpoints.md](shamstay-endpoints.md), and
[shamrealestate-endpoints.md](shamrealestate-endpoints.md).

## Authentication

- Platform routes use a bearer token returned by `POST /api/auth/login`.
- Client routes use a bearer token returned by `POST /client-api/auth/login`.
- Public client routes under `/client-api/public/*` do not require a token.
- `POST /api/auth/register` is a reserved compatibility endpoint and returns
  `403`; client onboarding is handled through the platform client APIs.
- Staging passwords and encryption material are held only in the server `.env`
  file and must not be copied into the repository or documentation.

## Deployment

The API server uses [docker-compose.api.deploy.yml](../docker-compose.api.deploy.yml)
from `~/services/peptrace/stg`, with its secrets in a mode-`600` `.env` file.
The stack contains these services:

- `postgres` — PostgreSQL 16 with the persistent `stg_peptrace_postgres` volume.
- `db-init` — an on-demand Prisma schema and repeatable seed runner.
- `api` — the platform/superadmin API on container port `3000`.
- `client-api` — the tenant/client API on container port `3001`.

For an image tag such as `sha-abcdef0`, set `API_IMAGE`, `CLIENT_API_IMAGE`,
and `MIGRATION_IMAGE` in the server environment, then run:

```sh
docker compose -f docker-compose.api.deploy.yml pull postgres api client-api db-init
docker compose -f docker-compose.api.deploy.yml up -d postgres
docker compose -f docker-compose.api.deploy.yml --profile tools run --rm db-init
docker compose -f docker-compose.api.deploy.yml up -d api client-api
docker compose -f docker-compose.api.deploy.yml ps
```

`TRAEFIK_ROUTER_PREFIX` must be unique for every stack on a shared Traefik host.
Staging uses `peptrace-stg`; this prevents its API routers from colliding with
the preview deployment.

## Verification

An API deployment is ready only when all three long-running containers are
healthy and both public health requests return HTTP `200`:

```sh
curl --fail https://peptrace.stg.esteemed.engineering/api/health
curl --fail https://peptrace.stg.esteemed.engineering/client-api/health
```

The platform health response includes `dependencies.database: "ok"`. A release
check should also log in through both auth services and call each corresponding
`/auth/me` endpoint without printing tokens or passwords.
