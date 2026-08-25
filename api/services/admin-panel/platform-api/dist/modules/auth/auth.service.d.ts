import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto, RegisterDto } from "./auth.dto";
import { AdminSession, AuthenticatedAdminUser } from "./auth.types";
export declare class AuthService {
    private readonly jwtService;
    private readonly prisma;
    private readonly logger;
    private readonly authenticatedUserCache;
    private readonly loginUserCache;
    constructor(jwtService: JwtService, prisma: PrismaService);
    login(dto: LoginDto): Promise<AdminSession>;
    register(dto: RegisterDto): Promise<AdminSession & {
        organization: string;
    }>;
    refresh(authorizationHeader: string | undefined): Promise<AdminSession>;
    me(authorizationHeader: string | undefined): Promise<AuthenticatedAdminUser>;
    getAuthenticatedUser(authorizationHeader: string | undefined): Promise<AuthenticatedAdminUser>;
    private issueToken;
    private extractBearerToken;
    private normalizeEmail;
    private findLoginUser;
    private queryLoginUser;
    private refreshLoginUser;
    private recordLastLogin;
    private cacheAuthenticatedUser;
    private isPlatformAdmin;
    private toAuthenticatedAdminUser;
}
