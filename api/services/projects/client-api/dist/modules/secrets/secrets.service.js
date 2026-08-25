"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecretsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const node_crypto_1 = require("node:crypto");
const prisma_service_1 = require("../prisma/prisma.service");
const secret_encryption_service_1 = require("./secret-encryption.service");
const LOCKER_ADMIN_ROLES = new Set(["owner", "admin"]);
const MAX_SECRET_SIZE_BYTES = 65_536;
const GRANT_RANK = {
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
};
const versionPayloadSelect = {
    ...versionMetadataSelect,
    authenticationTag: true,
    checksum: true,
    encryptedValue: true,
    encryptionIv: true
};
const secretMetadataInclude = {
    _count: { select: { versions: true } },
    versions: {
        orderBy: { version: "desc" },
        select: versionMetadataSelect,
        take: 1
    }
};
const secretAccessInclude = {
    grants: {
        select: { role: true, userId: true }
    }
};
let SecretsService = class SecretsService {
    encryption;
    prisma;
    constructor(encryption, prisma) {
        this.encryption = encryption;
        this.prisma = prisma;
    }
    async listSecrets(query, actor) {
        const page = query.page ?? 1;
        const pageSize = query.pageSize ?? 25;
        const search = query.search?.trim();
        const where = {
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
        const [items, total] = await this.prisma.withConnectionRetry(() => Promise.all([
            this.prisma.secret.findMany({
                include: secretMetadataInclude,
                orderBy: { updatedAt: "desc" },
                skip: (page - 1) * pageSize,
                take: pageSize,
                where
            }),
            this.prisma.secret.count({ where })
        ]));
        return {
            items: items.map((secret) => this.toSecretMetadata(secret, actor.tenantSlug)),
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize)
        };
    }
    async getSecret(identifier, actor) {
        const secret = await this.getSecretWithPermission(identifier, actor, "view");
        return this.toSecretMetadata(await this.getSecretMetadata(secret.id, actor.tenantId), actor.tenantSlug);
    }
    async createSecret(dto, actor) {
        this.assertLockerAdmin(actor);
        const name = dto.name.trim();
        const labels = this.validateLabels(dto.labels ?? {});
        try {
            const secret = await this.prisma.withConnectionRetry(() => this.prisma.secret.create({
                data: {
                    createdById: actor.id,
                    description: dto.description?.trim() || null,
                    labels,
                    name,
                    tenantId: actor.tenantId
                },
                include: secretMetadataInclude
            }));
            await this.writeAudit(actor, "SECRET_CREATE", secret.id, null, { name });
            return this.toSecretMetadata(secret, actor.tenantSlug);
        }
        catch (error) {
            this.rethrowUniqueSecret(error);
        }
    }
    async updateSecret(identifier, dto, actor) {
        const secret = await this.getSecretWithPermission(identifier, actor, "manage");
        if (Object.keys(dto).length === 0) {
            throw new common_1.BadRequestException("Provide secret metadata to update");
        }
        const labels = dto.labels === undefined ? undefined : this.validateLabels(dto.labels);
        const updated = await this.prisma.withConnectionRetry(() => this.prisma.secret.update({
            data: {
                ...(dto.description !== undefined ? { description: dto.description.trim() || null } : {}),
                ...(labels !== undefined ? { labels } : {})
            },
            include: secretMetadataInclude,
            where: { id: secret.id }
        }));
        await this.writeAudit(actor, "SECRET_UPDATE", secret.id, null, { fields: Object.keys(dto) });
        return this.toSecretMetadata(updated, actor.tenantSlug);
    }
    async listVersions(identifier, actor) {
        const secret = await this.getSecretWithPermission(identifier, actor, "view");
        const versions = await this.prisma.withConnectionRetry(() => this.prisma.secretVersion.findMany({
            orderBy: { version: "desc" },
            select: versionMetadataSelect,
            where: { secretId: secret.id }
        }));
        return versions.map((version) => this.toVersionMetadata(version, actor.tenantSlug, secret.name));
    }
    async addVersion(identifier, dto, actor) {
        const secret = await this.getSecretWithPermission(identifier, actor, "manage");
        if (Buffer.byteLength(dto.value, "utf8") > MAX_SECRET_SIZE_BYTES) {
            throw new common_1.BadRequestException(`Secret payload must be ${MAX_SECRET_SIZE_BYTES} bytes or smaller`);
        }
        const versionCounter = await this.prisma.withConnectionRetry(() => this.prisma.secret.update({
            data: { versionCounter: { increment: 1 } },
            select: { versionCounter: true },
            where: { id: secret.id }
        }));
        const versionNumber = versionCounter.versionCounter;
        const encrypted = this.encryption.encrypt(dto.value, this.getAdditionalAuthenticatedData(actor.tenantId, secret.id, versionNumber));
        const version = await this.prisma.withConnectionRetry(() => this.prisma.secretVersion.create({
            data: {
                ...encrypted,
                createdById: actor.id,
                secretId: secret.id,
                state: "ENABLED",
                version: versionNumber
            },
            select: versionMetadataSelect
        }));
        await this.writeAudit(actor, "VERSION_ADD", secret.id, version.id, { version: versionNumber });
        return this.toVersionMetadata(version, actor.tenantSlug, secret.name);
    }
    async accessVersion(identifier, requestedVersion, actor) {
        const secret = await this.getSecretWithPermission(identifier, actor, "access");
        const version = await this.getVersion(secret.id, requestedVersion);
        if (version.state !== "ENABLED") {
            throw new common_1.ConflictException(`Secret version ${version.version} is ${version.state.toLowerCase()}`);
        }
        if (!version.encryptedValue || !version.encryptionIv || !version.authenticationTag || !version.checksum) {
            throw new common_1.ConflictException("Secret payload is no longer available");
        }
        let value;
        try {
            value = this.encryption.decrypt(version.encryptedValue, version.encryptionIv, version.authenticationTag, this.getAdditionalAuthenticatedData(actor.tenantId, secret.id, version.version), version.encryptionKeyId);
        }
        catch {
            throw new common_1.InternalServerErrorException("Secret payload could not be authenticated");
        }
        const checksum = (0, node_crypto_1.createHash)("sha256").update(value, "utf8").digest("base64");
        if (checksum !== version.checksum) {
            throw new common_1.InternalServerErrorException("Secret integrity check failed");
        }
        await this.prisma.withConnectionRetry(() => this.prisma.secretAuditEvent.create({
            data: this.getAuditData(actor, "VERSION_ACCESS", secret.id, version.id, {
                version: version.version
            })
        }));
        return {
            checksum,
            name: secret.name,
            resourceName: this.getVersionResourceName(actor.tenantSlug, secret.name, version.version),
            value,
            version: version.version
        };
    }
    async updateVersionState(identifier, requestedVersion, dto, actor) {
        const secret = await this.getSecretWithPermission(identifier, actor, "manage");
        const version = await this.getVersion(secret.id, requestedVersion);
        if (version.state === "DESTROYED") {
            throw new common_1.ConflictException("A destroyed secret version cannot be restored");
        }
        const updated = await this.prisma.withConnectionRetry(() => this.prisma.secretVersion.update({
            data: { state: dto.state },
            select: versionMetadataSelect,
            where: { id: version.id }
        }));
        await this.writeAudit(actor, dto.state === "ENABLED" ? "VERSION_ENABLE" : "VERSION_DISABLE", secret.id, version.id, { version: version.version });
        return this.toVersionMetadata(updated, actor.tenantSlug, secret.name);
    }
    async destroyVersion(identifier, requestedVersion, actor) {
        const secret = await this.getSecretWithPermission(identifier, actor, "manage");
        const version = await this.getVersion(secret.id, requestedVersion);
        if (version.state === "DESTROYED") {
            return this.toVersionMetadata(version, actor.tenantSlug, secret.name);
        }
        const destroyed = await this.prisma.withConnectionRetry(() => this.prisma.secretVersion.update({
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
        }));
        await this.writeAudit(actor, "VERSION_DESTROY", secret.id, version.id, { version: version.version });
        return this.toVersionMetadata(destroyed, actor.tenantSlug, secret.name);
    }
    async listGrants(identifier, actor) {
        this.assertLockerAdmin(actor);
        const secret = await this.getTenantSecret(identifier, actor.tenantId);
        const grants = await this.prisma.withConnectionRetry(() => this.prisma.secretAccessGrant.findMany({
            include: {
                user: { select: { displayName: true, email: true, isActive: true, role: true } }
            },
            orderBy: { createdAt: "asc" },
            where: { secretId: secret.id, tenantId: actor.tenantId }
        }));
        const memberships = await this.prisma.withConnectionRetry(() => this.prisma.tenantMembership.findMany({
            select: { role: true, userId: true },
            where: { tenantId: actor.tenantId, userId: { in: grants.map((grant) => grant.userId) } }
        }));
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
    async setGrant(identifier, userId, dto, actor) {
        this.assertLockerAdmin(actor);
        const secret = await this.getTenantSecret(identifier, actor.tenantId);
        const target = await this.prisma.withConnectionRetry(() => this.prisma.tenantMembership.findFirst({
            select: {
                isActive: true,
                role: true,
                user: { select: { displayName: true, email: true, id: true, isActive: true } }
            },
            where: { tenantId: actor.tenantId, userId }
        }));
        if (!target) {
            throw new common_1.NotFoundException("User not found in this company");
        }
        if (!target.isActive || !target.user.isActive) {
            throw new common_1.BadRequestException("Secret access cannot be granted to an inactive user");
        }
        if (LOCKER_ADMIN_ROLES.has(target.role)) {
            throw new common_1.BadRequestException("Company owners and admins already have implicit Secret Locker access");
        }
        const grant = await this.prisma.withConnectionRetry(() => this.prisma.secretAccessGrant.upsert({
            create: {
                role: dto.role,
                secretId: secret.id,
                tenantId: actor.tenantId,
                userId: target.user.id
            },
            update: { role: dto.role },
            where: { secretId_userId: { secretId: secret.id, userId: target.user.id } }
        }));
        await this.writeAudit(actor, "GRANT_SET", secret.id, null, { role: dto.role, userId: target.user.id });
        return {
            createdAt: grant.createdAt,
            role: grant.role,
            updatedAt: grant.updatedAt,
            user: { ...target.user, role: target.role }
        };
    }
    async removeGrant(identifier, userId, actor) {
        this.assertLockerAdmin(actor);
        const secret = await this.getTenantSecret(identifier, actor.tenantId);
        const grant = await this.prisma.withConnectionRetry(() => this.prisma.secretAccessGrant.findUnique({
            where: { secretId_userId: { secretId: secret.id, userId } }
        }));
        if (!grant || grant.tenantId !== actor.tenantId) {
            throw new common_1.NotFoundException("Secret grant not found");
        }
        await this.prisma.withConnectionRetry(() => this.prisma.secretAccessGrant.delete({ where: { id: grant.id } }));
        await this.writeAudit(actor, "GRANT_REMOVE", secret.id, null, { userId });
        return { removed: true, userId };
    }
    async listAuditEvents(query, actor) {
        this.assertLockerAdmin(actor);
        const page = query.page ?? 1;
        const pageSize = query.pageSize ?? 50;
        const secret = query.secret ? await this.getTenantSecret(query.secret, actor.tenantId) : null;
        const where = {
            tenantId: actor.tenantId,
            ...(secret ? { secretId: secret.id } : {})
        };
        const [events, total] = await this.prisma.withConnectionRetry(() => Promise.all([
            this.prisma.secretAuditEvent.findMany({
                include: { secret: { select: { name: true } } },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * pageSize,
                take: pageSize,
                where
            }),
            this.prisma.secretAuditEvent.count({ where })
        ]));
        const actorIds = [...new Set(events.map((event) => event.actorId))];
        const actors = await this.prisma.withConnectionRetry(() => this.prisma.tenantMembership.findMany({
            select: { user: { select: { displayName: true, email: true, id: true } } },
            where: { tenantId: actor.tenantId, userId: { in: actorIds } }
        }));
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
    async getSecretWithPermission(identifier, actor, requiredPermission) {
        const secret = await this.prisma.withConnectionRetry(() => this.prisma.secret.findFirst({
            include: secretAccessInclude,
            where: {
                OR: [{ id: identifier }, { name: identifier }],
                tenantId: actor.tenantId
            }
        }));
        if (!secret) {
            throw new common_1.NotFoundException("Secret not found in this company");
        }
        if (this.isLockerAdmin(actor)) {
            return secret;
        }
        const grant = secret.grants.find((item) => item.userId === actor.id);
        const requiredRank = requiredPermission === "view" ? 1 : requiredPermission === "access" ? 2 : 3;
        if (!grant || GRANT_RANK[grant.role] < requiredRank) {
            throw new common_1.ForbiddenException(`You do not have permission to ${requiredPermission} this secret`);
        }
        return secret;
    }
    async getTenantSecret(identifier, tenantId) {
        const secret = await this.prisma.withConnectionRetry(() => this.prisma.secret.findFirst({
            where: {
                OR: [{ id: identifier }, { name: identifier }],
                tenantId
            }
        }));
        if (!secret) {
            throw new common_1.NotFoundException("Secret not found in this company");
        }
        return secret;
    }
    async getSecretMetadata(id, tenantId) {
        const secret = await this.prisma.withConnectionRetry(() => this.prisma.secret.findFirst({
            include: secretMetadataInclude,
            where: { id, tenantId }
        }));
        if (!secret) {
            throw new common_1.NotFoundException("Secret not found in this company");
        }
        return secret;
    }
    async getVersion(secretId, requestedVersion) {
        const versionNumber = this.parseVersion(requestedVersion);
        const version = await this.prisma.withConnectionRetry(() => this.prisma.secretVersion.findFirst({
            orderBy: requestedVersion === "latest" ? { version: "desc" } : undefined,
            select: versionPayloadSelect,
            where: {
                secretId,
                ...(versionNumber !== null ? { version: versionNumber } : {})
            }
        }));
        if (!version) {
            throw new common_1.NotFoundException("Secret version not found");
        }
        return version;
    }
    parseVersion(value) {
        if (value === "latest") {
            return null;
        }
        if (!/^[1-9]\d*$/.test(value)) {
            throw new common_1.BadRequestException("Version must be a positive integer or latest");
        }
        return Number(value);
    }
    validateLabels(labels) {
        const entries = Object.entries(labels);
        if (entries.length > 64) {
            throw new common_1.BadRequestException("A secret can have no more than 64 labels");
        }
        entries.forEach(([key, value]) => {
            if (!/^[a-z][a-z0-9_-]{0,62}$/.test(key)) {
                throw new common_1.BadRequestException(`Invalid label key: ${key}`);
            }
            if (typeof value !== "string" || value.length > 63) {
                throw new common_1.BadRequestException(`Invalid label value for ${key}`);
            }
        });
        return labels;
    }
    assertLockerAdmin(actor) {
        if (!this.isLockerAdmin(actor)) {
            throw new common_1.ForbiddenException("Only company owners and admins can administer the Secret Locker");
        }
    }
    isLockerAdmin(actor) {
        return LOCKER_ADMIN_ROLES.has(actor.role);
    }
    async writeAudit(actor, action, secretId, secretVersionId, metadata) {
        await this.prisma.withConnectionRetry(() => this.prisma.secretAuditEvent.create({
            data: this.getAuditData(actor, action, secretId, secretVersionId, metadata)
        }));
    }
    getAuditData(actor, action, secretId, secretVersionId, metadata) {
        return {
            action,
            actorId: actor.id,
            metadata,
            secretId,
            secretVersionId,
            tenantId: actor.tenantId
        };
    }
    getAdditionalAuthenticatedData(tenantId, secretId, version) {
        return `${tenantId}:${secretId}:${version}`;
    }
    toSecretMetadata(secret, tenantSlug) {
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
    toVersionMetadata(version, tenantSlug, secretName) {
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
    getVersionResourceName(tenantSlug, secretName, version) {
        return `tenants/${tenantSlug}/secrets/${secretName}/versions/${version}`;
    }
    rethrowUniqueSecret(error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            throw new common_1.ConflictException("A secret with this name already exists in the company");
        }
        throw error;
    }
};
exports.SecretsService = SecretsService;
exports.SecretsService = SecretsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [secret_encryption_service_1.SecretEncryptionService,
        prisma_service_1.PrismaService])
], SecretsService);
//# sourceMappingURL=secrets.service.js.map