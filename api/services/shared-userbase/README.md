# Shared Userbase Services

Shared userbase services follow the auth flow from the architecture diagram:

1. Frontend, mobile, or machine clients send a Peptrace API auth request.
2. Peptrace API makes a machine-to-machine request to the external EsteemedEngineering Userbase service.
3. Userbase returns the Peptrace Postgres connection string for the resolved tenant.
4. Peptrace loads local userbase context from the Peptrace database.
5. Peptrace returns a tenant-scoped JWT.

Folders:

- `auth/` for the incoming Peptrace auth boundary.
- `external-userbase/` for the external Userbase service client boundary.
- `database/` for Peptrace Postgres connection routing.
- `jwt/` for JWT issuing and response handling.
