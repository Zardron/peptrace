export declare const CLIENT_USER_ROLES: readonly ["owner", "admin", "manager", "member", "viewer"];
export declare const CLIENT_USER_STATUSES: readonly ["active", "inactive"];
export type ClientUserRole = (typeof CLIENT_USER_ROLES)[number];
export type ClientUserStatus = (typeof CLIENT_USER_STATUSES)[number];
export declare class ListUsersQueryDto {
    search?: string;
    role?: ClientUserRole;
    status?: ClientUserStatus;
    page: number;
    pageSize: number;
}
export declare class CreateUserDto {
    email: string;
    displayName: string;
    role: ClientUserRole;
    password: string;
}
export declare class UpdateUserDto {
    email?: string;
    displayName?: string;
    role?: ClientUserRole;
    isActive?: boolean;
}
export declare class ResetUserPasswordDto {
    password: string;
}
