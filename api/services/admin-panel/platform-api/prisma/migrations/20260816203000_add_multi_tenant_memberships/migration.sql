CREATE TABLE IF NOT EXISTS "TenantSettings" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "branding" JSONB NOT NULL DEFAULT '{}',
  "enabledModules" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "integrations" JSONB NOT NULL DEFAULT '{}',
  "limits" JSONB NOT NULL DEFAULT '{}',
  "labels" JSONB NOT NULL DEFAULT '{}',
  "businessSettings" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TenantSettings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TenantSettings_tenantId_fkey" FOREIGN KEY ("tenantId")
    REFERENCES "ClientTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "TenantSettings_tenantId_key" ON "TenantSettings"("tenantId");

INSERT INTO "TenantSettings" (
  "id",
  "tenantId",
  "branding",
  "enabledModules",
  "integrations",
  "limits",
  "labels",
  "businessSettings",
  "createdAt",
  "updatedAt"
)
SELECT
  concat('tenant-settings-', "id"),
  "id",
  jsonb_build_object('name', "name", 'slug', "slug"),
  CASE
    WHEN "slug" = 'peptrace' THEN ARRAY['overview', 'clients', 'vendors', 'peptides', 'testing', 'labs', 'users', 'secrets', 'access']::TEXT[]
    ELSE ARRAY['overview', 'operations', 'users', 'secrets', 'access']::TEXT[]
  END,
  '{}'::JSONB,
  jsonb_build_object('plan', "plan", 'seats', "seats"),
  '{}'::JSONB,
  jsonb_build_object('dataRegion', "dataRegion", 'owner', "owner"),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "ClientTenant"
ON CONFLICT ("tenantId") DO NOTHING;

CREATE TABLE IF NOT EXISTS "TenantMembership" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TenantMembership_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TenantMembership_tenantId_fkey" FOREIGN KEY ("tenantId")
    REFERENCES "ClientTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TenantMembership_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "TenantMembership_tenantId_userId_key"
  ON "TenantMembership"("tenantId", "userId");
CREATE INDEX IF NOT EXISTS "TenantMembership_userId_isActive_idx"
  ON "TenantMembership"("userId", "isActive");
CREATE INDEX IF NOT EXISTS "TenantMembership_tenantId_role_idx"
  ON "TenantMembership"("tenantId", "role");

INSERT INTO "TenantMembership" (
  "id",
  "tenantId",
  "userId",
  "role",
  "isActive",
  "createdAt",
  "updatedAt"
)
SELECT
  concat('tenant-membership-', "tenantId", '-', "id"),
  "tenantId",
  "id",
  "role",
  "isActive",
  "createdAt",
  "updatedAt"
FROM "AdminUser"
WHERE "tenantId" IS NOT NULL
ON CONFLICT ("tenantId", "userId") DO NOTHING;

CREATE TABLE IF NOT EXISTS "PlatformAuditEvent" (
  "id" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "tenantId" TEXT,
  "action" TEXT NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlatformAuditEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PlatformAuditEvent_actorId_fkey" FOREIGN KEY ("actorId")
    REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PlatformAuditEvent_tenantId_fkey" FOREIGN KEY ("tenantId")
    REFERENCES "ClientTenant"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "PlatformAuditEvent_actorId_createdAt_idx"
  ON "PlatformAuditEvent"("actorId", "createdAt");
CREATE INDEX IF NOT EXISTS "PlatformAuditEvent_tenantId_createdAt_idx"
  ON "PlatformAuditEvent"("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "PlatformAuditEvent_action_createdAt_idx"
  ON "PlatformAuditEvent"("action", "createdAt");
