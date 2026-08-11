import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
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
const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@peptrace.com").toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin@123";

async function main() {
  for (const client of clientTenants) {
    await prisma.clientTenant.upsert({
      where: { slug: client.slug },
      update: {
        name: client.name,
        plan: client.plan,
        status: client.status,
        owner: client.owner,
        seats: client.seats,
        monthlySpend: client.monthlySpend,
        openItems: client.openItems,
        dataRegion: client.dataRegion,
        lastActivityAt: new Date(client.lastActivityAt)
      },
      create: {
        id: client.id,
        name: client.name,
        slug: client.slug,
        plan: client.plan,
        status: client.status,
        owner: client.owner,
        seats: client.seats,
        monthlySpend: client.monthlySpend,
        openItems: client.openItems,
        dataRegion: client.dataRegion,
        lastActivityAt: new Date(client.lastActivityAt)
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
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {
      displayName: "Peptrace Admin",
      passwordHash,
      role: "owner",
      tenantId: "client-esteem-engineering"
    },
    create: {
      email: adminEmail,
      displayName: "Peptrace Admin",
      passwordHash,
      role: "owner",
      tenantId: "client-esteem-engineering"
    }
  });
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
