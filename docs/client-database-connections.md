# Client database connections

## Recommendation

Use PostgreSQL as the platform default. The application data is relational: client companies, users, roles, grants, audit events, billing values, and operational records benefit from foreign keys and transactions. Supabase is supported as a managed PostgreSQL deployment rather than as a separate database engine.

MySQL and MongoDB are valid dedicated client options, but they require provider-specific repository adapters and migrations. Prisma allows one datasource provider per schema, so the existing PostgreSQL Prisma client cannot transparently query MySQL or MongoDB by changing only the URL.

## Control-plane behavior

- No dedicated connection row means the client uses the shared platform PostgreSQL database.
- One `ClientDatabaseConnection` row assigns a dedicated provider to one client.
- Passwords are encrypted with AES-256-GCM and tenant-bound additional authenticated data.
- API responses return `hasPassword` and a masked preview, never the password, encryption payload, or usable URI.
- A superadmin can test the saved connection with a five-second timeout and a provider-specific health query.
- Saving a profile marks it `NOT_TESTED`; a successful live test marks it `CONNECTED`.
- Returning to shared mode deletes connection metadata, not the external database.

## Required fields

| Provider | Required | Optional | Default port |
| --- | --- | --- | --- |
| PostgreSQL | Host, port, database, username, password, TLS mode | Schema | 5432 |
| Supabase Postgres | Host, port, database, username, password, TLS mode, connection mode | Schema | 5432 |
| MySQL | Host, port, database, username, password, TLS mode | None | 3306 |
| MongoDB | Host, port, database, TLS mode | Username, password, authentication database, replica set, DNS SRV | 27017 |

Supabase connection mode should match the runtime:

- `DIRECT`: persistent backend with IPv6 connectivity.
- `SESSION_POOLER`: persistent backend requiring an IPv4-compatible pooler.
- `TRANSACTION_POOLER`: serverless or short-lived connections. Transaction pooling does not support every session feature.

MongoDB Atlas should normally use DNS SRV. `authSource` defaults to `admin`. Credentials are passed to the Node driver as structured options instead of being concatenated into the stored URI.

## Security and operations

- Generate a unique 32-byte base64 `DATABASE_CONNECTION_ENCRYPTION_KEY` for every environment.
- Keep previous keys in `DATABASE_CONNECTION_ENCRYPTION_PREVIOUS_KEYS` during key rotation.
- Use `VERIFY_FULL` TLS in production. `REQUIRE` encrypts traffic but intentionally skips certificate verification.
- Give each client database user only the permissions needed by its repository adapter.
- Restrict database firewalls to application egress addresses.
- Connection tests reject cloud metadata and link-local destinations.
- Apply the included Prisma migration to the central control database before opening System Configuration.
- Provider profile activation and application data cutover should be separate audited operations. Run schema validation and data migration before routing a production client to a dedicated database.

## Adapter rollout

1. Keep shared clients on the existing Prisma PostgreSQL repositories.
2. Add a tenant connection resolver that reads the active assignment from the control plane.
3. Implement and test one repository adapter per provider and domain module.
4. Provision the target schema and least-privilege database user.
5. Migrate and reconcile client data.
6. Run the connection test, adapter contract tests, and a tenant isolation test.
7. Activate routing for that client with a rollback window.

## Primary references

- NestJS database techniques: https://docs.nestjs.com/techniques/database
- NestJS MongoDB techniques: https://docs.nestjs.com/techniques/mongodb
- Prisma datasource rules: https://docs.prisma.io/docs/orm/prisma-schema/overview/data-sources
- Prisma supported databases: https://docs.prisma.io/docs/orm/reference/supported-databases
- Supabase Postgres connections: https://supabase.com/docs/guides/database/connecting-to-postgres
- node-postgres connection configuration: https://node-postgres.com/features/connecting
- MySQL2 connection configuration: https://sidorares.github.io/node-mysql2/docs/examples/connections/create-connection
- MongoDB Node driver connection targets: https://www.mongodb.com/docs/drivers/node/current/connect/connection-targets/
- OWASP secrets management: https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
