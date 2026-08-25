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
const ADMIN_PANEL_CACHE_TTL_MS = 30_000;
const fallbackPanelDefinition = {
    brandName: "Client workspace",
    enabledModules: ["overview", "operations", "users", "secrets", "access"],
    productName: "Client admin",
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
    companyCache = new Map();
    dataCache = new Map();
    statsCache = new Map();
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getContext(user) {
        const company = await this.getCompany(user.tenantId);
        const isPeptrace = company.slug === "peptrace";
        const stats = isPeptrace
            ? await this.getPeptraceStats(user.tenantId, user.tenantName)
            : {
                accountWorkItems: [],
                apiSurfaceCount: 0,
                labTestCount: 0,
                vendorCount: 0
            };
        return {
            mode: "client",
            viewer: {
                id: user.id,
                displayName: user.displayName,
                email: user.email,
                role: user.role,
                tenant: user.tenant
            },
            company: this.toCompanyPayload(company),
            panel: this.buildClientPanel(company, stats)
        };
    }
    async getData(user) {
        const cachedData = this.dataCache.get(user.tenantId);
        if (cachedData) {
            if (cachedData.expiresAt <= Date.now()) {
                cachedData.expiresAt = Date.now() + ADMIN_PANEL_CACHE_TTL_MS;
                this.refreshData(user);
            }
            return cachedData.data;
        }
        const data = await this.queryData(user);
        this.dataCache.set(user.tenantId, {
            data,
            expiresAt: Date.now() + ADMIN_PANEL_CACHE_TTL_MS
        });
        return data;
    }
    queryData(user) {
        const includeCatalogData = user.tenantSlug === "peptrace";
        return this.prisma
            .withConnectionRetry(() => Promise.all([
            this.prisma.clientTenant.findMany({
                where: { id: user.tenantId },
                orderBy: { name: "asc" }
            }),
            includeCatalogData
                ? this.prisma.vendor.findMany({
                    include: { products: true },
                    orderBy: { displayName: "asc" }
                })
                : Promise.resolve([]),
            includeCatalogData
                ? this.prisma.peptide.findMany({
                    include: { tests: true },
                    orderBy: { label: "asc" }
                })
                : Promise.resolve([]),
            includeCatalogData
                ? this.prisma.lab.findMany({
                    include: { tests: true },
                    orderBy: { displayName: "asc" }
                })
                : Promise.resolve([]),
            includeCatalogData
                ? this.prisma.labTest.findMany({
                    include: {
                        lab: true,
                        peptide: true,
                        vendor: true
                    },
                    orderBy: { createdAt: "desc" }
                })
                : Promise.resolve([]),
            includeCatalogData
                ? this.prisma.apiSurface.findMany({
                    orderBy: { group: "asc" }
                })
                : Promise.resolve([]),
            this.prisma.accountWorkItem.findMany({
                where: { account: user.tenantName },
                orderBy: { dueAt: "asc" }
            })
        ]))
            .then(([clients, vendors, peptides, labs, tests, apiSurfaces, accountWorkItems]) => ({
            accountWorkItems,
            apiSurfaces,
            clients: clients.map((client) => this.toCompanyPayload(client)),
            labs,
            peptides,
            tests,
            vendors
        }));
    }
    refreshData(user) {
        void this.queryData(user)
            .then((data) => {
            this.dataCache.set(user.tenantId, {
                data,
                expiresAt: Date.now() + ADMIN_PANEL_CACHE_TTL_MS
            });
        })
            .catch((error) => {
            const message = error instanceof Error ? error.message : "Unknown database error";
            this.logger.warn(`Could not refresh cached client data: ${message}`);
        });
    }
    async getPeptraceStats(tenantId, account) {
        const cachedStats = this.statsCache.get(tenantId);
        if (cachedStats) {
            if (cachedStats.expiresAt <= Date.now()) {
                cachedStats.expiresAt = Date.now() + ADMIN_PANEL_CACHE_TTL_MS;
                this.refreshPeptraceStats(tenantId, account);
            }
            return cachedStats.stats;
        }
        const stats = await this.queryPeptraceStats(account);
        this.statsCache.set(tenantId, {
            stats,
            expiresAt: Date.now() + ADMIN_PANEL_CACHE_TTL_MS
        });
        return stats;
    }
    async queryPeptraceStats(account) {
        const [accountWorkItems, vendorCount, labTestCount, apiSurfaceCount] = await this.prisma.withConnectionRetry(() => Promise.all([
            this.getAccountWorkItems(account),
            this.prisma.vendor.count(),
            this.prisma.labTest.count(),
            this.prisma.apiSurface.count()
        ]));
        return {
            accountWorkItems,
            apiSurfaceCount,
            labTestCount,
            vendorCount
        };
    }
    refreshPeptraceStats(tenantId, account) {
        void this.queryPeptraceStats(account)
            .then((stats) => {
            this.statsCache.set(tenantId, {
                stats,
                expiresAt: Date.now() + ADMIN_PANEL_CACHE_TTL_MS
            });
        })
            .catch((error) => {
            const message = error instanceof Error ? error.message : "Unknown database error";
            this.logger.warn(`Could not refresh cached Peptrace statistics: ${message}`);
        });
    }
    async getCompany(tenantId) {
        const cachedCompany = this.companyCache.get(tenantId);
        if (cachedCompany) {
            if (cachedCompany.expiresAt <= Date.now()) {
                cachedCompany.expiresAt = Date.now() + ADMIN_PANEL_CACHE_TTL_MS;
                this.refreshCompany(tenantId);
            }
            return cachedCompany.company;
        }
        const company = await this.queryCompany(tenantId);
        if (!company) {
            throw new common_1.NotFoundException("Client company not found");
        }
        this.companyCache.set(tenantId, {
            company,
            expiresAt: Date.now() + ADMIN_PANEL_CACHE_TTL_MS
        });
        return company;
    }
    queryCompany(tenantId) {
        return this.prisma.withConnectionRetry(() => this.prisma.clientTenant.findUnique({
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
                settings: {
                    select: { enabledModules: true }
                },
                whiteLabelPanel: true
            },
            where: { id: tenantId }
        })).then((company) => (company ? this.withMembershipAccounts(company) : null));
    }
    refreshCompany(tenantId) {
        void this.queryCompany(tenantId)
            .then((company) => {
            if (company) {
                this.companyCache.set(tenantId, {
                    company,
                    expiresAt: Date.now() + ADMIN_PANEL_CACHE_TTL_MS
                });
            }
        })
            .catch((error) => {
            const message = error instanceof Error ? error.message : "Unknown database error";
            this.logger.warn(`Could not refresh the cached client panel: ${message}`);
        });
    }
    getAccountWorkItems(account) {
        return this.prisma.accountWorkItem.findMany({
            orderBy: { dueAt: "asc" },
            where: { account }
        });
    }
    buildClientPanel(company, data) {
        const definition = this.toPanelDefinition(company.whiteLabelPanel);
        const workItems = data.accountWorkItems.map((item) => ({
            label: item.kind,
            detail: `Due ${this.formatDate(item.dueAt)}`,
            priority: this.toPriority(item.priority)
        }));
        const isPeptrace = company.slug === "peptrace";
        const isShamstay = company.slug === "shamstay-bnb";
        const isRealEstate = company.slug === "sham-real-estate-hub";
        const primaryRecords = isPeptrace
            ? [
                {
                    label: "Vendor catalog",
                    detail: "Database-backed vendor records",
                    status: "Ready",
                    value: `${data.vendorCount} vendors`
                },
                {
                    label: "Lab testing",
                    detail: "Database-backed testing workflow",
                    status: data.labTestCount > 0 ? "In review" : "Ready",
                    value: `${data.labTestCount} tests`
                },
                {
                    label: "Customer API",
                    detail: "Database-backed API surface readiness",
                    status: "Scoped",
                    value: `${data.apiSurfaceCount} surfaces`
                }
            ]
            : definition.primaryRecords;
        const panelWorkItems = isPeptrace && workItems.length > 0 ? workItems : definition.workItems;
        const enabledModules = company.settings?.enabledModules && company.settings.enabledModules.length > 0
            ? company.settings.enabledModules
            : definition.enabledModules;
        return {
            ...definition,
            enabledModules,
            primaryRecords: primaryRecords.length > 0 ? primaryRecords : definition.primaryRecords,
            workItems: panelWorkItems.length > 0 ? panelWorkItems : definition.workItems,
            metrics: [
                {
                    label: isShamstay ? "Portfolio access" : isRealEstate ? "Brokerage access" : "Workspace access",
                    value: "Granted",
                    change: `${company.adminUsers.length} enabled accounts`,
                    tone: "info"
                },
                {
                    label: isShamstay ? "Portfolio status" : isRealEstate ? "Pipeline status" : "Workspace status",
                    value: company.status,
                    change: isShamstay || isRealEstate ? `${company.dataRegion} operating region` : `${company.dataRegion} data region`,
                    tone: company.status === "Healthy" ? "success" : "warning"
                },
                {
                    label: isShamstay ? "Stay tasks" : isRealEstate ? "Deal tasks" : "Open items",
                    value: company.openItems.toString(),
                    change: isShamstay
                        ? "Reservations and turnover queue"
                        : isRealEstate
                            ? "Leads, viewings, and offers"
                            : "Tenant-scoped queue",
                    tone: company.openItems > 1 ? "warning" : "success"
                },
                {
                    label: isShamstay ? "Monthly bookings" : isRealEstate ? "Pipeline value" : "Operational value",
                    value: this.formatClientCurrency(company.slug, company.monthlySpend),
                    change: isShamstay ? "Current owner reporting" : isRealEstate ? "Active listings and offers" : "Current workspace reporting",
                    tone: "neutral"
                }
            ]
        };
    }
    formatCurrency(amount) {
        return `$${amount.toLocaleString("en-US")}`;
    }
    formatClientCurrency(slug, amount) {
        return slug === "shamstay-bnb" || slug === "sham-real-estate-hub"
            ? `USD ${amount.toLocaleString("en-US")}`
            : this.formatCurrency(amount);
    }
    toCompanyPayload(company) {
        const { monthlySpend, plan, seats, settings: _settings, ...client } = company;
        void _settings;
        return {
            ...client,
            accessStatus: plan,
            enabledAccounts: seats,
            operationalValue: monthlySpend
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
    toPanelDefinition(panel) {
        if (!panel) {
            return fallbackPanelDefinition;
        }
        return {
            brandName: panel.brandName,
            enabledModules: fallbackPanelDefinition.enabledModules,
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
    formatDate(value) {
        return new Intl.DateTimeFormat("en", {
            day: "numeric",
            month: "short",
            year: "numeric"
        }).format(value);
    }
    toPriority(value) {
        return value === "High" || value === "Medium" || value === "Low" ? value : "Medium";
    }
};
exports.AdminPanelService = AdminPanelService;
exports.AdminPanelService = AdminPanelService = AdminPanelService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminPanelService);
//# sourceMappingURL=admin-panel.service.js.map