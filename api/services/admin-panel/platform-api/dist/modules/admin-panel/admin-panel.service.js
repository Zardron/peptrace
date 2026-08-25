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
var AdminPanelService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminPanelService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const SUPERADMIN_ROLES = new Set(["superadmin", "platform_admin"]);
const SUPERADMIN_ROLE_VALUES = ["superadmin", "platform_admin"];
const ADMIN_PANEL_CACHE_TTL_MS = 30_000;
const fallbackPanelDefinition = {
    brandName: "Client workspace",
    productName: "Admin panel",
    industry: "Operations",
    accentColor: "#0e7467",
    overviewTitle: "Client admin panel",
    overviewDescription: "Manage this company workspace, users, access state, and operational queue.",
    operationsTitle: "Workspace operations",
    operationsDescription: "Current work across this client account.",
    primaryRecords: [
        {
            label: "Operations queue",
            detail: "Tenant-scoped work",
            status: "Active",
            value: "Live"
        }
    ],
    workItems: [
        {
            label: "Review workspace setup",
            detail: "Confirm account permissions and access settings",
            priority: "Medium"
        }
    ]
};
let AdminPanelService = AdminPanelService_1 = class AdminPanelService {
    prisma;
    logger = new common_1.Logger(AdminPanelService_1.name);
    companiesCache = null;
    internalAccountsCache = null;
    constructor(prisma) {
        this.prisma = prisma;
    }
    invalidateCompaniesCache() {
        this.companiesCache = null;
    }
    async getContext(user) {
        if (!this.isSuperAdmin(user)) {
            throw new common_1.ForbiddenException("The superadmin API only serves EsteemedEngineering platform admins");
        }
        const [clients, internalAccounts] = await Promise.all([this.listCompanies(), this.listInternalAccounts()]);
        return {
            mode: "superadmin",
            viewer: this.toViewer(user),
            platform: {
                title: "EsteemedEngineering superadmin",
                description: "EsteemedEngineering manages all white-label client workspaces, companies, and admin accounts.",
                metrics: [
                    {
                        label: "Client companies",
                        value: clients.length.toString(),
                        change: "White-label workspaces",
                        tone: "info"
                    },
                    {
                        label: "Admin accounts",
                        value: (internalAccounts.length + clients.reduce((total, client) => total + client.adminUsers.length, 0)).toString(),
                        change: "Across every company",
                        tone: "success"
                    },
                    {
                        label: "Open items",
                        value: clients.reduce((total, client) => total + client.openItems, 0).toString(),
                        change: "Tenant work queues",
                        tone: "warning"
                    },
                    {
                        label: "Access model",
                        value: "Direct",
                        change: "Company access granted by approval",
                        tone: "neutral"
                    }
                ],
                internalAccounts,
                secretLocker: this.toSecretLockerSummary(clients),
                clients: clients.map((client) => ({
                    ...this.toCompanyPayload(client),
                    panel: this.toPanelDefinition(client.whiteLabelPanel)
                }))
            }
        };
    }
    async listCompanies() {
        if (this.companiesCache) {
            if (this.companiesCache.expiresAt <= Date.now()) {
                this.companiesCache.expiresAt = Date.now() + ADMIN_PANEL_CACHE_TTL_MS;
                this.refreshCompanies();
            }
            return this.companiesCache.companies;
        }
        const companies = await this.queryCompanies();
        this.companiesCache = {
            companies,
            expiresAt: Date.now() + ADMIN_PANEL_CACHE_TTL_MS
        };
        return companies;
    }
    async listInternalAccounts() {
        if (this.internalAccountsCache) {
            if (this.internalAccountsCache.expiresAt <= Date.now()) {
                this.internalAccountsCache.expiresAt = Date.now() + ADMIN_PANEL_CACHE_TTL_MS;
                this.refreshInternalAccounts();
            }
            return this.internalAccountsCache.accounts;
        }
        const accounts = await this.queryInternalAccounts();
        this.internalAccountsCache = {
            accounts,
            expiresAt: Date.now() + ADMIN_PANEL_CACHE_TTL_MS
        };
        return accounts;
    }
    queryCompanies() {
        return this.prisma.withConnectionRetry(() => this.prisma.clientTenant.findMany({
            include: {
                memberships: {
                    orderBy: { user: { displayName: "asc" } },
                    select: {
                        role: true,
                        createdAt: true,
                        user: {
                            select: {
                                id: true,
                                displayName: true,
                                email: true,
                                isActive: true,
                                lastLoginAt: true,
                                createdAt: true
                            }
                        }
                    }
                },
                secrets: {
                    orderBy: { updatedAt: "desc" },
                    select: {
                        _count: { select: { versions: true } },
                        description: true,
                        id: true,
                        name: true,
                        updatedAt: true,
                        versions: {
                            orderBy: { version: "desc" },
                            select: { state: true, version: true },
                            take: 1
                        }
                    }
                },
                whiteLabelPanel: true
            },
            orderBy: { name: "asc" },
            where: {
                whiteLabelPanel: {
                    isNot: null
                }
            }
        })).then((companies) => companies.map((company) => this.withMembershipAccounts(company)));
    }
    queryInternalAccounts() {
        return this.prisma.withConnectionRetry(() => this.prisma.adminUser.findMany({
            orderBy: { displayName: "asc" },
            select: {
                id: true,
                displayName: true,
                email: true,
                role: true,
                lastLoginAt: true,
                createdAt: true
            },
            where: {
                role: { in: SUPERADMIN_ROLE_VALUES },
                tenantId: null
            }
        }));
    }
    refreshCompanies() {
        void this.queryCompanies()
            .then((companies) => {
            this.companiesCache = {
                companies,
                expiresAt: Date.now() + ADMIN_PANEL_CACHE_TTL_MS
            };
        })
            .catch((error) => this.logCacheRefreshError("companies", error));
    }
    refreshInternalAccounts() {
        void this.queryInternalAccounts()
            .then((accounts) => {
            this.internalAccountsCache = {
                accounts,
                expiresAt: Date.now() + ADMIN_PANEL_CACHE_TTL_MS
            };
        })
            .catch((error) => this.logCacheRefreshError("internal accounts", error));
    }
    logCacheRefreshError(scope, error) {
        const message = error instanceof Error ? error.message : "Unknown database error";
        this.logger.warn(`Could not refresh cached ${scope}: ${message}`);
    }
    toPanelDefinition(panel) {
        if (!panel) {
            return fallbackPanelDefinition;
        }
        return {
            brandName: panel.brandName,
            productName: panel.productName,
            industry: panel.industry,
            accentColor: panel.accentColor,
            overviewTitle: panel.overviewTitle,
            overviewDescription: panel.overviewDescription,
            operationsTitle: panel.operationsTitle,
            operationsDescription: panel.operationsDescription,
            primaryRecords: this.toPanelRecords(panel.primaryRecords),
            workItems: this.toPanelWorkItems(panel.workItems)
        };
    }
    toSecretLockerSummary(clients) {
        const companies = clients.map((client) => {
            const secrets = client.secrets.map((secret) => {
                const latestVersion = secret.versions[0] ?? null;
                return {
                    description: secret.description,
                    id: secret.id,
                    latestState: latestVersion?.state ?? null,
                    latestVersion: latestVersion?.version ?? null,
                    name: secret.name,
                    resourceName: `tenants/${client.slug}/secrets/${secret.name}`,
                    updatedAt: secret.updatedAt,
                    versionCount: secret._count.versions
                };
            });
            return {
                enabledSecrets: secrets.filter((secret) => secret.latestState === "ENABLED").length,
                lastUpdatedAt: secrets[0]?.updatedAt ?? null,
                secretCount: secrets.length,
                secrets,
                tenantId: client.id,
                tenantName: client.name,
                tenantSlug: client.slug,
                versionCount: secrets.reduce((total, secret) => total + secret.versionCount, 0)
            };
        });
        return {
            companies,
            enabledSecrets: companies.reduce((total, company) => total + company.enabledSecrets, 0),
            totalSecrets: companies.reduce((total, company) => total + company.secretCount, 0),
            totalVersions: companies.reduce((total, company) => total + company.versionCount, 0)
        };
    }
    toPanelRecords(value) {
        if (!Array.isArray(value)) {
            return fallbackPanelDefinition.primaryRecords;
        }
        const records = value.flatMap((record) => {
            if (!this.isJsonObject(record)) {
                return [];
            }
            const label = this.jsonString(record.label);
            const detail = this.jsonString(record.detail);
            const status = this.jsonString(record.status);
            const itemValue = this.jsonString(record.value);
            return label && detail && status && itemValue
                ? [
                    {
                        detail,
                        label,
                        status,
                        value: itemValue
                    }
                ]
                : [];
        });
        return records.length > 0 ? records : fallbackPanelDefinition.primaryRecords;
    }
    toPanelWorkItems(value) {
        if (!Array.isArray(value)) {
            return fallbackPanelDefinition.workItems;
        }
        const items = value.flatMap((item) => {
            if (!this.isJsonObject(item)) {
                return [];
            }
            const label = this.jsonString(item.label);
            const detail = this.jsonString(item.detail);
            const priority = this.jsonString(item.priority);
            return label && detail && priority
                ? [
                    {
                        detail,
                        label,
                        priority: this.toPriority(priority)
                    }
                ]
                : [];
        });
        return items.length > 0 ? items : fallbackPanelDefinition.workItems;
    }
    isJsonObject(value) {
        return typeof value === "object" && value !== null && !Array.isArray(value);
    }
    jsonString(value) {
        return typeof value === "string" ? value : null;
    }
    toPriority(value) {
        return value === "High" || value === "Medium" || value === "Low" ? value : "Medium";
    }
    isSuperAdmin(user) {
        return SUPERADMIN_ROLES.has(user.role) && !user.tenantId;
    }
    toViewer(user) {
        return {
            id: user.id,
            displayName: user.displayName,
            email: user.email,
            role: user.role,
            tenant: user.tenant
        };
    }
    withMembershipAccounts(company) {
        const { memberships, adminUsers: _legacyAdminUsers, ...client } = company;
        void _legacyAdminUsers;
        return {
            ...client,
            adminUsers: memberships.map((membership) => ({
                id: membership.user.id,
                displayName: membership.user.displayName,
                email: membership.user.email,
                role: membership.role,
                lastLoginAt: membership.user.lastLoginAt,
                createdAt: membership.user.createdAt
            }))
        };
    }
    toCompanyPayload(company) {
        const { monthlySpend, plan, seats, secrets, whiteLabelPanel, ...client } = company;
        void whiteLabelPanel;
        void secrets;
        return {
            ...client,
            accessStatus: plan,
            enabledAccounts: seats,
            operationalValue: monthlySpend
        };
    }
};
exports.AdminPanelService = AdminPanelService;
exports.AdminPanelService = AdminPanelService = AdminPanelService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminPanelService);
//# sourceMappingURL=admin-panel.service.js.map