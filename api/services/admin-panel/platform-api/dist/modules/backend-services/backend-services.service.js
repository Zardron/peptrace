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
exports.BackendServicesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const backend_services_dto_1 = require("./backend-services.dto");
const SUPERADMIN_ROLES = new Set(["superadmin", "platform_admin"]);
let BackendServicesService = class BackendServicesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listServices(query, user) {
        this.assertSuperadmin(user);
        const services = await this.prisma.withConnectionRetry(() => this.prisma.backendService.findMany({
            orderBy: [{ scope: "asc" }, { category: "asc" }, { name: "asc" }],
            where: {
                scope: query.scope,
                status: query.status
            }
        }));
        return { items: services.map((service) => this.toServicePayload(service)) };
    }
    async getService(serviceKey, user) {
        this.assertSuperadmin(user);
        return this.toServicePayload(await this.getServiceRecord(serviceKey));
    }
    async createService(dto, user) {
        this.assertSuperadmin(user);
        this.assertValidServiceKey(dto.key);
        try {
            const service = await this.prisma.withConnectionRetry(() => this.prisma.backendService.create({
                data: {
                    basePath: dto.basePath.trim(),
                    category: dto.category.trim(),
                    configSchema: this.jsonValue(dto.configSchema ?? {}),
                    defaultEnabled: dto.defaultEnabled ?? false,
                    description: dto.description.trim(),
                    docsPath: dto.docsPath?.trim() || null,
                    endpoints: this.jsonValue(dto.endpoints ?? []),
                    key: dto.key,
                    name: dto.name.trim(),
                    owner: dto.owner.trim(),
                    requiredRoles: dto.requiredRoles ?? [],
                    scope: dto.scope,
                    status: dto.status ?? backend_services_dto_1.BackendServiceStatus.DRAFT,
                    tags: dto.tags ?? []
                }
            }));
            await this.writeAudit(user, "BACKEND_SERVICE_CREATE", null, {
                key: service.key,
                scope: service.scope,
                status: service.status
            });
            return this.toServicePayload(service);
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
                throw new common_1.ConflictException("A backend service with this key already exists");
            }
            throw error;
        }
    }
    async updateService(serviceKey, dto, user) {
        this.assertSuperadmin(user);
        const service = await this.getServiceRecord(serviceKey);
        const updated = await this.prisma.withConnectionRetry(() => this.prisma.backendService.update({
            data: this.toUpdateData(dto),
            where: { id: service.id }
        }));
        await this.writeAudit(user, "BACKEND_SERVICE_UPDATE", null, {
            key: updated.key,
            scope: updated.scope,
            status: updated.status
        });
        return this.toServicePayload(updated);
    }
    async listTenantServices(tenantId, user) {
        this.assertSuperadmin(user);
        const tenant = await this.getTenant(tenantId);
        const services = await this.prisma.withConnectionRetry(() => this.prisma.backendService.findMany({
            include: {
                tenantServices: {
                    where: { tenantId: tenant.id }
                }
            },
            orderBy: [{ scope: "asc" }, { category: "asc" }, { name: "asc" }]
        }));
        return {
            tenant,
            items: services.map((service) => this.toTenantServicePayload(service))
        };
    }
    async getTenantService(tenantId, serviceKey, user) {
        this.assertSuperadmin(user);
        const tenant = await this.getTenant(tenantId);
        const service = await this.getTenantServiceRecord(tenant.id, serviceKey);
        return {
            tenant,
            service: this.toTenantServicePayload(service)
        };
    }
    async upsertTenantService(tenantId, serviceKey, dto, user) {
        this.assertSuperadmin(user);
        const tenant = await this.getTenant(tenantId);
        const service = await this.getServiceRecord(serviceKey);
        const assignment = await this.prisma.withConnectionRetry(() => this.prisma.tenantBackendService.upsert({
            create: {
                config: this.jsonValue(dto.config ?? {}),
                createdByEmail: user.email,
                createdById: user.id,
                isEnabled: dto.isEnabled,
                notes: dto.notes?.trim() || null,
                serviceId: service.id,
                status: dto.status,
                tenantId: tenant.id,
                updatedByEmail: user.email,
                updatedById: user.id
            },
            update: {
                config: this.jsonValue(dto.config ?? {}),
                isEnabled: dto.isEnabled,
                notes: dto.notes?.trim() || null,
                status: dto.status,
                updatedByEmail: user.email,
                updatedById: user.id
            },
            where: { tenantId_serviceId: { serviceId: service.id, tenantId: tenant.id } }
        }));
        await this.writeAudit(user, "TENANT_BACKEND_SERVICE_UPSERT", tenant.id, {
            isEnabled: assignment.isEnabled,
            serviceKey: service.key,
            serviceScope: service.scope,
            status: assignment.status
        });
        return {
            tenant,
            service: this.toTenantServicePayload({ ...service, tenantServices: [assignment] })
        };
    }
    async removeTenantService(tenantId, serviceKey, user) {
        this.assertSuperadmin(user);
        const tenant = await this.getTenant(tenantId);
        const service = await this.getServiceRecord(serviceKey);
        await this.prisma.withConnectionRetry(() => this.prisma.tenantBackendService.deleteMany({
            where: { serviceId: service.id, tenantId: tenant.id }
        }));
        await this.writeAudit(user, "TENANT_BACKEND_SERVICE_REMOVE", tenant.id, {
            serviceKey: service.key,
            serviceScope: service.scope
        });
        return {
            tenant,
            service: this.toTenantServicePayload({ ...service, tenantServices: [] })
        };
    }
    async getServiceRecord(serviceKey) {
        const service = await this.prisma.withConnectionRetry(() => this.prisma.backendService.findFirst({
            where: {
                OR: [{ id: serviceKey }, { key: serviceKey }]
            }
        }));
        if (!service) {
            throw new common_1.NotFoundException("Backend service not found");
        }
        return service;
    }
    async getTenantServiceRecord(tenantId, serviceKey) {
        const service = await this.prisma.withConnectionRetry(() => this.prisma.backendService.findFirst({
            include: {
                tenantServices: {
                    where: { tenantId }
                }
            },
            where: {
                OR: [{ id: serviceKey }, { key: serviceKey }]
            }
        }));
        if (!service) {
            throw new common_1.NotFoundException("Backend service not found");
        }
        return service;
    }
    async getTenant(tenantId) {
        const tenant = await this.prisma.withConnectionRetry(() => this.prisma.clientTenant.findFirst({
            select: {
                dataRegion: true,
                id: true,
                name: true,
                slug: true,
                status: true
            },
            where: {
                OR: [{ id: tenantId }, { slug: tenantId }]
            }
        }));
        if (!tenant) {
            throw new common_1.NotFoundException("Client tenant not found");
        }
        return tenant;
    }
    toUpdateData(dto) {
        return {
            ...(dto.basePath !== undefined ? { basePath: dto.basePath.trim() } : {}),
            ...(dto.category !== undefined ? { category: dto.category.trim() } : {}),
            ...(dto.configSchema !== undefined ? { configSchema: this.jsonValue(dto.configSchema) } : {}),
            ...(dto.defaultEnabled !== undefined ? { defaultEnabled: dto.defaultEnabled } : {}),
            ...(dto.description !== undefined ? { description: dto.description.trim() } : {}),
            ...(dto.docsPath !== undefined ? { docsPath: dto.docsPath?.trim() || null } : {}),
            ...(dto.endpoints !== undefined ? { endpoints: this.jsonValue(dto.endpoints) } : {}),
            ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
            ...(dto.owner !== undefined ? { owner: dto.owner.trim() } : {}),
            ...(dto.requiredRoles !== undefined ? { requiredRoles: dto.requiredRoles } : {}),
            ...(dto.scope !== undefined ? { scope: dto.scope } : {}),
            ...(dto.status !== undefined ? { status: dto.status } : {}),
            ...(dto.tags !== undefined ? { tags: dto.tags } : {})
        };
    }
    toServicePayload(service) {
        return {
            id: service.id,
            key: service.key,
            name: service.name,
            scope: service.scope,
            category: service.category,
            description: service.description,
            owner: service.owner,
            basePath: service.basePath,
            status: service.status,
            defaultEnabled: service.defaultEnabled,
            endpoints: service.endpoints,
            requiredRoles: service.requiredRoles,
            tags: service.tags,
            configSchema: service.configSchema,
            docsPath: service.docsPath,
            createdAt: service.createdAt.toISOString(),
            updatedAt: service.updatedAt.toISOString()
        };
    }
    toTenantServicePayload(service) {
        const assignment = service.tenantServices[0] ?? null;
        const effectiveEnabled = service.scope === backend_services_dto_1.BackendServiceScope.SHARED
            ? assignment?.isEnabled ?? service.defaultEnabled
            : Boolean(assignment?.isEnabled);
        const effectiveStatus = assignment?.status ?? (effectiveEnabled ? backend_services_dto_1.TenantBackendServiceStatus.ENABLED : backend_services_dto_1.TenantBackendServiceStatus.DISABLED);
        return {
            ...this.toServicePayload(service),
            effectiveEnabled,
            effectiveStatus,
            assignment: assignment ? this.toAssignmentPayload(assignment) : null
        };
    }
    toAssignmentPayload(assignment) {
        return {
            id: assignment.id,
            isEnabled: assignment.isEnabled,
            status: assignment.status,
            config: assignment.config,
            notes: assignment.notes,
            createdByEmail: assignment.createdByEmail,
            updatedByEmail: assignment.updatedByEmail,
            createdAt: assignment.createdAt.toISOString(),
            updatedAt: assignment.updatedAt.toISOString()
        };
    }
    jsonValue(value) {
        return value;
    }
    assertValidServiceKey(key) {
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key)) {
            throw new common_1.ConflictException("Service key must contain lowercase letters, numbers, and single hyphens");
        }
    }
    writeAudit(user, action, tenantId, metadata) {
        return this.prisma.platformAuditEvent.create({
            data: {
                action,
                actorId: user.id,
                metadata,
                tenantId
            }
        });
    }
    assertSuperadmin(user) {
        if (!SUPERADMIN_ROLES.has(user.role) || user.tenantId) {
            throw new common_1.ForbiddenException("Only platform superadmins can manage backend services");
        }
    }
};
exports.BackendServicesService = BackendServicesService;
exports.BackendServicesService = BackendServicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BackendServicesService);
//# sourceMappingURL=backend-services.service.js.map