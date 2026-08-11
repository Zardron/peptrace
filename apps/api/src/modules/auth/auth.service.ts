import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto, RegisterDto } from "./auth.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService
  ) {}

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase();
    const adminUser = await this.prisma.adminUser.findUnique({
      include: { tenant: true },
      where: { email }
    });

    if (!adminUser) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const validPassword = await bcrypt.compare(dto.password, adminUser.passwordHash);
    if (!validPassword) {
      throw new UnauthorizedException("Invalid email or password");
    }

    await this.prisma.adminUser.update({
      data: { lastLoginAt: new Date() },
      where: { id: adminUser.id }
    });

    return this.issueToken({
      email: adminUser.email,
      id: adminUser.id,
      role: adminUser.role,
      tenantId: adminUser.tenantId,
      tenantName: adminUser.tenant?.name ?? null
    });
  }

  async register(dto: RegisterDto) {
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const tenant = await this.prisma.clientTenant.findFirst({
      where: { name: dto.organizationName }
    });
    const adminUser = await this.prisma.adminUser.create({
      data: {
        displayName: dto.organizationName,
        email: dto.email.toLowerCase(),
        passwordHash,
        role: "owner",
        tenantId: tenant?.id
      }
    });

    return {
      organization: dto.organizationName,
      ...(await this.issueToken({
        email: adminUser.email,
        id: adminUser.id,
        role: adminUser.role,
        tenantId: adminUser.tenantId,
        tenantName: tenant?.name ?? null
      }))
    };
  }

  async refresh(email = "admin@peptrace.com") {
    const adminUser = await this.prisma.adminUser.findUnique({
      include: { tenant: true },
      where: { email: email.toLowerCase() }
    });

    if (!adminUser) {
      throw new UnauthorizedException("Admin session not found");
    }

    return this.issueToken({
      email: adminUser.email,
      id: adminUser.id,
      role: adminUser.role,
      tenantId: adminUser.tenantId,
      tenantName: adminUser.tenant?.name ?? null
    });
  }

  async me(authorizationHeader: string | undefined) {
    const token = authorizationHeader?.replace(/^Bearer\s+/i, "");
    if (!token) {
      throw new UnauthorizedException("Missing bearer token");
    }

    const payload = await this.jwtService.verifyAsync<{ sub: string }>(token);
    const adminUser = await this.prisma.adminUser.findUnique({
      include: { tenant: true },
      where: { id: payload.sub }
    });

    if (!adminUser) {
      throw new UnauthorizedException("Admin session not found");
    }

    return {
      id: adminUser.id,
      email: adminUser.email,
      displayName: adminUser.displayName,
      role: adminUser.role,
      tenant: adminUser.tenant
        ? {
            id: adminUser.tenant.id,
            name: adminUser.tenant.name,
            slug: adminUser.tenant.slug,
            plan: adminUser.tenant.plan
          }
        : null
    };
  }

  private async issueToken(user: {
    email: string;
    id: string;
    role: string;
    tenantId: string | null;
    tenantName: string | null;
  }) {
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
        id: user.id,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: user.tenantName
      }
    };
  }
}
