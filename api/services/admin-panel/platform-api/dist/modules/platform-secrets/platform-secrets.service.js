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
exports.PlatformSecretsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const node_crypto_1 = require("node:crypto");
const admin_panel_service_1 = require("../admin-panel/admin-panel.service");
const prisma_service_1 = require("../prisma/prisma.service");
const platform_secret_encryption_service_1 = require("./platform-secret-encryption.service");
const SUPERADMIN_ROLES = new Set(["superadmin", "platform_admin"]);
const MAX_SECRET_SIZE_BYTES = 65_536;
let PlatformSecretsService = class PlatformSecretsService {
    prisma;
    encryption;
    adminPanelService;
    constructor(prisma, encryption, adminPanelService) {
        this.prisma = prisma;
        this.encryption = encryption;
        this.adminPanelService = adminPanelService;
    }
    async createSecret(dto, actor) {
        this.assertSuperadmin(actor);
        if (Buffer.byteLength(dto.value, "utf8") > MAX_SECRET_SIZE_BYTES) {
            throw new common_1.BadRequestException(`Secret payload must be ${MAX_SECRET_SIZE_BYTES} bytes or smaller`);
        }
        const tenant = await this.prisma.clientTenant.findFirst({
            select: { id: true, name: true, slug: true },
            where: { id: dto.tenantId, whiteLabelPanel: { isNot: null } }
        });
        if (!tenant) {
            throw new common_1.NotFoundException("Client vault not found");
        }
        const labels = this.validateLabels(dto.labels ?? {});
        const secretId = (0, node_crypto_1.randomUUID)();
        const versionNumber = 1;
        const encrypted = this.encryption.encrypt(dto.value, this.getAdditionalAuthenticatedData(tenant.id, secretId, versionNumber));
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
                await transaction.platformAuditEvent.create({
                    data: {
                        action: "PLATFORM_SECRET_PROVISION",
                        actorId: actor.id,
                        metadata: {
                            name: secret.name,
                            secretId,
                            source: "SUPERADMIN"
                        },
                        tenantId: tenant.id
                    }
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
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
                throw new common_1.ConflictException("A secret with this name already exists in the client vault");
            }
            throw error;
        }
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
    getAdditionalAuthenticatedData(tenantId, secretId, version) {
        return `${tenantId}:${secretId}:${version}`;
    }
    assertSuperadmin(actor) {
        if (!SUPERADMIN_ROLES.has(actor.role) || actor.tenantId) {
            throw new common_1.ForbiddenException("Only platform superadmins can provision client secrets");
        }
    }
};
exports.PlatformSecretsService = PlatformSecretsService;
exports.PlatformSecretsService = PlatformSecretsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        platform_secret_encryption_service_1.PlatformSecretEncryptionService,
        admin_panel_service_1.AdminPanelService])
], PlatformSecretsService);
//# sourceMappingURL=platform-secrets.service.js.map