import { ForbiddenException, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { AuthenticatedAdminUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import { CreateApiKeyDto } from "./platform.dto";

const SUPERADMIN_ROLES = new Set(["superadmin", "platform_admin"]);

@Injectable()
export class PlatformService {
  constructor(private readonly prisma: PrismaService) {}

  getAccountProfile(user: AuthenticatedAdminUser) {
    this.assertPlatformAdmin(user);
    return {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      tenant: user.tenant
    };
  }

  listApiSurfaces(user: AuthenticatedAdminUser) {
    this.assertPlatformAdmin(user);
    return this.prisma.apiSurface.findMany({
      orderBy: { group: "asc" }
    });
  }

  createApiKey(dto: CreateApiKeyDto, user: AuthenticatedAdminUser) {
    this.assertPlatformAdmin(user);
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

  private assertPlatformAdmin(user: AuthenticatedAdminUser): void {
    if (!SUPERADMIN_ROLES.has(user.role) || user.tenantId) {
      throw new ForbiddenException("Only platform admins can access platform account APIs");
    }
  }
}
