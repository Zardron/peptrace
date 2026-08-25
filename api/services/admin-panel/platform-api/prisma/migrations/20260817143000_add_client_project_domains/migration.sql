CREATE TABLE IF NOT EXISTS "ShamstayProperty" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "country" TEXT NOT NULL,
  "propertyType" TEXT NOT NULL,
  "bedrooms" INTEGER NOT NULL,
  "bathrooms" DOUBLE PRECISION NOT NULL,
  "maxGuests" INTEGER NOT NULL,
  "nightlyRate" INTEGER NOT NULL,
  "cleaningFee" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "ownerName" TEXT,
  "rating" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ShamstayProperty_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ShamstayProperty_tenantId_fkey" FOREIGN KEY ("tenantId")
    REFERENCES "ClientTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "ShamstayProperty_tenantId_slug_key"
  ON "ShamstayProperty"("tenantId", "slug");
CREATE INDEX IF NOT EXISTS "ShamstayProperty_tenantId_status_idx"
  ON "ShamstayProperty"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "ShamstayProperty_city_status_idx"
  ON "ShamstayProperty"("city", "status");

CREATE TABLE IF NOT EXISTS "ShamstayGuest" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "country" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ShamstayGuest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ShamstayGuest_tenantId_fkey" FOREIGN KEY ("tenantId")
    REFERENCES "ClientTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "ShamstayGuest_tenantId_email_key"
  ON "ShamstayGuest"("tenantId", "email");
CREATE INDEX IF NOT EXISTS "ShamstayGuest_tenantId_fullName_idx"
  ON "ShamstayGuest"("tenantId", "fullName");

CREATE TABLE IF NOT EXISTS "ShamstayReservation" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "guestId" TEXT NOT NULL,
  "confirmationCode" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'BOOKED',
  "checkIn" TIMESTAMP(3) NOT NULL,
  "checkOut" TIMESTAMP(3) NOT NULL,
  "guests" INTEGER NOT NULL,
  "channel" TEXT NOT NULL,
  "nightlyRate" INTEGER NOT NULL,
  "fees" INTEGER NOT NULL DEFAULT 0,
  "taxes" INTEGER NOT NULL DEFAULT 0,
  "totalAmount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ShamstayReservation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ShamstayReservation_tenantId_fkey" FOREIGN KEY ("tenantId")
    REFERENCES "ClientTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ShamstayReservation_propertyId_fkey" FOREIGN KEY ("propertyId")
    REFERENCES "ShamstayProperty"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ShamstayReservation_guestId_fkey" FOREIGN KEY ("guestId")
    REFERENCES "ShamstayGuest"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "ShamstayReservation_tenantId_confirmationCode_key"
  ON "ShamstayReservation"("tenantId", "confirmationCode");
CREATE INDEX IF NOT EXISTS "ShamstayReservation_tenantId_status_idx"
  ON "ShamstayReservation"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "ShamstayReservation_propertyId_checkIn_idx"
  ON "ShamstayReservation"("propertyId", "checkIn");
CREATE INDEX IF NOT EXISTS "ShamstayReservation_guestId_checkIn_idx"
  ON "ShamstayReservation"("guestId", "checkIn");

CREATE TABLE IF NOT EXISTS "ShamstayTurnover" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "reservationId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
  "scheduledFor" TIMESTAMP(3) NOT NULL,
  "assignedTeam" TEXT,
  "checklist" JSONB NOT NULL DEFAULT '[]',
  "completedAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ShamstayTurnover_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ShamstayTurnover_tenantId_fkey" FOREIGN KEY ("tenantId")
    REFERENCES "ClientTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ShamstayTurnover_propertyId_fkey" FOREIGN KEY ("propertyId")
    REFERENCES "ShamstayProperty"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ShamstayTurnover_reservationId_fkey" FOREIGN KEY ("reservationId")
    REFERENCES "ShamstayReservation"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ShamstayTurnover_tenantId_status_idx"
  ON "ShamstayTurnover"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "ShamstayTurnover_propertyId_scheduledFor_idx"
  ON "ShamstayTurnover"("propertyId", "scheduledFor");

