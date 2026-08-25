"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DOCUMENTED_SERVICE_CATALOG = void 0;
exports.getDocumentedServiceSpec = getDocumentedServiceSpec;
exports.isDocumentedServiceAvailableToTenant = isDocumentedServiceAvailableToTenant;
exports.listDocumentedServiceSpecsForTenant = listDocumentedServiceSpecsForTenant;
exports.toFlatEndpoints = toFlatEndpoints;
exports.DOCUMENTED_SERVICE_CATALOG = [
    {
        key: "client-api-health",
        name: "Client API health",
        scope: "SHARED",
        category: "Platform",
        description: "Shared client API route index and health check endpoints.",
        owner: "Client API",
        basePath: "/client-api",
        docsPath: "docs/shared-endpoints.md#health",
        defaultEnabled: true,
        requiredRoles: [],
        tags: ["shared", "health", "status"],
        endpointGroups: [
            {
                key: "client-api-health",
                name: "Client API Health",
                audience: "shared",
                endpoints: [
                    { method: "GET", path: "/client-api", summary: "Client API route index.", auth: "none" },
                    { method: "GET", path: "/client-api/health", summary: "Client API health check.", auth: "none" }
                ]
            }
        ]
    },
    {
        key: "platform-health",
        name: "Platform API health",
        scope: "SHARED",
        category: "Platform",
        description: "Platform API route index and health check endpoints.",
        owner: "Platform",
        basePath: "/api",
        docsPath: "docs/shared-endpoints.md#health",
        defaultEnabled: false,
        requiredRoles: [],
        tags: ["shared", "platform", "health"],
        includeInTenantServices: false,
        endpointGroups: [
            {
                key: "platform-health",
                name: "Platform Health",
                audience: "shared",
                endpoints: [
                    { method: "GET", path: "/api", summary: "Platform API route index.", auth: "none" },
                    { method: "GET", path: "/api/health", summary: "Platform API health check.", auth: "none" }
                ]
            }
        ]
    },
    {
        key: "platform-auth",
        name: "Platform authentication",
        scope: "SHARED",
        category: "Identity",
        description: "Platform superadmin authentication endpoints.",
        owner: "Auth",
        basePath: "/api/auth",
        docsPath: "docs/shared-endpoints.md#auth",
        defaultEnabled: false,
        requiredRoles: ["superadmin", "platform_admin"],
        tags: ["shared", "platform", "identity"],
        includeInTenantServices: false,
        endpointGroups: [
            {
                key: "platform-auth",
                name: "Platform Auth",
                audience: "admin",
                endpoints: [
                    { method: "POST", path: "/api/auth/login", summary: "Create platform superadmin session.", auth: "none" },
                    { method: "POST", path: "/api/auth/register", summary: "Register platform admin user.", auth: "none" },
                    { method: "POST", path: "/api/auth/refresh", summary: "Refresh platform token.", auth: "platform-jwt" },
                    { method: "GET", path: "/api/auth/me", summary: "Read current platform user.", auth: "platform-jwt" }
                ]
            }
        ]
    },
    {
        key: "auth-session",
        name: "Authentication and tenant switching",
        scope: "SHARED",
        category: "Identity",
        description: "Shared client login, refresh, current account, and tenant switching endpoints.",
        owner: "Auth",
        basePath: "/client-api/auth",
        docsPath: "docs/shared-endpoints.md#auth",
        defaultEnabled: true,
        requiredRoles: [],
        tags: ["shared", "identity", "jwt"],
        endpointGroups: [
            {
                key: "client-auth",
                name: "Client Auth",
                audience: "shared",
                endpoints: [
                    { method: "POST", path: "/client-api/auth/login", summary: "Create a client tenant session.", auth: "none" },
                    { method: "POST", path: "/client-api/auth/refresh", summary: "Refresh the current client session.", auth: "client-jwt" },
                    {
                        method: "POST",
                        path: "/client-api/auth/switch-tenant",
                        summary: "Switch the active client workspace.",
                        auth: "client-jwt"
                    },
                    { method: "GET", path: "/client-api/auth/me", summary: "Read the current client user.", auth: "client-jwt" }
                ]
            }
        ]
    },
    {
        key: "userbase",
        name: "Userbase",
        scope: "SHARED",
        category: "Identity",
        description: "Tenant-scoped user management shared by every client workspace.",
        owner: "Auth",
        basePath: "/client-api/users",
        docsPath: "docs/shared-endpoints.md#users",
        defaultEnabled: true,
        requiredRoles: ["owner", "admin"],
        tags: ["shared", "users", "tenant-memberships"],
        endpointGroups: [
            {
                key: "users",
                name: "Users",
                audience: "admin",
                endpoints: [
                    { method: "GET", path: "/client-api/users", summary: "List tenant users.", auth: "client-jwt" },
                    { method: "GET", path: "/client-api/users/:id", summary: "Read one tenant user.", auth: "client-jwt" },
                    {
                        method: "POST",
                        path: "/client-api/users",
                        summary: "Create or attach a tenant user.",
                        auth: "client-jwt",
                        roles: ["owner", "admin"]
                    },
                    {
                        method: "PATCH",
                        path: "/client-api/users/:id",
                        summary: "Update a tenant user's profile, role, or status.",
                        auth: "client-jwt",
                        roles: ["owner", "admin"]
                    },
                    {
                        method: "POST",
                        path: "/client-api/users/:id/password",
                        summary: "Reset a tenant user password.",
                        auth: "client-jwt",
                        roles: ["owner", "admin"]
                    },
                    {
                        method: "DELETE",
                        path: "/client-api/users/:id",
                        summary: "Deactivate a tenant user.",
                        auth: "client-jwt",
                        roles: ["owner", "admin"]
                    }
                ]
            }
        ]
    },
    {
        key: "tenant-operations",
        name: "Tenant operations",
        scope: "SHARED",
        category: "Operations",
        description: "Reusable tenant operations summary, records, and work queue endpoints.",
        owner: "Client API",
        basePath: "/client-api/operations",
        docsPath: "docs/shared-endpoints.md#generic-operations",
        defaultEnabled: true,
        requiredRoles: [],
        tags: ["shared", "operations", "white-label"],
        endpointGroups: [
            {
                key: "generic-operations",
                name: "Generic Operations",
                audience: "admin",
                endpoints: [
                    { method: "GET", path: "/client-api/operations", summary: "Read tenant operations summary.", auth: "client-jwt" },
                    {
                        method: "GET",
                        path: "/client-api/operations/records",
                        summary: "List tenant operation records.",
                        auth: "client-jwt"
                    },
                    {
                        method: "GET",
                        path: "/client-api/operations/work-items",
                        summary: "List tenant work items.",
                        auth: "client-jwt"
                    }
                ]
            }
        ]
    },
    {
        key: "client-onboarding",
        name: "Client onboarding",
        scope: "SHARED",
        category: "Platform",
        description: "Platform endpoints for creating and reading client tenants.",
        owner: "Platform",
        basePath: "/api/clients",
        docsPath: "docs/shared-endpoints.md#clients",
        defaultEnabled: false,
        requiredRoles: ["superadmin", "platform_admin"],
        tags: ["shared", "platform", "clients", "onboarding"],
        includeInTenantServices: false,
        endpointGroups: [
            {
                key: "clients",
                name: "Clients",
                audience: "admin",
                endpoints: [
                    { method: "GET", path: "/api/clients", summary: "List client tenants.", auth: "platform-jwt" },
                    { method: "GET", path: "/api/clients/:idOrSlug", summary: "Read one client tenant.", auth: "platform-jwt" },
                    { method: "POST", path: "/api/clients", summary: "Create client tenant.", auth: "platform-jwt" }
                ]
            }
        ]
    },
    {
        key: "backend-service-catalog",
        name: "Backend service catalog",
        scope: "SHARED",
        category: "Platform",
        description: "Platform control-plane endpoints for backend service definitions and tenant service assignments.",
        owner: "Platform",
        basePath: "/api/services, /api/clients/:tenantId/services",
        docsPath: "docs/shared-endpoints.md#service-catalog",
        defaultEnabled: false,
        requiredRoles: ["superadmin", "platform_admin"],
        tags: ["shared", "platform", "services", "control-plane"],
        includeInTenantServices: false,
        endpointGroups: [
            {
                key: "backend-service-definitions",
                name: "Service Definitions",
                audience: "admin",
                endpoints: [
                    { method: "GET", path: "/api/services", summary: "List backend service definitions.", auth: "platform-jwt" },
                    { method: "GET", path: "/api/services/:serviceKey", summary: "Read one backend service definition.", auth: "platform-jwt" },
                    { method: "POST", path: "/api/services", summary: "Create backend service definition.", auth: "platform-jwt" },
                    { method: "PATCH", path: "/api/services/:serviceKey", summary: "Update backend service definition.", auth: "platform-jwt" }
                ]
            },
            {
                key: "tenant-service-assignments",
                name: "Tenant Service Assignments",
                audience: "admin",
                endpoints: [
                    { method: "GET", path: "/api/clients/:tenantId/services", summary: "List services for one tenant.", auth: "platform-jwt" },
                    {
                        method: "GET",
                        path: "/api/clients/:tenantId/services/:serviceKey",
                        summary: "Read one tenant service assignment.",
                        auth: "platform-jwt"
                    },
                    {
                        method: "PUT",
                        path: "/api/clients/:tenantId/services/:serviceKey",
                        summary: "Enable, disable, pause, or configure one tenant service.",
                        auth: "platform-jwt"
                    },
                    {
                        method: "DELETE",
                        path: "/api/clients/:tenantId/services/:serviceKey",
                        summary: "Remove one tenant service override.",
                        auth: "platform-jwt"
                    }
                ]
            }
        ]
    },
    {
        key: "client-database-registry",
        name: "Client database registry",
        scope: "SHARED",
        category: "Data",
        description: "Platform endpoints for encrypted shared or dedicated client database connection assignments.",
        owner: "Platform",
        basePath: "/api/system/database-connections",
        docsPath: "docs/shared-endpoints.md#database-connections",
        defaultEnabled: false,
        requiredRoles: ["superadmin", "platform_admin"],
        tags: ["shared", "platform", "database", "encrypted"],
        includeInTenantServices: false,
        endpointGroups: [
            {
                key: "database-connections",
                name: "Database Connections",
                audience: "admin",
                endpoints: [
                    { method: "GET", path: "/api/system/database-connections", summary: "List client database assignments.", auth: "platform-jwt" },
                    { method: "GET", path: "/api/system/database-providers", summary: "List supported database providers.", auth: "platform-jwt" },
                    {
                        method: "PUT",
                        path: "/api/system/database-connections/:tenantId",
                        summary: "Save encrypted dedicated database connection.",
                        auth: "platform-jwt"
                    },
                    {
                        method: "POST",
                        path: "/api/system/database-connections/:tenantId/test",
                        summary: "Test saved database connection.",
                        auth: "platform-jwt"
                    },
                    {
                        method: "DELETE",
                        path: "/api/system/database-connections/:tenantId",
                        summary: "Return client to shared platform database.",
                        auth: "platform-jwt"
                    }
                ]
            }
        ]
    },
    {
        key: "platform-account-api-keys",
        name: "Platform account and API keys",
        scope: "SHARED",
        category: "Platform",
        description: "Platform account profile, API surface summaries, and preview API key metadata endpoints.",
        owner: "Platform",
        basePath: "/api/account, /api/api-surfaces, /api/authorization",
        docsPath: "docs/shared-endpoints.md#platform-account-and-api-keys",
        defaultEnabled: false,
        requiredRoles: ["superadmin", "platform_admin"],
        tags: ["shared", "platform", "api-keys"],
        includeInTenantServices: false,
        endpointGroups: [
            {
                key: "platform-account-api-keys",
                name: "Platform Account And API Keys",
                audience: "admin",
                endpoints: [
                    { method: "GET", path: "/api/account/profile", summary: "Read platform admin account profile.", auth: "platform-jwt" },
                    { method: "GET", path: "/api/api-surfaces", summary: "List seeded API surface summaries.", auth: "platform-jwt" },
                    {
                        method: "POST",
                        path: "/api/authorization/api-keys",
                        summary: "Create preview API key metadata.",
                        auth: "platform-jwt"
                    }
                ]
            }
        ]
    },
    {
        key: "platform-secret-provisioning",
        name: "Platform secret provisioning",
        scope: "SHARED",
        category: "Security",
        description: "Platform endpoint for provisioning initial encrypted client secret metadata.",
        owner: "Platform",
        basePath: "/api/system/secrets",
        docsPath: "docs/shared-endpoints.md#secrets",
        defaultEnabled: false,
        requiredRoles: ["superadmin", "platform_admin"],
        tags: ["shared", "platform", "secrets"],
        includeInTenantServices: false,
        endpointGroups: [
            {
                key: "platform-secret-provisioning",
                name: "Platform Secret Provisioning",
                audience: "admin",
                endpoints: [
                    { method: "POST", path: "/api/system/secrets", summary: "Provision encrypted client secret metadata.", auth: "platform-jwt" }
                ]
            }
        ]
    },
    {
        key: "platform-admin-panel",
        name: "Platform admin panel context",
        scope: "SHARED",
        category: "Platform",
        description: "Platform admin panel context endpoint for superadmin workflows.",
        owner: "Platform",
        basePath: "/api/admin-panel",
        docsPath: "docs/shared-endpoints.md#admin-panel-context",
        defaultEnabled: false,
        requiredRoles: ["superadmin", "platform_admin"],
        tags: ["shared", "platform", "admin-panel"],
        includeInTenantServices: false,
        endpointGroups: [
            {
                key: "platform-admin-panel-context",
                name: "Platform Admin Panel Context",
                audience: "admin",
                endpoints: [
                    { method: "GET", path: "/api/admin-panel/context", summary: "Read platform admin panel context.", auth: "platform-jwt" }
                ]
            }
        ]
    },
    {
        key: "client-admin-panel",
        name: "Client admin panel context",
        scope: "SHARED",
        category: "Platform",
        description: "Shared client admin panel context and data bundle endpoints.",
        owner: "Client API",
        basePath: "/client-api/admin-panel",
        docsPath: "docs/shared-endpoints.md#admin-panel-context",
        defaultEnabled: true,
        requiredRoles: [],
        tags: ["shared", "admin-panel", "context"],
        endpointGroups: [
            {
                key: "admin-panel-context",
                name: "Admin Panel Context",
                audience: "admin",
                endpoints: [
                    {
                        method: "GET",
                        path: "/client-api/admin-panel/context",
                        summary: "Read client admin panel context.",
                        auth: "client-jwt"
                    },
                    {
                        method: "GET",
                        path: "/client-api/admin-panel/data",
                        summary: "Read client admin panel data bundle.",
                        auth: "client-jwt"
                    }
                ]
            }
        ]
    },
    {
        key: "client-secrets",
        name: "Client secrets",
        scope: "SHARED",
        category: "Security",
        description: "Tenant-scoped encrypted secret metadata, versions, audit events, and grants.",
        owner: "Client API",
        basePath: "/client-api/secrets",
        docsPath: "docs/shared-endpoints.md#secrets",
        defaultEnabled: true,
        requiredRoles: ["owner", "admin"],
        tags: ["shared", "secrets", "encrypted"],
        endpointGroups: [
            {
                key: "secrets",
                name: "Secrets",
                audience: "admin",
                endpoints: [
                    { method: "GET", path: "/client-api/secrets", summary: "List secret metadata.", auth: "client-jwt" },
                    {
                        method: "POST",
                        path: "/client-api/secrets",
                        summary: "Create a secret container.",
                        auth: "client-jwt",
                        roles: ["owner", "admin"]
                    },
                    { method: "GET", path: "/client-api/secrets/audit", summary: "List secret audit events.", auth: "client-jwt" },
                    { method: "GET", path: "/client-api/secrets/:secret", summary: "Read secret metadata.", auth: "client-jwt" },
                    { method: "PATCH", path: "/client-api/secrets/:secret", summary: "Update secret metadata.", auth: "client-jwt" },
                    {
                        method: "GET",
                        path: "/client-api/secrets/:secret/versions",
                        summary: "List secret versions.",
                        auth: "client-jwt"
                    },
                    {
                        method: "POST",
                        path: "/client-api/secrets/:secret/versions",
                        summary: "Add encrypted secret version.",
                        auth: "client-jwt"
                    },
                    {
                        method: "GET",
                        path: "/client-api/secrets/:secret/versions/:version/access",
                        summary: "Decrypt an enabled secret version.",
                        auth: "client-jwt"
                    },
                    {
                        method: "PATCH",
                        path: "/client-api/secrets/:secret/versions/:version",
                        summary: "Enable or disable a secret version.",
                        auth: "client-jwt"
                    },
                    {
                        method: "DELETE",
                        path: "/client-api/secrets/:secret/versions/:version",
                        summary: "Destroy a secret version payload.",
                        auth: "client-jwt"
                    },
                    { method: "GET", path: "/client-api/secrets/:secret/grants", summary: "List secret grants.", auth: "client-jwt" },
                    {
                        method: "PUT",
                        path: "/client-api/secrets/:secret/grants/:userId",
                        summary: "Grant per-secret access.",
                        auth: "client-jwt",
                        roles: ["owner", "admin"]
                    },
                    {
                        method: "DELETE",
                        path: "/client-api/secrets/:secret/grants/:userId",
                        summary: "Revoke per-secret access.",
                        auth: "client-jwt",
                        roles: ["owner", "admin"]
                    }
                ]
            }
        ]
    },
    {
        key: "client-service-discovery",
        name: "Client service discovery",
        scope: "SHARED",
        category: "Platform",
        description: "Shared endpoint inventory for enabled and documented client API backend services.",
        owner: "Client API",
        basePath: "/client-api/services",
        docsPath: "docs/shared-endpoints.md#service-catalog",
        defaultEnabled: true,
        requiredRoles: [],
        tags: ["shared", "services", "catalog"],
        endpointGroups: [
            {
                key: "service-discovery",
                name: "Service Discovery",
                audience: "shared",
                endpoints: [
                    {
                        method: "GET",
                        path: "/client-api/services",
                        summary: "List enabled services for the signed-in tenant.",
                        auth: "client-jwt"
                    },
                    {
                        method: "GET",
                        path: "/client-api/services/catalog",
                        summary: "List the complete documented client API service catalog.",
                        auth: "client-jwt"
                    },
                    {
                        method: "GET",
                        path: "/client-api/services/:serviceKey",
                        summary: "Read one enabled service for the signed-in tenant.",
                        auth: "client-jwt"
                    }
                ]
            }
        ]
    },
    {
        key: "peptrace-platform-maintenance",
        name: "Peptrace platform maintenance",
        scope: "CLIENT_SPECIFIC",
        category: "Peptrace",
        description: "Platform JWT endpoints for maintaining Peptrace reference catalog and lab testing records.",
        owner: "Platform",
        basePath: "/api/vendors, /api/peptides, /api/labs, /api/testing",
        docsPath: "docs/peptrace-endpoints.md#platform-maintenance",
        defaultEnabled: false,
        requiredRoles: ["superadmin", "platform_admin"],
        tags: ["client-specific", "peptrace", "platform-maintenance", "catalog", "testing"],
        tenantSlugs: ["peptrace"],
        includeInTenantServices: false,
        endpointGroups: [
            {
                key: "peptrace-platform-maintenance",
                name: "Platform Maintenance",
                audience: "admin",
                endpoints: [
                    { method: "GET", path: "/api/vendors", summary: "List vendors.", auth: "platform-jwt" },
                    { method: "GET", path: "/api/vendor/:idOrSlug", summary: "Read one vendor.", auth: "platform-jwt" },
                    {
                        method: "POST",
                        path: "/api/vendors",
                        summary: "Create vendor.",
                        auth: "platform-jwt",
                        roles: ["superadmin", "platform_admin"]
                    },
                    { method: "GET", path: "/api/peptides", summary: "List peptides.", auth: "platform-jwt" },
                    { method: "GET", path: "/api/peptide/:idOrSlug", summary: "Read one peptide.", auth: "platform-jwt" },
                    {
                        method: "POST",
                        path: "/api/peptides",
                        summary: "Create peptide.",
                        auth: "platform-jwt",
                        roles: ["superadmin", "platform_admin"]
                    },
                    { method: "GET", path: "/api/labs", summary: "List labs.", auth: "platform-jwt" },
                    {
                        method: "POST",
                        path: "/api/labs",
                        summary: "Create lab.",
                        auth: "platform-jwt",
                        roles: ["superadmin", "platform_admin"]
                    },
                    { method: "GET", path: "/api/testing", summary: "List lab tests.", auth: "platform-jwt" },
                    { method: "GET", path: "/api/testing/:id", summary: "Read one lab test.", auth: "platform-jwt" },
                    {
                        method: "POST",
                        path: "/api/testing",
                        summary: "Create lab test.",
                        auth: "platform-jwt",
                        roles: ["superadmin", "platform_admin"]
                    }
                ]
            }
        ]
    },
    {
        key: "peptrace-quality",
        name: "Peptrace quality intelligence website and admin",
        scope: "CLIENT_SPECIFIC",
        category: "Peptrace",
        description: "Peptrace-specific public quality intelligence and admin batch/certificate operations.",
        owner: "Peptrace",
        basePath: "/client-api/public/quality, /client-api/quality",
        docsPath: "docs/peptrace-endpoints.md",
        defaultEnabled: false,
        requiredRoles: [],
        tags: ["client-specific", "peptrace", "catalog", "testing", "certificates"],
        tenantSlugs: ["peptrace"],
        endpointGroups: [
            {
                key: "public-quality-discovery",
                name: "Public Vendor And Product Discovery",
                audience: "public",
                endpoints: [
                    { method: "GET", path: "/client-api/public/quality/vendors", summary: "Public vendor comparison.", auth: "none" },
                    {
                        method: "GET",
                        path: "/client-api/public/quality/vendors/:idOrSlug",
                        summary: "Public vendor detail.",
                        auth: "none"
                    },
                    { method: "GET", path: "/client-api/public/quality/peptides", summary: "Public peptide index.", auth: "none" },
                    {
                        method: "GET",
                        path: "/client-api/public/quality/peptides/:idOrSlug",
                        summary: "Public peptide detail.",
                        auth: "none"
                    }
                ]
            },
            {
                key: "public-quality-verification",
                name: "Public Testing And Certificate Verification",
                audience: "public",
                endpoints: [
                    { method: "GET", path: "/client-api/public/quality/tests", summary: "Public released lab tests.", auth: "none" },
                    {
                        method: "GET",
                        path: "/client-api/public/quality/certificates/:idOrNumber/verify",
                        summary: "Verify a certificate of analysis.",
                        auth: "none"
                    }
                ]
            },
            {
                key: "quality-admin-catalog",
                name: "Admin Reference Catalog",
                audience: "admin",
                endpoints: [
                    { method: "GET", path: "/client-api/quality/vendors", summary: "List vendors.", auth: "client-jwt" },
                    { method: "GET", path: "/client-api/quality/vendors/:idOrSlug", summary: "Read one vendor.", auth: "client-jwt" },
                    { method: "GET", path: "/client-api/quality/peptides", summary: "List peptides.", auth: "client-jwt" },
                    { method: "GET", path: "/client-api/quality/peptides/:idOrSlug", summary: "Read one peptide.", auth: "client-jwt" },
                    { method: "GET", path: "/client-api/quality/labs", summary: "List labs.", auth: "client-jwt" },
                    { method: "GET", path: "/client-api/quality/tests", summary: "List lab tests.", auth: "client-jwt" },
                    { method: "GET", path: "/client-api/quality/tests/:id", summary: "Read one lab test.", auth: "client-jwt" }
                ]
            },
            {
                key: "quality-admin-batches",
                name: "Admin Batches",
                audience: "admin",
                endpoints: [
                    { method: "GET", path: "/client-api/quality/batches", summary: "List batches.", auth: "client-jwt" },
                    { method: "GET", path: "/client-api/quality/batches/:idOrCode", summary: "Read one batch.", auth: "client-jwt" },
                    {
                        method: "POST",
                        path: "/client-api/quality/batches",
                        summary: "Create quality batch.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "PATCH",
                        path: "/client-api/quality/batches/:id",
                        summary: "Edit quality batch.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "PATCH",
                        path: "/client-api/quality/batches/:id/status",
                        summary: "Update batch status.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "DELETE",
                        path: "/client-api/quality/batches/:id",
                        summary: "Archive batch.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    }
                ]
            },
            {
                key: "quality-admin-certificates",
                name: "Admin Certificates",
                audience: "admin",
                endpoints: [
                    { method: "GET", path: "/client-api/quality/certificates", summary: "List certificates.", auth: "client-jwt" },
                    {
                        method: "GET",
                        path: "/client-api/quality/certificates/:idOrNumber",
                        summary: "Read one certificate.",
                        auth: "client-jwt"
                    },
                    {
                        method: "POST",
                        path: "/client-api/quality/certificates",
                        summary: "Create certificate.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "PATCH",
                        path: "/client-api/quality/certificates/:id",
                        summary: "Edit certificate.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "PATCH",
                        path: "/client-api/quality/certificates/:id/status",
                        summary: "Update certificate status.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "DELETE",
                        path: "/client-api/quality/certificates/:id",
                        summary: "Archive certificate.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    }
                ]
            }
        ]
    },
    {
        key: "shamstay-operations",
        name: "Shamstay BnB marketplace and operations",
        scope: "CLIENT_SPECIFIC",
        category: "Shamstay BnB",
        description: "Shamstay-specific public rental marketplace, booking, billing, and admin operations.",
        owner: "Shamstay BnB",
        basePath: "/client-api/public/shamstay, /client-api/shamstay",
        docsPath: "docs/shamstay-endpoints.md",
        defaultEnabled: false,
        requiredRoles: [],
        tags: ["client-specific", "bnb", "marketplace", "operations", "billing"],
        tenantSlugs: ["shamstay-bnb"],
        endpointGroups: [
            {
                key: "shamstay-admin-analytics",
                name: "Admin Analytics",
                audience: "admin",
                endpoints: [
                    {
                        method: "GET",
                        path: "/client-api/shamstay/analytics/overview",
                        summary: "Dashboard rollup for Shamstay operations.",
                        auth: "client-jwt"
                    }
                ]
            },
            {
                key: "shamstay-public-discovery",
                name: "Public Property Discovery",
                audience: "public",
                endpoints: [
                    { method: "GET", path: "/client-api/public/shamstay/properties", summary: "Public property search.", auth: "none" },
                    {
                        method: "GET",
                        path: "/client-api/public/shamstay/properties/:idOrSlug",
                        summary: "Public property detail.",
                        auth: "none"
                    },
                    {
                        method: "GET",
                        path: "/client-api/public/shamstay/properties/:idOrSlug/quote",
                        summary: "Quote available dates and total stay amount.",
                        auth: "none"
                    },
                    {
                        method: "GET",
                        path: "/client-api/public/shamstay/properties/:idOrSlug/reviews",
                        summary: "Public approved property reviews.",
                        auth: "none"
                    }
                ]
            },
            {
                key: "shamstay-public-conversion",
                name: "Public Guest Conversion",
                audience: "public",
                endpoints: [
                    {
                        method: "POST",
                        path: "/client-api/public/shamstay/reservation-requests",
                        summary: "Create website reservation request.",
                        auth: "none"
                    },
                    {
                        method: "POST",
                        path: "/client-api/public/shamstay/payments",
                        summary: "Create provider-neutral payment intent metadata.",
                        auth: "none"
                    },
                    { method: "POST", path: "/client-api/public/shamstay/contact", summary: "Create guest inquiry.", auth: "none" },
                    { method: "GET", path: "/client-api/public/shamstay/wishlist", summary: "List saved properties.", auth: "none" },
                    { method: "POST", path: "/client-api/public/shamstay/wishlist", summary: "Save property.", auth: "none" },
                    {
                        method: "DELETE",
                        path: "/client-api/public/shamstay/wishlist/:propertyIdOrSlug",
                        summary: "Remove saved property.",
                        auth: "none"
                    }
                ]
            },
            {
                key: "shamstay-admin-properties",
                name: "Admin Properties And Availability",
                audience: "admin",
                endpoints: [
                    { method: "GET", path: "/client-api/shamstay/properties", summary: "List properties.", auth: "client-jwt" },
                    { method: "GET", path: "/client-api/shamstay/properties/:idOrSlug", summary: "Read one property.", auth: "client-jwt" },
                    {
                        method: "POST",
                        path: "/client-api/shamstay/properties",
                        summary: "Create property.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "PATCH",
                        path: "/client-api/shamstay/properties/:id",
                        summary: "Edit property.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "PATCH",
                        path: "/client-api/shamstay/properties/:id/status",
                        summary: "Update property status.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "DELETE",
                        path: "/client-api/shamstay/properties/:id",
                        summary: "Archive property.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "GET",
                        path: "/client-api/shamstay/properties/:propertyId/availability-blocks",
                        summary: "List availability blocks.",
                        auth: "client-jwt"
                    },
                    {
                        method: "POST",
                        path: "/client-api/shamstay/properties/:propertyId/availability-blocks",
                        summary: "Create availability block.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "PATCH",
                        path: "/client-api/shamstay/availability-blocks/:id",
                        summary: "Edit availability block.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "DELETE",
                        path: "/client-api/shamstay/availability-blocks/:id",
                        summary: "Remove availability block.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    }
                ]
            },
            {
                key: "shamstay-admin-guests",
                name: "Admin Guests And Reservations",
                audience: "admin",
                endpoints: [
                    { method: "GET", path: "/client-api/shamstay/guests", summary: "List guests.", auth: "client-jwt" },
                    { method: "GET", path: "/client-api/shamstay/guests/:id", summary: "Read one guest.", auth: "client-jwt" },
                    {
                        method: "POST",
                        path: "/client-api/shamstay/guests",
                        summary: "Create guest.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "PATCH",
                        path: "/client-api/shamstay/guests/:id",
                        summary: "Edit guest.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    { method: "GET", path: "/client-api/shamstay/reservations", summary: "List reservations.", auth: "client-jwt" },
                    {
                        method: "GET",
                        path: "/client-api/shamstay/reservations/:id",
                        summary: "Read one reservation.",
                        auth: "client-jwt"
                    },
                    {
                        method: "POST",
                        path: "/client-api/shamstay/reservations",
                        summary: "Create reservation.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "PATCH",
                        path: "/client-api/shamstay/reservations/:id",
                        summary: "Edit reservation.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "PATCH",
                        path: "/client-api/shamstay/reservations/:id/status",
                        summary: "Update reservation status.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "DELETE",
                        path: "/client-api/shamstay/reservations/:id",
                        summary: "Archive reservation.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    }
                ]
            },
            {
                key: "shamstay-admin-messages-reviews",
                name: "Admin Messages And Reviews",
                audience: "admin",
                endpoints: [
                    { method: "GET", path: "/client-api/shamstay/conversations", summary: "List conversations.", auth: "client-jwt" },
                    {
                        method: "POST",
                        path: "/client-api/shamstay/conversations",
                        summary: "Create conversation.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "GET",
                        path: "/client-api/shamstay/conversations/:id",
                        summary: "Read one conversation.",
                        auth: "client-jwt"
                    },
                    {
                        method: "DELETE",
                        path: "/client-api/shamstay/conversations/:id",
                        summary: "Archive conversation.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "GET",
                        path: "/client-api/shamstay/conversations/:id/messages",
                        summary: "List conversation messages.",
                        auth: "client-jwt"
                    },
                    {
                        method: "POST",
                        path: "/client-api/shamstay/conversations/:id/messages",
                        summary: "Send host message.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    { method: "GET", path: "/client-api/shamstay/reviews", summary: "List reviews.", auth: "client-jwt" },
                    { method: "GET", path: "/client-api/shamstay/reviews/:id", summary: "Read one review.", auth: "client-jwt" },
                    {
                        method: "POST",
                        path: "/client-api/shamstay/reviews",
                        summary: "Create or import review.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "PATCH",
                        path: "/client-api/shamstay/reviews/:id/status",
                        summary: "Moderate review status.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "PATCH",
                        path: "/client-api/shamstay/reviews/:id/response",
                        summary: "Add host response.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "DELETE",
                        path: "/client-api/shamstay/reviews/:id",
                        summary: "Archive review.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    }
                ]
            },
            {
                key: "shamstay-admin-operations",
                name: "Admin Operations",
                audience: "admin",
                endpoints: [
                    { method: "GET", path: "/client-api/shamstay/turnovers", summary: "List turnovers.", auth: "client-jwt" },
                    { method: "GET", path: "/client-api/shamstay/turnovers/:id", summary: "Read one turnover.", auth: "client-jwt" },
                    {
                        method: "POST",
                        path: "/client-api/shamstay/turnovers",
                        summary: "Create turnover.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "PATCH",
                        path: "/client-api/shamstay/turnovers/:id",
                        summary: "Edit turnover.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "PATCH",
                        path: "/client-api/shamstay/turnovers/:id/status",
                        summary: "Update turnover status.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "DELETE",
                        path: "/client-api/shamstay/turnovers/:id",
                        summary: "Archive turnover.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    { method: "GET", path: "/client-api/shamstay/maintenance", summary: "List maintenance tickets.", auth: "client-jwt" },
                    {
                        method: "GET",
                        path: "/client-api/shamstay/maintenance/:id",
                        summary: "Read one maintenance ticket.",
                        auth: "client-jwt"
                    },
                    {
                        method: "POST",
                        path: "/client-api/shamstay/maintenance",
                        summary: "Create maintenance ticket.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "PATCH",
                        path: "/client-api/shamstay/maintenance/:id",
                        summary: "Edit maintenance ticket.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "PATCH",
                        path: "/client-api/shamstay/maintenance/:id/status",
                        summary: "Update maintenance status.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "DELETE",
                        path: "/client-api/shamstay/maintenance/:id",
                        summary: "Archive maintenance ticket.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    { method: "GET", path: "/client-api/shamstay/payouts", summary: "List owner payouts.", auth: "client-jwt" },
                    { method: "GET", path: "/client-api/shamstay/payouts/:id", summary: "Read one owner payout.", auth: "client-jwt" },
                    {
                        method: "POST",
                        path: "/client-api/shamstay/payouts",
                        summary: "Create owner payout.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "PATCH",
                        path: "/client-api/shamstay/payouts/:id",
                        summary: "Edit owner payout.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "PATCH",
                        path: "/client-api/shamstay/payouts/:id/status",
                        summary: "Update payout status.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "DELETE",
                        path: "/client-api/shamstay/payouts/:id",
                        summary: "Archive owner payout.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    }
                ]
            },
            {
                key: "shamstay-admin-billing",
                name: "Admin Billing And Refunds",
                audience: "admin",
                endpoints: [
                    { method: "GET", path: "/client-api/shamstay/payments", summary: "List reservation payments.", auth: "client-jwt" },
                    { method: "GET", path: "/client-api/shamstay/payments/:id", summary: "Read one payment.", auth: "client-jwt" },
                    {
                        method: "POST",
                        path: "/client-api/shamstay/payments",
                        summary: "Create payment record.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "PATCH",
                        path: "/client-api/shamstay/payments/:id",
                        summary: "Edit payment record.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "PATCH",
                        path: "/client-api/shamstay/payments/:id/status",
                        summary: "Update payment status.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "POST",
                        path: "/client-api/shamstay/payments/:id/refunds",
                        summary: "Apply payment refund.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "DELETE",
                        path: "/client-api/shamstay/payments/:id",
                        summary: "Void payment.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    }
                ]
            }
        ]
    },
    {
        key: "sham-real-estate-operations",
        name: "Sham Real Estate Hub marketplace and brokerage operations",
        scope: "CLIENT_SPECIFIC",
        category: "Sham Real Estate Hub",
        description: "Real-estate-specific public property marketplace and brokerage admin operations.",
        owner: "Sham Real Estate Hub",
        basePath: "/client-api/public/real-estate, /client-api/real-estate",
        docsPath: "docs/shamrealestate-endpoints.md",
        defaultEnabled: false,
        requiredRoles: [],
        tags: ["client-specific", "real-estate", "marketplace", "operations"],
        tenantSlugs: ["sham-real-estate-hub"],
        endpointGroups: [
            {
                key: "real-estate-admin-analytics",
                name: "Admin Analytics",
                audience: "admin",
                endpoints: [
                    {
                        method: "GET",
                        path: "/client-api/real-estate/analytics/overview",
                        summary: "Dashboard rollup for real estate brokerage operations.",
                        auth: "client-jwt"
                    }
                ]
            },
            {
                key: "real-estate-public-discovery",
                name: "Public Listing Discovery",
                audience: "public",
                endpoints: [
                    { method: "GET", path: "/client-api/public/real-estate/listings", summary: "Public listing search.", auth: "none" },
                    {
                        method: "GET",
                        path: "/client-api/public/real-estate/listings/:idOrSlug",
                        summary: "Public listing detail.",
                        auth: "none"
                    }
                ]
            },
            {
                key: "real-estate-public-conversion",
                name: "Public Buyer And Renter Conversion",
                audience: "public",
                endpoints: [
                    {
                        method: "POST",
                        path: "/client-api/public/real-estate/inquiries",
                        summary: "Create buyer or renter inquiry.",
                        auth: "none"
                    },
                    { method: "POST", path: "/client-api/public/real-estate/tour-requests", summary: "Request listing tour.", auth: "none" },
                    { method: "GET", path: "/client-api/public/real-estate/saved-listings", summary: "List saved listings.", auth: "none" },
                    { method: "POST", path: "/client-api/public/real-estate/saved-listings", summary: "Save listing.", auth: "none" },
                    {
                        method: "DELETE",
                        path: "/client-api/public/real-estate/saved-listings/:listingIdOrSlug",
                        summary: "Remove saved listing.",
                        auth: "none"
                    },
                    { method: "GET", path: "/client-api/public/real-estate/saved-searches", summary: "List saved searches.", auth: "none" },
                    { method: "POST", path: "/client-api/public/real-estate/saved-searches", summary: "Save search.", auth: "none" },
                    {
                        method: "DELETE",
                        path: "/client-api/public/real-estate/saved-searches/:id",
                        summary: "Delete saved search.",
                        auth: "none"
                    }
                ]
            },
            {
                key: "real-estate-admin-listings",
                name: "Admin Listings",
                audience: "admin",
                endpoints: [
                    { method: "GET", path: "/client-api/real-estate/listings", summary: "List listings.", auth: "client-jwt" },
                    { method: "GET", path: "/client-api/real-estate/listings/:idOrSlug", summary: "Read one listing.", auth: "client-jwt" },
                    {
                        method: "POST",
                        path: "/client-api/real-estate/listings",
                        summary: "Create listing.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "PATCH",
                        path: "/client-api/real-estate/listings/:id",
                        summary: "Edit listing.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "PATCH",
                        path: "/client-api/real-estate/listings/:id/status",
                        summary: "Update listing status.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "DELETE",
                        path: "/client-api/real-estate/listings/:id",
                        summary: "Archive listing.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    }
                ]
            },
            {
                key: "real-estate-admin-pipeline",
                name: "Admin Leads, Tours, Offers, And Closing",
                audience: "admin",
                endpoints: [
                    { method: "GET", path: "/client-api/real-estate/leads", summary: "List leads.", auth: "client-jwt" },
                    { method: "GET", path: "/client-api/real-estate/leads/:id", summary: "Read one lead.", auth: "client-jwt" },
                    {
                        method: "POST",
                        path: "/client-api/real-estate/leads",
                        summary: "Create lead.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "PATCH",
                        path: "/client-api/real-estate/leads/:id",
                        summary: "Edit lead.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "PATCH",
                        path: "/client-api/real-estate/leads/:id/status",
                        summary: "Update lead status.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "DELETE",
                        path: "/client-api/real-estate/leads/:id",
                        summary: "Archive lead.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    { method: "GET", path: "/client-api/real-estate/viewings", summary: "List viewings.", auth: "client-jwt" },
                    { method: "GET", path: "/client-api/real-estate/viewings/:id", summary: "Read one viewing.", auth: "client-jwt" },
                    {
                        method: "POST",
                        path: "/client-api/real-estate/viewings",
                        summary: "Create viewing.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "PATCH",
                        path: "/client-api/real-estate/viewings/:id",
                        summary: "Edit viewing.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "PATCH",
                        path: "/client-api/real-estate/viewings/:id/status",
                        summary: "Update viewing status.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "DELETE",
                        path: "/client-api/real-estate/viewings/:id",
                        summary: "Archive viewing.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    { method: "GET", path: "/client-api/real-estate/offers", summary: "List offers.", auth: "client-jwt" },
                    { method: "GET", path: "/client-api/real-estate/offers/:id", summary: "Read one offer.", auth: "client-jwt" },
                    {
                        method: "POST",
                        path: "/client-api/real-estate/offers",
                        summary: "Create offer.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "PATCH",
                        path: "/client-api/real-estate/offers/:id",
                        summary: "Edit offer.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "PATCH",
                        path: "/client-api/real-estate/offers/:id/status",
                        summary: "Update offer status.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "DELETE",
                        path: "/client-api/real-estate/offers/:id",
                        summary: "Archive offer.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    { method: "GET", path: "/client-api/real-estate/commissions", summary: "List commissions.", auth: "client-jwt" },
                    { method: "GET", path: "/client-api/real-estate/commissions/:id", summary: "Read one commission.", auth: "client-jwt" },
                    {
                        method: "POST",
                        path: "/client-api/real-estate/commissions",
                        summary: "Create commission.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "PATCH",
                        path: "/client-api/real-estate/commissions/:id",
                        summary: "Edit commission.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "PATCH",
                        path: "/client-api/real-estate/commissions/:id/status",
                        summary: "Update commission status.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    },
                    {
                        method: "DELETE",
                        path: "/client-api/real-estate/commissions/:id",
                        summary: "Void commission.",
                        auth: "client-jwt",
                        roles: ["owner", "admin", "manager"]
                    }
                ]
            },
            {
                key: "real-estate-admin-saved-signals",
                name: "Admin Saved Buyer Signals",
                audience: "admin",
                endpoints: [
                    { method: "GET", path: "/client-api/real-estate/saved-listings", summary: "List saved listing signals.", auth: "client-jwt" },
                    { method: "GET", path: "/client-api/real-estate/saved-searches", summary: "List saved search signals.", auth: "client-jwt" }
                ]
            }
        ]
    }
];
function getDocumentedServiceSpec(serviceKey) {
    return exports.DOCUMENTED_SERVICE_CATALOG.find((service) => service.key === serviceKey) ?? null;
}
function isDocumentedServiceAvailableToTenant(service, tenantSlug) {
    if (service.includeInTenantServices === false)
        return false;
    return service.scope === "SHARED" || service.tenantSlugs?.includes(tenantSlug) === true;
}
function listDocumentedServiceSpecsForTenant(tenantSlug) {
    return exports.DOCUMENTED_SERVICE_CATALOG.filter((service) => service.includeInTenantServices !== false && isDocumentedServiceAvailableToTenant(service, tenantSlug));
}
function toFlatEndpoints(service) {
    return service.endpointGroups.flatMap((group) => group.endpoints);
}
//# sourceMappingURL=service-catalog.js.map