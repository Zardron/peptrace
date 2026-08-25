import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { AuthService } from "../auth/auth.service";
import { AuthenticatedClientUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import { ClientUserRole, CreateUserDto, ListUsersQueryDto, ResetUserPasswordDto, UpdateUserDto } from "./users.dto";

const USER_MANAGER_ROLES = new Set(["owner", "admin"]);
const SUPERADMIN_ROLES = new Set(["superadmin", "platform_admin"]);
const clientUserMembershipSelect = {
  id: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      email: true,
      displayName: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true
    }
  }
} satisfies Prisma.TenantMembershipSelect;

type ClientUserRecord = Prisma.TenantMembershipGetPayload<{ select: typeof clientUserMembershipSelect }>;

@Injectable()
export class UsersService {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService
  ) {}

  async listUsers(query: ListUsersQueryDto, actor: AuthenticatedClientUser) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const search = query.search?.trim();
    const userWhere: Prisma.AdminUserWhereInput = {
      ...(query.status === "active" ? { isActive: true } : {}),
      ...(search
        ? {
            OR: [
              { displayName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } }
            ]
          }
        : {})
    };
    const where: Prisma.TenantMembershipWhereInput = {
      tenantId: actor.tenantId,
      ...(query.role ? { role: query.role } : {}),
      ...(query.status === "active" ? { isActive: true } : {}),
      ...(query.status === "inactive"
        ? {
            OR: [{ isActive: false }, { user: { isActive: false } }]
          }
        : {}),
      ...(Object.keys(userWhere).length > 0 ? { user: userWhere } : {})
    };

    const [items, total] = await this.prisma.withConnectionRetry(() =>
      Promise.all([
        this.prisma.tenantMembership.findMany({
          orderBy: [{ isActive: "desc" }, { user: { displayName: "asc" } }],
          select: clientUserMembershipSelect,
          skip: (page - 1) * pageSize,
          take: pageSize,
          where
        }),
        this.prisma.tenantMembership.count({ where })
      ])
    );

    return {
      items: items.map((user) => this.toClientUser(user)),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  async getUser(id: string, actor: AuthenticatedClientUser) {
    return this.toClientUser(await this.getTenantMembership(id, actor.tenantId));
  }

  async createUser(dto: CreateUserDto, actor: AuthenticatedClientUser) {
    this.assertCanManageUsers(actor);
    this.assertCanAssignRole(actor, dto.role);

    const email = this.normalizeEmail(dto.email);
    const existingUser = await this.prisma.withConnectionRetry(() =>
      this.prisma.adminUser.findUnique({
        select: { id: true, role: true },
        where: { email }
      })
    );

    if (existingUser) {
      if (SUPERADMIN_ROLES.has(existingUser.role)) {
        throw new BadRequestException("Platform users cannot be assigned to client workspaces");
      }
      await this.assertMembershipAvailable(existingUser.id, actor.tenantId);
    }

    try {
      const user = await this.prisma.withConnectionRetry(() =>
        this.prisma.$transaction(async (transaction) => {
          if (existingUser) {
            return transaction.tenantMembership.create({
              data: {
                isActive: true,
                role: dto.role,
                tenantId: actor.tenantId,
                userId: existingUser.id
              },
              select: clientUserMembershipSelect
            });
          }

          const passwordHash = await bcrypt.hash(dto.password, 12);
          const createdUser = await transaction.adminUser.create({
            data: {
              displayName: dto.displayName.trim(),
              email,
              isActive: true,
              passwordHash,
              role: dto.role,
              tenantId: actor.tenantId
            },
            select: { id: true }
          });

          return transaction.tenantMembership.create({
            data: {
              isActive: true,
              role: dto.role,
              tenantId: actor.tenantId,
              userId: createdUser.id
            },
            select: clientUserMembershipSelect
          });
        })
      );

      this.authService.invalidateUser(user.user.id, user.user.email);
      return this.toClientUser(user);
    } catch (error) {
      this.rethrowUniqueEmail(error);
    }
  }

  async updateUser(id: string, dto: UpdateUserDto, actor: AuthenticatedClientUser) {
    this.assertCanManageUsers(actor);
    const target = await this.getTenantMembership(id, actor.tenantId);
    this.assertCanManageTarget(actor, target);

    if (Object.keys(dto).length === 0) {
      throw new BadRequestException("Provide at least one user field to update");
    }

    if (actor.id === target.user.id && dto.isActive === false) {
      throw new BadRequestException("You cannot deactivate your own account");
    }
    if (actor.id === target.user.id && dto.role && dto.role !== target.role) {
      throw new BadRequestException("You cannot change your own role");
    }
    if (dto.role) {
      this.assertCanAssignRole(actor, dto.role);
    }
    if (target.role === "owner" && (dto.isActive === false || (dto.role && dto.role !== "owner"))) {
      await this.assertAnotherActiveOwner(target.user.id, actor.tenantId);
    }

    const email = dto.email ? this.normalizeEmail(dto.email) : undefined;
    if (email && email !== target.user.email) {
      await this.assertEmailAvailable(email, target.user.id);
    }
    const displayName = dto.displayName?.trim();
    const updatesGlobalIdentity =
      (displayName !== undefined && displayName !== target.user.displayName) ||
      (email !== undefined && email !== target.user.email);
    if (updatesGlobalIdentity) {
      await this.assertIdentityScopedToTenant(
        target.user.id,
        actor.tenantId,
        "Shared user identities cannot be edited from a single company"
      );
    }

    try {
      const user = await this.prisma.withConnectionRetry(() =>
        this.prisma.$transaction(async (transaction) => {
          if (dto.displayName !== undefined || email !== undefined) {
            await transaction.adminUser.update({
              data: {
                ...(displayName !== undefined ? { displayName } : {}),
                ...(email !== undefined ? { email } : {})
              },
              where: { id: target.user.id }
            });
          }

          return transaction.tenantMembership.update({
            data: {
              ...(dto.role !== undefined ? { role: dto.role } : {}),
              ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {})
            },
            select: clientUserMembershipSelect,
            where: { tenantId_userId: { tenantId: actor.tenantId, userId: target.user.id } }
          });
        })
      );

      this.authService.invalidateUser(target.user.id, target.user.email);
      if (email && email !== target.user.email) {
        this.authService.invalidateUser(target.user.id, email);
      }
      return this.toClientUser(user);
    } catch (error) {
      this.rethrowUniqueEmail(error);
    }
  }

  async resetPassword(id: string, dto: ResetUserPasswordDto, actor: AuthenticatedClientUser) {
    this.assertCanManageUsers(actor);
    const target = await this.getTenantMembership(id, actor.tenantId);
    this.assertCanManageTarget(actor, target);
    await this.assertIdentityScopedToTenant(
      target.user.id,
      actor.tenantId,
      "Shared user passwords must be reset by the platform or account owner"
    );
    const passwordHash = await bcrypt.hash(dto.password, 12);

    await this.prisma.withConnectionRetry(() =>
      this.prisma.adminUser.update({
        data: { passwordHash },
        where: { id: target.user.id }
      })
    );
    this.authService.invalidateUser(target.user.id, target.user.email);

    return { id: target.user.id, passwordUpdated: true };
  }

  async deactivateUser(id: string, actor: AuthenticatedClientUser) {
    this.assertCanManageUsers(actor);
    const target = await this.getTenantMembership(id, actor.tenantId);
    this.assertCanManageTarget(actor, target);

    if (target.user.id === actor.id) {
      throw new BadRequestException("You cannot deactivate your own account");
    }
    if (target.role === "owner" && target.isActive) {
      await this.assertAnotherActiveOwner(target.user.id, actor.tenantId);
    }
    if (!target.isActive) {
      return this.toClientUser(target);
    }

    const user = await this.prisma.withConnectionRetry(() =>
      this.prisma.tenantMembership.update({
        data: { isActive: false },
        select: clientUserMembershipSelect,
        where: { tenantId_userId: { tenantId: actor.tenantId, userId: target.user.id } }
      })
    );
    this.authService.invalidateUser(target.user.id, target.user.email);
    return this.toClientUser(user);
  }

  private async getTenantMembership(id: string, tenantId: string): Promise<ClientUserRecord> {
    const user = await this.prisma.withConnectionRetry(() =>
      this.prisma.tenantMembership.findFirst({
        select: clientUserMembershipSelect,
        where: { tenantId, userId: id }
      })
    );

    if (!user) {
      throw new NotFoundException("User not found in this company");
    }
    return user;
  }

  private assertCanManageUsers(actor: AuthenticatedClientUser): void {
    if (!USER_MANAGER_ROLES.has(actor.role)) {
      throw new ForbiddenException("Only company owners and admins can manage users");
    }
  }

  private assertCanManageTarget(actor: AuthenticatedClientUser, target: ClientUserRecord): void {
    if (actor.role !== "owner" && target.role === "owner") {
      throw new ForbiddenException("Only a company owner can manage another owner");
    }
  }

  private assertCanAssignRole(actor: AuthenticatedClientUser, role: ClientUserRole): void {
    if (role === "owner" && actor.role !== "owner") {
      throw new ForbiddenException("Only a company owner can assign the owner role");
    }
  }

  private async assertAnotherActiveOwner(excludedUserId: string, tenantId: string): Promise<void> {
    const ownerCount = await this.prisma.withConnectionRetry(() =>
      this.prisma.tenantMembership.count({
        where: {
          isActive: true,
          role: "owner",
          tenantId,
          userId: { not: excludedUserId },
          user: { isActive: true }
        }
      })
    );

    if (ownerCount === 0) {
      throw new BadRequestException("A company must retain at least one active owner");
    }
  }

  private async assertEmailAvailable(email: string, excludedUserId?: string): Promise<void> {
    const existing = await this.prisma.withConnectionRetry(() =>
      this.prisma.adminUser.findUnique({
        select: { id: true },
        where: { email }
      })
    );

    if (existing && existing.id !== excludedUserId) {
      throw new ConflictException("A user with this email already exists");
    }
  }

  private async assertMembershipAvailable(userId: string, tenantId: string): Promise<void> {
    const existing = await this.prisma.withConnectionRetry(() =>
      this.prisma.tenantMembership.findUnique({
        select: { id: true },
        where: { tenantId_userId: { tenantId, userId } }
      })
    );

    if (existing) {
      throw new ConflictException("This user already belongs to the company");
    }
  }

  private async assertIdentityScopedToTenant(userId: string, tenantId: string, message: string): Promise<void> {
    const otherMemberships = await this.prisma.withConnectionRetry(() =>
      this.prisma.tenantMembership.count({
        where: {
          tenantId: { not: tenantId },
          userId
        }
      })
    );

    if (otherMemberships > 0) {
      throw new BadRequestException(message);
    }
  }

  private rethrowUniqueEmail(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ConflictException("A user with this email already exists");
    }
    throw error;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private toClientUser(membership: ClientUserRecord) {
    return {
      id: membership.user.id,
      displayName: membership.user.displayName,
      email: membership.user.email,
      role: membership.role,
      status: membership.isActive && membership.user.isActive ? ("active" as const) : ("inactive" as const),
      lastLoginAt: membership.user.lastLoginAt,
      createdAt: membership.user.createdAt,
      updatedAt:
        membership.updatedAt > membership.user.updatedAt ? membership.updatedAt : membership.user.updatedAt
    };
  }
}
