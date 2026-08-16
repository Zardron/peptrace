CREATE TABLE IF NOT EXISTS "Secret" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "labels" JSONB NOT NULL DEFAULT '{}',
  "versionCounter" INTEGER NOT NULL DEFAULT 0,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Secret_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Secret_tenantId_fkey" FOREIGN KEY ("tenantId")
    REFERENCES "ClientTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Secret_tenantId_name_key" ON "Secret"("tenantId", "name");
CREATE INDEX IF NOT EXISTS "Secret_tenantId_updatedAt_idx" ON "Secret"("tenantId", "updatedAt");

CREATE TABLE IF NOT EXISTS "SecretVersion" (
  "id" TEXT NOT NULL,
  "secretId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "state" TEXT NOT NULL DEFAULT 'ENABLED',
  "encryptedValue" BYTEA,
  "encryptionIv" BYTEA,
  "authenticationTag" BYTEA,
  "checksum" TEXT,
  "encryptionKeyId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "destroyedAt" TIMESTAMP(3),
  CONSTRAINT "SecretVersion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SecretVersion_secretId_fkey" FOREIGN KEY ("secretId")
    REFERENCES "Secret"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "SecretVersion_secretId_version_key"
  ON "SecretVersion"("secretId", "version");
CREATE INDEX IF NOT EXISTS "SecretVersion_secretId_state_idx" ON "SecretVersion"("secretId", "state");

CREATE TABLE IF NOT EXISTS "SecretAccessGrant" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "secretId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SecretAccessGrant_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SecretAccessGrant_tenantId_fkey" FOREIGN KEY ("tenantId")
    REFERENCES "ClientTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SecretAccessGrant_secretId_fkey" FOREIGN KEY ("secretId")
    REFERENCES "Secret"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SecretAccessGrant_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "SecretAccessGrant_secretId_userId_key"
  ON "SecretAccessGrant"("secretId", "userId");
CREATE INDEX IF NOT EXISTS "SecretAccessGrant_tenantId_userId_idx"
  ON "SecretAccessGrant"("tenantId", "userId");

CREATE TABLE IF NOT EXISTS "SecretAuditEvent" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "secretId" TEXT,
  "secretVersionId" TEXT,
  "actorId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SecretAuditEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SecretAuditEvent_tenantId_fkey" FOREIGN KEY ("tenantId")
    REFERENCES "ClientTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SecretAuditEvent_secretId_fkey" FOREIGN KEY ("secretId")
    REFERENCES "Secret"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "SecretAuditEvent_secretVersionId_fkey" FOREIGN KEY ("secretVersionId")
    REFERENCES "SecretVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "SecretAuditEvent_tenantId_createdAt_idx"
  ON "SecretAuditEvent"("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "SecretAuditEvent_secretId_createdAt_idx"
  ON "SecretAuditEvent"("secretId", "createdAt");
