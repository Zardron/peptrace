import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { AuthenticatedAdminUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import { CreateClientDto } from "./clients.dto";

const SUPERADMIN_ROLES = new Set(["superadmin", "platform_admin"]);

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  listClients(user: AuthenticatedAdminUser) {
    return this.prisma.clientTenant.findMany({
      include: this.isSuperAdmin(user)
        ? {
            adminUsers: {
              orderBy: { displayName: "asc" },
              select: {
                id: true,
                displayName: true,
                email: true,
                role: true,
                lastLoginAt: true,
                createdAt: true
              }
            }
          }
        : undefined,
      where: this.isSuperAdmin(user) ? undefined : { id: user.tenantId ?? "" },
      orderBy: { name: "asc" }
    }).then((clients) => clients.map((client) => this.toClientPayload(client)));
  }

  async getClient(idOrSlug: string, user: AuthenticatedAdminUser) {
    const client = await this.prisma.clientTenant.findFirst({
      include: {
        adminUsers: {
          orderBy: { displayName: "asc" },
          select: {
            id: true,
            displayName: true,
            email: true,
            role: true,
            lastLoginAt: true,
            createdAt: true
          }
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

  createClient(dto: CreateClientDto, user: AuthenticatedAdminUser) {
    if (!this.isSuperAdmin(user)) {
      throw new ForbiddenException("Only superadmins can create client companies");
    }

    return this.prisma.clientTenant.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        plan: dto.accessStatus,
        status: dto.status,
        owner: dto.owner,
        seats: dto.enabledAccounts,
        monthlySpend: dto.operationalValue,
        openItems: dto.openItems,
        dataRegion: dto.dataRegion,
        lastActivityAt: new Date()
      }
    }).then((client) => this.toClientPayload(client));
  }

  private isSuperAdmin(user: AuthenticatedAdminUser): boolean {
    return SUPERADMIN_ROLES.has(user.role);
  }

  private toClientPayload<T extends { monthlySpend: number; plan: string; seats: number }>(client: T) {
    const { monthlySpend, plan, seats, ...rest } = client;

    return {
      ...rest,
      accessStatus: plan,
      enabledAccounts: seats,
      operationalValue: monthlySpend
    };
  }
}
