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
  whiteLabelPanel: PersistedWhiteLabelPanel | null;
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
  overviewDescription: "Manage this company workspace, users, billing state, and operational queue.",
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
      detail: "Confirm account permissions and billing settings",
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
            label: "Monthly spend",
            value: this.formatCurrency(clients.reduce((total, client) => total + client.monthlySpend, 0)),
            change: "Managed revenue",
            tone: "neutral" as const
          }
        ],
        internalAccounts,
        clients: clients.map(({ whiteLabelPanel, ...client }) => ({
          ...client,
          panel: this.toPanelDefinition(whiteLabelPanel)
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
          adminUsers: {
            orderBy: { displayName: "asc" },
            select: {
              id: true,
              displayName: true,
              email: true,
              role: true,
              lastLoginAt: true,
              createdAt: true
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
    );
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
    return SUPERADMIN_ROLES.has(user.role);
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

  private formatCurrency(amount: number): string {
    return `$${amount.toLocaleString("en-US")}`;
  }
}
