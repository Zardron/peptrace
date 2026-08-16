import type { AccountWorkItem, ApiSurface, ClientTenant, Lab, LabTest, Peptide, Vendor } from "@peptrace/domain";

export interface LoginRequest {
  email: string;
  password: string;
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
    plan: string;
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
  plan: string;
  status: string;
  owner: string;
  seats: number;
  monthlySpend: number;
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

  getBilling(): Promise<unknown> {
    return this.request<unknown>("/billing");
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
