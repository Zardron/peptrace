ALTER TABLE "ShamstayProperty"
  ADD COLUMN IF NOT EXISTS "description" TEXT,
  ADD COLUMN IF NOT EXISTS "amenities" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "houseRules" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "photos" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;

CREATE TABLE IF NOT EXISTS "ShamstayAvailabilityBlock" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "reason" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'BLOCKED',
  "nightlyRateOverride" INTEGER,
  "minimumNights" INTEGER,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ShamstayAvailabilityBlock_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ShamstayAvailabilityBlock_tenantId_fkey" FOREIGN KEY ("tenantId")
    REFERENCES "ClientTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ShamstayAvailabilityBlock_propertyId_fkey" FOREIGN KEY ("propertyId")
    REFERENCES "ShamstayProperty"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ShamstayAvailabilityBlock_tenantId_status_idx"
  ON "ShamstayAvailabilityBlock"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "ShamstayAvailabilityBlock_propertyId_startDate_idx"
  ON "ShamstayAvailabilityBlock"("propertyId", "startDate");

CREATE TABLE IF NOT EXISTS "ShamstayReview" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "reservationId" TEXT,
  "guestName" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "hostResponse" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ShamstayReview_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ShamstayReview_tenantId_fkey" FOREIGN KEY ("tenantId")
    REFERENCES "ClientTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ShamstayReview_propertyId_fkey" FOREIGN KEY ("propertyId")
    REFERENCES "ShamstayProperty"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ShamstayReview_reservationId_fkey" FOREIGN KEY ("reservationId")
    REFERENCES "ShamstayReservation"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ShamstayReview_tenantId_status_idx"
  ON "ShamstayReview"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "ShamstayReview_propertyId_status_idx"
  ON "ShamstayReview"("propertyId", "status");

CREATE TABLE IF NOT EXISTS "ShamstayConversation" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "propertyId" TEXT,
  "reservationId" TEXT,
  "guestId" TEXT,
  "guestName" TEXT NOT NULL,
  "guestEmail" TEXT,
  "subject" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "source" TEXT NOT NULL DEFAULT 'WEBSITE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ShamstayConversation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ShamstayConversation_tenantId_fkey" FOREIGN KEY ("tenantId")
    REFERENCES "ClientTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ShamstayConversation_propertyId_fkey" FOREIGN KEY ("propertyId")
    REFERENCES "ShamstayProperty"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "ShamstayConversation_reservationId_fkey" FOREIGN KEY ("reservationId")
    REFERENCES "ShamstayReservation"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "ShamstayConversation_guestId_fkey" FOREIGN KEY ("guestId")
    REFERENCES "ShamstayGuest"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ShamstayConversation_tenantId_status_idx"
  ON "ShamstayConversation"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "ShamstayConversation_propertyId_status_idx"
  ON "ShamstayConversation"("propertyId", "status");
CREATE INDEX IF NOT EXISTS "ShamstayConversation_reservationId_status_idx"
  ON "ShamstayConversation"("reservationId", "status");

CREATE TABLE IF NOT EXISTS "ShamstayMessage" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "senderType" TEXT NOT NULL,
  "senderName" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "attachments" JSONB NOT NULL DEFAULT '[]',
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ShamstayMessage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ShamstayMessage_conversationId_fkey" FOREIGN KEY ("conversationId")
    REFERENCES "ShamstayConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ShamstayMessage_conversationId_createdAt_idx"
  ON "ShamstayMessage"("conversationId", "createdAt");

CREATE TABLE IF NOT EXISTS "ShamstayWishlistItem" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "visitorKey" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ShamstayWishlistItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ShamstayWishlistItem_tenantId_fkey" FOREIGN KEY ("tenantId")
    REFERENCES "ClientTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ShamstayWishlistItem_propertyId_fkey" FOREIGN KEY ("propertyId")
    REFERENCES "ShamstayProperty"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "ShamstayWishlistItem_tenantId_visitorKey_propertyId_key"
  ON "ShamstayWishlistItem"("tenantId", "visitorKey", "propertyId");
CREATE INDEX IF NOT EXISTS "ShamstayWishlistItem_propertyId_createdAt_idx"
  ON "ShamstayWishlistItem"("propertyId", "createdAt");

ALTER TABLE "RealEstateListing"
  ADD COLUMN IF NOT EXISTS "description" TEXT,
  ADD COLUMN IF NOT EXISTS "listingPurpose" TEXT NOT NULL DEFAULT 'SALE',
  ADD COLUMN IF NOT EXISTS "features" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "photos" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "lotSizeSqm" INTEGER,
  ADD COLUMN IF NOT EXISTS "yearBuilt" INTEGER;

CREATE INDEX IF NOT EXISTS "RealEstateListing_city_status_idx"
  ON "RealEstateListing"("city", "status");
CREATE INDEX IF NOT EXISTS "RealEstateListing_listingPurpose_status_idx"
  ON "RealEstateListing"("listingPurpose", "status");

CREATE TABLE IF NOT EXISTS "RealEstateSavedListing" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "visitorKey" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RealEstateSavedListing_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RealEstateSavedListing_tenantId_fkey" FOREIGN KEY ("tenantId")
    REFERENCES "ClientTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RealEstateSavedListing_listingId_fkey" FOREIGN KEY ("listingId")
    REFERENCES "RealEstateListing"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "RealEstateSavedListing_tenantId_visitorKey_listingId_key"
  ON "RealEstateSavedListing"("tenantId", "visitorKey", "listingId");
CREATE INDEX IF NOT EXISTS "RealEstateSavedListing_listingId_createdAt_idx"
  ON "RealEstateSavedListing"("listingId", "createdAt");

CREATE TABLE IF NOT EXISTS "RealEstateSavedSearch" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "visitorKey" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "filters" JSONB NOT NULL DEFAULT '{}',
  "alertFrequency" TEXT NOT NULL DEFAULT 'WEEKLY',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RealEstateSavedSearch_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RealEstateSavedSearch_tenantId_fkey" FOREIGN KEY ("tenantId")
    REFERENCES "ClientTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "RealEstateSavedSearch_tenantId_visitorKey_idx"
  ON "RealEstateSavedSearch"("tenantId", "visitorKey");
CREATE INDEX IF NOT EXISTS "RealEstateSavedSearch_tenantId_alertFrequency_idx"
  ON "RealEstateSavedSearch"("tenantId", "alertFrequency");
