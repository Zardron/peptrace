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
exports.ServicesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const service_catalog_1 = require("./service-catalog");
const ACTIVE_SERVICE_STATUS = "ACTIVE";
const ENABLED_TENANT_STATUS = "ENABLED";
const SHARED_SCOPE = "SHARED";
let ServicesService = class ServicesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listServices(user) {
        const services = await this.prisma.withConnectionRetry(() => this.prisma.backendService.findMany({
            include: {
                tenantServices: {
                    where: { tenantId: user.tenantId }
                }
            },
            orderBy: [{ scope: "asc" }, { category: "asc" }, { name: "asc" }],
            where: {
                status: ACTIVE_SERVICE_STATUS
            }
        }));
        return {
            tenant: user.tenant,
            items: this.withDocumentedFallbacks(services.filter((service) => this.isVisibleToTenant(service)).map((service) => this.toPayload(service)), services, user)
        };
    }
    listCatalog(user) {
        return {
            tenant: user.tenant,
            items: service_catalog_1.DOCUMENTED_SERVICE_CATALOG.map((service) => ({
                ...this.toDocumentedPayload(service, user),
                isAvailableToTenant: (0, service_catalog_1.isDocumentedServiceAvailableToTenant)(service, user.tenantSlug)
            }))
        };
    }
    async getService(serviceKey, user) {
        const service = await this.prisma.withConnectionRetry(() => this.prisma.backendService.findFirst({
            include: {
                tenantServices: {
                    where: { tenantId: user.tenantId }
                }
            },
            where: {
                OR: [{ id: serviceKey }, { key: serviceKey }],
                status: ACTIVE_SERVICE_STATUS
            }
        }));
        if (service && this.isVisibleToTenant(service)) {
            return {
                tenant: user.tenant,
                service: this.toPayload(service)
            };
        }
        if (service) {
            throw new common_1.NotFoundException("Backend service is not enabled for this company");
        }
        const documentedService = (0, service_catalog_1.getDocumentedServiceSpec)(serviceKey);
        if (!documentedService || !(0, service_catalog_1.isDocumentedServiceAvailableToTenant)(documentedService, user.tenantSlug)) {
            throw new common_1.NotFoundException("Backend service is not enabled for this company");
        }
        return { tenant: user.tenant, service: this.toDocumentedPayload(documentedService, user) };
    }
    isVisibleToTenant(service) {
        const assignment = service.tenantServices[0] ?? null;
        const enabled = service.scope === SHARED_SCOPE ? assignment?.isEnabled ?? service.defaultEnabled : Boolean(assignment?.isEnabled);
        const tenantStatus = assignment?.status ?? (enabled ? ENABLED_TENANT_STATUS : "DISABLED");
        return enabled && tenantStatus === ENABLED_TENANT_STATUS;
    }
    toPayload(service) {
        const assignment = service.tenantServices[0] ?? null;
        const documentedService = (0, service_catalog_1.getDocumentedServiceSpec)(service.key);
        return {
            id: service.id,
            key: service.key,
            name: documentedService?.name ?? service.name,
            scope: documentedService?.scope ?? service.scope,
            category: documentedService?.category ?? service.category,
            description: documentedService?.description ?? service.description,
            owner: documentedService?.owner ?? service.owner,
            basePath: documentedService?.basePath ?? service.basePath,
            endpoints: documentedService ? (0, service_catalog_1.toFlatEndpoints)(documentedService) : service.endpoints,
            endpointGroups: documentedService?.endpointGroups ?? [],
            requiredRoles: documentedService?.requiredRoles ?? service.requiredRoles,
            tags: documentedService?.tags ?? service.tags,
            docsPath: documentedService?.docsPath ?? service.docsPath,
            config: assignment?.config ?? {},
            assignment: assignment ? this.toAssignmentPayload(assignment) : null
        };
    }
    withDocumentedFallbacks(visibleServices, serviceRecords, user) {
        const existingKeys = new Set(visibleServices.map((service) => service.key));
        const explicitlyConfiguredKeys = new Set(serviceRecords.map((service) => service.key));
        const fallbackServices = (0, service_catalog_1.listDocumentedServiceSpecsForTenant)(user.tenantSlug)
            .filter((service) => !existingKeys.has(service.key) && !explicitlyConfiguredKeys.has(service.key))
            .map((service) => this.toDocumentedPayload(service, user));
        return [...visibleServices, ...fallbackServices].sort((left, right) => {
            const scopeCompare = left.scope.localeCompare(right.scope);
            if (scopeCompare !== 0)
                return scopeCompare;
            const categoryCompare = left.category.localeCompare(right.category);
            if (categoryCompare !== 0)
                return categoryCompare;
            return left.name.localeCompare(right.name);
        });
    }
    toDocumentedPayload(service, user) {
        return {
            id: `documented-service-${service.key}`,
            key: service.key,
            name: service.name,
            scope: service.scope,
            category: service.category,
            description: service.description,
            owner: service.owner,
            basePath: service.basePath,
            endpoints: (0, service_catalog_1.toFlatEndpoints)(service),
            endpointGroups: service.endpointGroups,
            requiredRoles: service.requiredRoles,
            tags: service.tags,
            docsPath: service.docsPath,
            config: {
                tenantSlug: user.tenantSlug,
                source: "documented-client-api-catalog"
            },
            assignment: null
        };
    }
    toAssignmentPayload(assignment) {
        return {
            id: assignment.id,
            status: assignment.status,
            isEnabled: assignment.isEnabled,
            notes: assignment.notes,
            updatedAt: assignment.updatedAt.toISOString()
        };
    }
};
exports.ServicesService = ServicesService;
exports.ServicesService = ServicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ServicesService);
//# sourceMappingURL=services.service.js.map