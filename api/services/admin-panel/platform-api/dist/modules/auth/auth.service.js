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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_service_1 = require("../prisma/prisma.service");
const SUPERADMIN_ROLES = new Set(["superadmin", "platform_admin"]);
const AUTHENTICATED_USER_CACHE_TTL_MS = 60_000;
const LOGIN_USER_CACHE_TTL_MS = 30_000;
let AuthService = AuthService_1 = class AuthService {
    jwtService;
    prisma;
    logger = new common_1.Logger(AuthService_1.name);
    authenticatedUserCache = new Map();
    loginUserCache = new Map();
    constructor(jwtService, prisma) {
        this.jwtService = jwtService;
        this.prisma = prisma;
    }
    async login(dto) {
        const email = this.normalizeEmail(dto.email);
        const adminUser = await this.findLoginUser(email);
        if (!adminUser || !this.isPlatformAdmin(adminUser)) {
            throw new common_1.UnauthorizedException("Invalid superadmin email or password");
        }
        const validPassword = await bcryptjs_1.default.compare(dto.password, adminUser.passwordHash);
        if (!validPassword) {
            throw new common_1.UnauthorizedException("Invalid superadmin email or password");
        }
        this.recordLastLogin(adminUser.id);
        const authenticatedUser = this.toAuthenticatedAdminUser(adminUser);
        this.cacheAuthenticatedUser(authenticatedUser);
        return this.issueToken(authenticatedUser);
    }
    async register(dto) {
        void dto;
        throw new common_1.ForbiddenException("Client admin registration belongs to the client API service");
    }
    async refresh(authorizationHeader) {
        const adminUser = await this.getAuthenticatedUser(authorizationHeader);
        return this.issueToken(adminUser);
    }
    async me(authorizationHeader) {
        return this.getAuthenticatedUser(authorizationHeader);
    }
    async getAuthenticatedUser(authorizationHeader) {
        const token = this.extractBearerToken(authorizationHeader);
        if (!token) {
            throw new common_1.UnauthorizedException("Missing bearer token");
        }
        let payload;
        try {
            payload = await this.jwtService.verifyAsync(token);
        }
        catch {
            throw new common_1.UnauthorizedException("Invalid or expired bearer token");
        }
        const cachedUser = this.authenticatedUserCache.get(payload.sub);
        if (cachedUser && cachedUser.expiresAt > Date.now()) {
            return cachedUser.user;
        }
        this.authenticatedUserCache.delete(payload.sub);
        const adminUser = await this.prisma.adminUser.findUnique({
            include: { tenant: true },
            where: { id: payload.sub }
        });
        if (!adminUser || !this.isPlatformAdmin(adminUser)) {
            throw new common_1.UnauthorizedException("Superadmin session not found");
        }
        const authenticatedUser = this.toAuthenticatedAdminUser(adminUser);
        this.cacheAuthenticatedUser(authenticatedUser);
        return authenticatedUser;
    }
    async issueToken(user) {
        const accessToken = await this.jwtService.signAsync({
            email: user.email,
            membershipId: user.membershipId,
            role: user.role,
            sub: user.id,
            tenantId: user.tenantId
        });
        return {
            accessToken,
            tokenType: "Bearer",
            expiresIn: 3600,
            user: {
                email: user.email,
                displayName: user.displayName,
                id: user.id,
                membershipId: user.membershipId,
                role: user.role,
                tenantId: user.tenantId,
                tenantName: user.tenantName,
                tenantSlug: user.tenantSlug,
                tenants: user.tenants
            }
        };
    }
    extractBearerToken(authorizationHeader) {
        const match = authorizationHeader?.match(/^Bearer\s+(.+)$/i);
        return match?.[1]?.trim() || null;
    }
    normalizeEmail(email) {
        return email.trim().toLowerCase();
    }
    async findLoginUser(email) {
        const cachedUser = this.loginUserCache.get(email);
        if (cachedUser) {
            if (cachedUser.expiresAt <= Date.now()) {
                cachedUser.expiresAt = Date.now() + LOGIN_USER_CACHE_TTL_MS;
                this.refreshLoginUser(email);
            }
            return cachedUser.user;
        }
        const user = await this.queryLoginUser(email);
        if (user) {
            this.loginUserCache.set(email, {
                expiresAt: Date.now() + LOGIN_USER_CACHE_TTL_MS,
                user
            });
        }
        return user;
    }
    queryLoginUser(email) {
        return this.prisma.withConnectionRetry(() => this.prisma.adminUser.findUnique({
            include: { tenant: true },
            where: { email }
        }));
    }
    refreshLoginUser(email) {
        void this.queryLoginUser(email)
            .then((user) => {
            if (user) {
                this.loginUserCache.set(email, {
                    expiresAt: Date.now() + LOGIN_USER_CACHE_TTL_MS,
                    user
                });
            }
        })
            .catch((error) => {
            const message = error instanceof Error ? error.message : "Unknown database error";
            this.logger.warn(`Could not refresh the cached superadmin account: ${message}`);
        });
    }
    recordLastLogin(userId) {
        void this.prisma.adminUser
            .update({
            data: { lastLoginAt: new Date() },
            where: { id: userId }
        })
            .catch((error) => {
            const message = error instanceof Error ? error.message : "Unknown database error";
            this.logger.warn(`Could not record the superadmin login: ${message}`);
        });
    }
    cacheAuthenticatedUser(user) {
        this.authenticatedUserCache.set(user.id, {
            expiresAt: Date.now() + AUTHENTICATED_USER_CACHE_TTL_MS,
            user
        });
    }
    isPlatformAdmin(adminUser) {
        return Boolean(adminUser?.isActive && SUPERADMIN_ROLES.has(adminUser.role) && !adminUser.tenantId);
    }
    toAuthenticatedAdminUser(adminUser) {
        return {
            id: adminUser.id,
            displayName: adminUser.displayName,
            email: adminUser.email,
            membershipId: null,
            role: adminUser.role,
            tenantId: adminUser.tenantId,
            tenantName: adminUser.tenant?.name ?? null,
            tenantSlug: adminUser.tenant?.slug ?? null,
            tenant: adminUser.tenant
                ? {
                    id: adminUser.tenant.id,
                    name: adminUser.tenant.name,
                    slug: adminUser.tenant.slug
                }
                : null,
            tenants: []
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        prisma_service_1.PrismaService])
], AuthService);
//# sourceMappingURL=auth.service.js.map