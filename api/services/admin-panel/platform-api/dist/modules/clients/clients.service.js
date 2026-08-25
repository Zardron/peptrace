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
exports.ClientsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const admin_panel_service_1 = require("../admin-panel/admin-panel.service");
const prisma_service_1 = require("../prisma/prisma.service");
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
};
let ClientsService = class ClientsService {
    prisma;
    adminPanelService;
    constructor(prisma, adminPanelService) {
        this.prisma = prisma;
        this.adminPanelService = adminPanelService;
    }
    listClients(user) {
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
    async getClient(idOrSlug, user) {
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
            throw new common_1.NotFoundException("Client tenant not found");
        }
        if (!this.isSuperAdmin(user) && client.id !== user.tenantId) {
            throw new common_1.ForbiddenException("You can only access your assigned client company");
        }
        return this.toClientPayload(client);
    }
    async createClient(dto, user) {
        this.assertSuperadmin(user);
        this.assertValidSlug(dto.slug);
        if (dto.ownerUser) {
            await this.assertOwnerUserCanBeInvited(dto.ownerUser);
        }
        try {
            const client = await this.prisma.withConnectionRetry(() => this.prisma.$transaction(async (transaction) => {
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
            }));
            this.adminPanelService.invalidateCompaniesCache();
            return this.toClientPayload(client);
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
                throw new common_1.ConflictException("A client with this slug or identifier already exists");
            }
            throw error;
        }
    }
    buildTenantSettings(dto) {
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
    buildWhiteLabelPanel(dto) {
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
    async ensureOwnerMembership(transaction, tenantId, ownerUser) {
        const email = ownerUser.email.trim().toLowerCase();
        const existingUser = await transaction.adminUser.findUnique({
            select: { id: true, role: true },
            where: { email }
        });
        if (!existingUser && !ownerUser.password) {
            throw new common_1.BadRequestException("Provide an initial password for the new client owner");
        }
        let userId = existingUser?.id;
        if (!userId) {
            const password = ownerUser.password;
            if (!password) {
                throw new common_1.BadRequestException("Provide an initial password for the new client owner");
            }
            userId = (await transaction.adminUser.create({
                data: {
                    displayName: ownerUser.displayName.trim(),
                    email,
                    isActive: true,
                    passwordHash: await bcryptjs_1.default.hash(password, 12),
                    role: "owner",
                    tenantId
                },
                select: { id: true }
            })).id;
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
    async assertOwnerUserCanBeInvited(ownerUser) {
        const existingUser = await this.prisma.adminUser.findUnique({
            select: { isActive: true, role: true },
            where: { email: ownerUser.email.trim().toLowerCase() }
        });
        if (existingUser && SUPERADMIN_ROLES.has(existingUser.role)) {
            throw new common_1.BadRequestException("Platform users cannot be invited as client owners through onboarding");
        }
        if (existingUser && !existingUser.isActive) {
            throw new common_1.BadRequestException("Inactive users cannot be invited as client owners through onboarding");
        }
        if (!existingUser && !ownerUser.password) {
            throw new common_1.BadRequestException("Provide an initial password for the new client owner");
        }
    }
    writeAudit(transaction, user, action, tenantId, metadata) {
        return transaction.platformAuditEvent.create({
            data: {
                action,
                actorId: user.id,
                metadata,
                tenantId
            }
        });
    }
    assertValidSlug(slug) {
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
            throw new common_1.BadRequestException("Client slug must contain lowercase letters, numbers, and single hyphens");
        }
    }
    jsonObject(value) {
        return (value ?? {});
    }
    assertSuperadmin(user) {
        if (!this.isSuperAdmin(user) || user.tenantId) {
            throw new common_1.ForbiddenException("Only platform superadmins can create client companies");
        }
    }
    isSuperAdmin(user) {
        return SUPERADMIN_ROLES.has(user.role) && !user.tenantId;
    }
    toClientPayload(client) {
        const { monthlySpend, plan, seats, memberships, ...rest } = client;
        return {
            ...rest,
            adminUsers: memberships?.map((membership) => ({
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
};
exports.ClientsService = ClientsService;
exports.ClientsService = ClientsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        admin_panel_service_1.AdminPanelService])
], ClientsService);
//# sourceMappingURL=clients.service.js.map