CREATE TABLE IF NOT EXISTS "ShamstayMaintenanceTicket" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "priority" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dueAt" TIMESTAMP(3),
  "resolvedAt" TIMESTAMP(3),
  "vendorName" TEXT,
  "estimatedCost" INTEGER,
  "actualCost" INTEGER,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ShamstayMaintenanceTicket_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ShamstayMaintenanceTicket_tenantId_fkey" FOREIGN KEY ("tenantId")
    REFERENCES "ClientTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ShamstayMaintenanceTicket_propertyId_fkey" FOREIGN KEY ("propertyId")
    REFERENCES "ShamstayProperty"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ShamstayMaintenanceTicket_tenantId_status_idx"
  ON "ShamstayMaintenanceTicket"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "ShamstayMaintenanceTicket_propertyId_status_idx"
  ON "ShamstayMaintenanceTicket"("propertyId", "status");
CREATE INDEX IF NOT EXISTS "ShamstayMaintenanceTicket_priority_status_idx"
  ON "ShamstayMaintenanceTicket"("priority", "status");

CREATE TABLE IF NOT EXISTS "ShamstayOwnerPayout" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "grossRevenue" INTEGER NOT NULL,
  "expenses" INTEGER NOT NULL DEFAULT 0,
  "platformFees" INTEGER NOT NULL DEFAULT 0,
  "netPayout" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "paidAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ShamstayOwnerPayout_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ShamstayOwnerPayout_tenantId_fkey" FOREIGN KEY ("tenantId")
    REFERENCES "ClientTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ShamstayOwnerPayout_propertyId_fkey" FOREIGN KEY ("propertyId")
    REFERENCES "ShamstayProperty"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ShamstayOwnerPayout_tenantId_status_idx"
  ON "ShamstayOwnerPayout"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "ShamstayOwnerPayout_propertyId_periodStart_idx"
  ON "ShamstayOwnerPayout"("propertyId", "periodStart");

CREATE TABLE IF NOT EXISTS "RealEstateListing" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "propertyType" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "district" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "price" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "bedrooms" INTEGER,
  "bathrooms" DOUBLE PRECISION,
  "sizeSqm" INTEGER,
  "ownerName" TEXT,
  "assignedAgent" TEXT,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RealEstateListing_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RealEstateListing_tenantId_fkey" FOREIGN KEY ("tenantId")
    REFERENCES "ClientTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "RealEstateListing_tenantId_slug_key"
  ON "RealEstateListing"("tenantId", "slug");
CREATE INDEX IF NOT EXISTS "RealEstateListing_tenantId_status_idx"
  ON "RealEstateListing"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "RealEstateListing_district_status_idx"
  ON "RealEstateListing"("district", "status");

CREATE TABLE IF NOT EXISTS "RealEstateLead" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "listingId" TEXT,
  "fullName" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "interestType" TEXT NOT NULL,
  "budgetMin" INTEGER,
  "budgetMax" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'NEW',
  "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
  "assignedAgent" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RealEstateLead_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RealEstateLead_tenantId_fkey" FOREIGN KEY ("tenantId")
    REFERENCES "ClientTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RealEstateLead_listingId_fkey" FOREIGN KEY ("listingId")
    REFERENCES "RealEstateListing"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "RealEstateLead_tenantId_status_idx"
  ON "RealEstateLead"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "RealEstateLead_listingId_status_idx"
  ON "RealEstateLead"("listingId", "status");
CREATE INDEX IF NOT EXISTS "RealEstateLead_assignedAgent_status_idx"
  ON "RealEstateLead"("assignedAgent", "status");

CREATE TABLE IF NOT EXISTS "RealEstateViewing" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "leadId" TEXT,
  "scheduledFor" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
  "assignedAgent" TEXT,
  "notes" TEXT,
  "feedback" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RealEstateViewing_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RealEstateViewing_tenantId_fkey" FOREIGN KEY ("tenantId")
    REFERENCES "ClientTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RealEstateViewing_listingId_fkey" FOREIGN KEY ("listingId")
    REFERENCES "RealEstateListing"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RealEstateViewing_leadId_fkey" FOREIGN KEY ("leadId")
    REFERENCES "RealEstateLead"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "RealEstateViewing_tenantId_status_idx"
  ON "RealEstateViewing"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "RealEstateViewing_listingId_scheduledFor_idx"
  ON "RealEstateViewing"("listingId", "scheduledFor");

