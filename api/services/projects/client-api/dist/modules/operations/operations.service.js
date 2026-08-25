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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let OperationsService = class OperationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSummary(user) {
        const panel = await this.getPanel(user.tenantId);
        const [records, workItems] = await Promise.all([
            this.getRecords(user, panel),
            this.getWorkItems(user, panel)
        ]);
        return {
            tenant: user.tenant,
            title: panel.operationsTitle,
            description: panel.operationsDescription,
            counts: {
                records: records.items.length,
                workItems: workItems.items.length
            }
        };
    }
    async getRecords(user, panel) {
        const resolvedPanel = panel ?? (await this.getPanel(user.tenantId));
        return {
            tenant: user.tenant,
            title: resolvedPanel.operationsTitle,
            description: resolvedPanel.operationsDescription,
            items: this.toOperationRecords(resolvedPanel.primaryRecords)
        };
    }
    async getWorkItems(user, panel) {
        const resolvedPanel = panel ?? (await this.getPanel(user.tenantId));
        const accountWorkItems = await this.prisma.withConnectionRetry(() => this.prisma.accountWorkItem.findMany({
            orderBy: { dueAt: "asc" },
            where: { account: user.tenantName }
        }));
        return {
            tenant: user.tenant,
            items: [
                ...this.toOperationWorkItems(resolvedPanel.workItems).map((item, index) => ({
                    id: `panel-${index + 1}`,
                    source: "panel",
                    ...item
                })),
                ...accountWorkItems.map((item) => ({
                    id: item.id,
                    source: "account-work-item",
                    label: item.kind,
                    detail: `${item.account} due ${item.dueAt.toISOString()}`,
                    priority: item.priority,
                    dueAt: item.dueAt.toISOString()
                }))
            ]
        };
    }
    async getPanel(tenantId) {
        const panel = await this.prisma.withConnectionRetry(() => this.prisma.whiteLabelPanel.findUnique({
            select: {
                operationsDescription: true,
                operationsTitle: true,
                primaryRecords: true,
                workItems: true
            },
            where: { clientTenantId: tenantId }
        }));
        if (!panel) {
            throw new common_1.NotFoundException("Client operations panel not found");
        }
        return panel;
    }
    toOperationRecords(value) {
        if (!Array.isArray(value)) {
            return [];
        }
        return value.filter(this.isOperationRecord);
    }
    toOperationWorkItems(value) {
        if (!Array.isArray(value)) {
            return [];
        }
        return value.filter(this.isOperationWorkItem);
    }
    isOperationRecord(value) {
        const record = value;
        return (Boolean(value) &&
            typeof value === "object" &&
            !Array.isArray(value) &&
            typeof record.detail === "string" &&
            typeof record.label === "string" &&
            typeof record.status === "string" &&
            typeof record.value === "string");
    }
    isOperationWorkItem(value) {
        const record = value;
        return (Boolean(value) &&
            typeof value === "object" &&
            !Array.isArray(value) &&
            typeof record.detail === "string" &&
            typeof record.label === "string" &&
            (record.priority === "High" || record.priority === "Medium" || record.priority === "Low"));
    }
};
exports.OperationsService = OperationsService;
exports.OperationsService = OperationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OperationsService);
//# sourceMappingURL=operations.service.js.map