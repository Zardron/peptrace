import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { AuthenticatedAdminUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import { CreateApiKeyDto } from "./platform.dto";

@Injectable()
export class PlatformService {
  constructor(private readonly prisma: PrismaService) {}

  getAccountProfile(user: AuthenticatedAdminUser) {
    return {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      tenant: user.tenant
    };
  }

  async getBilling(user: AuthenticatedAdminUser) {
    const tenant = user.tenantId
      ? await this.prisma.clientTenant.findUnique({
          where: { id: user.tenantId }
        })
      : null;

    return {
      plan: tenant?.plan ?? user.tenant?.plan ?? "Launch",
      status: "active",
      currency: "USD",
      monthlySpend: tenant?.monthlySpend ?? 0,
      nextInvoiceAt: "2026-09-01T00:00:00.000Z",
      tenant: tenant
        ? {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            status: tenant.status
          }
        : user.tenant
    };
  }

  listApiSurfaces() {
    return this.prisma.apiSurface.findMany({
      orderBy: { group: "asc" }
    });
  }

  createApiKey(dto: CreateApiKeyDto, user: AuthenticatedAdminUser) {
    const id = randomUUID();

    return {
      id,
      label: dto.label,
      scopes: dto.scopes,
      createdBy: user.id,
      tenantId: user.tenantId,
      keyPreview: `pk_live_${id.slice(0, 8)}...`,
      createdAt: new Date().toISOString()
    };
  }
}
