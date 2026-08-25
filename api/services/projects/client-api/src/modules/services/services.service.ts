import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuthenticatedClientUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import {
  DOCUMENTED_SERVICE_CATALOG,
  DocumentedServiceSpec,
  getDocumentedServiceSpec,
  isDocumentedServiceAvailableToTenant,
  listDocumentedServiceSpecsForTenant,
  toFlatEndpoints
} from "./service-catalog";

const ACTIVE_SERVICE_STATUS = "ACTIVE";
const ENABLED_TENANT_STATUS = "ENABLED";
const SHARED_SCOPE = "SHARED";

type BackendServiceWithAssignments = Prisma.BackendServiceGetPayload<{
  include: { tenantServices: true };
}>;
type TenantServiceAssignment = Prisma.TenantBackendServiceGetPayload<Record<string, never>>;

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async listServices(user: AuthenticatedClientUser) {
    const services = await this.prisma.withConnectionRetry(() =>
      this.prisma.backendService.findMany({
        include: {
          tenantServices: {
            where: { tenantId: user.tenantId }
          }
        },
        orderBy: [{ scope: "asc" }, { category: "asc" }, { name: "asc" }],
        where: {
          status: ACTIVE_SERVICE_STATUS
        }
      })
    );

    return {
      tenant: user.tenant,
      items: this.withDocumentedFallbacks(
        services.filter((service) => this.isVisibleToTenant(service)).map((service) => this.toPayload(service)),
        services,
        user
      )
    };
  }

  listCatalog(user: AuthenticatedClientUser) {
    return {
      tenant: user.tenant,
      items: DOCUMENTED_SERVICE_CATALOG.map((service) => ({
        ...this.toDocumentedPayload(service, user),
        isAvailableToTenant: isDocumentedServiceAvailableToTenant(service, user.tenantSlug)
      }))
    };
  }

  async getService(serviceKey: string, user: AuthenticatedClientUser) {
    const service = await this.prisma.withConnectionRetry(() =>
      this.prisma.backendService.findFirst({
        include: {
          tenantServices: {
            where: { tenantId: user.tenantId }
          }
        },
        where: {
          OR: [{ id: serviceKey }, { key: serviceKey }],
          status: ACTIVE_SERVICE_STATUS
        }
      })
    );

    if (service && this.isVisibleToTenant(service)) {
      return {
        tenant: user.tenant,
        service: this.toPayload(service)
      };
    }

    if (service) {
      throw new NotFoundException("Backend service is not enabled for this company");
    }

    const documentedService = getDocumentedServiceSpec(serviceKey);
    if (!documentedService || !isDocumentedServiceAvailableToTenant(documentedService, user.tenantSlug)) {
      throw new NotFoundException("Backend service is not enabled for this company");
    }

    return { tenant: user.tenant, service: this.toDocumentedPayload(documentedService, user) };
  }

  private isVisibleToTenant(service: BackendServiceWithAssignments): boolean {
    const assignment = service.tenantServices[0] ?? null;
    const enabled =
      service.scope === SHARED_SCOPE ? assignment?.isEnabled ?? service.defaultEnabled : Boolean(assignment?.isEnabled);
    const tenantStatus = assignment?.status ?? (enabled ? ENABLED_TENANT_STATUS : "DISABLED");

    return enabled && tenantStatus === ENABLED_TENANT_STATUS;
  }

  private toPayload(service: BackendServiceWithAssignments) {
    const assignment = service.tenantServices[0] ?? null;
    const documentedService = getDocumentedServiceSpec(service.key);

    return {
      id: service.id,
      key: service.key,
      name: documentedService?.name ?? service.name,
      scope: documentedService?.scope ?? service.scope,
      category: documentedService?.category ?? service.category,
      description: documentedService?.description ?? service.description,
      owner: documentedService?.owner ?? service.owner,
      basePath: documentedService?.basePath ?? service.basePath,
      endpoints: documentedService ? toFlatEndpoints(documentedService) : service.endpoints,
      endpointGroups: documentedService?.endpointGroups ?? [],
      requiredRoles: documentedService?.requiredRoles ?? service.requiredRoles,
      tags: documentedService?.tags ?? service.tags,
      docsPath: documentedService?.docsPath ?? service.docsPath,
      config: assignment?.config ?? {},
      assignment: assignment ? this.toAssignmentPayload(assignment) : null
    };
  }

  private withDocumentedFallbacks(
    visibleServices: Array<ReturnType<ServicesService["toPayload"]>>,
    serviceRecords: BackendServiceWithAssignments[],
    user: AuthenticatedClientUser
  ) {
    const existingKeys = new Set(visibleServices.map((service) => service.key));
    const explicitlyConfiguredKeys = new Set(serviceRecords.map((service) => service.key));
    const fallbackServices = listDocumentedServiceSpecsForTenant(user.tenantSlug)
      .filter((service) => !existingKeys.has(service.key) && !explicitlyConfiguredKeys.has(service.key))
      .map((service) => this.toDocumentedPayload(service, user));

    return [...visibleServices, ...fallbackServices].sort((left, right) => {
      const scopeCompare = left.scope.localeCompare(right.scope);
      if (scopeCompare !== 0) return scopeCompare;
      const categoryCompare = left.category.localeCompare(right.category);
      if (categoryCompare !== 0) return categoryCompare;
      return left.name.localeCompare(right.name);
    });
  }

  private toDocumentedPayload(service: DocumentedServiceSpec, user: AuthenticatedClientUser) {
    return {
      id: `documented-service-${service.key}`,
      key: service.key,
      name: service.name,
      scope: service.scope,
      category: service.category,
      description: service.description,
      owner: service.owner,
      basePath: service.basePath,
      endpoints: toFlatEndpoints(service),
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

  private toAssignmentPayload(assignment: TenantServiceAssignment) {
    return {
      id: assignment.id,
      status: assignment.status,
      isEnabled: assignment.isEnabled,
      notes: assignment.notes,
      updatedAt: assignment.updatedAt.toISOString()
    };
  }
}
