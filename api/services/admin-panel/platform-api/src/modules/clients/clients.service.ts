import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { AdminPanelService } from "../admin-panel/admin-panel.service";
import { AuthenticatedAdminUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import { CreateClientDto, CreateClientOwnerDto, CreateClientSettingsDto } from "./clients.dto";

const SUPERADMIN_ROLES = new Set(["superadmin", "platform_admin"]);
const DEFAULT_CLIENT_MODULES = ["overview", "operations", "users", "secrets", "access"];
const clientMembershipSelect = {
  role: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      displayName: true,
      email: true,
      lastLoginAt: true,
      createdAt: true
    }
  }
} satisfies Prisma.TenantMembershipSelect;

type ClientTenantWithMemberships = Prisma.ClientTenantGetPayload<{
  include: {
    memberships: { select: typeof clientMembershipSelect };
  };
}>;

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminPanelService: AdminPanelService
  ) {}

  listClients(user: AuthenticatedAdminUser) {
    return this.prisma.clientTenant
      .findMany({
        include: this.isSuperAdmin(user)
          ? {
              memberships: {
                orderBy: { user: { displayName: "asc" } },
                select: clientMembershipSelect
              }
            }
          : undefined,
        where: this.isSuperAdmin(user) ? undefined : { id: user.tenantId ?? "" },
        orderBy: { name: "asc" }
      })
      .then((clients) => clients.map((client) => this.toClientPayload(client)));
  }

  async getClient(idOrSlug: string, user: AuthenticatedAdminUser) {
    const client = await this.prisma.clientTenant.findFirst({
      include: {
        memberships: {
          orderBy: { user: { displayName: "asc" } },
          select: clientMembershipSelect
        }
      },
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }]
      }
    });

    if (!client) {
      throw new NotFoundException("Client tenant not found");
    }

    if (!this.isSuperAdmin(user) && client.id !== user.tenantId) {
      throw new ForbiddenException("You can only access your assigned client company");
    }

    return this.toClientPayload(client);
  }

  async createClient(dto: CreateClientDto, user: AuthenticatedAdminUser) {
    this.assertSuperadmin(user);
    this.assertValidSlug(dto.slug);
    if (dto.ownerUser) {
      await this.assertOwnerUserCanBeInvited(dto.ownerUser);
    }

    try {
      const client = await this.prisma.withConnectionRetry(() =>
        this.prisma.$transaction(async (transaction) => {
          const tenant = await transaction.clientTenant.create({
            data: {
              name: dto.name.trim(),
              slug: dto.slug,
              plan: dto.accessStatus,
              status: dto.status,
              owner: dto.owner.trim(),
              seats: dto.enabledAccounts,
              monthlySpend: dto.operationalValue,
              openItems: dto.openItems,
              dataRegion: dto.dataRegion,
              lastActivityAt: new Date(),
              settings: {
                create: this.buildTenantSettings(dto)
              },
              whiteLabelPanel: {
                create: this.buildWhiteLabelPanel(dto)
              }
            },
            select: { id: true }
          });

          if (dto.ownerUser) {
            await this.ensureOwnerMembership(transaction, tenant.id, dto.ownerUser);
          }

          await this.writeAudit(transaction, user, "CLIENT_CREATE", tenant.id, {
            modules: dto.settings?.enabledModules ?? DEFAULT_CLIENT_MODULES,
            ownerUserEmail: dto.ownerUser?.email ?? null,
            slug: dto.slug
          });

          return transaction.clientTenant.findUniqueOrThrow({
            include: {
              memberships: {
                orderBy: { user: { displayName: "asc" } },
                select: clientMembershipSelect
              }
            },
            where: { id: tenant.id }
          });
        })
      );

      this.adminPanelService.invalidateCompaniesCache();
      return this.toClientPayload(client);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("A client with this slug or identifier already exists");
      }
      throw error;
    }
  }

  private buildTenantSettings(dto: CreateClientDto): Prisma.TenantSettingsCreateWithoutTenantInput {
    const settings = dto.settings ?? {};
    return {
      branding: this.jsonObject({
        accentColor: dto.accentColor ?? "#0e7467",
        name: dto.name,
        slug: dto.slug,
        ...(settings.branding ?? {})
      }),
      businessSettings: this.jsonObject({
        dataRegion: dto.dataRegion,
        owner: dto.owner,
        ...(settings.businessSettings ?? {})
      }),
      enabledModules: settings.enabledModules ?? DEFAULT_CLIENT_MODULES,
      integrations: this.jsonObject(settings.integrations),
      labels: this.jsonObject(settings.labels),
      limits: this.jsonObject({
        plan: dto.accessStatus,
        seats: dto.enabledAccounts,
        ...(settings.limits ?? {})
      })
    };
  }

  private buildWhiteLabelPanel(dto: CreateClientDto): Prisma.WhiteLabelPanelCreateWithoutClientTenantInput {
    const industry = dto.industry?.trim() || "Operations";
    const accentColor = dto.accentColor?.trim() || "#0e7467";
    return {
      brandName: dto.name.trim(),
      productName: `${dto.name.trim()} admin`,
      industry,
      accentColor,
      overviewTitle: `${dto.name.trim()} admin panel`,
      overviewDescription: `Manage ${dto.name.trim()} users, settings, modules, and operational work from the shared platform.`,
      operationsTitle: `${industry} operations`,
      operationsDescription: `Current operational records and onboarding tasks for ${dto.name.trim()}.`,
      primaryRecords: [
        {
          label: "Workspace setup",
          detail: "Default shared admin workspace",
          status: dto.status,
          value: dto.accessStatus
        }
      ],
      workItems: [
        {
          label: "Complete onboarding",
          detail: "Configure modules, invite users, and verify integrations",
          priority: "Medium"
        }
      ]
    };
  }

  private async ensureOwnerMembership(
    transaction: Prisma.TransactionClient,
    tenantId: string,
    ownerUser: CreateClientOwnerDto
  ): Promise<void> {
    const email = ownerUser.email.trim().toLowerCase();
    const existingUser = await transaction.adminUser.findUnique({
      select: { id: true, role: true },
      where: { email }
    });

    if (!existingUser && !ownerUser.password) {
      throw new BadRequestException("Provide an initial password for the new client owner");
    }

    let userId = existingUser?.id;
    if (!userId) {
      const password = ownerUser.password;
      if (!password) {
        throw new BadRequestException("Provide an initial password for the new client owner");
      }
      userId = (
        await transaction.adminUser.create({
          data: {
            displayName: ownerUser.displayName.trim(),
            email,
            isActive: true,
            passwordHash: await bcrypt.hash(password, 12),
            role: "owner",
            tenantId
          },
          select: { id: true }
        })
      ).id;
    }

    await transaction.tenantMembership.upsert({
      create: {
        isActive: true,
        role: "owner",
        tenantId,
        userId
      },
      update: {
        isActive: true,
        role: "owner"
      },
      where: { tenantId_userId: { tenantId, userId } }
    });
  }

  private async assertOwnerUserCanBeInvited(ownerUser: CreateClientOwnerDto): Promise<void> {
    const existingUser = await this.prisma.adminUser.findUnique({
      select: { isActive: true, role: true },
      where: { email: ownerUser.email.trim().toLowerCase() }
    });
    if (existingUser && SUPERADMIN_ROLES.has(existingUser.role)) {
      throw new BadRequestException("Platform users cannot be invited as client owners through onboarding");
    }
    if (existingUser && !existingUser.isActive) {
      throw new BadRequestException("Inactive users cannot be invited as client owners through onboarding");
    }
    if (!existingUser && !ownerUser.password) {
      throw new BadRequestException("Provide an initial password for the new client owner");
    }
  }

  private writeAudit(
    transaction: Prisma.TransactionClient,
    user: AuthenticatedAdminUser,
    action: string,
    tenantId: string,
    metadata: Prisma.InputJsonObject
  ) {
    return transaction.platformAuditEvent.create({
      data: {
        action,
        actorId: user.id,
        metadata,
        tenantId
      }
    });
  }

  private assertValidSlug(slug: string): void {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new BadRequestException("Client slug must contain lowercase letters, numbers, and single hyphens");
    }
  }

  private jsonObject(value: CreateClientSettingsDto[keyof CreateClientSettingsDto]): Prisma.InputJsonObject {
    return (value ?? {}) as Prisma.InputJsonObject;
  }

  private assertSuperadmin(user: AuthenticatedAdminUser): void {
    if (!this.isSuperAdmin(user) || user.tenantId) {
      throw new ForbiddenException("Only platform superadmins can create client companies");
    }
  }

  private isSuperAdmin(user: AuthenticatedAdminUser): boolean {
    return SUPERADMIN_ROLES.has(user.role) && !user.tenantId;
  }

  private toClientPayload<T extends { monthlySpend: number; plan: string; seats: number }>(client: T) {
    const {
      monthlySpend,
      plan,
      seats,
      memberships,
      ...rest
    } = client as T & { memberships?: ClientTenantWithMemberships["memberships"] };

    return {
      ...rest,
      adminUsers:
        memberships?.map((membership) => ({
          id: membership.user.id,
          displayName: membership.user.displayName,
          email: membership.user.email,
          role: membership.role,
          lastLoginAt: membership.user.lastLoginAt,
          createdAt: membership.user.createdAt
        })) ?? undefined,
      accessStatus: plan,
      enabledAccounts: seats,
      operationalValue: monthlySpend
    };
  }
}
