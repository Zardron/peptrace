import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { CreateApiKeyDto } from "./platform.dto";

@Injectable()
export class PlatformService {
  constructor(private readonly prisma: PrismaService) {}

  getAccountProfile() {
    return {
      id: "account-owner",
      email: "admin@peptrace.com",
      role: "owner",
      tenant: "EsteemedEngineering"
    };
  }

  getBilling() {
    return {
      plan: "Enterprise",
      status: "active",
      currency: "USD",
      monthlySpend: 12800,
      nextInvoiceAt: "2026-09-01T00:00:00.000Z"
    };
  }

  listApiSurfaces() {
    return this.prisma.apiSurface.findMany({
      orderBy: { group: "asc" }
    });
  }

  createApiKey(dto: CreateApiKeyDto) {
    const id = randomUUID();

    return {
      id,
      label: dto.label,
      scopes: dto.scopes,
      keyPreview: `pk_live_${id.slice(0, 8)}...`,
      createdAt: new Date().toISOString()
    };
  }
}
