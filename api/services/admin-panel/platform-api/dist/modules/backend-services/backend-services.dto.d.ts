export declare enum BackendServiceScope {
    CLIENT_SPECIFIC = "CLIENT_SPECIFIC",
    SHARED = "SHARED"
}
export declare enum BackendServiceStatus {
    ACTIVE = "ACTIVE",
    DEPRECATED = "DEPRECATED",
    DRAFT = "DRAFT"
}
export declare enum TenantBackendServiceStatus {
    DISABLED = "DISABLED",
    ENABLED = "ENABLED",
    PAUSED = "PAUSED"
}
export declare enum BackendServiceHttpMethod {
    DELETE = "DELETE",
    GET = "GET",
    PATCH = "PATCH",
    POST = "POST",
    PUT = "PUT"
}
export declare class BackendServiceEndpointDto {
    method: BackendServiceHttpMethod;
    path: string;
    summary: string;
    roles?: string[];
}
export declare class ListBackendServicesQueryDto {
    scope?: BackendServiceScope;
    status?: BackendServiceStatus;
}
export declare class CreateBackendServiceDto {
    key: string;
    name: string;
    scope: BackendServiceScope;
    category: string;
    description: string;
    owner: string;
    basePath: string;
    status?: BackendServiceStatus;
    defaultEnabled?: boolean;
    endpoints?: BackendServiceEndpointDto[];
    requiredRoles?: string[];
    tags?: string[];
    configSchema?: Record<string, unknown>;
    docsPath?: string;
}
export declare class UpdateBackendServiceDto {
    name?: string;
    scope?: BackendServiceScope;
    category?: string;
    description?: string;
    owner?: string;
    basePath?: string;
    status?: BackendServiceStatus;
    defaultEnabled?: boolean;
    endpoints?: BackendServiceEndpointDto[];
    requiredRoles?: string[];
    tags?: string[];
    configSchema?: Record<string, unknown>;
    docsPath?: string;
}
export declare class UpsertTenantBackendServiceDto {
    isEnabled: boolean;
    status: TenantBackendServiceStatus;
    config?: Record<string, unknown>;
    notes?: string;
}