CREATE TABLE IF NOT EXISTS "RealEstateOffer" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  "terms" JSONB NOT NULL DEFAULT '{}',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RealEstateOffer_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RealEstateOffer_tenantId_fkey" FOREIGN KEY ("tenantId")
    REFERENCES "ClientTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RealEstateOffer_listingId_fkey" FOREIGN KEY ("listingId")
    REFERENCES "RealEstateListing"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RealEstateOffer_leadId_fkey" FOREIGN KEY ("leadId")
    REFERENCES "RealEstateLead"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "RealEstateOffer_tenantId_status_idx"
  ON "RealEstateOffer"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "RealEstateOffer_listingId_status_idx"
  ON "RealEstateOffer"("listingId", "status");
CREATE INDEX IF NOT EXISTS "RealEstateOffer_leadId_status_idx"
  ON "RealEstateOffer"("leadId", "status");

CREATE TABLE IF NOT EXISTS "RealEstateCommission" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "listingId" TEXT,
  "offerId" TEXT,
  "agentName" TEXT NOT NULL,
  "grossCommission" INTEGER NOT NULL,
  "brokerageShare" INTEGER NOT NULL,
  "agentShare" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "dueAt" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RealEstateCommission_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RealEstateCommission_tenantId_fkey" FOREIGN KEY ("tenantId")
    REFERENCES "ClientTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RealEstateCommission_listingId_fkey" FOREIGN KEY ("listingId")
    REFERENCES "RealEstateListing"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "RealEstateCommission_offerId_fkey" FOREIGN KEY ("offerId")
    REFERENCES "RealEstateOffer"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "RealEstateCommission_tenantId_status_idx"
  ON "RealEstateCommission"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "RealEstateCommission_agentName_status_idx"
  ON "RealEstateCommission"("agentName", "status");

CREATE TABLE IF NOT EXISTS "PeptraceBatch" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "batchCode" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "peptideId" TEXT NOT NULL,
  "productId" TEXT,
  "manufacturedAt" TIMESTAMP(3),
  "receivedAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'RECEIVED',
  "quantityVials" INTEGER NOT NULL,
  "vialSizeMg" INTEGER NOT NULL,
  "storageCondition" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PeptraceBatch_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PeptraceBatch_tenantId_fkey" FOREIGN KEY ("tenantId")
    REFERENCES "ClientTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "PeptraceBatch_tenantId_batchCode_key"
  ON "PeptraceBatch"("tenantId", "batchCode");
CREATE INDEX IF NOT EXISTS "PeptraceBatch_tenantId_status_idx"
  ON "PeptraceBatch"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "PeptraceBatch_vendorId_status_idx"
  ON "PeptraceBatch"("vendorId", "status");
CREATE INDEX IF NOT EXISTS "PeptraceBatch_peptideId_status_idx"
  ON "PeptraceBatch"("peptideId", "status");

CREATE TABLE IF NOT EXISTS "PeptraceCertificate" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "labTestId" TEXT,
  "certificateNumber" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "issuedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "documentUrl" TEXT,
  "summary" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PeptraceCertificate_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PeptraceCertificate_tenantId_fkey" FOREIGN KEY ("tenantId")
    REFERENCES "ClientTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PeptraceCertificate_batchId_fkey" FOREIGN KEY ("batchId")
    REFERENCES "PeptraceBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "PeptraceCertificate_tenantId_certificateNumber_key"
  ON "PeptraceCertificate"("tenantId", "certificateNumber");
CREATE INDEX IF NOT EXISTS "PeptraceCertificate_tenantId_status_idx"
  ON "PeptraceCertificate"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "PeptraceCertificate_batchId_status_idx"
  ON "PeptraceCertificate"("batchId", "status");
