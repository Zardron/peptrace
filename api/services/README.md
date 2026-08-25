# API Services

Service bundles are grouped by ownership area:

- `admin-panel/` contains admin panel and platform-facing API services.
- `projects/` contains project-facing and product-specific API services.
- `shared-userbase/` contains shared user, auth, role, tenant-access, external Userbase, database routing, and JWT session boundaries.

Current service bundles:

- `admin-panel/platform-api/` contains the platform/admin API service.
- `projects/client-api/` contains the project/client API service.

Keep new source modules in `api/src/services/` using the same area names.
