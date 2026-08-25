import { BadRequestException, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto, SwitchTenantDto } from "./auth.dto";
import { AuthenticatedClientUser, AuthTokenPayload, ClientSession } from "./auth.types";
import {
  TenantMembershipCandidate,
  selectTenantMembership,
  toTenantMembershipSummary
} from "./tenant-membership.policy";

type AdminUserWithMemberships = Prisma.AdminUserGetPayload<{
  include: {
    memberships: {
      include: { tenant: true };
    };
    tenant: true;
  };
}>;

const SUPERADMIN_ROLES = new Set(["superadmin", "platform_admin"]);
const AUTHENTICATED_USER_CACHE_TTL_MS = 60_000;
const LOGIN_USER_CACHE_TTL_MS = 30_000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly authenticatedUserCache = new Map<
    string,
    { expiresAt: number; user: AuthenticatedClientUser }
  >();
  private readonly loginUserCache = new Map<string, { expiresAt: number; user: AdminUserWithMemberships }>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService
  ) {}

  async login(dto: LoginDto): Promise<ClientSession> {
    const email = this.normalizeEmail(dto.email);
    const adminUser = await this.findLoginUser(email);

    if (!adminUser || !adminUser.isActive || SUPERADMIN_ROLES.has(adminUser.role)) {
      throw new UnauthorizedException("Invalid client email or password");
    }

    const validPassword = await bcrypt.compare(dto.password, adminUser.passwordHash);
    if (!validPassword) {
      throw new UnauthorizedException("Invalid client email or password");
    }

    this.recordLastLogin(adminUser.id);

    const authenticatedUser = this.toAuthenticatedClientUser(adminUser, dto.tenantId ?? dto.tenantSlug);
    this.cacheAuthenticatedUser(authenticatedUser);
    return this.issueToken(authenticatedUser);
  }

  async switchTenant(authorizationHeader: string | undefined, dto: SwitchTenantDto): Promise<ClientSession> {
    const currentUser = await this.getAuthenticatedUser(authorizationHeader);
    const requestedTenant = dto.tenantId ?? dto.tenantSlug;
    if (!requestedTenant) {
      throw new BadRequestException("Provide tenantId or tenantSlug to switch tenant context");
    }

    const adminUser = await this.queryLoginUser(currentUser.email);
    if (!adminUser || !adminUser.isActive || SUPERADMIN_ROLES.has(adminUser.role)) {
      throw new UnauthorizedException("Client session not found");
    }

    const authenticatedUser = this.toAuthenticatedClientUser(adminUser, requestedTenant);
    this.cacheAuthenticatedUser(authenticatedUser);
    return this.issueToken(authenticatedUser);
  }

  async refresh(authorizationHeader: string | undefined): Promise<ClientSession> {
    const user = await this.getAuthenticatedUser(authorizationHeader);
    return this.issueToken(user);
  }

  async me(authorizationHeader: string | undefined): Promise<AuthenticatedClientUser> {
    return this.getAuthenticatedUser(authorizationHeader);
  }

  async getAuthenticatedUser(authorizationHeader: string | undefined): Promise<AuthenticatedClientUser> {
    const token = this.extractBearerToken(authorizationHeader);
    if (!token) {
      throw new UnauthorizedException("Missing bearer token");
    }

    let payload: AuthTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<AuthTokenPayload>(token);
    } catch {
      throw new UnauthorizedException("Invalid or expired bearer token");
    }

    const cacheKey = this.getAuthenticatedUserCacheKey(payload.sub, payload.tenantId);
    const cachedUser = this.authenticatedUserCache.get(cacheKey);
    if (cachedUser && cachedUser.expiresAt > Date.now()) {
      return cachedUser.user;
    }

    this.authenticatedUserCache.delete(cacheKey);

    const adminUser = await this.prisma.adminUser.findUnique({
      include: {
        memberships: {
          include: { tenant: true }
        },
        tenant: true
      },
      where: { id: payload.sub }
    });

    if (!adminUser || !adminUser.isActive || SUPERADMIN_ROLES.has(adminUser.role)) {
      throw new UnauthorizedException("Client session not found");
    }

    const authenticatedUser = this.toAuthenticatedClientUser(adminUser, payload.tenantId ?? undefined);
    this.cacheAuthenticatedUser(authenticatedUser);
    return authenticatedUser;
  }

  invalidateUser(userId: string, email?: string): void {
    for (const key of this.authenticatedUserCache.keys()) {
      if (key === userId || key.startsWith(`${userId}:`)) {
        this.authenticatedUserCache.delete(key);
      }
    }
    if (email) {
      this.loginUserCache.delete(this.normalizeEmail(email));
    }
  }

  private async issueToken(user: AuthenticatedClientUser): Promise<ClientSession> {
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

  private extractBearerToken(authorizationHeader: string | undefined): string | null {
    const match = authorizationHeader?.match(/^Bearer\s+(.+)$/i);
    return match?.[1]?.trim() || null;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private async findLoginUser(email: string): Promise<AdminUserWithMemberships | null> {
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

  private queryLoginUser(email: string): Promise<AdminUserWithMemberships | null> {
    return this.prisma.withConnectionRetry(() =>
      this.prisma.adminUser.findUnique({
        include: {
          memberships: {
            include: { tenant: true }
          },
          tenant: true
        },
        where: { email }
      })
    );
  }

  private refreshLoginUser(email: string): void {
    void this.queryLoginUser(email)
      .then((user) => {
        if (user) {
          this.loginUserCache.set(email, {
            expiresAt: Date.now() + LOGIN_USER_CACHE_TTL_MS,
            user
          });
        }
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Unknown database error";
        this.logger.warn(`Could not refresh the cached client account: ${message}`);
      });
  }

  private recordLastLogin(userId: string): void {
    void this.prisma.adminUser
      .update({
        data: { lastLoginAt: new Date() },
        where: { id: userId }
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Unknown database error";
        this.logger.warn(`Could not record the client login: ${message}`);
      });
  }

  private cacheAuthenticatedUser(user: AuthenticatedClientUser): void {
    this.authenticatedUserCache.set(this.getAuthenticatedUserCacheKey(user.id, user.tenantId), {
      expiresAt: Date.now() + AUTHENTICATED_USER_CACHE_TTL_MS,
      user
    });
  }

  private getAuthenticatedUserCacheKey(userId: string, tenantId: string | null | undefined): string {
    return `${userId}:${tenantId ?? "none"}`;
  }

  private toAuthenticatedClientUser(
    adminUser: AdminUserWithMemberships,
    requestedTenant?: string | null
  ): AuthenticatedClientUser {
    const memberships = this.getMembershipCandidates(adminUser);
    const selectedMembership = selectTenantMembership(memberships, requestedTenant);

    if (!selectedMembership) {
      throw new UnauthorizedException("Client account is not assigned to a company");
    }

    const tenants = memberships.filter((membership) => membership.isActive).map(toTenantMembershipSummary);

    return {
      id: adminUser.id,
      displayName: adminUser.displayName,
      email: adminUser.email,
      membershipId: selectedMembership.id,
      role: selectedMembership.role,
      tenantId: selectedMembership.tenant.id,
      tenantName: selectedMembership.tenant.name,
      tenantSlug: selectedMembership.tenant.slug,
      tenant: {
        id: selectedMembership.tenant.id,
        name: selectedMembership.tenant.name,
        slug: selectedMembership.tenant.slug
      },
      tenants
    };
  }

  private getMembershipCandidates(adminUser: AdminUserWithMemberships): TenantMembershipCandidate[] {
    const memberships: TenantMembershipCandidate[] = adminUser.memberships
      .filter((membership) => membership.tenant)
      .map((membership) => ({
        id: membership.id,
        isActive: membership.isActive,
        role: membership.role,
        tenant: {
          id: membership.tenant.id,
          name: membership.tenant.name,
          slug: membership.tenant.slug
        }
      }));

    if (adminUser.tenant && !memberships.some((membership) => membership.tenant.id === adminUser.tenantId)) {
      memberships.push({
        id: null,
        isActive: adminUser.isActive,
        role: adminUser.role,
        tenant: {
          id: adminUser.tenant.id,
          name: adminUser.tenant.name,
          slug: adminUser.tenant.slug
        }
      });
    }

    return memberships;
  }
}
