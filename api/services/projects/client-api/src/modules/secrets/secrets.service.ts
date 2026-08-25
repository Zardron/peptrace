import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { createHash } from "node:crypto";
import { AuthenticatedClientUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import { SecretEncryptionService } from "./secret-encryption.service";
import {
  AddSecretVersionDto,
  CreateSecretDto,
  ListSecretAuditQueryDto,
  ListSecretsQueryDto,
  MutableSecretVersionState,
  SecretGrantRole,
  SetSecretGrantDto,
  UpdateSecretDto,
  UpdateSecretVersionDto
} from "./secrets.dto";

const LOCKER_ADMIN_ROLES = new Set(["owner", "admin"]);
const MAX_SECRET_SIZE_BYTES = 65_536;
const GRANT_RANK: Record<SecretGrantRole, number> = {
  viewer: 1,
  accessor: 2,
  manager: 3
};

const versionMetadataSelect = {
  createdAt: true,
  createdById: true,
  destroyedAt: true,
  encryptionKeyId: true,
  id: true,
  state: true,
  version: true
} satisfies Prisma.SecretVersionSelect;

const versionPayloadSelect = {
  ...versionMetadataSelect,
  authenticationTag: true,
  checksum: true,
  encryptedValue: true,
  encryptionIv: true
} satisfies Prisma.SecretVersionSelect;

const secretMetadataInclude = {
  _count: { select: { versions: true } },
  versions: {
    orderBy: { version: "desc" as const },
    select: versionMetadataSelect,
    take: 1
  }
} satisfies Prisma.SecretInclude;

const secretAccessInclude = {
  grants: {
    select: { role: true, userId: true }
  }
} satisfies Prisma.SecretInclude;

type SecretMetadataRecord = Prisma.SecretGetPayload<{ include: typeof secretMetadataInclude }>;
type SecretAccessRecord = Prisma.SecretGetPayload<{ include: typeof secretAccessInclude }>;
type SecretVersionMetadataRecord = Prisma.SecretVersionGetPayload<{ select: typeof versionMetadataSelect }>;
type RequiredSecretPermission = "view" | "access" | "manage";

@Injectable()
export class SecretsService {
  constructor(
    private readonly encryption: SecretEncryptionService,
    private readonly prisma: PrismaService
  ) {}

  async listSecrets(query: ListSecretsQueryDto, actor: AuthenticatedClientUser) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const search = query.search?.trim();
    const where: Prisma.SecretWhereInput = {
      tenantId: actor.tenantId,
      ...(!this.isLockerAdmin(actor) ? { grants: { some: { userId: actor.id } } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } }
            ]
          }
        : {})
    };

    const [items, total] = await this.prisma.withConnectionRetry(() =>
      Promise.all([
        this.prisma.secret.findMany({
          include: secretMetadataInclude,
          orderBy: { updatedAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
          where
        }),
        this.prisma.secret.count({ where })
      ])
    );

    return {
      items: items.map((secret) => this.toSecretMetadata(secret, actor.tenantSlug)),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  async getSecret(identifier: string, actor: AuthenticatedClientUser) {
    const secret = await this.getSecretWithPermission(identifier, actor, "view");
    return this.toSecretMetadata(await this.getSecretMetadata(secret.id, actor.tenantId), actor.tenantSlug);
  }

  async createSecret(dto: CreateSecretDto, actor: AuthenticatedClientUser) {
    this.assertLockerAdmin(actor);
    const name = dto.name.trim();
    const labels = this.validateLabels(dto.labels ?? {});

    try {
      const secret = await this.prisma.withConnectionRetry(() =>
        this.prisma.secret.create({
          data: {
            createdById: actor.id,
            description: dto.description?.trim() || null,
            labels,
            name,
            tenantId: actor.tenantId
          },
          include: secretMetadataInclude
        })
      );
      await this.writeAudit(actor, "SECRET_CREATE", secret.id, null, { name });

      return this.toSecretMetadata(secret, actor.tenantSlug);
    } catch (error) {
      this.rethrowUniqueSecret(error);
    }
  }

  async updateSecret(identifier: string, dto: UpdateSecretDto, actor: AuthenticatedClientUser) {
    const secret = await this.getSecretWithPermission(identifier, actor, "manage");
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException("Provide secret metadata to update");
    }
    const labels = dto.labels === undefined ? undefined : this.validateLabels(dto.labels);

    const updated = await this.prisma.withConnectionRetry(() =>
      this.prisma.secret.update({
        data: {
          ...(dto.description !== undefined ? { description: dto.description.trim() || null } : {}),
          ...(labels !== undefined ? { labels } : {})
        },
        include: secretMetadataInclude,
        where: { id: secret.id }
      })
    );
    await this.writeAudit(actor, "SECRET_UPDATE", secret.id, null, { fields: Object.keys(dto) });

    return this.toSecretMetadata(updated, actor.tenantSlug);
  }

  async listVersions(identifier: string, actor: AuthenticatedClientUser) {
    const secret = await this.getSecretWithPermission(identifier, actor, "view");
    const versions = await this.prisma.withConnectionRetry(() =>
      this.prisma.secretVersion.findMany({
        orderBy: { version: "desc" },
        select: versionMetadataSelect,
        where: { secretId: secret.id }
      })
    );

    return versions.map((version) => this.toVersionMetadata(version, actor.tenantSlug, secret.name));
  }

  async addVersion(identifier: string, dto: AddSecretVersionDto, actor: AuthenticatedClientUser) {
    const secret = await this.getSecretWithPermission(identifier, actor, "manage");
    if (Buffer.byteLength(dto.value, "utf8") > MAX_SECRET_SIZE_BYTES) {
      throw new BadRequestException(`Secret payload must be ${MAX_SECRET_SIZE_BYTES} bytes or smaller`);
    }

    const versionCounter = await this.prisma.withConnectionRetry(() =>
      this.prisma.secret.update({
        data: { versionCounter: { increment: 1 } },
        select: { versionCounter: true },
        where: { id: secret.id }
      })
    );
    const versionNumber = versionCounter.versionCounter;
    const encrypted = this.encryption.encrypt(
      dto.value,
      this.getAdditionalAuthenticatedData(actor.tenantId, secret.id, versionNumber)
    );
    const version = await this.prisma.withConnectionRetry(() =>
      this.prisma.secretVersion.create({
        data: {
          ...encrypted,
          createdById: actor.id,
          secretId: secret.id,
          state: "ENABLED",
          version: versionNumber
        },
        select: versionMetadataSelect
      })
    );
    await this.writeAudit(actor, "VERSION_ADD", secret.id, version.id, { version: versionNumber });

    return this.toVersionMetadata(version, actor.tenantSlug, secret.name);
  }

  async accessVersion(
    identifier: string,
    requestedVersion: string,
    actor: AuthenticatedClientUser
  ) {
    const secret = await this.getSecretWithPermission(identifier, actor, "access");
    const version = await this.getVersion(secret.id, requestedVersion);

    if (version.state !== "ENABLED") {
      throw new ConflictException(`Secret version ${version.version} is ${version.state.toLowerCase()}`);
    }
    if (!version.encryptedValue || !version.encryptionIv || !version.authenticationTag || !version.checksum) {
      throw new ConflictException("Secret payload is no longer available");
    }

    let value: string;
    try {
      value = this.encryption.decrypt(
        version.encryptedValue,
        version.encryptionIv,
        version.authenticationTag,
        this.getAdditionalAuthenticatedData(actor.tenantId, secret.id, version.version),
        version.encryptionKeyId
      );
    } catch {
      throw new InternalServerErrorException("Secret payload could not be authenticated");
    }

    const checksum = createHash("sha256").update(value, "utf8").digest("base64");
    if (checksum !== version.checksum) {
      throw new InternalServerErrorException("Secret integrity check failed");
    }

    await this.prisma.withConnectionRetry(() =>
      this.prisma.secretAuditEvent.create({
        data: this.getAuditData(actor, "VERSION_ACCESS", secret.id, version.id, {
          version: version.version
        })
      })
    );

    return {
      checksum,
      name: secret.name,
      resourceName: this.getVersionResourceName(actor.tenantSlug, secret.name, version.version),
      value,
      version: version.version
    };
  }

  async updateVersionState(
    identifier: string,
    requestedVersion: string,
    dto: UpdateSecretVersionDto,
    actor: AuthenticatedClientUser
  ) {
    const secret = await this.getSecretWithPermission(identifier, actor, "manage");
    const version = await this.getVersion(secret.id, requestedVersion);
    if (version.state === "DESTROYED") {
      throw new ConflictException("A destroyed secret version cannot be restored");
    }

    const updated = await this.prisma.withConnectionRetry(() =>
      this.prisma.secretVersion.update({
        data: { state: dto.state },
        select: versionMetadataSelect,
        where: { id: version.id }
      })
    );
    await this.writeAudit(
      actor,
      dto.state === "ENABLED" ? "VERSION_ENABLE" : "VERSION_DISABLE",
      secret.id,
      version.id,
      { version: version.version }
    );

    return this.toVersionMetadata(updated, actor.tenantSlug, secret.name);
  }

  async destroyVersion(identifier: string, requestedVersion: string, actor: AuthenticatedClientUser) {
    const secret = await this.getSecretWithPermission(identifier, actor, "manage");
    const version = await this.getVersion(secret.id, requestedVersion);
    if (version.state === "DESTROYED") {
      return this.toVersionMetadata(version, actor.tenantSlug, secret.name);
    }

    const destroyed = await this.prisma.withConnectionRetry(() =>
      this.prisma.secretVersion.update({
        data: {
          authenticationTag: null,
          checksum: null,
          destroyedAt: new Date(),
          encryptedValue: null,
          encryptionIv: null,
          state: "DESTROYED"
        },
        select: versionMetadataSelect,
        where: { id: version.id }
      })
    );
    await this.writeAudit(actor, "VERSION_DESTROY", secret.id, version.id, { version: version.version });

    return this.toVersionMetadata(destroyed, actor.tenantSlug, secret.name);
  }

  async listGrants(identifier: string, actor: AuthenticatedClientUser) {
    this.assertLockerAdmin(actor);
    const secret = await this.getTenantSecret(identifier, actor.tenantId);
    const grants = await this.prisma.withConnectionRetry(() =>
      this.prisma.secretAccessGrant.findMany({
        include: {
          user: { select: { displayName: true, email: true, isActive: true, role: true } }
        },
        orderBy: { createdAt: "asc" },
        where: { secretId: secret.id, tenantId: actor.tenantId }
      })
    );
    const memberships = await this.prisma.withConnectionRetry(() =>
      this.prisma.tenantMembership.findMany({
        select: { role: true, userId: true },
        where: { tenantId: actor.tenantId, userId: { in: grants.map((grant) => grant.userId) } }
      })
    );
    const rolesByUserId = new Map(memberships.map((membership) => [membership.userId, membership.role]));

    return grants.map((grant) => ({
      createdAt: grant.createdAt,
      role: grant.role,
      updatedAt: grant.updatedAt,
      user: {
        displayName: grant.user.displayName,
        email: grant.user.email,
        id: grant.userId,
        isActive: grant.user.isActive,
        role: rolesByUserId.get(grant.userId) ?? grant.user.role
      }
    }));
  }

  async setGrant(
    identifier: string,
    userId: string,
    dto: SetSecretGrantDto,
    actor: AuthenticatedClientUser
  ) {
    this.assertLockerAdmin(actor);
    const secret = await this.getTenantSecret(identifier, actor.tenantId);
    const target = await this.prisma.withConnectionRetry(() =>
      this.prisma.tenantMembership.findFirst({
        select: {
          isActive: true,
          role: true,
          user: { select: { displayName: true, email: true, id: true, isActive: true } }
        },
        where: { tenantId: actor.tenantId, userId }
      })
    );
    if (!target) {
      throw new NotFoundException("User not found in this company");
    }
    if (!target.isActive || !target.user.isActive) {
      throw new BadRequestException("Secret access cannot be granted to an inactive user");
    }
    if (LOCKER_ADMIN_ROLES.has(target.role)) {
      throw new BadRequestException("Company owners and admins already have implicit Secret Locker access");
    }

    const grant = await this.prisma.withConnectionRetry(() =>
      this.prisma.secretAccessGrant.upsert({
        create: {
          role: dto.role,
          secretId: secret.id,
          tenantId: actor.tenantId,
          userId: target.user.id
        },
        update: { role: dto.role },
        where: { secretId_userId: { secretId: secret.id, userId: target.user.id } }
      })
    );
    await this.writeAudit(actor, "GRANT_SET", secret.id, null, { role: dto.role, userId: target.user.id });

    return {
      createdAt: grant.createdAt,
      role: grant.role,
      updatedAt: grant.updatedAt,
      user: { ...target.user, role: target.role }
    };
  }

  async removeGrant(identifier: string, userId: string, actor: AuthenticatedClientUser) {
    this.assertLockerAdmin(actor);
    const secret = await this.getTenantSecret(identifier, actor.tenantId);
    const grant = await this.prisma.withConnectionRetry(() =>
      this.prisma.secretAccessGrant.findUnique({
        where: { secretId_userId: { secretId: secret.id, userId } }
      })
    );
    if (!grant || grant.tenantId !== actor.tenantId) {
      throw new NotFoundException("Secret grant not found");
    }

    await this.prisma.withConnectionRetry(() => this.prisma.secretAccessGrant.delete({ where: { id: grant.id } }));
    await this.writeAudit(actor, "GRANT_REMOVE", secret.id, null, { userId });

    return { removed: true, userId };
  }

  async listAuditEvents(query: ListSecretAuditQueryDto, actor: AuthenticatedClientUser) {
    this.assertLockerAdmin(actor);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;
    const secret = query.secret ? await this.getTenantSecret(query.secret, actor.tenantId) : null;
    const where: Prisma.SecretAuditEventWhereInput = {
      tenantId: actor.tenantId,
      ...(secret ? { secretId: secret.id } : {})
    };

    const [events, total] = await this.prisma.withConnectionRetry(() =>
      Promise.all([
        this.prisma.secretAuditEvent.findMany({
          include: { secret: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
          where
        }),
        this.prisma.secretAuditEvent.count({ where })
      ])
    );
    const actorIds = [...new Set(events.map((event) => event.actorId))];
    const actors = await this.prisma.withConnectionRetry(() =>
      this.prisma.tenantMembership.findMany({
        select: { user: { select: { displayName: true, email: true, id: true } } },
        where: { tenantId: actor.tenantId, userId: { in: actorIds } }
      })
    );
    const actorsById = new Map(actors.map((membership) => [membership.user.id, membership.user]));

    return {
      items: events.map((event) => ({
        action: event.action,
        actor: actorsById.get(event.actorId) ?? { id: event.actorId },
        createdAt: event.createdAt,
        id: event.id,
        metadata: event.metadata,
        secret: event.secret ? { id: event.secretId, name: event.secret.name } : null,
        secretVersionId: event.secretVersionId
      })),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  private async getSecretWithPermission(
    identifier: string,
    actor: AuthenticatedClientUser,
    requiredPermission: RequiredSecretPermission
  ): Promise<SecretAccessRecord> {
    const secret = await this.prisma.withConnectionRetry(() =>
      this.prisma.secret.findFirst({
        include: secretAccessInclude,
        where: {
          OR: [{ id: identifier }, { name: identifier }],
          tenantId: actor.tenantId
        }
      })
    );
    if (!secret) {
      throw new NotFoundException("Secret not found in this company");
    }
    if (this.isLockerAdmin(actor)) {
      return secret;
    }

    const grant = secret.grants.find((item) => item.userId === actor.id);
    const requiredRank = requiredPermission === "view" ? 1 : requiredPermission === "access" ? 2 : 3;
    if (!grant || GRANT_RANK[grant.role as SecretGrantRole] < requiredRank) {
      throw new ForbiddenException(`You do not have permission to ${requiredPermission} this secret`);
    }
    return secret;
  }

  private async getTenantSecret(identifier: string, tenantId: string) {
    const secret = await this.prisma.withConnectionRetry(() =>
      this.prisma.secret.findFirst({
        where: {
          OR: [{ id: identifier }, { name: identifier }],
          tenantId
        }
      })
    );
    if (!secret) {
      throw new NotFoundException("Secret not found in this company");
    }
    return secret;
  }

  private async getSecretMetadata(id: string, tenantId: string): Promise<SecretMetadataRecord> {
    const secret = await this.prisma.withConnectionRetry(() =>
      this.prisma.secret.findFirst({
        include: secretMetadataInclude,
        where: { id, tenantId }
      })
    );
    if (!secret) {
      throw new NotFoundException("Secret not found in this company");
    }
    return secret;
  }

  private async getVersion(secretId: string, requestedVersion: string) {
    const versionNumber = this.parseVersion(requestedVersion);
    const version = await this.prisma.withConnectionRetry(() =>
      this.prisma.secretVersion.findFirst({
        orderBy: requestedVersion === "latest" ? { version: "desc" } : undefined,
        select: versionPayloadSelect,
        where: {
          secretId,
          ...(versionNumber !== null ? { version: versionNumber } : {})
        }
      })
    );
    if (!version) {
      throw new NotFoundException("Secret version not found");
    }
    return version;
  }

  private parseVersion(value: string): number | null {
    if (value === "latest") {
      return null;
    }
    if (!/^[1-9]\d*$/.test(value)) {
      throw new BadRequestException("Version must be a positive integer or latest");
    }
    return Number(value);
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

  private assertLockerAdmin(actor: AuthenticatedClientUser): void {
    if (!this.isLockerAdmin(actor)) {
      throw new ForbiddenException("Only company owners and admins can administer the Secret Locker");
    }
  }

  private isLockerAdmin(actor: AuthenticatedClientUser): boolean {
    return LOCKER_ADMIN_ROLES.has(actor.role);
  }

  private async writeAudit(
    actor: AuthenticatedClientUser,
    action: string,
    secretId: string | null,
    secretVersionId: string | null,
    metadata: Prisma.InputJsonObject
  ): Promise<void> {
    await this.prisma.withConnectionRetry(() =>
      this.prisma.secretAuditEvent.create({
        data: this.getAuditData(actor, action, secretId, secretVersionId, metadata)
      })
    );
  }

  private getAuditData(
    actor: AuthenticatedClientUser,
    action: string,
    secretId: string | null,
    secretVersionId: string | null,
    metadata: Prisma.InputJsonObject
  ): Prisma.SecretAuditEventUncheckedCreateInput {
    return {
      action,
      actorId: actor.id,
      metadata,
      secretId,
      secretVersionId,
      tenantId: actor.tenantId
    };
  }

  private getAdditionalAuthenticatedData(tenantId: string, secretId: string, version: number): string {
    return `${tenantId}:${secretId}:${version}`;
  }

  private toSecretMetadata(secret: SecretMetadataRecord, tenantSlug: string) {
    const latestVersion = secret.versions[0] ?? null;
    return {
      createdAt: secret.createdAt,
      createdById: secret.createdById,
      description: secret.description,
      id: secret.id,
      labels: secret.labels,
      latestVersion: latestVersion ? this.toVersionMetadata(latestVersion, tenantSlug, secret.name) : null,
      name: secret.name,
      resourceName: `tenants/${tenantSlug}/secrets/${secret.name}`,
      updatedAt: secret.updatedAt,
      versionCount: secret._count.versions
    };
  }

  private toVersionMetadata(version: SecretVersionMetadataRecord, tenantSlug: string, secretName: string) {
    return {
      createdAt: version.createdAt,
      createdById: version.createdById,
      destroyedAt: version.destroyedAt,
      encryptionKeyId: version.encryptionKeyId,
      id: version.id,
      resourceName: this.getVersionResourceName(tenantSlug, secretName, version.version),
      state: version.state,
      version: version.version
    };
  }

  private getVersionResourceName(tenantSlug: string, secretName: string, version: number): string {
    return `tenants/${tenantSlug}/secrets/${secretName}/versions/${version}`;
  }

  private rethrowUniqueSecret(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ConflictException("A secret with this name already exists in the company");
    }
    throw error;
  }
}
