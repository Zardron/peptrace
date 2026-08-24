import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuthenticatedAdminUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import {
  BackendServiceScope,
  BackendServiceStatus,
  CreateBackendServiceDto,
  ListBackendServicesQueryDto,
  TenantBackendServiceStatus,
  UpdateBackendServiceDto,
  UpsertTenantBackendServiceDto
} from "./backend-services.dto";

const SUPERADMIN_ROLES = new Set(["superadmin", "platform_admin"]);

type BackendServiceRecord = Prisma.BackendServiceGetPayload<Record<string, never>>;
type BackendServiceWithAssignments = Prisma.BackendServiceGetPayload<{
  include: { tenantServices: true };
}>;
type TenantServiceAssignment = Prisma.TenantBackendServiceGetPayload<Record<string, never>>;

@Injectable()
export class BackendServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async listServices(query: ListBackendServicesQueryDto, user: AuthenticatedAdminUser) {
    this.assertSuperadmin(user);
    const services = await this.prisma.withConnectionRetry(() =>
      this.prisma.backendService.findMany({
        orderBy: [{ scope: "asc" }, { category: "asc" }, { name: "asc" }],
        where: {
          scope: query.scope,
          status: query.status
        }
      })
    );

    return { items: services.map((service) => this.toServicePayload(service)) };
  }

  async getService(serviceKey: string, user: AuthenticatedAdminUser) {
    this.assertSuperadmin(user);
    return this.toServicePayload(await this.getServiceRecord(serviceKey));
  }

  async createService(dto: CreateBackendServiceDto, user: AuthenticatedAdminUser) {
    this.assertSuperadmin(user);
    this.assertValidServiceKey(dto.key);

    try {
      const service = await this.prisma.withConnectionRetry(() =>
        this.prisma.backendService.create({
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
            status: dto.status ?? BackendServiceStatus.DRAFT,
            tags: dto.tags ?? []
          }
        })
      );
      await this.writeAudit(user, "BACKEND_SERVICE_CREATE", null, {
        key: service.key,
        scope: service.scope,
        status: service.status
      });
      return this.toServicePayload(service);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("A backend service with this key already exists");
      }
      throw error;
    }
  }

  async updateService(serviceKey: string, dto: UpdateBackendServiceDto, user: AuthenticatedAdminUser) {
    this.assertSuperadmin(user);
    const service = await this.getServiceRecord(serviceKey);
    const updated = await this.prisma.withConnectionRetry(() =>
      this.prisma.backendService.update({
        data: this.toUpdateData(dto),
        where: { id: service.id }
      })
    );
    await this.writeAudit(user, "BACKEND_SERVICE_UPDATE", null, {
      key: updated.key,
      scope: updated.scope,
      status: updated.status
    });
    return this.toServicePayload(updated);
  }

  async listTenantServices(tenantId: string, user: AuthenticatedAdminUser) {
    this.assertSuperadmin(user);
    const tenant = await this.getTenant(tenantId);
    const services = await this.prisma.withConnectionRetry(() =>
      this.prisma.backendService.findMany({
        include: {
          tenantServices: {
            where: { tenantId: tenant.id }
          }
        },
        orderBy: [{ scope: "asc" }, { category: "asc" }, { name: "asc" }]
      })
    );

    return {
      tenant,
      items: services.map((service) => this.toTenantServicePayload(service))
    };
  }

  async getTenantService(tenantId: string, serviceKey: string, user: AuthenticatedAdminUser) {
    this.assertSuperadmin(user);
    const tenant = await this.getTenant(tenantId);
    const service = await this.getTenantServiceRecord(tenant.id, serviceKey);

    return {
      tenant,
      service: this.toTenantServicePayload(service)
    };
  }

  async upsertTenantService(
    tenantId: string,
    serviceKey: string,
    dto: UpsertTenantBackendServiceDto,
    user: AuthenticatedAdminUser
  ) {
    this.assertSuperadmin(user);
    const tenant = await this.getTenant(tenantId);
    const service = await this.getServiceRecord(serviceKey);

    const assignment = await this.prisma.withConnectionRetry(() =>
      this.prisma.tenantBackendService.upsert({
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
      })
    );

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

  async removeTenantService(tenantId: string, serviceKey: string, user: AuthenticatedAdminUser) {
    this.assertSuperadmin(user);
    const tenant = await this.getTenant(tenantId);
    const service = await this.getServiceRecord(serviceKey);

    await this.prisma.withConnectionRetry(() =>
      this.prisma.tenantBackendService.deleteMany({
        where: { serviceId: service.id, tenantId: tenant.id }
      })
    );
    await this.writeAudit(user, "TENANT_BACKEND_SERVICE_REMOVE", tenant.id, {
      serviceKey: service.key,
      serviceScope: service.scope
    });

    return {
      tenant,
      service: this.toTenantServicePayload({ ...service, tenantServices: [] })
    };
  }

  private async getServiceRecord(serviceKey: string): Promise<BackendServiceRecord> {
    const service = await this.prisma.withConnectionRetry(() =>
      this.prisma.backendService.findFirst({
        where: {
          OR: [{ id: serviceKey }, { key: serviceKey }]
        }
      })
    );

    if (!service) {
      throw new NotFoundException("Backend service not found");
    }
    return service;
  }

  private async getTenantServiceRecord(tenantId: string, serviceKey: string): Promise<BackendServiceWithAssignments> {
    const service = await this.prisma.withConnectionRetry(() =>
      this.prisma.backendService.findFirst({
        include: {
          tenantServices: {
            where: { tenantId }
          }
        },
        where: {
          OR: [{ id: serviceKey }, { key: serviceKey }]
        }
      })
    );

    if (!service) {
      throw new NotFoundException("Backend service not found");
    }
    return service;
  }

  private async getTenant(tenantId: string) {
    const tenant = await this.prisma.withConnectionRetry(() =>
      this.prisma.clientTenant.findFirst({
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
      })
    );

    if (!tenant) {
      throw new NotFoundException("Client tenant not found");
    }
    return tenant;
  }

  private toUpdateData(dto: UpdateBackendServiceDto): Prisma.BackendServiceUpdateInput {
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

  private toServicePayload(service: BackendServiceRecord) {
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

  private toTenantServicePayload(service: BackendServiceWithAssignments) {
    const assignment = service.tenantServices[0] ?? null;
    const effectiveEnabled =
      service.scope === BackendServiceScope.SHARED
        ? assignment?.isEnabled ?? service.defaultEnabled
        : Boolean(assignment?.isEnabled);
    const effectiveStatus = assignment?.status ?? (effectiveEnabled ? TenantBackendServiceStatus.ENABLED : TenantBackendServiceStatus.DISABLED);

    return {
      ...this.toServicePayload(service),
      effectiveEnabled,
      effectiveStatus,
      assignment: assignment ? this.toAssignmentPayload(assignment) : null
    };
  }

  private toAssignmentPayload(assignment: TenantServiceAssignment) {
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

  private jsonValue(value: unknown): Prisma.InputJsonValue {
    return value as Prisma.InputJsonValue;
  }

  private assertValidServiceKey(key: string): void {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key)) {
      throw new ConflictException("Service key must contain lowercase letters, numbers, and single hyphens");
    }
  }

  private writeAudit(
    user: AuthenticatedAdminUser,
    action: string,
    tenantId: string | null,
    metadata: Prisma.InputJsonObject
  ) {
    return this.prisma.platformAuditEvent.create({
      data: {
        action,
        actorId: user.id,
        metadata,
        tenantId
      }
    });
  }

  private assertSuperadmin(user: AuthenticatedAdminUser): void {
    if (!SUPERADMIN_ROLES.has(user.role) || user.tenantId) {
      throw new ForbiddenException("Only platform superadmins can manage backend services");
    }
  }
}
