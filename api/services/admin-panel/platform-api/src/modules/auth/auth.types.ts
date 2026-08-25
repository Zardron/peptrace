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

export interface AuthenticatedAdminUser {
  id: string;
  displayName: string;
  email: string;
  membershipId: string | null;
  role: string;
  tenantId: string | null;
  tenantName: string | null;
  tenantSlug: string | null;
  tenant: AuthTenant | null;
  tenants: AuthTenantMembership[];
}

export interface AdminSession {
  accessToken: string;
  expiresIn: number;
  tokenType: "Bearer";
  user: {
    email: string;
    displayName: string;
    id: string;
    membershipId: string | null;
    role: string;
    tenantId: string | null;
    tenantName: string | null;
    tenantSlug: string | null;
    tenants: AuthTenantMembership[];
  };
}
