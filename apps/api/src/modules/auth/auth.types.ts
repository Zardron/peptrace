export interface AuthTokenPayload {
  email: string;
  role: string;
  sub: string;
  tenantId: string | null;
}

export interface AuthTenant {
  id: string;
  name: string;
  slug: string;
}

export interface AuthenticatedAdminUser {
  id: string;
  displayName: string;
  email: string;
  role: string;
  tenantId: string | null;
  tenantName: string | null;
  tenantSlug: string | null;
  tenant: AuthTenant | null;
}

export interface AdminSession {
  accessToken: string;
  expiresIn: number;
  tokenType: "Bearer";
  user: {
    email: string;
    displayName: string;
    id: string;
    role: string;
    tenantId: string | null;
    tenantName: string | null;
    tenantSlug: string | null;
  };
}
