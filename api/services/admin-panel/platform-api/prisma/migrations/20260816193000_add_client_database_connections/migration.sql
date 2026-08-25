CREATE TABLE "ClientDatabaseConnection" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "databaseName" TEXT NOT NULL,
    "username" TEXT,
    "passwordCiphertext" BYTEA,
    "passwordIv" BYTEA,
    "passwordAuthTag" BYTEA,
    "passwordKeyId" TEXT,
    "sslMode" TEXT NOT NULL DEFAULT 'REQUIRE',
    "connectionMode" TEXT NOT NULL DEFAULT 'STANDARD',
    "schemaName" TEXT,
    "authSource" TEXT,
    "replicaSet" TEXT,
    "useSrv" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'NOT_TESTED',
    "lastTestedAt" TIMESTAMP(3),
    "lastTestMessage" TEXT,
    "updatedById" TEXT NOT NULL,
    "updatedByEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientDatabaseConnection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClientDatabaseConnection_tenantId_key" ON "ClientDatabaseConnection"("tenantId");
CREATE INDEX "ClientDatabaseConnection_provider_status_idx" ON "ClientDatabaseConnection"("provider", "status");

ALTER TABLE "ClientDatabaseConnection"
ADD CONSTRAINT "ClientDatabaseConnection_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "ClientTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
