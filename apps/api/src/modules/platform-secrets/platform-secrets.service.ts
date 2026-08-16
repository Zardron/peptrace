import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { AuthenticatedAdminUser } from "../auth/auth.types";
import { AdminPanelService } from "../admin-panel/admin-panel.service";
import { PrismaService } from "../prisma/prisma.service";
import { PlatformSecretEncryptionService } from "./platform-secret-encryption.service";
import { CreatePlatformSecretDto } from "./platform-secrets.dto";

const SUPERADMIN_ROLES = new Set(["superadmin", "platform_admin"]);
const MAX_SECRET_SIZE_BYTES = 65_536;

@Injectable()
export class PlatformSecretsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: PlatformSecretEncryptionService,
    private readonly adminPanelService: AdminPanelService
  ) {}

  async createSecret(dto: CreatePlatformSecretDto, actor: AuthenticatedAdminUser) {
    this.assertSuperadmin(actor);
    if (Buffer.byteLength(dto.value, "utf8") > MAX_SECRET_SIZE_BYTES) {
      throw new BadRequestException(`Secret payload must be ${MAX_SECRET_SIZE_BYTES} bytes or smaller`);
    }

    const tenant = await this.prisma.clientTenant.findFirst({
      select: { id: true, name: true, slug: true },
      where: { id: dto.tenantId, whiteLabelPanel: { isNot: null } }
    });
    if (!tenant) {
      throw new NotFoundException("Client vault not found");
    }

    const labels = this.validateLabels(dto.labels ?? {});
    const secretId = randomUUID();
    const versionNumber = 1;
    const encrypted = this.encryption.encrypt(
      dto.value,
      this.getAdditionalAuthenticatedData(tenant.id, secretId, versionNumber)
    );

    try {
      const result = await this.prisma.$transaction(async (transaction) => {
        const secret = await transaction.secret.create({
          data: {
            id: secretId,
            createdById: actor.id,
            description: dto.description?.trim() || null,
            labels,
            name: dto.name.trim(),
            tenantId: tenant.id,
            versionCounter: versionNumber
          }
        });
        const version = await transaction.secretVersion.create({
          data: {
            ...encrypted,
            createdById: actor.id,
            secretId,
            state: "ENABLED",
            version: versionNumber
          },
          select: {
            createdAt: true,
            encryptionKeyId: true,
            id: true,
            state: true,
            version: true
          }
        });
        await transaction.secretAuditEvent.createMany({
          data: [
            {
              action: "SECRET_CREATE",
              actorId: actor.id,
              metadata: { actorEmail: actor.email, name: secret.name, source: "SUPERADMIN" },
              secretId,
              tenantId: tenant.id
            },
            {
              action: "VERSION_ADD",
              actorId: actor.id,
              metadata: { actorEmail: actor.email, source: "SUPERADMIN", version: versionNumber },
              secretId,
              secretVersionId: version.id,
              tenantId: tenant.id
            }
          ]
        });
        return { secret, version };
      });
      this.adminPanelService.invalidateCompaniesCache();

      return {
        tenantId: tenant.id,
        tenantName: tenant.name,
        tenantSlug: tenant.slug,
        secret: {
          createdAt: result.secret.createdAt.toISOString(),
          description: result.secret.description,
          id: result.secret.id,
          labels: result.secret.labels,
          latestState: result.version.state,
          latestVersion: result.version.version,
          name: result.secret.name,
          resourceName: `tenants/${tenant.slug}/secrets/${result.secret.name}`,
          updatedAt: result.secret.updatedAt.toISOString(),
          versionCount: 1
        }
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("A secret with this name already exists in the client vault");
      }
      throw error;
    }
  }

  private validateLabels(labels: Record<string, string>): Prisma.InputJsonObject {
    const entries = Object.entries(labels);
    if (entries.length > 64) {
      throw new BadRequestException("A secret can have no more than 64 labels");
    }
    entries.forEach(([key, value]) => {
      if (!/^[a-z][a-z0-9_-]{0,62}$/.test(key)) {
        throw new BadRequestException(`Invalid label key: ${key}`);
      }
      if (typeof value !== "string" || value.length > 63) {
        throw new BadRequestException(`Invalid label value for ${key}`);
      }
    });
    return labels;
  }

  private getAdditionalAuthenticatedData(tenantId: string, secretId: string, version: number): string {
    return `${tenantId}:${secretId}:${version}`;
  }

  private assertSuperadmin(actor: AuthenticatedAdminUser): void {
    if (!SUPERADMIN_ROLES.has(actor.role) || actor.tenantId) {
      throw new ForbiddenException("Only platform superadmins can provision client secrets");
    }
  }
}
