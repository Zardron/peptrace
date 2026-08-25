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
exports.PlatformService = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const prisma_service_1 = require("../prisma/prisma.service");
const SUPERADMIN_ROLES = new Set(["superadmin", "platform_admin"]);
let PlatformService = class PlatformService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    getAccountProfile(user) {
        this.assertPlatformAdmin(user);
        return {
            id: user.id,
            displayName: user.displayName,
            email: user.email,
            role: user.role,
            tenant: user.tenant
        };
    }
    listApiSurfaces(user) {
        this.assertPlatformAdmin(user);
        return this.prisma.apiSurface.findMany({
            orderBy: { group: "asc" }
        });
    }
    createApiKey(dto, user) {
        this.assertPlatformAdmin(user);
        const id = (0, node_crypto_1.randomUUID)();
        return {
            id,
            label: dto.label,
            scopes: dto.scopes,
            createdBy: user.id,
            tenantId: user.tenantId,
            keyPreview: `pk_live_${id.slice(0, 8)}...`,
            createdAt: new Date().toISOString()
        };
    }
    assertPlatformAdmin(user) {
        if (!SUPERADMIN_ROLES.has(user.role) || user.tenantId) {
            throw new common_1.ForbiddenException("Only platform admins can access platform account APIs");
        }
    }
};
exports.PlatformService = PlatformService;
exports.PlatformService = PlatformService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PlatformService);
//# sourceMappingURL=platform.service.js.map