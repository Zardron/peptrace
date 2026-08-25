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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const auth_service_1 = require("../auth/auth.service");
const prisma_service_1 = require("../prisma/prisma.service");
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
};
let UsersService = class UsersService {
    authService;
    prisma;
    constructor(authService, prisma) {
        this.authService = authService;
        this.prisma = prisma;
    }
    async listUsers(query, actor) {
        const page = query.page ?? 1;
        const pageSize = query.pageSize ?? 25;
        const search = query.search?.trim();
        const userWhere = {
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
        const where = {
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
        const [items, total] = await this.prisma.withConnectionRetry(() => Promise.all([
            this.prisma.tenantMembership.findMany({
                orderBy: [{ isActive: "desc" }, { user: { displayName: "asc" } }],
                select: clientUserMembershipSelect,
                skip: (page - 1) * pageSize,
                take: pageSize,
                where
            }),
            this.prisma.tenantMembership.count({ where })
        ]));
        return {
            items: items.map((user) => this.toClientUser(user)),
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize)
        };
    }
    async getUser(id, actor) {
        return this.toClientUser(await this.getTenantMembership(id, actor.tenantId));
    }
    async createUser(dto, actor) {
        this.assertCanManageUsers(actor);
        this.assertCanAssignRole(actor, dto.role);
        const email = this.normalizeEmail(dto.email);
        const existingUser = await this.prisma.withConnectionRetry(() => this.prisma.adminUser.findUnique({
            select: { id: true, role: true },
            where: { email }
        }));
        if (existingUser) {
            if (SUPERADMIN_ROLES.has(existingUser.role)) {
                throw new common_1.BadRequestException("Platform users cannot be assigned to client workspaces");
            }
            await this.assertMembershipAvailable(existingUser.id, actor.tenantId);
        }
        try {
            const user = await this.prisma.withConnectionRetry(() => this.prisma.$transaction(async (transaction) => {
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
                const passwordHash = await bcryptjs_1.default.hash(dto.password, 12);
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
            }));
            this.authService.invalidateUser(user.user.id, user.user.email);
            return this.toClientUser(user);
        }
        catch (error) {
            this.rethrowUniqueEmail(error);
        }
    }
    async updateUser(id, dto, actor) {
        this.assertCanManageUsers(actor);
        const target = await this.getTenantMembership(id, actor.tenantId);
        this.assertCanManageTarget(actor, target);
        if (Object.keys(dto).length === 0) {
            throw new common_1.BadRequestException("Provide at least one user field to update");
        }
        if (actor.id === target.user.id && dto.isActive === false) {
            throw new common_1.BadRequestException("You cannot deactivate your own account");
        }
        if (actor.id === target.user.id && dto.role && dto.role !== target.role) {
            throw new common_1.BadRequestException("You cannot change your own role");
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
        const updatesGlobalIdentity = (displayName !== undefined && displayName !== target.user.displayName) ||
            (email !== undefined && email !== target.user.email);
        if (updatesGlobalIdentity) {
            await this.assertIdentityScopedToTenant(target.user.id, actor.tenantId, "Shared user identities cannot be edited from a single company");
        }
        try {
            const user = await this.prisma.withConnectionRetry(() => this.prisma.$transaction(async (transaction) => {
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
            }));
            this.authService.invalidateUser(target.user.id, target.user.email);
            if (email && email !== target.user.email) {
                this.authService.invalidateUser(target.user.id, email);
            }
            return this.toClientUser(user);
        }
        catch (error) {
            this.rethrowUniqueEmail(error);
        }
    }
    async resetPassword(id, dto, actor) {
        this.assertCanManageUsers(actor);
        const target = await this.getTenantMembership(id, actor.tenantId);
        this.assertCanManageTarget(actor, target);
        await this.assertIdentityScopedToTenant(target.user.id, actor.tenantId, "Shared user passwords must be reset by the platform or account owner");
        const passwordHash = await bcryptjs_1.default.hash(dto.password, 12);
        await this.prisma.withConnectionRetry(() => this.prisma.adminUser.update({
            data: { passwordHash },
            where: { id: target.user.id }
        }));
        this.authService.invalidateUser(target.user.id, target.user.email);
        return { id: target.user.id, passwordUpdated: true };
    }
    async deactivateUser(id, actor) {
        this.assertCanManageUsers(actor);
        const target = await this.getTenantMembership(id, actor.tenantId);
        this.assertCanManageTarget(actor, target);
        if (target.user.id === actor.id) {
            throw new common_1.BadRequestException("You cannot deactivate your own account");
        }
        if (target.role === "owner" && target.isActive) {
            await this.assertAnotherActiveOwner(target.user.id, actor.tenantId);
        }
        if (!target.isActive) {
            return this.toClientUser(target);
        }
        const user = await this.prisma.withConnectionRetry(() => this.prisma.tenantMembership.update({
            data: { isActive: false },
            select: clientUserMembershipSelect,
            where: { tenantId_userId: { tenantId: actor.tenantId, userId: target.user.id } }
        }));
        this.authService.invalidateUser(target.user.id, target.user.email);
        return this.toClientUser(user);
    }
    async getTenantMembership(id, tenantId) {
        const user = await this.prisma.withConnectionRetry(() => this.prisma.tenantMembership.findFirst({
            select: clientUserMembershipSelect,
            where: { tenantId, userId: id }
        }));
        if (!user) {
            throw new common_1.NotFoundException("User not found in this company");
        }
        return user;
    }
    assertCanManageUsers(actor) {
        if (!USER_MANAGER_ROLES.has(actor.role)) {
            throw new common_1.ForbiddenException("Only company owners and admins can manage users");
        }
    }
    assertCanManageTarget(actor, target) {
        if (actor.role !== "owner" && target.role === "owner") {
            throw new common_1.ForbiddenException("Only a company owner can manage another owner");
        }
    }
    assertCanAssignRole(actor, role) {
        if (role === "owner" && actor.role !== "owner") {
            throw new common_1.ForbiddenException("Only a company owner can assign the owner role");
        }
    }
    async assertAnotherActiveOwner(excludedUserId, tenantId) {
        const ownerCount = await this.prisma.withConnectionRetry(() => this.prisma.tenantMembership.count({
            where: {
                isActive: true,
                role: "owner",
                tenantId,
                userId: { not: excludedUserId },
                user: { isActive: true }
            }
        }));
        if (ownerCount === 0) {
            throw new common_1.BadRequestException("A company must retain at least one active owner");
        }
    }
    async assertEmailAvailable(email, excludedUserId) {
        const existing = await this.prisma.withConnectionRetry(() => this.prisma.adminUser.findUnique({
            select: { id: true },
            where: { email }
        }));
        if (existing && existing.id !== excludedUserId) {
            throw new common_1.ConflictException("A user with this email already exists");
        }
    }
    async assertMembershipAvailable(userId, tenantId) {
        const existing = await this.prisma.withConnectionRetry(() => this.prisma.tenantMembership.findUnique({
            select: { id: true },
            where: { tenantId_userId: { tenantId, userId } }
        }));
        if (existing) {
            throw new common_1.ConflictException("This user already belongs to the company");
        }
    }
    async assertIdentityScopedToTenant(userId, tenantId, message) {
        const otherMemberships = await this.prisma.withConnectionRetry(() => this.prisma.tenantMembership.count({
            where: {
                tenantId: { not: tenantId },
                userId
            }
        }));
        if (otherMemberships > 0) {
            throw new common_1.BadRequestException(message);
        }
    }
    rethrowUniqueEmail(error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            throw new common_1.ConflictException("A user with this email already exists");
        }
        throw error;
    }
    normalizeEmail(email) {
        return email.trim().toLowerCase();
    }
    toClientUser(membership) {
        return {
            id: membership.user.id,
            displayName: membership.user.displayName,
            email: membership.user.email,
            role: membership.role,
            status: membership.isActive && membership.user.isActive ? "active" : "inactive",
            lastLoginAt: membership.user.lastLoginAt,
            createdAt: membership.user.createdAt,
            updatedAt: membership.updatedAt > membership.user.updatedAt ? membership.updatedAt : membership.user.updatedAt
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map