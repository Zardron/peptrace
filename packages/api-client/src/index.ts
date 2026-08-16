import type { AccountWorkItem, ApiSurface, ClientTenant, Lab, LabTest, Peptide, Vendor } from "@peptrace/domain";

export interface LoginRequest {
  email: string;
  password: string;
}

export type ClientUserRole = "owner" | "admin" | "manager" | "member" | "viewer";
export type ClientUserStatus = "active" | "inactive";

export interface ClientUser {
  id: string;
  displayName: string;
  email: string;
  role: ClientUserRole;
  status: ClientUserStatus;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClientUserList {
  items: ClientUser[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface CreateClientUserRequest {
  displayName: string;
  email: string;
  password: string;
  role: ClientUserRole;
}

export interface UpdateClientUserRequest {
  displayName?: string;
  email?: string;
  isActive?: boolean;
  role?: ClientUserRole;
}

export type SecretVersionState = "ENABLED" | "DISABLED" | "DESTROYED";
export type SecretGrantRole = "viewer" | "accessor" | "manager";

export interface LockerSecretVersion {
  createdAt: string;
  createdById: string;
  destroyedAt: string | null;
  encryptionKeyId: string;
  id: string;
  resourceName: string;
  state: SecretVersionState;
  version: number;
}

export interface LockerSecret {
  createdAt: string;
  createdById: string;
  description: string | null;
  id: string;
  labels: Record<string, string>;
  latestVersion: LockerSecretVersion | null;
  name: string;
  resourceName: string;
  updatedAt: string;
  versionCount: number;
}

export interface LockerSecretList {
  items: LockerSecret[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface LockerSecretGrant {
  createdAt: string;
  role: SecretGrantRole;
  updatedAt: string;
  user: {
    displayName: string;
    email: string;
    id: string;
    isActive: boolean;
    role: string;
  };
}

export interface LockerSecretAuditEvent {
  action: string;
  actor: { id: string; displayName?: string; email?: string };
  createdAt: string;
  id: string;
  metadata: Record<string, unknown>;
  secret: { id: string | null; name: string } | null;
  secretVersionId: string | null;
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

export interface CurrentAdminUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
  tenantId: string | null;
  tenantName: string | null;
  tenantSlug: string | null;
  tenant: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export type AdminPanelTone = "info" | "neutral" | "success" | "warning";

export interface AdminPanelMetric {
  label: string;
  value: string;
  change: string;
  tone: AdminPanelTone;
}

export interface AdminPanelAccount {
  id: string;
  displayName: string;
  email: string;
  role: string;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AdminPanelCompany {
  id: string;
  name: string;
  slug: string;
  accessStatus: string;
  status: string;
  owner: string;
  enabledAccounts: number;
  operationalValue: number;
  openItems: number;
  dataRegion: string;
  lastActivityAt: string;
  adminUsers: AdminPanelAccount[];
}

export interface AdminPanelRecord {
  label: string;
  detail: string;
  status: string;
  value: string;
}

export interface AdminPanelWorkItem {
  label: string;
  detail: string;
  priority: "High" | "Medium" | "Low";
}

export interface WhiteLabelPanel {
  brandName: string;
  productName: string;
  industry: string;
  accentColor: string;
  overviewTitle: string;
  overviewDescription: string;
  operationsTitle: string;
  operationsDescription: string;
  metrics: AdminPanelMetric[];
  primaryRecords: AdminPanelRecord[];
  workItems: AdminPanelWorkItem[];
}

export interface AdminPanelViewer {
  id: string;
  displayName: string;
  email: string;
  role: string;
  tenant: CurrentAdminUser["tenant"];
}

export interface PlatformSecretLockerSummary {
  companies: Array<{
    enabledSecrets: number;
    lastUpdatedAt: string | null;
    secretCount: number;
    secrets: Array<{
      description: string | null;
      id: string;
      latestState: SecretVersionState | null;
      latestVersion: number | null;
      name: string;
      resourceName: string;
      updatedAt: string;
      versionCount: number;
    }>;
    tenantId: string;
    tenantName: string;
    tenantSlug: string;
    versionCount: number;
  }>;
  enabledSecrets: number;
  totalSecrets: number;
  totalVersions: number;
}

export type AdminPanelContext =
  | {
      mode: "client";
      viewer: AdminPanelViewer;
      company: AdminPanelCompany;
      panel: WhiteLabelPanel;
    }
  | {
      mode: "superadmin";
      viewer: AdminPanelViewer;
      platform: {
        title: string;
        description: string;
        metrics: AdminPanelMetric[];
        internalAccounts: AdminPanelAccount[];
        clients: Array<AdminPanelCompany & { panel: Omit<WhiteLabelPanel, "metrics"> }>;
        secretLocker?: PlatformSecretLockerSummary;
      };
    };

export interface AdminPanelData {
  accountWorkItems: AccountWorkItem[];
  apiSurfaces: ApiSurface[];
  clients: ClientTenant[];
  labs: Lab[];
  peptides: Peptide[];
  tests: LabTest[];
  vendors: Vendor[];
}

export interface PeptraceApiClientOptions {
  baseUrl: string;
  token?: string;
  fetcher?: typeof fetch;
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  query?: Record<string, boolean | number | string | null | undefined>;
}

export class PeptraceApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "PeptraceApiError";
    this.status = status;
    this.payload = payload;
  }
}

export class PeptraceApiClient {
  private readonly baseUrl: string;
  private readonly fetcher: typeof fetch;
  private token?: string;

  constructor(options: PeptraceApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.token = options.token;
    this.fetcher = options.fetcher ?? fetch;
  }

  setToken(token: string | undefined): void {
    this.token = token;
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const baseUrl =
      this.baseUrl.startsWith("http://") || this.baseUrl.startsWith("https://")
        ? `${this.baseUrl}/`
        : new URL(`${this.baseUrl.replace(/^\/+/, "")}/`, getRuntimeOrigin()).toString();
    const url = new URL(path.replace(/^\/+/, ""), baseUrl);

    Object.entries(options.query ?? {}).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });

    const headers = new Headers(options.headers);
    headers.set("Accept", "application/json");

    let body: BodyInit | undefined;
    if (options.body !== undefined) {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(options.body);
    }

    if (this.token) {
      headers.set("Authorization", `Bearer ${this.token}`);
    }

    // Browser fetch implementations may reject calls made with the API client as
    // their receiver. Read it into a local first so it is invoked as a function.
    const fetcher = this.fetcher;
    const response = await fetcher(url, {
      ...options,
      headers,
      body
    });

    const payload = await parseResponse(response);
    if (!response.ok) {
      throw new PeptraceApiError(response.statusText, response.status, payload);
    }

    return payload as T;
  }

  listVendors(): Promise<Vendor[]> {
    return this.request<Vendor[]>("/vendors");
  }

  login(body: LoginRequest): Promise<AdminSession> {
    return this.request<AdminSession>("/auth/login", {
      method: "POST",
      body
    });
  }

  getCurrentAdminUser(): Promise<CurrentAdminUser> {
    return this.request<CurrentAdminUser>("/auth/me");
  }

  getAdminPanelContext(): Promise<AdminPanelContext> {
    return this.request<AdminPanelContext>("/admin-panel/context");
  }

  getAdminPanelData(): Promise<AdminPanelData> {
    return this.request<AdminPanelData>("/admin-panel/data");
  }

  listClientUsers(query?: {
    page?: number;
    pageSize?: number;
    role?: ClientUserRole;
    search?: string;
    status?: ClientUserStatus;
  }): Promise<ClientUserList> {
    return this.request<ClientUserList>("/users", { query });
  }

  getClientUser(id: string): Promise<ClientUser> {
    return this.request<ClientUser>(`/users/${id}`);
  }

  createClientUser(body: CreateClientUserRequest): Promise<ClientUser> {
    return this.request<ClientUser>("/users", { body, method: "POST" });
  }

  updateClientUser(id: string, body: UpdateClientUserRequest): Promise<ClientUser> {
    return this.request<ClientUser>(`/users/${id}`, { body, method: "PATCH" });
  }

  resetClientUserPassword(id: string, password: string): Promise<{ id: string; passwordUpdated: true }> {
    return this.request<{ id: string; passwordUpdated: true }>(`/users/${id}/password`, {
      body: { password },
      method: "POST"
    });
  }

  deactivateClientUser(id: string): Promise<ClientUser> {
    return this.request<ClientUser>(`/users/${id}`, { method: "DELETE" });
  }

  listLockerSecrets(query?: { page?: number; pageSize?: number; search?: string }): Promise<LockerSecretList> {
    return this.request<LockerSecretList>("/secrets", { query });
  }

  getLockerSecret(secret: string): Promise<LockerSecret> {
    return this.request<LockerSecret>(`/secrets/${encodeURIComponent(secret)}`);
  }

  createLockerSecret(body: {
    description?: string;
    labels?: Record<string, string>;
    name: string;
  }): Promise<LockerSecret> {
    return this.request<LockerSecret>("/secrets", { body, method: "POST" });
  }

  updateLockerSecret(
    secret: string,
    body: { description?: string; labels?: Record<string, string> }
  ): Promise<LockerSecret> {
    return this.request<LockerSecret>(`/secrets/${encodeURIComponent(secret)}`, { body, method: "PATCH" });
  }

  listLockerSecretVersions(secret: string): Promise<LockerSecretVersion[]> {
    return this.request<LockerSecretVersion[]>(`/secrets/${encodeURIComponent(secret)}/versions`);
  }

  addLockerSecretVersion(secret: string, value: string): Promise<LockerSecretVersion> {
    return this.request<LockerSecretVersion>(`/secrets/${encodeURIComponent(secret)}/versions`, {
      body: { value },
      method: "POST"
    });
  }

  accessLockerSecretVersion(
    secret: string,
    version: number | "latest" = "latest"
  ): Promise<{ checksum: string; name: string; resourceName: string; value: string; version: number }> {
    return this.request(`/secrets/${encodeURIComponent(secret)}/versions/${version}/access`);
  }

  updateLockerSecretVersionState(
    secret: string,
    version: number,
    state: "ENABLED" | "DISABLED"
  ): Promise<LockerSecretVersion> {
    return this.request<LockerSecretVersion>(`/secrets/${encodeURIComponent(secret)}/versions/${version}`, {
      body: { state },
      method: "PATCH"
    });
  }

  destroyLockerSecretVersion(secret: string, version: number): Promise<LockerSecretVersion> {
    return this.request<LockerSecretVersion>(`/secrets/${encodeURIComponent(secret)}/versions/${version}`, {
      method: "DELETE"
    });
  }

  listLockerSecretGrants(secret: string): Promise<LockerSecretGrant[]> {
    return this.request<LockerSecretGrant[]>(`/secrets/${encodeURIComponent(secret)}/grants`);
  }

  setLockerSecretGrant(secret: string, userId: string, role: SecretGrantRole): Promise<LockerSecretGrant> {
    return this.request<LockerSecretGrant>(`/secrets/${encodeURIComponent(secret)}/grants/${userId}`, {
      body: { role },
      method: "PUT"
    });
  }

  removeLockerSecretGrant(secret: string, userId: string): Promise<{ removed: true; userId: string }> {
    return this.request(`/secrets/${encodeURIComponent(secret)}/grants/${userId}`, { method: "DELETE" });
  }

  listLockerSecretAuditEvents(query?: {
    page?: number;
    pageSize?: number;
    secret?: string;
  }): Promise<{ items: LockerSecretAuditEvent[]; page: number; pageSize: number; total: number; totalPages: number }> {
    return this.request("/secrets/audit", { query });
  }

  getVendor(idOrSlug: string): Promise<Vendor> {
    return this.request<Vendor>(`/vendor/${idOrSlug}`);
  }

  listPeptides(): Promise<Peptide[]> {
    return this.request<Peptide[]>("/peptides");
  }

  getPeptide(idOrSlug: string): Promise<Peptide> {
    return this.request<Peptide>(`/peptide/${idOrSlug}`);
  }

  listTests(query?: { status?: string; vendorId?: string; peptideId?: string }): Promise<LabTest[]> {
    return this.request<LabTest[]>("/testing", { query });
  }

  getTest(id: string): Promise<LabTest> {
    return this.request<LabTest>(`/testing/${id}`);
  }

  listLabs(): Promise<Lab[]> {
    return this.request<Lab[]>("/labs");
  }

  getAccount(): Promise<unknown> {
    return this.request<unknown>("/account/profile");
  }

  createCustomerApiKey(body: { label: string; scopes: string[] }): Promise<unknown> {
    return this.request<unknown>("/authorization/api-keys", {
      method: "POST",
      body
    });
  }
}

const parseResponse = async (response: Response): Promise<unknown> => {
  const contentType = response.headers.get("content-type") ?? "";
  if (response.status === 204) {
    return null;
  }

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
};

const getRuntimeOrigin = (): string => {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  return "http://localhost";
};
