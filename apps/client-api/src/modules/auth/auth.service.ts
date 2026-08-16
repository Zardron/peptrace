import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./auth.dto";
import { AuthenticatedClientUser, AuthTokenPayload, ClientSession } from "./auth.types";

type AdminUserWithTenant = Prisma.AdminUserGetPayload<{ include: { tenant: true } }>;

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
  private readonly loginUserCache = new Map<string, { expiresAt: number; user: AdminUserWithTenant }>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService
  ) {}

  async login(dto: LoginDto): Promise<ClientSession> {
    const email = this.normalizeEmail(dto.email);
    const adminUser = await this.findLoginUser(email);

    if (!adminUser || !adminUser.tenant || SUPERADMIN_ROLES.has(adminUser.role)) {
      throw new UnauthorizedException("Invalid client email or password");
    }

    const validPassword = await bcrypt.compare(dto.password, adminUser.passwordHash);
    if (!validPassword) {
      throw new UnauthorizedException("Invalid client email or password");
    }

    this.recordLastLogin(adminUser.id);

    const authenticatedUser = this.toAuthenticatedClientUser(adminUser);
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

    const cachedUser = this.authenticatedUserCache.get(payload.sub);
    if (cachedUser && cachedUser.expiresAt > Date.now()) {
      return cachedUser.user;
    }

    this.authenticatedUserCache.delete(payload.sub);

    const adminUser = await this.prisma.adminUser.findUnique({
      include: { tenant: true },
      where: { id: payload.sub }
    });

    if (!adminUser || !adminUser.tenant || SUPERADMIN_ROLES.has(adminUser.role)) {
      throw new UnauthorizedException("Client session not found");
    }

    const authenticatedUser = this.toAuthenticatedClientUser(adminUser);
    this.cacheAuthenticatedUser(authenticatedUser);
    return authenticatedUser;
  }

  private async issueToken(user: AuthenticatedClientUser): Promise<ClientSession> {
    const accessToken = await this.jwtService.signAsync({
      email: user.email,
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
        role: user.role,
        tenantId: user.tenantId,
        tenantName: user.tenantName,
        tenantSlug: user.tenantSlug
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

  private async findLoginUser(email: string): Promise<AdminUserWithTenant | null> {
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

  private queryLoginUser(email: string): Promise<AdminUserWithTenant | null> {
    return this.prisma.withConnectionRetry(() =>
      this.prisma.adminUser.findUnique({
        include: { tenant: true },
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
    this.authenticatedUserCache.set(user.id, {
      expiresAt: Date.now() + AUTHENTICATED_USER_CACHE_TTL_MS,
      user
    });
  }

  private toAuthenticatedClientUser(adminUser: AdminUserWithTenant): AuthenticatedClientUser {
    if (!adminUser.tenant) {
      throw new UnauthorizedException("Client account is not assigned to a company");
    }

    return {
      id: adminUser.id,
      displayName: adminUser.displayName,
      email: adminUser.email,
      role: adminUser.role,
      tenantId: adminUser.tenant.id,
      tenantName: adminUser.tenant.name,
      tenantSlug: adminUser.tenant.slug,
      tenant: {
        id: adminUser.tenant.id,
        name: adminUser.tenant.name,
        slug: adminUser.tenant.slug
      }
    };
  }
}
