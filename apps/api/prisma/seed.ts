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
} from "../../../packages/domain/src/index";

const configDir = dirname(fileURLToPath(import.meta.url));

[
  resolve(configDir, "../.env.local"),
  resolve(configDir, "../.env"),
  resolve(configDir, "../../../.env.local"),
  resolve(configDir, "../../../.env")
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
    await prisma.adminUser.upsert({
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
