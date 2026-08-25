import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto, SwitchTenantDto } from "./auth.dto";
import { AuthenticatedClientUser, ClientSession } from "./auth.types";
export declare class AuthService {
    private readonly jwtService;
    private readonly prisma;
    private readonly logger;
    private readonly authenticatedUserCache;
    private readonly loginUserCache;
    constructor(jwtService: JwtService, prisma: PrismaService);
    login(dto: LoginDto): Promise<ClientSession>;
    switchTenant(authorizationHeader: string | undefined, dto: SwitchTenantDto): Promise<ClientSession>;
    refresh(authorizationHeader: string | undefined): Promise<ClientSession>;
    me(authorizationHeader: string | undefined): Promise<AuthenticatedClientUser>;
    getAuthenticatedUser(authorizationHeader: string | undefined): Promise<AuthenticatedClientUser>;
    invalidateUser(userId: string, email?: string): void;
    private issueToken;
    private extractBearerToken;
    private normalizeEmail;
    private findLoginUser;
    private queryLoginUser;
    private refreshLoginUser;
    private recordLastLogin;
    private cacheAuthenticatedUser;
    private getAuthenticatedUserCacheKey;
    private toAuthenticatedClientUser;
    private getMembershipCandidates;
}
