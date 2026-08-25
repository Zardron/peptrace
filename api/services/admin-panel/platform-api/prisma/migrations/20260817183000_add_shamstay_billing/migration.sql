CREATE TABLE IF NOT EXISTS "ShamstayPayment" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "propertyId" TEXT,
  "reservationId" TEXT,
  "guestId" TEXT,
  "provider" TEXT NOT NULL DEFAULT 'manual',
  "providerReference" TEXT,
  "type" TEXT NOT NULL DEFAULT 'CHARGE',
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "fees" INTEGER NOT NULL DEFAULT 0,
  "taxes" INTEGER NOT NULL DEFAULT 0,
  "refundAmount" INTEGER NOT NULL DEFAULT 0,
  "paidAt" TIMESTAMP(3),
  "refundedAt" TIMESTAMP(3),
  "notes" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ShamstayPayment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ShamstayPayment_tenantId_fkey" FOREIGN KEY ("tenantId")
    REFERENCES "ClientTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ShamstayPayment_propertyId_fkey" FOREIGN KEY ("propertyId")
    REFERENCES "ShamstayProperty"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "ShamstayPayment_reservationId_fkey" FOREIGN KEY ("reservationId")
    REFERENCES "ShamstayReservation"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "ShamstayPayment_guestId_fkey" FOREIGN KEY ("guestId")
    REFERENCES "ShamstayGuest"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "ShamstayPayment_tenantId_providerReference_key"
  ON "ShamstayPayment"("tenantId", "providerReference");
CREATE INDEX IF NOT EXISTS "ShamstayPayment_tenantId_status_idx"
  ON "ShamstayPayment"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "ShamstayPayment_propertyId_status_idx"
  ON "ShamstayPayment"("propertyId", "status");
CREATE INDEX IF NOT EXISTS "ShamstayPayment_reservationId_status_idx"
  ON "ShamstayPayment"("reservationId", "status");
CREATE INDEX IF NOT EXISTS "ShamstayPayment_guestId_status_idx"
  ON "ShamstayPayment"("guestId", "status");
