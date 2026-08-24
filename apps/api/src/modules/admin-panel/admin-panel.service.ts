import { ForbiddenException, Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuthenticatedAdminUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";

type AdminPanelTone = "info" | "neutral" | "success" | "warning";

type AdminPanelMetric = {
  label: string;
  value: string;
  change: string;
  tone: AdminPanelTone;
};

type AdminPanelRecord = {
  label: string;
  detail: string;
  status: string;
  value: string;
};

type AdminPanelWorkItem = {
  label: string;
  detail: string;
  priority: "High" | "Medium" | "Low";
};

type CompanyAccount = {
  id: string;
  displayName: string;
  email: string;
  role: string;
  lastLoginAt: Date | null;
  createdAt: Date;
};

type CompanySecret = {
  _count: { versions: number };
  description: string | null;
  id: string;
  name: string;
  updatedAt: Date;
  versions: Array<{
    state: string;
    version: number;
  }>;
};

type ClientCompany = {
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
  lastActivityAt: Date;
  adminUsers: CompanyAccount[];
  secrets: CompanySecret[];
  whiteLabelPanel: PersistedWhiteLabelPanel | null;
};

type CompanyMembership = {
  createdAt: Date;
  role: string;
  user: {
    id: string;
    displayName: string;
    email: string;
    isActive: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
  };
};

type ClientCompanyRecord = Omit<ClientCompany, "adminUsers"> & {
  adminUsers?: CompanyAccount[];
  memberships: CompanyMembership[];
};

type PersistedWhiteLabelPanel = {
  brandName: string;
  productName: string;
  industry: string;
  accentColor: string;
  overviewTitle: string;
  overviewDescription: string;
  operationsTitle: string;
  operationsDescription: string;
  primaryRecords: Prisma.JsonValue;
  workItems: Prisma.JsonValue;
};

type ClientPanelDefinition = {
  brandName: string;
  productName: string;
  industry: string;
  accentColor: string;
  overviewTitle: string;
  overviewDescription: string;
  operationsTitle: string;
  operationsDescription: string;
  primaryRecords: AdminPanelRecord[];
  workItems: AdminPanelWorkItem[];
};

const SUPERADMIN_ROLES = new Set(["superadmin", "platform_admin"]);
const SUPERADMIN_ROLE_VALUES = ["superadmin", "platform_admin"];
const ADMIN_PANEL_CACHE_TTL_MS = 30_000;

const fallbackPanelDefinition: ClientPanelDefinition = {
  brandName: "Client workspace",
  productName: "Admin panel",
  industry: "Operations",
  accentColor: "#0e7467",
  overviewTitle: "Client admin panel",
  overviewDescription: "Manage this company workspace, users, access state, and operational queue.",
  operationsTitle: "Workspace operations",
  operationsDescription: "Current work across this client account.",
  primaryRecords: [
    {
      label: "Operations queue",
      detail: "Tenant-scoped work",
      status: "Active",
      value: "Live"
    }
  ],
  workItems: [
    {
      label: "Review workspace setup",
      detail: "Confirm account permissions and access settings",
      priority: "Medium"
    }
  ]
};

@Injectable()
export class AdminPanelService {
  private readonly logger = new Logger(AdminPanelService.name);
  private companiesCache: { companies: ClientCompany[]; expiresAt: number } | null = null;
  private internalAccountsCache: { accounts: CompanyAccount[]; expiresAt: number } | null = null;

  constructor(private readonly prisma: PrismaService) {}

  invalidateCompaniesCache(): void {
    this.companiesCache = null;
  }

  async getContext(user: AuthenticatedAdminUser) {
    if (!this.isSuperAdmin(user)) {
      throw new ForbiddenException("The superadmin API only serves EsteemedEngineering platform admins");
    }

    const [clients, internalAccounts] = await Promise.all([this.listCompanies(), this.listInternalAccounts()]);

    return {
      mode: "superadmin" as const,
      viewer: this.toViewer(user),
      platform: {
        title: "EsteemedEngineering superadmin",
        description: "EsteemedEngineering manages all white-label client workspaces, companies, and admin accounts.",
        metrics: [
          {
            label: "Client companies",
            value: clients.length.toString(),
            change: "White-label workspaces",
            tone: "info" as const
          },
          {
            label: "Admin accounts",
            value: (internalAccounts.length + clients.reduce((total, client) => total + client.adminUsers.length, 0)).toString(),
            change: "Across every company",
            tone: "success" as const
          },
          {
            label: "Open items",
            value: clients.reduce((total, client) => total + client.openItems, 0).toString(),
            change: "Tenant work queues",
            tone: "warning" as const
          },
          {
            label: "Access model",
            value: "Direct",
            change: "Company access granted by approval",
            tone: "neutral" as const
          }
        ],
        internalAccounts,
        secretLocker: this.toSecretLockerSummary(clients),
        clients: clients.map((client) => ({
          ...this.toCompanyPayload(client),
          panel: this.toPanelDefinition(client.whiteLabelPanel)
        }))
      }
    };
  }

  private async listCompanies(): Promise<ClientCompany[]> {
    if (this.companiesCache) {
      if (this.companiesCache.expiresAt <= Date.now()) {
        this.companiesCache.expiresAt = Date.now() + ADMIN_PANEL_CACHE_TTL_MS;
        this.refreshCompanies();
      }

      return this.companiesCache.companies;
    }

    const companies = await this.queryCompanies();

    this.companiesCache = {
      companies,
      expiresAt: Date.now() + ADMIN_PANEL_CACHE_TTL_MS
    };

    return companies;
  }

  private async listInternalAccounts(): Promise<CompanyAccount[]> {
    if (this.internalAccountsCache) {
      if (this.internalAccountsCache.expiresAt <= Date.now()) {
        this.internalAccountsCache.expiresAt = Date.now() + ADMIN_PANEL_CACHE_TTL_MS;
        this.refreshInternalAccounts();
      }

      return this.internalAccountsCache.accounts;
    }

    const accounts = await this.queryInternalAccounts();

    this.internalAccountsCache = {
      accounts,
      expiresAt: Date.now() + ADMIN_PANEL_CACHE_TTL_MS
    };

    return accounts;
  }

  private queryCompanies(): Promise<ClientCompany[]> {
    return this.prisma.withConnectionRetry(() =>
      this.prisma.clientTenant.findMany({
        include: {
          memberships: {
            orderBy: { user: { displayName: "asc" } },
            select: {
              role: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  displayName: true,
                  email: true,
                  isActive: true,
                  lastLoginAt: true,
                  createdAt: true
                }
              }
            }
          },
          secrets: {
            orderBy: { updatedAt: "desc" },
            select: {
              _count: { select: { versions: true } },
              description: true,
              id: true,
              name: true,
              updatedAt: true,
              versions: {
                orderBy: { version: "desc" },
                select: { state: true, version: true },
                take: 1
              }
            }
          },
          whiteLabelPanel: true
        },
        orderBy: { name: "asc" },
        where: {
          whiteLabelPanel: {
            isNot: null
          }
        }
      })
    ).then((companies) => companies.map((company) => this.withMembershipAccounts(company as ClientCompanyRecord)));
  }

  private queryInternalAccounts(): Promise<CompanyAccount[]> {
    return this.prisma.withConnectionRetry(() =>
      this.prisma.adminUser.findMany({
        orderBy: { displayName: "asc" },
        select: {
          id: true,
          displayName: true,
          email: true,
          role: true,
          lastLoginAt: true,
          createdAt: true
        },
        where: {
          role: { in: SUPERADMIN_ROLE_VALUES },
          tenantId: null
        }
      })
    );
  }

  private refreshCompanies(): void {
    void this.queryCompanies()
      .then((companies) => {
        this.companiesCache = {
          companies,
          expiresAt: Date.now() + ADMIN_PANEL_CACHE_TTL_MS
        };
      })
      .catch((error: unknown) => this.logCacheRefreshError("companies", error));
  }

  private refreshInternalAccounts(): void {
    void this.queryInternalAccounts()
      .then((accounts) => {
        this.internalAccountsCache = {
          accounts,
          expiresAt: Date.now() + ADMIN_PANEL_CACHE_TTL_MS
        };
      })
      .catch((error: unknown) => this.logCacheRefreshError("internal accounts", error));
  }

  private logCacheRefreshError(scope: string, error: unknown): void {
    const message = error instanceof Error ? error.message : "Unknown database error";
    this.logger.warn(`Could not refresh cached ${scope}: ${message}`);
  }

  private toPanelDefinition(panel: PersistedWhiteLabelPanel | null): ClientPanelDefinition {
    if (!panel) {
      return fallbackPanelDefinition;
    }

    return {
      brandName: panel.brandName,
      productName: panel.productName,
      industry: panel.industry,
      accentColor: panel.accentColor,
      overviewTitle: panel.overviewTitle,
      overviewDescription: panel.overviewDescription,
      operationsTitle: panel.operationsTitle,
      operationsDescription: panel.operationsDescription,
      primaryRecords: this.toPanelRecords(panel.primaryRecords),
      workItems: this.toPanelWorkItems(panel.workItems)
    };
  }

  private toSecretLockerSummary(clients: ClientCompany[]) {
    const companies = clients.map((client) => {
      const secrets = client.secrets.map((secret) => {
        const latestVersion = secret.versions[0] ?? null;
        return {
          description: secret.description,
          id: secret.id,
          latestState: latestVersion?.state ?? null,
          latestVersion: latestVersion?.version ?? null,
          name: secret.name,
          resourceName: `tenants/${client.slug}/secrets/${secret.name}`,
          updatedAt: secret.updatedAt,
          versionCount: secret._count.versions
        };
      });

      return {
        enabledSecrets: secrets.filter((secret) => secret.latestState === "ENABLED").length,
        lastUpdatedAt: secrets[0]?.updatedAt ?? null,
        secretCount: secrets.length,
        secrets,
        tenantId: client.id,
        tenantName: client.name,
        tenantSlug: client.slug,
        versionCount: secrets.reduce((total, secret) => total + secret.versionCount, 0)
      };
    });

    return {
      companies,
      enabledSecrets: companies.reduce((total, company) => total + company.enabledSecrets, 0),
      totalSecrets: companies.reduce((total, company) => total + company.secretCount, 0),
      totalVersions: companies.reduce((total, company) => total + company.versionCount, 0)
    };
  }

  private toPanelRecords(value: Prisma.JsonValue): AdminPanelRecord[] {
    if (!Array.isArray(value)) {
      return fallbackPanelDefinition.primaryRecords;
    }

    const records = value.flatMap((record) => {
      if (!this.isJsonObject(record)) {
        return [];
      }

      const label = this.jsonString(record.label);
      const detail = this.jsonString(record.detail);
      const status = this.jsonString(record.status);
      const itemValue = this.jsonString(record.value);

      return label && detail && status && itemValue
        ? [
            {
              detail,
              label,
              status,
              value: itemValue
            }
          ]
        : [];
    });

    return records.length > 0 ? records : fallbackPanelDefinition.primaryRecords;
  }

  private toPanelWorkItems(value: Prisma.JsonValue): AdminPanelWorkItem[] {
    if (!Array.isArray(value)) {
      return fallbackPanelDefinition.workItems;
    }

    const items = value.flatMap((item) => {
      if (!this.isJsonObject(item)) {
        return [];
      }

      const label = this.jsonString(item.label);
      const detail = this.jsonString(item.detail);
      const priority = this.jsonString(item.priority);

      return label && detail && priority
        ? [
            {
              detail,
              label,
              priority: this.toPriority(priority)
            }
          ]
        : [];
    });

    return items.length > 0 ? items : fallbackPanelDefinition.workItems;
  }

  private isJsonObject(value: Prisma.JsonValue): value is Prisma.JsonObject {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  private jsonString(value: Prisma.JsonValue | undefined): string | null {
    return typeof value === "string" ? value : null;
  }

  private toPriority(value: string): "High" | "Medium" | "Low" {
    return value === "High" || value === "Medium" || value === "Low" ? value : "Medium";
  }

  private isSuperAdmin(user: AuthenticatedAdminUser): boolean {
    return SUPERADMIN_ROLES.has(user.role) && !user.tenantId;
  }

  private toViewer(user: AuthenticatedAdminUser) {
    return {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      tenant: user.tenant
    };
  }

  private withMembershipAccounts(company: ClientCompanyRecord): ClientCompany {
    const { memberships, adminUsers: _legacyAdminUsers, ...client } = company;
    void _legacyAdminUsers;

    return {
      ...client,
      adminUsers: memberships.map((membership) => ({
        id: membership.user.id,
        displayName: membership.user.displayName,
        email: membership.user.email,
        role: membership.role,
        lastLoginAt: membership.user.lastLoginAt,
        createdAt: membership.user.createdAt
      }))
    };
  }

  private toCompanyPayload(company: ClientCompany) {
    const { monthlySpend, plan, seats, secrets, whiteLabelPanel, ...client } = company;
    void whiteLabelPanel;
    void secrets;

    return {
      ...client,
      accessStatus: plan,
      enabledAccounts: seats,
      operationalValue: monthlySpend
    };
  }
}
