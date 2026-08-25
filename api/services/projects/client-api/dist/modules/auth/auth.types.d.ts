export interface AuthTokenPayload {
    email: string;
    role: string;
    sub: string;
    tenantId: string | null;
    membershipId?: string | null;
}
export interface AuthTenant {
    id: string;
    name: string;
    slug: string;
}
export interface AuthTenantMembership extends AuthTenant {
    membershipId: string | null;
    role: string;
}
export interface AuthenticatedClientUser {
    id: string;
    displayName: string;
    email: string;
    membershipId: string | null;
    role: string;
    tenantId: string;
    tenantName: string;
    tenantSlug: string;
    tenant: AuthTenant;
    tenants: AuthTenantMembership[];
}
export interface ClientSession {
    accessToken: string;
    expiresIn: number;
    tokenType: "Bearer";
    user: {
        email: string;
        displayName: string;
        id: string;
        membershipId: string | null;
        role: string;
        tenantId: string;
        tenantName: string;
        tenantSlug: string;
        tenants: AuthTenantMembership[];
    };
}
