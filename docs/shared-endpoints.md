# Shared Endpoints

Shared endpoints are reusable across all clients/projects.

Base paths:

- Platform API: `/api`
- Client API: `/client-api`

## Health

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api` | Platform API route index. |
| `GET` | `/api/health` | Platform API health check. |
| `GET` | `/client-api` | Client API route index. |
| `GET` | `/client-api/health` | Client API health check. |

## Auth

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Platform superadmin login. |
| `POST` | `/api/auth/register` | Register platform admin user for setup/onboarding. |
| `POST` | `/api/auth/refresh` | Refresh platform token. |
| `GET` | `/api/auth/me` | Current platform user. |
| `POST` | `/client-api/auth/login` | Client login. |
| `POST` | `/client-api/auth/refresh` | Refresh client token. |
| `POST` | `/client-api/auth/switch-tenant` | Switch active client workspace. |
| `GET` | `/client-api/auth/me` | Current client user and tenant memberships. |

## Clients

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/clients` | List client tenants. |
| `GET` | `/api/clients/:idOrSlug` | Get one client tenant. |
| `POST` | `/api/clients` | Create client tenant, settings, panel, owner, and membership. |

## Service Catalog

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/services` | List shared and project-specific backend services. |
| `GET` | `/api/services/:serviceKey` | Get one backend service definition. |
| `POST` | `/api/services` | Create backend service definition. |
| `PATCH` | `/api/services/:serviceKey` | Update backend service definition. |
| `GET` | `/api/clients/:tenantId/services` | List enabled/disabled services for one client. |
| `GET` | `/api/clients/:tenantId/services/:serviceKey` | Get one client service assignment. |
| `PUT` | `/api/clients/:tenantId/services/:serviceKey` | Enable, disable, pause, or configure service for one client. |
| `DELETE` | `/api/clients/:tenantId/services/:serviceKey` | Remove client override or project service assignment. |
| `GET` | `/client-api/services` | List enabled services for the signed-in client. |
| `GET` | `/client-api/services/catalog` | List the complete documented client API service catalog, including shared, Peptrace, Shamstay BnB, and Sham Real Estate Hub service templates. |
| `GET` | `/client-api/services/:serviceKey` | Get one enabled service for the signed-in client. |

## Database Connections

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/system/database-connections` | List client shared/dedicated database assignments. |
| `GET` | `/api/system/database-providers` | List supported providers. |
| `PUT` | `/api/system/database-connections/:tenantId` | Save encrypted dedicated database connection. |
| `POST` | `/api/system/database-connections/:tenantId/test` | Test saved database connection. |
| `DELETE` | `/api/system/database-connections/:tenantId` | Return client to shared platform database. |

## Platform Account And API Keys

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/account/profile` | Read platform admin account profile. |
| `GET` | `/api/api-surfaces` | List seeded API surface summaries. |
| `POST` | `/api/authorization/api-keys` | Create preview API key metadata. |

## Users

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/client-api/users` | List tenant users. |
| `GET` | `/client-api/users/:id` | Get one tenant user. |
| `POST` | `/client-api/users` | Create or attach tenant user. |
| `PATCH` | `/client-api/users/:id` | Update user profile, role, or status. |
| `POST` | `/client-api/users/:id/password` | Reset user password. |
| `DELETE` | `/client-api/users/:id` | Deactivate user in tenant. |

## Secrets

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/system/secrets` | Platform creates initial client secret. |
| `GET` | `/client-api/secrets` | List secret metadata. |
| `POST` | `/client-api/secrets` | Create secret container. |
| `GET` | `/client-api/secrets/audit` | List secret audit events. |
| `GET` | `/client-api/secrets/:secret` | Get secret metadata. |
| `PATCH` | `/client-api/secrets/:secret` | Update secret metadata. |
| `GET` | `/client-api/secrets/:secret/versions` | List secret versions. |
| `POST` | `/client-api/secrets/:secret/versions` | Add secret version. |
| `GET` | `/client-api/secrets/:secret/versions/:version/access` | Decrypt enabled version. |
| `PATCH` | `/client-api/secrets/:secret/versions/:version` | Enable or disable version. |
| `DELETE` | `/client-api/secrets/:secret/versions/:version` | Destroy version payload. |
| `GET` | `/client-api/secrets/:secret/grants` | List secret grants. |
| `PUT` | `/client-api/secrets/:secret/grants/:userId` | Grant secret access. |
| `DELETE` | `/client-api/secrets/:secret/grants/:userId` | Revoke secret access. |

## Generic Operations

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/client-api/operations` | Tenant operations summary. |
| `GET` | `/client-api/operations/records` | Tenant operation records. |
| `GET` | `/client-api/operations/work-items` | Tenant work items. |

## Admin Panel Context

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/admin-panel/context` | Platform admin panel context. |
| `GET` | `/client-api/admin-panel/context` | Client admin panel context. |
| `GET` | `/client-api/admin-panel/data` | Client admin panel data bundle. |
