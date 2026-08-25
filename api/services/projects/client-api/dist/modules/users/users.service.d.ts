import { AuthService } from "../auth/auth.service";
import { AuthenticatedClientUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto, ListUsersQueryDto, ResetUserPasswordDto, UpdateUserDto } from "./users.dto";
export declare class UsersService {
    private readonly authService;
    private readonly prisma;
    constructor(authService: AuthService, prisma: PrismaService);
    listUsers(query: ListUsersQueryDto, actor: AuthenticatedClientUser): Promise<{
        items: {
            id: string;
            displayName: string;
            email: string;
            role: string;
            status: "active" | "inactive";
            lastLoginAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        }[];
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    }>;
    getUser(id: string, actor: AuthenticatedClientUser): Promise<{
        id: string;
        displayName: string;
        email: string;
        role: string;
        status: "active" | "inactive";
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createUser(dto: CreateUserDto, actor: AuthenticatedClientUser): Promise<{
        id: string;
        displayName: string;
        email: string;
        role: string;
        status: "active" | "inactive";
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateUser(id: string, dto: UpdateUserDto, actor: AuthenticatedClientUser): Promise<{
        id: string;
        displayName: string;
        email: string;
        role: string;
        status: "active" | "inactive";
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    resetPassword(id: string, dto: ResetUserPasswordDto, actor: AuthenticatedClientUser): Promise<{
        id: string;
        passwordUpdated: boolean;
    }>;
    deactivateUser(id: string, actor: AuthenticatedClientUser): Promise<{
        id: string;
        displayName: string;
        email: string;
        role: string;
        status: "active" | "inactive";
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    private getTenantMembership;
    private assertCanManageUsers;
    private assertCanManageTarget;
    private assertCanAssignRole;
    private assertAnotherActiveOwner;
    private assertEmailAvailable;
    private assertMembershipAvailable;
    private assertIdentityScopedToTenant;
    private rethrowUniqueEmail;
    private normalizeEmail;
    private toClientUser;
}
