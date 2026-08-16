import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { AuthService } from "../auth/auth.service";
import { AuthenticatedClientUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import { ClientUserRole, CreateUserDto, ListUsersQueryDto, ResetUserPasswordDto, UpdateUserDto } from "./users.dto";

const USER_MANAGER_ROLES = new Set(["owner", "admin"]);
const clientUserSelect = {
  id: true,
  email: true,
  displayName: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.AdminUserSelect;

type ClientUserRecord = Prisma.AdminUserGetPayload<{ select: typeof clientUserSelect }>;

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
    const where: Prisma.AdminUserWhereInput = {
      tenantId: actor.tenantId,
      ...(query.role ? { role: query.role } : {}),
      ...(query.status ? { isActive: query.status === "active" } : {}),
      ...(search
        ? {
            OR: [
              { displayName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } }
            ]
          }
        : {})
    };

    const [items, total] = await this.prisma.withConnectionRetry(() =>
      Promise.all([
        this.prisma.adminUser.findMany({
          orderBy: [{ isActive: "desc" }, { displayName: "asc" }],
          select: clientUserSelect,
          skip: (page - 1) * pageSize,
          take: pageSize,
          where
        }),
        this.prisma.adminUser.count({ where })
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
    return this.toClientUser(await this.getTenantUser(id, actor.tenantId));
  }

  async createUser(dto: CreateUserDto, actor: AuthenticatedClientUser) {
    this.assertCanManageUsers(actor);
    this.assertCanAssignRole(actor, dto.role);

    const email = this.normalizeEmail(dto.email);
    await this.assertEmailAvailable(email);
    const passwordHash = await bcrypt.hash(dto.password, 12);

    try {
      const user = await this.prisma.withConnectionRetry(() =>
        this.prisma.adminUser.create({
          data: {
            displayName: dto.displayName.trim(),
            email,
            isActive: true,
            passwordHash,
            role: dto.role,
            tenantId: actor.tenantId
          },
          select: clientUserSelect
        })
      );

      return this.toClientUser(user);
    } catch (error) {
      this.rethrowUniqueEmail(error);
    }
  }

  async updateUser(id: string, dto: UpdateUserDto, actor: AuthenticatedClientUser) {
    this.assertCanManageUsers(actor);
    const target = await this.getTenantUser(id, actor.tenantId);
    this.assertCanManageTarget(actor, target);

    if (Object.keys(dto).length === 0) {
      throw new BadRequestException("Provide at least one user field to update");
    }

    if (actor.id === target.id && dto.isActive === false) {
      throw new BadRequestException("You cannot deactivate your own account");
    }
    if (actor.id === target.id && dto.role && dto.role !== target.role) {
      throw new BadRequestException("You cannot change your own role");
    }
    if (dto.role) {
      this.assertCanAssignRole(actor, dto.role);
    }
    if (target.role === "owner" && (dto.isActive === false || (dto.role && dto.role !== "owner"))) {
      await this.assertAnotherActiveOwner(target.id, actor.tenantId);
    }

    const email = dto.email ? this.normalizeEmail(dto.email) : undefined;
    if (email && email !== target.email) {
      await this.assertEmailAvailable(email, target.id);
    }

    try {
      const user = await this.prisma.withConnectionRetry(() =>
        this.prisma.adminUser.update({
          data: {
            ...(dto.displayName !== undefined ? { displayName: dto.displayName.trim() } : {}),
            ...(email !== undefined ? { email } : {}),
            ...(dto.role !== undefined ? { role: dto.role } : {}),
            ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {})
          },
          select: clientUserSelect,
          where: { id: target.id }
        })
      );

      this.authService.invalidateUser(target.id, target.email);
      if (email && email !== target.email) {
        this.authService.invalidateUser(target.id, email);
      }
      return this.toClientUser(user);
    } catch (error) {
      this.rethrowUniqueEmail(error);
    }
  }

  async resetPassword(id: string, dto: ResetUserPasswordDto, actor: AuthenticatedClientUser) {
    this.assertCanManageUsers(actor);
    const target = await this.getTenantUser(id, actor.tenantId);
    this.assertCanManageTarget(actor, target);
    const passwordHash = await bcrypt.hash(dto.password, 12);

    await this.prisma.withConnectionRetry(() =>
      this.prisma.adminUser.update({
        data: { passwordHash },
        where: { id: target.id }
      })
    );
    this.authService.invalidateUser(target.id, target.email);

    return { id: target.id, passwordUpdated: true };
  }

  async deactivateUser(id: string, actor: AuthenticatedClientUser) {
    this.assertCanManageUsers(actor);
    const target = await this.getTenantUser(id, actor.tenantId);
    this.assertCanManageTarget(actor, target);

    if (target.id === actor.id) {
      throw new BadRequestException("You cannot deactivate your own account");
    }
    if (target.role === "owner" && target.isActive) {
      await this.assertAnotherActiveOwner(target.id, actor.tenantId);
    }
    if (!target.isActive) {
      return this.toClientUser(target);
    }

    const user = await this.prisma.withConnectionRetry(() =>
      this.prisma.adminUser.update({
        data: { isActive: false },
        select: clientUserSelect,
        where: { id: target.id }
      })
    );
    this.authService.invalidateUser(target.id, target.email);
    return this.toClientUser(user);
  }

  private async getTenantUser(id: string, tenantId: string): Promise<ClientUserRecord> {
    const user = await this.prisma.withConnectionRetry(() =>
      this.prisma.adminUser.findFirst({
        select: clientUserSelect,
        where: { id, tenantId }
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
      this.prisma.adminUser.count({
        where: {
          id: { not: excludedUserId },
          isActive: true,
          role: "owner",
          tenantId
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

  private rethrowUniqueEmail(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ConflictException("A user with this email already exists");
    }
    throw error;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private toClientUser(user: ClientUserRecord) {
    return {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      status: user.isActive ? ("active" as const) : ("inactive" as const),
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}
