import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { createPostgresPoolOptions } from "../src/database/create-postgres-pool-options";
import {
  accountWorkItems,
  apiSurfaces,
  clientTenants,
  labTests,
  labs,
  peptides,
  vendors
} from "../../../../../packages/domain/src/index";

const configDir = dirname(fileURLToPath(import.meta.url));

[
  resolve(configDir, "../.env.local"),
  resolve(configDir, "../.env"),
  resolve(configDir, "../../../../../.env.local"),
  resolve(configDir, "../../../../../.env")
].forEach((path) => {
  config({ path });
});

const pool = new Pool(createPostgresPoolOptions(process.env.DATABASE_URL ?? ""));
const prisma = new PrismaClient({
  adapter: new PrismaPg(pool)
});
const superAdminEmail = (
  process.env.SUPERADMIN_EMAIL ??
  process.env.ADMIN_EMAIL ??
  "admin@esteemedengineering.com"
).toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin@123";
const legacySuperAdminEmails = ["superadmin@esteemedengineering.com", "admin@peptrace.com"].filter(
  (email) => email !== superAdminEmail
);

const demoAdminUsers = [
  {
    email: superAdminEmail,
    displayName: "EsteemedEngineering Super Admin",
    role: "superadmin",
    tenantId: null
  },
  {
    email: "owner@peptrace.com",
    displayName: "Peptrace Owner",
    role: "owner",
    tenantId: "client-peptrace"
  },
  {
    email: "ops@peptrace.com",
    displayName: "Peptrace Operations",
    role: "admin",
    tenantId: "client-peptrace"
  },
  {
    email: "owner@shamstaybnb.com",
    displayName: "Shamstay BnB Owner",
    role: "owner",
    tenantId: "client-shamstay-bnb"
  },
  {
    email: "reservations@shamstaybnb.com",
    displayName: "Shamstay Reservations",
    role: "manager",
    tenantId: "client-shamstay-bnb"
  },
  {
    email: "owner@shamrealestatehub.com",
    displayName: "Sham Real Estate Hub Owner",
    role: "owner",
    tenantId: "client-sham-real-estate-hub"
  },
  {
    email: "agents@shamrealestatehub.com",
    displayName: "Sham Real Estate Hub Agents",
    role: "manager",
    tenantId: "client-sham-real-estate-hub"
  }
];

const whiteLabelPanels = [
  {
    clientTenantId: "client-peptrace",
    brandName: "Peptrace",
    productName: "Peptrace admin",
    industry: "Peptide quality intelligence",
    accentColor: "#0e7467",
    overviewTitle: "Peptrace admin panel",
    overviewDescription: "Monitor peptide catalog quality, vendor readiness, testing workflows, and API access.",
    operationsTitle: "Quality operations",
    operationsDescription: "Vendor, lab, and catalog actions for the Peptrace workspace.",
    primaryRecords: [
      {
        label: "Vendor catalog",
        detail: "Peptide Partners, AminoForge, Northstar Peptides",
        status: "Ready",
        value: "3 vendors"
      },
      {
        label: "Lab testing",
        detail: "LC-MS, HPLC, NMR, sterility workflows",
        status: "In review",
        value: "4 tests"
      },
      {
        label: "Customer API",
        detail: "Scoped catalog and certificate endpoints",
        status: "Scoped",
        value: "6 surfaces"
      }
    ],
    workItems: [
      {
        label: "Approve customer API key",
        detail: "Catalog and testing report scopes",
        priority: "High"
      },
      {
        label: "Review pending lab result",
        detail: "Tirzepatide LC-MS batch awaiting release",
        priority: "Medium"
      },
      {
        label: "Confirm access policy",
        detail: "Company API scopes and administrator permissions",
        priority: "Low"
      }
    ]
  },
  {
    clientTenantId: "client-shamstay-bnb",
    brandName: "Shamstay BnB",
    productName: "Shamstay BnB admin",
    industry: "Short-term rental operations",
    accentColor: "#1f7a8c",
    overviewTitle: "Shamstay BnB admin panel",
    overviewDescription: "Track homes, reservations, guest requests, turnovers, maintenance, and owner payouts.",
    operationsTitle: "Guest and stay operations",
    operationsDescription: "Reservation readiness, property turnover, guest support, and owner-reporting work.",
    primaryRecords: [
      {
        label: "Old Damascus Courtyard Home",
        detail: "Guest arriving today at 15:00, digital check-in sent",
        status: "Check-in today",
        value: "USD 1,280 booking"
      },
      {
        label: "Aleppo Citadel Loft",
        detail: "Back-to-back stay, cleaning team scheduled at 13:00",
        status: "Turnover due",
        value: "92% occupancy"
      },
      {
        label: "Latakia Coast Villa",
        detail: "AC maintenance approval needed before next guest",
        status: "Maintenance",
        value: "4.8 rating"
      },
      {
        label: "Bab Touma Studio",
        detail: "Owner statement ready, payout batch pending review",
        status: "Owner payout",
        value: "USD 740 payout"
      }
    ],
    workItems: [
      {
        label: "Confirm late checkout",
        detail: "Aleppo Citadel Loft guest requested 14:00 checkout before turnover",
        priority: "High"
      },
      {
        label: "Dispatch cleaning team",
        detail: "Old Damascus Courtyard Home needs linen reset and pre-arrival inspection",
        priority: "Medium"
      },
      {
        label: "Approve maintenance quote",
        detail: "Latakia Coast Villa AC vendor waiting on owner approval",
        priority: "Medium"
      },
      {
        label: "Send owner payout report",
        detail: "Bab Touma Studio monthly statement and payout confirmation",
        priority: "Low"
      }
    ]
  },
  {
    clientTenantId: "client-sham-real-estate-hub",
    brandName: "Sham Real Estate Hub",
    productName: "Sham Real Estate Hub admin",
    industry: "Real estate brokerage",
    accentColor: "#6d5dfc",
    overviewTitle: "Sham Real Estate Hub admin panel",
    overviewDescription: "Manage listings, buyer and tenant leads, agent workload, viewings, offers, and deal pipeline health.",
    operationsTitle: "Brokerage operations",
    operationsDescription: "Listing readiness, lead routing, viewing coordination, offer negotiation, and seller follow-up.",
    primaryRecords: [
      {
        label: "Malki Penthouse",
        detail: "Exclusive listing, 3 qualified buyers, weekend viewing slots open",
        status: "Hot listing",
        value: "USD 890k"
      },
      {
        label: "Mezzeh Office",
        detail: "Commercial tenant lead requested valuation and floor plan refresh",
        status: "Valuation review",
        value: "USD 340k"
      },
      {
        label: "Yaafour Villa",
        detail: "Offer negotiation assigned to senior agent, seller callback due",
        status: "Offer stage",
        value: "USD 1.25M"
      },
      {
        label: "New Aleppo Townhouse",
        detail: "Portal inquiries need qualification and mortgage pre-approval check",
        status: "Lead routing",
        value: "14 leads"
      }
    ],
    workItems: [
      {
        label: "Qualify buyer leads",
        detail: "New Aleppo Townhouse portal inquiries need budget and financing checks",
        priority: "High"
      },
      {
        label: "Refresh listing media",
        detail: "Mezzeh Office needs updated floor plan and commercial photos",
        priority: "Medium"
      },
      {
        label: "Confirm viewing schedule",
        detail: "Malki Penthouse weekend tours need agent coverage",
        priority: "Medium"
      },
      {
        label: "Follow up on offer",
        detail: "Yaafour Villa seller callback before counter-offer deadline",
        priority: "Low"
      }
    ]
  }
];

