CREATE TABLE IF NOT EXISTS "BackendService" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "owner" TEXT NOT NULL,
  "basePath" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "defaultEnabled" BOOLEAN NOT NULL DEFAULT false,
  "endpoints" JSONB NOT NULL DEFAULT '[]',
  "requiredRoles" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "configSchema" JSONB NOT NULL DEFAULT '{}',
  "docsPath" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BackendService_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BackendService_key_key" ON "BackendService"("key");
CREATE INDEX IF NOT EXISTS "BackendService_scope_status_idx" ON "BackendService"("scope", "status");
CREATE INDEX IF NOT EXISTS "BackendService_category_status_idx" ON "BackendService"("category", "status");

CREATE TABLE IF NOT EXISTS "TenantBackendService" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "isEnabled" BOOLEAN NOT NULL DEFAULT true,
  "status" TEXT NOT NULL DEFAULT 'ENABLED',
  "config" JSONB NOT NULL DEFAULT '{}',
  "notes" TEXT,
  "createdById" TEXT NOT NULL,
  "createdByEmail" TEXT NOT NULL,
  "updatedById" TEXT NOT NULL,
  "updatedByEmail" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TenantBackendService_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TenantBackendService_tenantId_fkey" FOREIGN KEY ("tenantId")
    REFERENCES "ClientTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TenantBackendService_serviceId_fkey" FOREIGN KEY ("serviceId")
    REFERENCES "BackendService"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "TenantBackendService_tenantId_serviceId_key"
  ON "TenantBackendService"("tenantId", "serviceId");
CREATE INDEX IF NOT EXISTS "TenantBackendService_tenantId_status_idx"
  ON "TenantBackendService"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "TenantBackendService_serviceId_status_idx"
  ON "TenantBackendService"("serviceId", "status");
