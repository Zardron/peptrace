import { AuthenticatedClientUser } from "../auth/auth.types";
import { CreateUserDto, ListUsersQueryDto, ResetUserPasswordDto, UpdateUserDto } from "./users.dto";
import { UsersService } from "./users.service";
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    listUsers(query: ListUsersQueryDto, user: AuthenticatedClientUser): Promise<{
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
    getUser(id: string, user: AuthenticatedClientUser): Promise<{
        id: string;
        displayName: string;
        email: string;
        role: string;
        status: "active" | "inactive";
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createUser(dto: CreateUserDto, user: AuthenticatedClientUser): Promise<{
        id: string;
        displayName: string;
        email: string;
        role: string;
        status: "active" | "inactive";
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateUser(id: string, dto: UpdateUserDto, user: AuthenticatedClientUser): Promise<{
        id: string;
        displayName: string;
        email: string;
        role: string;
        status: "active" | "inactive";
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    resetPassword(id: string, dto: ResetUserPasswordDto, user: AuthenticatedClientUser): Promise<{
        id: string;
        passwordUpdated: boolean;
    }>;
    deactivateUser(id: string, user: AuthenticatedClientUser): Promise<{
        id: string;
        displayName: string;
        email: string;
        role: string;
        status: "active" | "inactive";
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