const backendServices = [
  {
    key: "client-api-health",
    name: "Client API health",
    scope: "SHARED",
    category: "Platform",
    description: "Shared client API route index and health check endpoints.",
    owner: "Client API",
    basePath: "/client-api",
    status: "ACTIVE",
    defaultEnabled: true,
    requiredRoles: [],
    tags: ["shared", "health", "status"],
    docsPath: "docs/shared-endpoints.md#health",
    configSchema: {},
    endpoints: [
      { method: "GET", path: "/client-api", summary: "Client API route index" },
      { method: "GET", path: "/client-api/health", summary: "Client API health check" }
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
    status: "ACTIVE",
    defaultEnabled: false,
    requiredRoles: [],
    tags: ["shared", "platform", "health"],
    docsPath: "docs/shared-endpoints.md#health",
    configSchema: {},
    endpoints: [
      { method: "GET", path: "/api", summary: "Platform API route index" },
      { method: "GET", path: "/api/health", summary: "Platform API health check" }
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
    status: "ACTIVE",
    defaultEnabled: false,
    requiredRoles: ["superadmin", "platform_admin"],
    tags: ["shared", "platform", "identity"],
    docsPath: "docs/shared-endpoints.md#auth",
    configSchema: {},
    endpoints: [
      { method: "POST", path: "/api/auth/login", summary: "Create platform superadmin session" },
      { method: "POST", path: "/api/auth/register", summary: "Register platform admin user" },
      { method: "POST", path: "/api/auth/refresh", summary: "Refresh platform token" },
      { method: "GET", path: "/api/auth/me", summary: "Read current platform user" }
    ]
  },
  {
    key: "auth-session",
    name: "Authentication and tenant switching",
    scope: "SHARED",
    category: "Identity",
    description:
      "Shared client login, refresh, account profile, and tenant switching endpoints for tenant sessions.",
    owner: "Auth",
    basePath: "/client-api/auth",
    status: "ACTIVE",
    defaultEnabled: true,
    requiredRoles: [],
    tags: ["shared", "identity", "jwt"],
    docsPath: "docs/shared-endpoints.md#auth",
    configSchema: {},
    endpoints: [
      { method: "POST", path: "/client-api/auth/login", summary: "Create a client tenant session" },
      { method: "POST", path: "/client-api/auth/refresh", summary: "Refresh a client tenant session" },
      { method: "POST", path: "/client-api/auth/switch-tenant", summary: "Switch to another assigned tenant" },
      { method: "GET", path: "/client-api/auth/me", summary: "Read the current client account" }
    ]
  },
  {
    key: "userbase",
    name: "Userbase",
    scope: "SHARED",
    category: "Identity",
    description:
      "Reusable tenant-scoped company user management for every client workspace, including roles, status, and password resets.",
    owner: "Auth",
    basePath: "/client-api/users",
    status: "ACTIVE",
    defaultEnabled: true,
    requiredRoles: ["owner", "admin"],
    tags: ["shared", "users", "tenant-memberships"],
    docsPath: "docs/shared-endpoints.md#users",
    configSchema: {},
    endpoints: [
      { method: "GET", path: "/client-api/users", summary: "List tenant users with filters and pagination" },
      { method: "GET", path: "/client-api/users/:id", summary: "Read one tenant user" },
      { method: "POST", path: "/client-api/users", summary: "Create or attach a tenant user" },
      { method: "PATCH", path: "/client-api/users/:id", summary: "Update profile, role, or active state" },
      { method: "POST", path: "/client-api/users/:id/password", summary: "Reset a tenant user password" },
      { method: "DELETE", path: "/client-api/users/:id", summary: "Deactivate a tenant user" }
    ]
  },
  {
    key: "tenant-operations",
    name: "Tenant operations",
    scope: "SHARED",
    category: "Operations",
    description:
      "Read-only tenant operations endpoints backed by each client's white-label records and work queue data.",
    owner: "Client API",
    basePath: "/client-api/operations",
    status: "ACTIVE",
    defaultEnabled: true,
    requiredRoles: [],
    tags: ["shared", "operations", "white-label"],
    docsPath: "docs/shared-endpoints.md#generic-operations",
    configSchema: {},
    endpoints: [
      { method: "GET", path: "/client-api/operations", summary: "Read tenant operations summary" },
      { method: "GET", path: "/client-api/operations/records", summary: "List tenant-specific operation records" },
      { method: "GET", path: "/client-api/operations/work-items", summary: "List tenant-specific work items" }
    ]
  },
  {
    key: "client-admin-panel",
    name: "Client admin panel context",
    scope: "SHARED",
    category: "Platform",
    description:
      "Shared client admin panel context and data bundle endpoints for every client workspace.",
    owner: "Client API",
    basePath: "/client-api/admin-panel",
    status: "ACTIVE",
    defaultEnabled: true,
    requiredRoles: [],
    tags: ["shared", "admin-panel", "context"],
    docsPath: "docs/shared-endpoints.md#admin-panel-context",
    configSchema: {},
    endpoints: [
      { method: "GET", path: "/client-api/admin-panel/context", summary: "Read client admin panel context" },
      { method: "GET", path: "/client-api/admin-panel/data", summary: "Read client admin panel data bundle" }
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
    status: "ACTIVE",
    defaultEnabled: false,
    requiredRoles: ["superadmin", "platform_admin"],
    tags: ["shared", "platform", "admin-panel"],
    docsPath: "docs/shared-endpoints.md#admin-panel-context",
    configSchema: {},
    endpoints: [
      { method: "GET", path: "/api/admin-panel/context", summary: "Read platform admin panel context" }
    ]
  },
  {
    key: "client-secrets",
    name: "Client secrets",
    scope: "SHARED",
    category: "Security",
    description:
      "Tenant-scoped encrypted secret metadata, versions, audit events, and grants for client workspaces.",
    owner: "Client API",
    basePath: "/client-api/secrets",
    status: "ACTIVE",
    defaultEnabled: true,
    requiredRoles: ["owner", "admin"],
    tags: ["shared", "secrets", "encrypted"],
    docsPath: "docs/shared-endpoints.md#secrets",
    configSchema: {},
    endpoints: [
      { method: "GET", path: "/client-api/secrets", summary: "List secret metadata" },
      { method: "POST", path: "/client-api/secrets", summary: "Create secret container" },
      { method: "GET", path: "/client-api/secrets/audit", summary: "List secret audit events" },
      { method: "GET", path: "/client-api/secrets/:secret", summary: "Read secret metadata" },
      { method: "PATCH", path: "/client-api/secrets/:secret", summary: "Update secret metadata" },
      { method: "GET", path: "/client-api/secrets/:secret/versions", summary: "List secret versions" },
      { method: "POST", path: "/client-api/secrets/:secret/versions", summary: "Add encrypted secret version" },
      { method: "GET", path: "/client-api/secrets/:secret/versions/:version/access", summary: "Decrypt enabled secret version" },
      { method: "PATCH", path: "/client-api/secrets/:secret/versions/:version", summary: "Enable or disable secret version" },
      { method: "DELETE", path: "/client-api/secrets/:secret/versions/:version", summary: "Destroy secret version payload" },
      { method: "GET", path: "/client-api/secrets/:secret/grants", summary: "List secret grants" },
      { method: "PUT", path: "/client-api/secrets/:secret/grants/:userId", summary: "Grant per-secret access" },
      { method: "DELETE", path: "/client-api/secrets/:secret/grants/:userId", summary: "Revoke per-secret access" }
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
    status: "ACTIVE",
    defaultEnabled: false,
    requiredRoles: ["superadmin", "platform_admin"],
    tags: ["shared", "platform", "secrets"],
    docsPath: "docs/shared-endpoints.md#secrets",
    configSchema: {},
    endpoints: [
      { method: "POST", path: "/api/system/secrets", summary: "Provision encrypted client secret metadata" }
    ]
  },
  {
    key: "client-service-discovery",
    name: "Client service discovery",
    scope: "SHARED",
    category: "Platform",
    description:
      "Shared endpoint inventory for enabled and documented client API backend services.",
    owner: "Client API",
    basePath: "/client-api/services",
    status: "ACTIVE",
    defaultEnabled: true,
    requiredRoles: [],
    tags: ["shared", "services", "catalog"],
    docsPath: "docs/shared-endpoints.md#service-catalog",
    configSchema: {},
    endpoints: [
      { method: "GET", path: "/client-api/services", summary: "List enabled services for the signed-in tenant" },
      { method: "GET", path: "/client-api/services/catalog", summary: "List complete documented client API service catalog" },
      { method: "GET", path: "/client-api/services/:serviceKey", summary: "Read one enabled service for the signed-in tenant" }
    ]
  },
  {
    key: "backend-service-catalog",
    name: "Backend service catalog",
    scope: "SHARED",
    category: "Platform",
    description:
      "Control-plane endpoints for service definitions plus per-client service assignment and visibility.",
    owner: "Platform",
    basePath: "/api/services, /api/clients/:tenantId/services, /client-api/services",
    status: "ACTIVE",
    defaultEnabled: false,
    requiredRoles: ["superadmin", "platform_admin"],
    tags: ["shared", "service-catalog", "control-plane"],
    docsPath: "docs/shared-endpoints.md#service-catalog",
    configSchema: {},
    endpoints: [
      { method: "GET", path: "/api/services", summary: "List all backend service definitions" },
      { method: "GET", path: "/api/services/:serviceKey", summary: "Read one backend service definition" },
      { method: "POST", path: "/api/services", summary: "Create a backend service definition" },
      { method: "PATCH", path: "/api/services/:serviceKey", summary: "Update a backend service definition" },
      { method: "GET", path: "/api/clients/:tenantId/services", summary: "List service assignments for one tenant" },
      { method: "GET", path: "/api/clients/:tenantId/services/:serviceKey", summary: "Read one service assignment for one tenant" },
      { method: "PUT", path: "/api/clients/:tenantId/services/:serviceKey", summary: "Assign or override a service for one tenant" },
      { method: "DELETE", path: "/api/clients/:tenantId/services/:serviceKey", summary: "Remove a service assignment override for one tenant" },
      { method: "GET", path: "/client-api/services", summary: "List enabled services for the signed-in tenant" },
      { method: "GET", path: "/client-api/services/catalog", summary: "List complete documented client API service catalog" }
    ]
  },
  {
    key: "client-database-registry",
    name: "Client database registry",
    scope: "SHARED",
    category: "Data",
    description:
      "EsteemedEngineering control-plane service for encrypted shared or dedicated client database connection assignments.",
    owner: "Platform",
    basePath: "/api/system/database-connections",
    status: "ACTIVE",
    defaultEnabled: false,
    requiredRoles: ["superadmin", "platform_admin"],
    tags: ["shared", "database", "supabase", "encrypted"],
    docsPath: "docs/shared-endpoints.md#database-connections",
    configSchema: {},
    endpoints: [
      { method: "GET", path: "/api/system/database-connections", summary: "List shared or dedicated database modes for clients" },
      { method: "GET", path: "/api/system/database-providers", summary: "List supported dedicated database providers" },
      { method: "PUT", path: "/api/system/database-connections/:tenantId", summary: "Save an encrypted client database connection" },
      { method: "POST", path: "/api/system/database-connections/:tenantId/test", summary: "Run a live connection test" },
      { method: "DELETE", path: "/api/system/database-connections/:tenantId", summary: "Return a client to the shared platform database" }
    ]
  },
  {
    key: "platform-account-api-keys",
    name: "Platform account and API keys",
    scope: "SHARED",
    category: "Platform",
    description:
      "Platform account profile, API surface summaries, and preview API key metadata endpoints.",
    owner: "Platform",
    basePath: "/api/account, /api/api-surfaces, /api/authorization",
    status: "ACTIVE",
    defaultEnabled: false,
    requiredRoles: ["superadmin", "platform_admin"],
    tags: ["shared", "platform", "api-keys"],
    docsPath: "docs/shared-endpoints.md#platform-account-and-api-keys",
    configSchema: {},
    endpoints: [
      { method: "GET", path: "/api/account/profile", summary: "Read platform admin account profile" },
      { method: "GET", path: "/api/api-surfaces", summary: "List seeded API surface summaries" },
      { method: "POST", path: "/api/authorization/api-keys", summary: "Create preview API key metadata" }
    ]
  },
  {
    key: "client-onboarding",
    name: "Client onboarding",
    scope: "SHARED",
    category: "Platform",
    description:
      "Superadmin endpoints for creating client tenants, tenant settings, white-label panels, owners, and memberships.",
    owner: "Platform",
    basePath: "/api/clients",
    status: "ACTIVE",
    defaultEnabled: false,
    requiredRoles: ["superadmin", "platform_admin"],
    tags: ["shared", "clients", "onboarding"],
    docsPath: "docs/shared-endpoints.md#clients",
    configSchema: {},
    endpoints: [
      { method: "GET", path: "/api/clients", summary: "List client tenants" },
      { method: "GET", path: "/api/clients/:idOrSlug", summary: "Read one client tenant" },
      { method: "POST", path: "/api/clients", summary: "Create a client tenant and optional owner" }
    ]
  },
  {
    key: "peptrace-platform-maintenance",
    name: "Peptrace platform maintenance",
    scope: "CLIENT_SPECIFIC",
    category: "Peptrace",
    description:
      "Platform JWT endpoints for maintaining Peptrace reference catalog and lab testing records.",
    owner: "Platform",
    basePath: "/api/vendors, /api/peptides, /api/labs, /api/testing",
    status: "ACTIVE",
    defaultEnabled: false,
    requiredRoles: ["superadmin", "platform_admin"],
    tags: ["client-specific", "peptrace", "platform-maintenance", "catalog", "testing"],
    docsPath: "docs/peptrace-endpoints.md#platform-maintenance",
    configSchema: { tenantSlug: "peptrace" },
    endpoints: [
      { method: "GET", path: "/api/vendors", summary: "List vendors" },
      { method: "GET", path: "/api/vendor/:idOrSlug", summary: "Read one vendor" },
      { method: "POST", path: "/api/vendors", summary: "Create vendor" },
      { method: "GET", path: "/api/peptides", summary: "List peptides" },
      { method: "GET", path: "/api/peptide/:idOrSlug", summary: "Read one peptide" },
      { method: "POST", path: "/api/peptides", summary: "Create peptide" },
      { method: "GET", path: "/api/labs", summary: "List labs" },
      { method: "POST", path: "/api/labs", summary: "Create lab" },
      { method: "GET", path: "/api/testing", summary: "List lab tests" },
      { method: "GET", path: "/api/testing/:id", summary: "Read one lab test" },
      { method: "POST", path: "/api/testing", summary: "Create lab test" }
    ]
  },
  {
    key: "peptrace-quality",
    name: "Peptrace quality intelligence website and admin",
    scope: "CLIENT_SPECIFIC",
    category: "Peptrace",
    description:
      "Peptrace-specific backend for public vendor/product comparison, released lab tests, certificate verification, and admin batch/certificate operations.",
    owner: "Peptrace",
    basePath: "/client-api/public/quality, /client-api/quality",
    status: "ACTIVE",
    defaultEnabled: false,
    requiredRoles: [],
    tags: ["client-specific", "peptrace", "catalog", "testing", "certificates", "public-verification"],
    docsPath: "docs/peptrace-endpoints.md",
    configSchema: { tenantSlug: "peptrace" },
    endpoints: [
      { method: "GET", path: "/client-api/public/quality/vendors", summary: "Public vendor comparison" },
      { method: "GET", path: "/client-api/public/quality/vendors/:idOrSlug", summary: "Public vendor detail" },
      { method: "GET", path: "/client-api/public/quality/peptides", summary: "Public peptide index" },
      { method: "GET", path: "/client-api/public/quality/peptides/:idOrSlug", summary: "Public peptide detail" },
      { method: "GET", path: "/client-api/public/quality/tests", summary: "Public released lab tests" },
      { method: "GET", path: "/client-api/public/quality/certificates/:idOrNumber/verify", summary: "Verify certificate of analysis" },
      { method: "GET", path: "/client-api/quality/vendors", summary: "List peptide vendors" },
      { method: "GET", path: "/client-api/quality/vendors/:idOrSlug", summary: "Read one peptide vendor" },
      { method: "GET", path: "/client-api/quality/peptides", summary: "List peptides" },
      { method: "GET", path: "/client-api/quality/peptides/:idOrSlug", summary: "Read one peptide" },
      { method: "GET", path: "/client-api/quality/labs", summary: "List labs" },
      { method: "GET", path: "/client-api/quality/tests", summary: "List lab tests" },
      { method: "GET", path: "/client-api/quality/tests/:id", summary: "Read one lab test" },
      { method: "GET", path: "/client-api/quality/batches", summary: "List quality batches" },
      { method: "GET", path: "/client-api/quality/batches/:idOrCode", summary: "Read one quality batch" },
      { method: "POST", path: "/client-api/quality/batches", summary: "Create a quality batch" },
      { method: "PATCH", path: "/client-api/quality/batches/:id", summary: "Edit a quality batch" },
      { method: "PATCH", path: "/client-api/quality/batches/:id/status", summary: "Update batch status" },
      { method: "DELETE", path: "/client-api/quality/batches/:id", summary: "Archive a quality batch" },
      { method: "GET", path: "/client-api/quality/certificates", summary: "List certificates of analysis" },
      { method: "GET", path: "/client-api/quality/certificates/:idOrNumber", summary: "Read one certificate of analysis" },
      { method: "POST", path: "/client-api/quality/certificates", summary: "Create a certificate of analysis" },
      { method: "PATCH", path: "/client-api/quality/certificates/:id", summary: "Edit a certificate of analysis" },
      { method: "PATCH", path: "/client-api/quality/certificates/:id/status", summary: "Update certificate status" },
      { method: "DELETE", path: "/client-api/quality/certificates/:id", summary: "Archive a certificate of analysis" }
    ]
  },
  {
    key: "shamstay-operations",
    name: "Shamstay BnB marketplace and operations",
    scope: "CLIENT_SPECIFIC",
    category: "Shamstay BnB",
    description:
      "Shamstay-specific backend for public property discovery, booking requests, quote/payment capture, guest messages, host calendars, reviews, turnovers, maintenance, owner payouts, and refunds.",
    owner: "Shamstay BnB",
    basePath: "/client-api/public/shamstay, /client-api/shamstay",
    status: "ACTIVE",
    defaultEnabled: false,
    requiredRoles: [],
    tags: ["client-specific", "bnb", "marketplace", "operations", "billing"],
    docsPath: "docs/shamstay-endpoints.md",
    configSchema: { tenantSlug: "shamstay-bnb" },
    endpoints: [
      { method: "GET", path: "/client-api/shamstay/analytics/overview", summary: "Dashboard rollup for Shamstay operations" },
      { method: "GET", path: "/client-api/public/shamstay/properties", summary: "Public property search with availability filters" },
      { method: "GET", path: "/client-api/public/shamstay/properties/:idOrSlug", summary: "Public property detail" },
      { method: "GET", path: "/client-api/public/shamstay/properties/:idOrSlug/quote", summary: "Quote available dates and total stay amount" },
      { method: "GET", path: "/client-api/public/shamstay/properties/:idOrSlug/reviews", summary: "Public property reviews" },
      { method: "POST", path: "/client-api/public/shamstay/reservation-requests", summary: "Create website booking request" },
      { method: "POST", path: "/client-api/public/shamstay/payments", summary: "Create provider-neutral payment intent metadata" },
      { method: "POST", path: "/client-api/public/shamstay/contact", summary: "Create guest inquiry thread" },
      { method: "GET", path: "/client-api/public/shamstay/wishlist", summary: "List saved properties for a visitor" },
      { method: "POST", path: "/client-api/public/shamstay/wishlist", summary: "Save property for a visitor" },
      { method: "DELETE", path: "/client-api/public/shamstay/wishlist/:propertyIdOrSlug", summary: "Remove saved property for a visitor" },
      { method: "GET", path: "/client-api/shamstay/properties", summary: "List rental properties" },
      { method: "GET", path: "/client-api/shamstay/properties/:idOrSlug", summary: "Read one rental property" },
      { method: "POST", path: "/client-api/shamstay/properties", summary: "Create rental property" },
      { method: "PATCH", path: "/client-api/shamstay/properties/:id", summary: "Edit rental property" },
      { method: "PATCH", path: "/client-api/shamstay/properties/:id/status", summary: "Update rental property status" },
      { method: "DELETE", path: "/client-api/shamstay/properties/:id", summary: "Archive rental property" },
      { method: "GET", path: "/client-api/shamstay/properties/:propertyId/availability-blocks", summary: "List calendar availability blocks" },
      { method: "POST", path: "/client-api/shamstay/properties/:propertyId/availability-blocks", summary: "Create calendar availability block" },
      { method: "PATCH", path: "/client-api/shamstay/availability-blocks/:id", summary: "Edit calendar availability block" },
      { method: "DELETE", path: "/client-api/shamstay/availability-blocks/:id", summary: "Remove calendar availability block" },
      { method: "GET", path: "/client-api/shamstay/guests", summary: "List guest records" },
      { method: "GET", path: "/client-api/shamstay/guests/:id", summary: "Read one guest record" },
      { method: "POST", path: "/client-api/shamstay/guests", summary: "Create guest record" },
      { method: "PATCH", path: "/client-api/shamstay/guests/:id", summary: "Edit guest record" },
      { method: "GET", path: "/client-api/shamstay/reservations", summary: "List reservations" },
      { method: "GET", path: "/client-api/shamstay/reservations/:id", summary: "Read one reservation" },
      { method: "POST", path: "/client-api/shamstay/reservations", summary: "Create reservation" },
      { method: "PATCH", path: "/client-api/shamstay/reservations/:id", summary: "Edit reservation" },
      { method: "PATCH", path: "/client-api/shamstay/reservations/:id/status", summary: "Update reservation status" },
      { method: "DELETE", path: "/client-api/shamstay/reservations/:id", summary: "Archive reservation" },
      { method: "GET", path: "/client-api/shamstay/conversations", summary: "List guest conversations" },
      { method: "POST", path: "/client-api/shamstay/conversations", summary: "Create guest conversation" },
      { method: "GET", path: "/client-api/shamstay/conversations/:id", summary: "Read one guest conversation" },
      { method: "DELETE", path: "/client-api/shamstay/conversations/:id", summary: "Archive guest conversation" },
      { method: "GET", path: "/client-api/shamstay/conversations/:id/messages", summary: "List guest conversation messages" },
      { method: "POST", path: "/client-api/shamstay/conversations/:id/messages", summary: "Send host message" },
      { method: "GET", path: "/client-api/shamstay/reviews", summary: "List and moderate reviews" },
      { method: "GET", path: "/client-api/shamstay/reviews/:id", summary: "Read one review" },
      { method: "POST", path: "/client-api/shamstay/reviews", summary: "Create or import review" },
      { method: "PATCH", path: "/client-api/shamstay/reviews/:id/status", summary: "Moderate review status" },
      { method: "PATCH", path: "/client-api/shamstay/reviews/:id/response", summary: "Add host review response" },
      { method: "DELETE", path: "/client-api/shamstay/reviews/:id", summary: "Archive review" },
      { method: "GET", path: "/client-api/shamstay/turnovers", summary: "List turnovers" },
      { method: "GET", path: "/client-api/shamstay/turnovers/:id", summary: "Read one turnover" },
      { method: "POST", path: "/client-api/shamstay/turnovers", summary: "Create turnover" },
      { method: "PATCH", path: "/client-api/shamstay/turnovers/:id", summary: "Edit turnover" },
      { method: "PATCH", path: "/client-api/shamstay/turnovers/:id/status", summary: "Update turnover status" },
      { method: "DELETE", path: "/client-api/shamstay/turnovers/:id", summary: "Archive turnover" },
      { method: "GET", path: "/client-api/shamstay/maintenance", summary: "List maintenance tickets" },
      { method: "GET", path: "/client-api/shamstay/maintenance/:id", summary: "Read one maintenance ticket" },
      { method: "POST", path: "/client-api/shamstay/maintenance", summary: "Create maintenance ticket" },
      { method: "PATCH", path: "/client-api/shamstay/maintenance/:id", summary: "Edit maintenance ticket" },
      { method: "PATCH", path: "/client-api/shamstay/maintenance/:id/status", summary: "Update maintenance status" },
      { method: "DELETE", path: "/client-api/shamstay/maintenance/:id", summary: "Archive maintenance ticket" },
      { method: "GET", path: "/client-api/shamstay/payouts", summary: "List owner payouts" },
      { method: "GET", path: "/client-api/shamstay/payouts/:id", summary: "Read one owner payout" },
      { method: "POST", path: "/client-api/shamstay/payouts", summary: "Create owner payout" },
      { method: "PATCH", path: "/client-api/shamstay/payouts/:id", summary: "Edit owner payout" },
      { method: "PATCH", path: "/client-api/shamstay/payouts/:id/status", summary: "Update owner payout status" },
      { method: "DELETE", path: "/client-api/shamstay/payouts/:id", summary: "Archive owner payout" },
      { method: "GET", path: "/client-api/shamstay/payments", summary: "List reservation payments" },
      { method: "GET", path: "/client-api/shamstay/payments/:id", summary: "Read one payment" },
      { method: "POST", path: "/client-api/shamstay/payments", summary: "Create payment record" },
      { method: "PATCH", path: "/client-api/shamstay/payments/:id", summary: "Edit payment record" },
      { method: "PATCH", path: "/client-api/shamstay/payments/:id/status", summary: "Update payment status" },
      { method: "POST", path: "/client-api/shamstay/payments/:id/refunds", summary: "Apply payment refund" },
      { method: "DELETE", path: "/client-api/shamstay/payments/:id", summary: "Void payment" }
    ]
  },
  {
    key: "sham-real-estate-operations",
    name: "Sham Real Estate Hub marketplace and brokerage operations",
    scope: "CLIENT_SPECIFIC",
    category: "Sham Real Estate Hub",
    description:
      "Real-estate-specific backend for public listing search, inquiries, tour requests, saved homes, saved searches, brokerage listings, leads, viewings, offers, and commission tracking.",
    owner: "Sham Real Estate Hub",
    basePath: "/client-api/public/real-estate, /client-api/real-estate",
    status: "ACTIVE",
    defaultEnabled: false,
    requiredRoles: [],
    tags: ["client-specific", "real-estate", "marketplace", "operations"],
    docsPath: "docs/shamrealestate-endpoints.md",
    configSchema: { tenantSlug: "sham-real-estate-hub" },
    endpoints: [
      { method: "GET", path: "/client-api/real-estate/analytics/overview", summary: "Dashboard rollup for real estate brokerage operations" },
      { method: "GET", path: "/client-api/public/real-estate/listings", summary: "Public listing search" },
      { method: "GET", path: "/client-api/public/real-estate/listings/:idOrSlug", summary: "Public listing detail" },
      { method: "POST", path: "/client-api/public/real-estate/inquiries", summary: "Create buyer or renter inquiry" },
      { method: "POST", path: "/client-api/public/real-estate/tour-requests", summary: "Request a listing tour" },
      { method: "GET", path: "/client-api/public/real-estate/saved-listings", summary: "List saved listings for a visitor" },
      { method: "POST", path: "/client-api/public/real-estate/saved-listings", summary: "Save listing for a visitor" },
      { method: "DELETE", path: "/client-api/public/real-estate/saved-listings/:listingIdOrSlug", summary: "Remove saved listing for a visitor" },
      { method: "GET", path: "/client-api/public/real-estate/saved-searches", summary: "List saved search filters" },
      { method: "POST", path: "/client-api/public/real-estate/saved-searches", summary: "Save listing search filters" },
      { method: "DELETE", path: "/client-api/public/real-estate/saved-searches/:id", summary: "Delete saved search filters" },
      { method: "GET", path: "/client-api/real-estate/listings", summary: "List property listings" },
      { method: "GET", path: "/client-api/real-estate/listings/:idOrSlug", summary: "Read one property listing" },
      { method: "POST", path: "/client-api/real-estate/listings", summary: "Create property listing" },
      { method: "PATCH", path: "/client-api/real-estate/listings/:id", summary: "Edit property listing" },
      { method: "PATCH", path: "/client-api/real-estate/listings/:id/status", summary: "Update property listing status" },
      { method: "DELETE", path: "/client-api/real-estate/listings/:id", summary: "Archive property listing" },
      { method: "GET", path: "/client-api/real-estate/leads", summary: "List buyer and tenant leads" },
      { method: "GET", path: "/client-api/real-estate/leads/:id", summary: "Read one buyer or tenant lead" },
      { method: "POST", path: "/client-api/real-estate/leads", summary: "Create lead" },
      { method: "PATCH", path: "/client-api/real-estate/leads/:id", summary: "Edit lead" },
      { method: "PATCH", path: "/client-api/real-estate/leads/:id/status", summary: "Update lead status" },
      { method: "DELETE", path: "/client-api/real-estate/leads/:id", summary: "Archive lead" },
      { method: "GET", path: "/client-api/real-estate/viewings", summary: "List scheduled viewings" },
      { method: "GET", path: "/client-api/real-estate/viewings/:id", summary: "Read one viewing" },
      { method: "POST", path: "/client-api/real-estate/viewings", summary: "Create viewing" },
      { method: "PATCH", path: "/client-api/real-estate/viewings/:id", summary: "Edit viewing" },
      { method: "PATCH", path: "/client-api/real-estate/viewings/:id/status", summary: "Update viewing status" },
      { method: "DELETE", path: "/client-api/real-estate/viewings/:id", summary: "Archive viewing" },
      { method: "GET", path: "/client-api/real-estate/offers", summary: "List offers" },
      { method: "GET", path: "/client-api/real-estate/offers/:id", summary: "Read one offer" },
      { method: "POST", path: "/client-api/real-estate/offers", summary: "Create offer" },
      { method: "PATCH", path: "/client-api/real-estate/offers/:id", summary: "Edit offer" },
      { method: "PATCH", path: "/client-api/real-estate/offers/:id/status", summary: "Update offer status" },
      { method: "DELETE", path: "/client-api/real-estate/offers/:id", summary: "Archive offer" },
      { method: "GET", path: "/client-api/real-estate/commissions", summary: "List commissions" },
      { method: "GET", path: "/client-api/real-estate/commissions/:id", summary: "Read one commission" },
      { method: "POST", path: "/client-api/real-estate/commissions", summary: "Create commission" },
      { method: "PATCH", path: "/client-api/real-estate/commissions/:id", summary: "Edit commission" },
      { method: "PATCH", path: "/client-api/real-estate/commissions/:id/status", summary: "Update commission status" },
      { method: "DELETE", path: "/client-api/real-estate/commissions/:id", summary: "Void commission" },
      { method: "GET", path: "/client-api/real-estate/saved-listings", summary: "List saved listing signals" },
      { method: "GET", path: "/client-api/real-estate/saved-searches", summary: "List saved search signals" }
    ]
  }
];

const tenantBackendServices = [
  {
    tenantId: "client-peptrace",
    serviceKey: "peptrace-quality",
    isEnabled: true,
    status: "ENABLED",
    config: {
      tenantSlug: "peptrace",
      modules: [
        "public-vendors",
        "public-peptides",
        "public-tests",
        "certificate-verification",
        "vendors",
        "peptides",
        "labs",
        "testing",
        "batches",
        "certificates"
      ]
    },
    notes: "Peptrace-specific quality intelligence service."
  },
  {
    tenantId: "client-shamstay-bnb",
    serviceKey: "shamstay-operations",
    isEnabled: true,
    status: "ENABLED",
    config: {
      tenantSlug: "shamstay-bnb",
      modules: [
        "analytics",
        "public-properties",
        "reservation-requests",
        "payments",
        "wishlists",
        "properties",
        "availability",
        "guests",
        "reservations",
        "conversations",
        "reviews",
        "turnovers",
        "maintenance",
        "payouts",
        "billing"
      ]
    },
    notes: "Shamstay-specific operations profile."
  },
  {
    tenantId: "client-sham-real-estate-hub",
    serviceKey: "sham-real-estate-operations",
    isEnabled: true,
    status: "ENABLED",
    config: {
      tenantSlug: "sham-real-estate-hub",
      modules: [
        "analytics",
        "public-listings",
        "inquiries",
        "tour-requests",
        "saved-listings",
        "saved-searches",
        "listings",
        "leads",
        "viewings",
        "offers",
        "commissions"
      ]
    },
    notes: "Sham Real Estate Hub-specific operations profile."
  }
];

const shamstayProperties = [
  {
    id: "shamstay-property-old-damascus-courtyard",
    tenantId: "client-shamstay-bnb",
    name: "Old Damascus Courtyard Home",
    slug: "old-damascus-courtyard-home",
    address: "Straight Street, Old Damascus",
    city: "Damascus",
    country: "Syria",
    propertyType: "Courtyard home",
    bedrooms: 3,
    bathrooms: 2,
    maxGuests: 6,
    nightlyRate: 18500,
    cleaningFee: 4500,
    currency: "USD",
    status: "ACTIVE",
    ownerName: "Nadia Al-Khatib",
    rating: 4.9
  },
  {
    id: "shamstay-property-aleppo-citadel-loft",
    tenantId: "client-shamstay-bnb",
    name: "Aleppo Citadel Loft",
    slug: "aleppo-citadel-loft",
    address: "Citadel View Road",
    city: "Aleppo",
    country: "Syria",
    propertyType: "Loft",
    bedrooms: 2,
    bathrooms: 1.5,
    maxGuests: 4,
    nightlyRate: 14200,
    cleaningFee: 3200,
    currency: "USD",
    status: "ACTIVE",
    ownerName: "Samir Haddad",
    rating: 4.7
  }
];

const shamstayGuests = [
  {
    id: "shamstay-guest-maya-santos",
    tenantId: "client-shamstay-bnb",
    fullName: "Maya Santos",
    email: "maya.santos@example.com",
    phone: "+1 415 555 0192",
    country: "United States",
    notes: "Prefers late checkout when available."
  },
  {
    id: "shamstay-guest-omar-nasser",
    tenantId: "client-shamstay-bnb",
    fullName: "Omar Nasser",
    email: "omar.nasser@example.com",
    phone: "+971 50 555 0101",
    country: "UAE",
    notes: "Returning guest."
  }
];

const shamstayReservations = [
  {
    id: "shamstay-reservation-sham-1001",
    tenantId: "client-shamstay-bnb",
    propertyId: "shamstay-property-old-damascus-courtyard",
    guestId: "shamstay-guest-maya-santos",
    confirmationCode: "SHAM-1001",
    status: "CHECK_IN_TODAY",
    checkIn: "2026-08-17T15:00:00Z",
    checkOut: "2026-08-22T11:00:00Z",
    guests: 4,
    channel: "Direct",
    nightlyRate: 18500,
    fees: 4500,
    taxes: 6200,
    totalAmount: 103200,
    currency: "USD",
    notes: "Digital check-in sent."
  },
  {
    id: "shamstay-reservation-sham-1002",
    tenantId: "client-shamstay-bnb",
    propertyId: "shamstay-property-aleppo-citadel-loft",
    guestId: "shamstay-guest-omar-nasser",
    confirmationCode: "SHAM-1002",
    status: "BOOKED",
    checkIn: "2026-08-21T15:00:00Z",
    checkOut: "2026-08-25T11:00:00Z",
    guests: 2,
    channel: "Airbnb",
    nightlyRate: 14200,
    fees: 3200,
    taxes: 4100,
    totalAmount: 64100,
    currency: "USD",
    notes: "Guest requested airport transfer options."
  }
];

const shamstayTurnovers = [
  {
    id: "shamstay-turnover-old-damascus-001",
    tenantId: "client-shamstay-bnb",
    propertyId: "shamstay-property-old-damascus-courtyard",
    reservationId: "shamstay-reservation-sham-1001",
    status: "SCHEDULED",
    scheduledFor: "2026-08-22T12:30:00Z",
    assignedTeam: "Linen team A",
    checklist: ["linens", "bathrooms", "kitchen", "courtyard inspection"],
    completedAt: null,
    notes: "Back patio needs inspection after checkout."
  },
  {
    id: "shamstay-turnover-aleppo-001",
    tenantId: "client-shamstay-bnb",
    propertyId: "shamstay-property-aleppo-citadel-loft",
    reservationId: "shamstay-reservation-sham-1002",
    status: "PENDING_TEAM_CONFIRMATION",
    scheduledFor: "2026-08-25T12:00:00Z",
    assignedTeam: "Aleppo reset crew",
    checklist: ["linen reset", "window check", "keybox reset"],
    completedAt: null,
    notes: "Back-to-back stay possible."
  }
];

const shamstayMaintenanceTickets = [
  {
    id: "shamstay-maintenance-ac-villa-001",
    tenantId: "client-shamstay-bnb",
    propertyId: "shamstay-property-old-damascus-courtyard",
    title: "AC condenser inspection",
    category: "HVAC",
    priority: "HIGH",
    status: "OPEN",
    dueAt: "2026-08-18T12:00:00Z",
    vendorName: "Levant Cooling",
    estimatedCost: 18000,
    actualCost: null,
    currency: "USD",
    notes: "Owner approval required before repair."
  },
  {
    id: "shamstay-maintenance-aleppo-lock-001",
    tenantId: "client-shamstay-bnb",
    propertyId: "shamstay-property-aleppo-citadel-loft",
    title: "Smart lock battery replacement",
    category: "Access",
    priority: "MEDIUM",
    status: "SCHEDULED",
    dueAt: "2026-08-20T10:00:00Z",
    vendorName: "Citadel Access",
    estimatedCost: 2500,
    actualCost: null,
    currency: "USD",
    notes: "Replace batteries before next guest."
  }
];

const shamstayOwnerPayouts = [
  {
    id: "shamstay-payout-old-damascus-2026-08",
    tenantId: "client-shamstay-bnb",
    propertyId: "shamstay-property-old-damascus-courtyard",
    periodStart: "2026-08-01T00:00:00Z",
    periodEnd: "2026-08-31T23:59:59Z",
    grossRevenue: 312000,
    expenses: 42000,
    platformFees: 31200,
    netPayout: 238800,
    currency: "USD",
    status: "DRAFT",
    paidAt: null,
    notes: "Pending maintenance deduction approval."
  },
  {
    id: "shamstay-payout-aleppo-2026-08",
    tenantId: "client-shamstay-bnb",
    propertyId: "shamstay-property-aleppo-citadel-loft",
    periodStart: "2026-08-01T00:00:00Z",
    periodEnd: "2026-08-31T23:59:59Z",
    grossRevenue: 184000,
    expenses: 21000,
    platformFees: 18400,
    netPayout: 144600,
    currency: "USD",
    status: "READY",
    paidAt: null,
    notes: "Ready for owner payout batch."
  }
];

const shamstayPayments = [
  {
    id: "shamstay-payment-sham-1001",
    tenantId: "client-shamstay-bnb",
    propertyId: "shamstay-property-old-damascus-courtyard",
    reservationId: "shamstay-reservation-sham-1001",
    guestId: "shamstay-guest-maya-santos",
    provider: "manual",
    providerReference: "MANUAL-SHAM-1001",
    type: "CHARGE",
    status: "PAID",
    amount: 103200,
    currency: "USD",
    fees: 4500,
    taxes: 6200,
    refundAmount: 0,
    paidAt: "2026-08-17T12:00:00Z",
    refundedAt: null,
    notes: "Captured direct booking payment.",
    metadata: { channel: "Direct" }
  },
  {
    id: "shamstay-payment-sham-1002",
    tenantId: "client-shamstay-bnb",
    propertyId: "shamstay-property-aleppo-citadel-loft",
    reservationId: "shamstay-reservation-sham-1002",
    guestId: "shamstay-guest-omar-nasser",
    provider: "airbnb",
    providerReference: "AIRBNB-SHAM-1002",
    type: "CHARGE",
    status: "PENDING",
    amount: 64100,
    currency: "USD",
    fees: 3200,
    taxes: 4100,
    refundAmount: 0,
    paidAt: null,
    refundedAt: null,
    notes: "Pending channel payout reconciliation.",
    metadata: { channel: "Airbnb" }
  }
];

const realEstateListings = [
  {
    id: "real-estate-listing-malki-penthouse",
    tenantId: "client-sham-real-estate-hub",
    title: "Malki Penthouse",
    slug: "malki-penthouse",
    propertyType: "Penthouse",
    address: "Malki District",
    district: "Malki",
    city: "Damascus",
    price: 89000000,
    currency: "USD",
    status: "PUBLISHED",
    bedrooms: 4,
    bathrooms: 3.5,
    sizeSqm: 310,
    ownerName: "Private Seller",
    assignedAgent: "Rana Darwish",
    publishedAt: "2026-08-01T10:00:00Z"
  },
  {
    id: "real-estate-listing-mezzeh-office",
    tenantId: "client-sham-real-estate-hub",
    title: "Mezzeh Office",
    slug: "mezzeh-office",
    propertyType: "Commercial office",
    address: "Mezzeh Business Avenue",
    district: "Mezzeh",
    city: "Damascus",
    price: 34000000,
    currency: "USD",
    status: "VALUATION_REVIEW",
    bedrooms: null,
    bathrooms: 2,
    sizeSqm: 180,
    ownerName: "Levant Holdings",
    assignedAgent: "Karim Mansour",
    publishedAt: null
  }
];

const realEstateLeads = [
  {
    id: "real-estate-lead-yara-hassan",
    tenantId: "client-sham-real-estate-hub",
    listingId: "real-estate-listing-malki-penthouse",
    fullName: "Yara Hassan",
    email: "yara.hassan@example.com",
    phone: "+963 944 555 120",
    source: "Portal",
    interestType: "BUYER",
    budgetMin: 80000000,
    budgetMax: 93000000,
    status: "QUALIFIED",
    priority: "HIGH",
    assignedAgent: "Rana Darwish",
    notes: "Needs weekend private viewing."
  },
  {
    id: "real-estate-lead-bassel-khoury",
    tenantId: "client-sham-real-estate-hub",
    listingId: "real-estate-listing-mezzeh-office",
    fullName: "Bassel Khoury",
    email: "bassel.khoury@example.com",
    phone: "+963 933 555 311",
    source: "Referral",
    interestType: "COMMERCIAL_BUYER",
    budgetMin: 30000000,
    budgetMax: 36000000,
    status: "NEW",
    priority: "MEDIUM",
    assignedAgent: "Karim Mansour",
    notes: "Requested updated floor plan."
  }
];

const realEstateViewings = [
  {
    id: "real-estate-viewing-malki-001",
    tenantId: "client-sham-real-estate-hub",
    listingId: "real-estate-listing-malki-penthouse",
    leadId: "real-estate-lead-yara-hassan",
    scheduledFor: "2026-08-22T14:00:00Z",
    status: "SCHEDULED",
    assignedAgent: "Rana Darwish",
    notes: "Seller approved private tour.",
    feedback: {}
  },
  {
    id: "real-estate-viewing-mezzeh-001",
    tenantId: "client-sham-real-estate-hub",
    listingId: "real-estate-listing-mezzeh-office",
    leadId: "real-estate-lead-bassel-khoury",
    scheduledFor: "2026-08-20T10:30:00Z",
    status: "PENDING_CONFIRMATION",
    assignedAgent: "Karim Mansour",
    notes: "Waiting on floor plan refresh.",
    feedback: {}
  }
];

const realEstateOffers = [
  {
    id: "real-estate-offer-malki-001",
    tenantId: "client-sham-real-estate-hub",
    listingId: "real-estate-listing-malki-penthouse",
    leadId: "real-estate-lead-yara-hassan",
    amount: 86000000,
    currency: "USD",
    status: "NEGOTIATION",
    submittedAt: "2026-08-15T12:00:00Z",
    expiresAt: "2026-08-23T12:00:00Z",
    terms: { financing: "cash", closingDays: 30 },
    notes: "Seller preparing counter-offer."
  },
  {
    id: "real-estate-offer-mezzeh-001",
    tenantId: "client-sham-real-estate-hub",
    listingId: "real-estate-listing-mezzeh-office",
    leadId: "real-estate-lead-bassel-khoury",
    amount: 32000000,
    currency: "USD",
    status: "DRAFT",
    submittedAt: "2026-08-16T10:00:00Z",
    expiresAt: null,
    terms: { inspection: true },
    notes: "Draft pending valuation review."
  }
];

const realEstateCommissions = [
  {
    id: "real-estate-commission-malki-001",
    tenantId: "client-sham-real-estate-hub",
    listingId: "real-estate-listing-malki-penthouse",
    offerId: "real-estate-offer-malki-001",
    agentName: "Rana Darwish",
    grossCommission: 1720000,
    brokerageShare: 1032000,
    agentShare: 688000,
    currency: "USD",
    status: "PENDING_CLOSE",
    dueAt: "2026-09-15T00:00:00Z",
    paidAt: null,
    notes: "Calculated at 2 percent of accepted offer."
  },
  {
    id: "real-estate-commission-mezzeh-001",
    tenantId: "client-sham-real-estate-hub",
    listingId: "real-estate-listing-mezzeh-office",
    offerId: "real-estate-offer-mezzeh-001",
    agentName: "Karim Mansour",
    grossCommission: 640000,
    brokerageShare: 384000,
    agentShare: 256000,
    currency: "USD",
    status: "DRAFT",
    dueAt: null,
    paidAt: null,
    notes: "Draft until offer becomes active."
  }
];

const peptraceBatches = [
  {
    id: "peptrace-batch-retatrutide-2026-08-a",
    tenantId: "client-peptrace",
    batchCode: "RET-2026-08-A",
    vendorId: "vendor-peptide-partners",
    peptideId: "peptide-retatrutide",
    productId: "product-retatrutide-pp",
    manufacturedAt: "2026-07-12T00:00:00Z",
    receivedAt: "2026-08-01T09:00:00Z",
    status: "CERTIFIED",
    quantityVials: 240,
    vialSizeMg: 100,
    storageCondition: "2-8C",
    notes: "Released after LC-MS review."
  },
  {
    id: "peptrace-batch-tirzepatide-2026-08-b",
    tenantId: "client-peptrace",
    batchCode: "TIR-2026-08-B",
    vendorId: "vendor-northstar-peptides",
    peptideId: "peptide-tirzepatide",
    productId: "product-tirzepatide-ns",
    manufacturedAt: "2026-07-20T00:00:00Z",
    receivedAt: "2026-08-10T09:00:00Z",
    status: "AWAITING_CERTIFICATE",
    quantityVials: 180,
    vialSizeMg: 75,
    storageCondition: "2-8C",
    notes: "Pending certificate approval."
  }
];

const peptraceCertificates = [
  {
    id: "peptrace-certificate-ret-2026-08-a",
    tenantId: "client-peptrace",
    batchId: "peptrace-batch-retatrutide-2026-08-a",
    labTestId: "test-retatrutide-001",
    certificateNumber: "COA-RET-2026-08-A",
    status: "ISSUED",
    issuedAt: "2026-08-03T12:00:00Z",
    expiresAt: "2027-08-03T12:00:00Z",
    documentUrl: null,
    summary: { purityPercent: 99.5, assay: "LC-MS", labelClaimPercent: 99.8 }
  },
  {
    id: "peptrace-certificate-tir-2026-08-b",
    tenantId: "client-peptrace",
    batchId: "peptrace-batch-tirzepatide-2026-08-b",
    labTestId: "test-tirzepatide-023",
    certificateNumber: "COA-TIR-2026-08-B",
    status: "DRAFT",
    issuedAt: null,
    expiresAt: null,
    documentUrl: null,
    summary: { assay: "LC-MS", pending: true }
  }
];

async function main() {
  for (const client of clientTenants) {
    await prisma.clientTenant.upsert({
      where: { slug: client.slug },
      update: {
        name: client.name,
        plan: client.accessStatus,
        status: client.status,
        owner: client.owner,
        seats: client.enabledAccounts,
        monthlySpend: client.operationalValue,
        openItems: client.openItems,
        dataRegion: client.dataRegion,
        lastActivityAt: new Date(client.lastActivityAt)
      },
      create: {
        id: client.id,
        name: client.name,
        slug: client.slug,
        plan: client.accessStatus,
        status: client.status,
        owner: client.owner,
        seats: client.enabledAccounts,
        monthlySpend: client.operationalValue,
        openItems: client.openItems,
        dataRegion: client.dataRegion,
        lastActivityAt: new Date(client.lastActivityAt)
      }
    });

    await prisma.tenantSettings.upsert({
      where: { tenantId: client.id },
      update: {
        branding: {
          name: client.name,
          slug: client.slug
        },
        enabledModules:
          client.slug === "peptrace"
            ? ["overview", "clients", "vendors", "peptides", "testing", "labs", "users", "secrets", "access"]
            : ["overview", "operations", "users", "secrets", "access"],
        limits: {
          plan: client.accessStatus,
          seats: client.enabledAccounts
        },
        businessSettings: {
          dataRegion: client.dataRegion,
          owner: client.owner
        }
      },
      create: {
        tenantId: client.id,
        branding: {
          name: client.name,
          slug: client.slug
        },
        enabledModules:
          client.slug === "peptrace"
            ? ["overview", "clients", "vendors", "peptides", "testing", "labs", "users", "secrets", "access"]
            : ["overview", "operations", "users", "secrets", "access"],
        integrations: {},
        limits: {
          plan: client.accessStatus,
          seats: client.enabledAccounts
        },
        labels: {},
        businessSettings: {
          dataRegion: client.dataRegion,
          owner: client.owner
        }
      }
    });
  }

  for (const panel of whiteLabelPanels) {
    await prisma.whiteLabelPanel.upsert({
      where: { clientTenantId: panel.clientTenantId },
      update: {
        brandName: panel.brandName,
        productName: panel.productName,
        industry: panel.industry,
        accentColor: panel.accentColor,
        overviewTitle: panel.overviewTitle,
        overviewDescription: panel.overviewDescription,
        operationsTitle: panel.operationsTitle,
        operationsDescription: panel.operationsDescription,
        primaryRecords: panel.primaryRecords as Prisma.InputJsonValue,
        workItems: panel.workItems as Prisma.InputJsonValue
      },
      create: {
        clientTenantId: panel.clientTenantId,
        brandName: panel.brandName,
        productName: panel.productName,
        industry: panel.industry,
        accentColor: panel.accentColor,
        overviewTitle: panel.overviewTitle,
        overviewDescription: panel.overviewDescription,
        operationsTitle: panel.operationsTitle,
        operationsDescription: panel.operationsDescription,
        primaryRecords: panel.primaryRecords as Prisma.InputJsonValue,
        workItems: panel.workItems as Prisma.InputJsonValue
      }
    });
  }

  for (const peptide of peptides) {
    await prisma.peptide.upsert({
      where: { slug: peptide.slug },
      update: {
        label: peptide.label
      },
      create: {
        id: peptide.id,
        label: peptide.label,
        slug: peptide.slug
      }
    });
  }

  for (const lab of labs) {
    await prisma.lab.upsert({
      where: { slug: lab.slug },
      update: {
        displayName: lab.displayName,
        partnerSince: new Date(lab.partnerSince)
      },
      create: {
        id: lab.id,
        displayName: lab.displayName,
        slug: lab.slug,
        partnerSince: new Date(lab.partnerSince)
      }
    });
  }

  for (const vendor of vendors) {
    await prisma.vendor.upsert({
      where: { slug: vendor.slug },
      update: {
        displayName: vendor.displayName,
        overallRating: vendor.overallRating
      },
      create: {
        id: vendor.id,
        displayName: vendor.displayName,
        slug: vendor.slug,
        overallRating: vendor.overallRating
      }
    });

    for (const product of vendor.products) {
      await prisma.vendorProduct.upsert({
        where: {
          vendorId_slug: {
            vendorId: vendor.id,
            slug: product.slug
          }
        },
        update: {
          label: product.label,
          peptideId: product.peptideId,
          priceMg: product.priceMg,
          rating: product.rating,
          doseMg: product.doseMg,
          purityPercent: product.purityPercent,
          labelAccuracyDelta: product.labelAccuracyDelta,
          testsCount: product.testsCount
        },
        create: {
          id: product.id,
          label: product.label,
          slug: product.slug,
          peptideId: product.peptideId,
          vendorId: vendor.id,
          priceMg: product.priceMg,
          rating: product.rating,
          doseMg: product.doseMg,
          purityPercent: product.purityPercent,
          labelAccuracyDelta: product.labelAccuracyDelta,
          testsCount: product.testsCount
        }
      });
    }
  }

  for (const test of labTests) {
    await prisma.labTest.upsert({
      where: { id: test.id },
      update: {
        labId: test.labId,
        vialSizeMg: test.vialSizeMg,
        vendorId: test.vendorId,
        resultsReleasedAt: test.resultsReleasedAt ? new Date(test.resultsReleasedAt) : null,
        testingStatus: test.testingStatus,
        peptideId: test.peptideId,
        assay: test.assay,
        purityPercent: test.purityPercent,
        labelClaimPercent: test.labelClaimPercent
      },
      create: {
        id: test.id,
        labId: test.labId,
        vialSizeMg: test.vialSizeMg,
        vendorId: test.vendorId,
        resultsReleasedAt: test.resultsReleasedAt ? new Date(test.resultsReleasedAt) : null,
        testingStatus: test.testingStatus,
        peptideId: test.peptideId,
        assay: test.assay,
        purityPercent: test.purityPercent,
        labelClaimPercent: test.labelClaimPercent
      }
    });
  }

  for (const property of shamstayProperties) {
    await prisma.shamstayProperty.upsert({
      where: { tenantId_slug: { tenantId: property.tenantId, slug: property.slug } },
      update: {
        address: property.address,
        bathrooms: property.bathrooms,
        bedrooms: property.bedrooms,
        city: property.city,
        cleaningFee: property.cleaningFee,
        country: property.country,
        currency: property.currency,
        maxGuests: property.maxGuests,
        name: property.name,
        nightlyRate: property.nightlyRate,
        ownerName: property.ownerName,
        propertyType: property.propertyType,
        rating: property.rating,
        status: property.status
      },
      create: property
    });
  }

  for (const guest of shamstayGuests) {
    await prisma.shamstayGuest.upsert({
      where: { tenantId_email: { tenantId: guest.tenantId, email: guest.email } },
      update: {
        country: guest.country,
        fullName: guest.fullName,
        notes: guest.notes,
        phone: guest.phone
      },
      create: guest
    });
  }

  for (const reservation of shamstayReservations) {
    await prisma.shamstayReservation.upsert({
      where: {
        tenantId_confirmationCode: {
          tenantId: reservation.tenantId,
          confirmationCode: reservation.confirmationCode
        }
      },
      update: {
        channel: reservation.channel,
        checkIn: new Date(reservation.checkIn),
        checkOut: new Date(reservation.checkOut),
        currency: reservation.currency,
        fees: reservation.fees,
        guestId: reservation.guestId,
        guests: reservation.guests,
        nightlyRate: reservation.nightlyRate,
        notes: reservation.notes,
        propertyId: reservation.propertyId,
        status: reservation.status,
        taxes: reservation.taxes,
        totalAmount: reservation.totalAmount
      },
      create: {
        ...reservation,
        checkIn: new Date(reservation.checkIn),
        checkOut: new Date(reservation.checkOut)
      }
    });
  }

  for (const turnover of shamstayTurnovers) {
    await prisma.shamstayTurnover.upsert({
      where: { id: turnover.id },
      update: {
        assignedTeam: turnover.assignedTeam,
        checklist: turnover.checklist as Prisma.InputJsonValue,
        completedAt: turnover.completedAt ? new Date(turnover.completedAt) : null,
        notes: turnover.notes,
        propertyId: turnover.propertyId,
        reservationId: turnover.reservationId,
        scheduledFor: new Date(turnover.scheduledFor),
        status: turnover.status
      },
      create: {
        ...turnover,
        checklist: turnover.checklist as Prisma.InputJsonValue,
        completedAt: turnover.completedAt ? new Date(turnover.completedAt) : null,
        scheduledFor: new Date(turnover.scheduledFor)
      }
    });
  }

  for (const ticket of shamstayMaintenanceTickets) {
    await prisma.shamstayMaintenanceTicket.upsert({
      where: { id: ticket.id },
      update: {
        actualCost: ticket.actualCost,
        category: ticket.category,
        currency: ticket.currency,
        dueAt: ticket.dueAt ? new Date(ticket.dueAt) : null,
        estimatedCost: ticket.estimatedCost,
        notes: ticket.notes,
        priority: ticket.priority,
        propertyId: ticket.propertyId,
        resolvedAt: null,
        status: ticket.status,
        title: ticket.title,
        vendorName: ticket.vendorName
      },
      create: {
        ...ticket,
        dueAt: ticket.dueAt ? new Date(ticket.dueAt) : null,
        resolvedAt: null
      }
    });
  }

  for (const payout of shamstayOwnerPayouts) {
    await prisma.shamstayOwnerPayout.upsert({
      where: { id: payout.id },
      update: {
        currency: payout.currency,
        expenses: payout.expenses,
        grossRevenue: payout.grossRevenue,
        netPayout: payout.netPayout,
        notes: payout.notes,
        paidAt: payout.paidAt ? new Date(payout.paidAt) : null,
        periodEnd: new Date(payout.periodEnd),
        periodStart: new Date(payout.periodStart),
        platformFees: payout.platformFees,
        propertyId: payout.propertyId,
        status: payout.status
      },
      create: {
        ...payout,
        paidAt: payout.paidAt ? new Date(payout.paidAt) : null,
        periodEnd: new Date(payout.periodEnd),
        periodStart: new Date(payout.periodStart)
      }
    });
  }

  for (const payment of shamstayPayments) {
    await prisma.shamstayPayment.upsert({
      where: { id: payment.id },
      update: {
        amount: payment.amount,
        currency: payment.currency,
        fees: payment.fees,
        guestId: payment.guestId,
        metadata: payment.metadata as Prisma.InputJsonValue,
        notes: payment.notes,
        paidAt: payment.paidAt ? new Date(payment.paidAt) : null,
        provider: payment.provider,
        providerReference: payment.providerReference,
        propertyId: payment.propertyId,
        refundedAt: payment.refundedAt ? new Date(payment.refundedAt) : null,
        refundAmount: payment.refundAmount,
        reservationId: payment.reservationId,
        status: payment.status,
        taxes: payment.taxes,
        type: payment.type
      },
      create: {
        ...payment,
        metadata: payment.metadata as Prisma.InputJsonValue,
        paidAt: payment.paidAt ? new Date(payment.paidAt) : null,
        refundedAt: payment.refundedAt ? new Date(payment.refundedAt) : null
      }
    });
  }

  for (const listing of realEstateListings) {
    await prisma.realEstateListing.upsert({
      where: { tenantId_slug: { tenantId: listing.tenantId, slug: listing.slug } },
      update: {
        address: listing.address,
        assignedAgent: listing.assignedAgent,
        bathrooms: listing.bathrooms,
        bedrooms: listing.bedrooms,
        city: listing.city,
        currency: listing.currency,
        district: listing.district,
        ownerName: listing.ownerName,
        price: listing.price,
        propertyType: listing.propertyType,
        publishedAt: listing.publishedAt ? new Date(listing.publishedAt) : null,
        sizeSqm: listing.sizeSqm,
        status: listing.status,
        title: listing.title
      },
      create: {
        ...listing,
        publishedAt: listing.publishedAt ? new Date(listing.publishedAt) : null
      }
    });
  }

  for (const lead of realEstateLeads) {
    await prisma.realEstateLead.upsert({
      where: { id: lead.id },
      update: {
        assignedAgent: lead.assignedAgent,
        budgetMax: lead.budgetMax,
        budgetMin: lead.budgetMin,
        email: lead.email,
        fullName: lead.fullName,
        interestType: lead.interestType,
        listingId: lead.listingId,
        notes: lead.notes,
        phone: lead.phone,
        priority: lead.priority,
        source: lead.source,
        status: lead.status
      },
      create: lead
    });
  }

  for (const viewing of realEstateViewings) {
    await prisma.realEstateViewing.upsert({
      where: { id: viewing.id },
      update: {
        assignedAgent: viewing.assignedAgent,
        feedback: viewing.feedback as Prisma.InputJsonValue,
        leadId: viewing.leadId,
        listingId: viewing.listingId,
        notes: viewing.notes,
        scheduledFor: new Date(viewing.scheduledFor),
        status: viewing.status
      },
      create: {
        ...viewing,
        feedback: viewing.feedback as Prisma.InputJsonValue,
        scheduledFor: new Date(viewing.scheduledFor)
      }
    });
  }

  for (const offer of realEstateOffers) {
    await prisma.realEstateOffer.upsert({
      where: { id: offer.id },
      update: {
        amount: offer.amount,
        currency: offer.currency,
        expiresAt: offer.expiresAt ? new Date(offer.expiresAt) : null,
        leadId: offer.leadId,
        listingId: offer.listingId,
        notes: offer.notes,
        status: offer.status,
        submittedAt: new Date(offer.submittedAt),
        terms: offer.terms as Prisma.InputJsonValue
      },
      create: {
        ...offer,
        expiresAt: offer.expiresAt ? new Date(offer.expiresAt) : null,
        submittedAt: new Date(offer.submittedAt),
        terms: offer.terms as Prisma.InputJsonValue
      }
    });
  }

  for (const commission of realEstateCommissions) {
    await prisma.realEstateCommission.upsert({
      where: { id: commission.id },
      update: {
        agentName: commission.agentName,
        agentShare: commission.agentShare,
        brokerageShare: commission.brokerageShare,
        currency: commission.currency,
        dueAt: commission.dueAt ? new Date(commission.dueAt) : null,
        grossCommission: commission.grossCommission,
        listingId: commission.listingId,
        notes: commission.notes,
        offerId: commission.offerId,
        paidAt: commission.paidAt ? new Date(commission.paidAt) : null,
        status: commission.status
      },
      create: {
        ...commission,
        dueAt: commission.dueAt ? new Date(commission.dueAt) : null,
        paidAt: commission.paidAt ? new Date(commission.paidAt) : null
      }
    });
  }

  for (const batch of peptraceBatches) {
    await prisma.peptraceBatch.upsert({
      where: { tenantId_batchCode: { tenantId: batch.tenantId, batchCode: batch.batchCode } },
      update: {
        manufacturedAt: batch.manufacturedAt ? new Date(batch.manufacturedAt) : null,
        notes: batch.notes,
        peptideId: batch.peptideId,
        productId: batch.productId,
        quantityVials: batch.quantityVials,
        receivedAt: batch.receivedAt ? new Date(batch.receivedAt) : null,
        status: batch.status,
        storageCondition: batch.storageCondition,
        vendorId: batch.vendorId,
        vialSizeMg: batch.vialSizeMg
      },
      create: {
        ...batch,
        manufacturedAt: batch.manufacturedAt ? new Date(batch.manufacturedAt) : null,
        receivedAt: batch.receivedAt ? new Date(batch.receivedAt) : null
      }
    });
  }

  for (const certificate of peptraceCertificates) {
    await prisma.peptraceCertificate.upsert({
      where: {
        tenantId_certificateNumber: {
          tenantId: certificate.tenantId,
          certificateNumber: certificate.certificateNumber
        }
      },
      update: {
        batchId: certificate.batchId,
        documentUrl: certificate.documentUrl,
        expiresAt: certificate.expiresAt ? new Date(certificate.expiresAt) : null,
        issuedAt: certificate.issuedAt ? new Date(certificate.issuedAt) : null,
        labTestId: certificate.labTestId,
        status: certificate.status,
        summary: certificate.summary as Prisma.InputJsonValue
      },
      create: {
        ...certificate,
        expiresAt: certificate.expiresAt ? new Date(certificate.expiresAt) : null,
        issuedAt: certificate.issuedAt ? new Date(certificate.issuedAt) : null,
        summary: certificate.summary as Prisma.InputJsonValue
      }
    });
  }

  for (const surface of apiSurfaces) {
    await prisma.apiSurface.upsert({
      where: { group: surface.group },
      update: {
        routes: surface.routes,
        owner: surface.owner,
        readiness: surface.readiness
      },
      create: {
        group: surface.group,
        routes: surface.routes,
        owner: surface.owner,
        readiness: surface.readiness
      }
    });
  }

  for (const service of backendServices) {
    await prisma.backendService.upsert({
      where: { key: service.key },
      update: {
        basePath: service.basePath,
        category: service.category,
        configSchema: service.configSchema as Prisma.InputJsonValue,
        defaultEnabled: service.defaultEnabled,
        description: service.description,
        docsPath: service.docsPath,
        endpoints: service.endpoints as Prisma.InputJsonValue,
        name: service.name,
        owner: service.owner,
        requiredRoles: service.requiredRoles,
        scope: service.scope,
        status: service.status,
        tags: service.tags
      },
      create: {
        id: `backend-service-${service.key}`,
        key: service.key,
        name: service.name,
        scope: service.scope,
        category: service.category,
        description: service.description,
        owner: service.owner,
        basePath: service.basePath,
        status: service.status,
        defaultEnabled: service.defaultEnabled,
        endpoints: service.endpoints as Prisma.InputJsonValue,
        requiredRoles: service.requiredRoles,
        tags: service.tags,
        configSchema: service.configSchema as Prisma.InputJsonValue,
        docsPath: service.docsPath
      }
    });
  }

  for (const item of accountWorkItems) {
    await prisma.accountWorkItem.upsert({
      where: { id: item.id },
      update: {
        account: item.account,
        kind: item.kind,
        priority: item.priority,
        dueAt: new Date(item.dueAt)
      },
      create: {
        id: item.id,
        account: item.account,
        kind: item.kind,
        priority: item.priority,
        dueAt: new Date(item.dueAt)
      }
    });
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const existingSuperAdmin = await prisma.adminUser.findUnique({
    where: { email: superAdminEmail }
  });
  if (!existingSuperAdmin) {
    const legacySuperAdmin = await prisma.adminUser.findFirst({
      orderBy: { createdAt: "asc" },
      where: {
        email: { in: legacySuperAdminEmails },
        role: { in: ["superadmin", "platform_admin"] }
      }
    });

    if (legacySuperAdmin) {
      await prisma.adminUser.update({
        data: { email: superAdminEmail },
        where: { id: legacySuperAdmin.id }
      });
    }
  }

  for (const adminUser of demoAdminUsers) {
    const user = await prisma.adminUser.upsert({
      where: { email: adminUser.email },
      update: {
        displayName: adminUser.displayName,
        isActive: true,
        passwordHash,
        role: adminUser.role,
        tenantId: adminUser.tenantId
      },
      create: {
        email: adminUser.email,
        displayName: adminUser.displayName,
        isActive: true,
        passwordHash,
        role: adminUser.role,
        tenantId: adminUser.tenantId
      }
    });

    if (adminUser.tenantId) {
      await prisma.tenantMembership.upsert({
        where: {
          tenantId_userId: {
            tenantId: adminUser.tenantId,
            userId: user.id
          }
        },
        update: {
          isActive: true,
          role: adminUser.role
        },
        create: {
          tenantId: adminUser.tenantId,
          userId: user.id,
          role: adminUser.role,
          isActive: true
        }
      });
    }
  }

  const platformActor = await prisma.adminUser.findUniqueOrThrow({
    where: { email: superAdminEmail }
  });

  for (const tenantService of tenantBackendServices) {
    const service = await prisma.backendService.findUnique({
      where: { key: tenantService.serviceKey }
    });
    if (!service) {
      continue;
    }

    await prisma.tenantBackendService.upsert({
      where: {
        tenantId_serviceId: {
          tenantId: tenantService.tenantId,
          serviceId: service.id
        }
      },
      update: {
        config: tenantService.config as Prisma.InputJsonValue,
        isEnabled: tenantService.isEnabled,
        notes: tenantService.notes,
        status: tenantService.status,
        updatedByEmail: platformActor.email,
        updatedById: platformActor.id
      },
      create: {
        id: `tenant-backend-service-${tenantService.tenantId}-${tenantService.serviceKey}`,
        tenantId: tenantService.tenantId,
        serviceId: service.id,
        isEnabled: tenantService.isEnabled,
        status: tenantService.status,
        config: tenantService.config as Prisma.InputJsonValue,
        notes: tenantService.notes,
        createdByEmail: platformActor.email,
        createdById: platformActor.id,
        updatedByEmail: platformActor.email,
        updatedById: platformActor.id
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
