export interface AuthTokenPayload {
  email: string;
  role: string;
  sub: string;
  tenantId: string | null;
}

export interface AuthTenant {
  id: string;
  name: string;
  plan: string;
  slug: string;
}

export interface AuthenticatedClientUser {
  id: string;
  displayName: string;
  email: string;
  role: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  tenant: AuthTenant;
}

export interface ClientSession {
  accessToken: string;
  expiresIn: number;
  tokenType: "Bearer";
  user: {
    email: string;
    displayName: string;
    id: string;
    role: string;
    tenantId: string;
    tenantName: string;
    tenantSlug: string;
  };
}
