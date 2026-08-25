export type DocumentedServiceScope = "CLIENT_SPECIFIC" | "SHARED";
export type DocumentedServiceEndpoint = {
    method: "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
    path: string;
    summary: string;
    auth: "none" | "client-jwt" | "platform-jwt";
    roles?: string[];
};
export type DocumentedServiceEndpointGroup = {
    key: string;
    name: string;
    audience: "admin" | "public" | "shared";
    endpoints: DocumentedServiceEndpoint[];
};
export type DocumentedServiceSpec = {
    key: string;
    name: string;
    scope: DocumentedServiceScope;
    category: string;
    description: string;
    owner: string;
    basePath: string;
    docsPath: string;
    defaultEnabled: boolean;
    requiredRoles: string[];
    tags: string[];
    tenantSlugs?: string[];
    includeInTenantServices?: boolean;
    endpointGroups: DocumentedServiceEndpointGroup[];
};
export declare const DOCUMENTED_SERVICE_CATALOG: DocumentedServiceSpec[];
export declare function getDocumentedServiceSpec(serviceKey: string): DocumentedServiceSpec | null;
export declare function isDocumentedServiceAvailableToTenant(service: DocumentedServiceSpec, tenantSlug: string): boolean;
export declare function listDocumentedServiceSpecsForTenant(tenantSlug: string): DocumentedServiceSpec[];
export declare function toFlatEndpoints(service: DocumentedServiceSpec): DocumentedServiceEndpoint[];
