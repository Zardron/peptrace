import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuthenticatedClientUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";

type AdminPanelTone = "info" | "neutral" | "success" | "warning";

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

const ADMIN_PANEL_CACHE_TTL_MS = 30_000;

type PeptracePanelStats = {
  accountWorkItems: Array<{ dueAt: Date; kind: string; priority: string }>;
  apiSurfaceCount: number;
  labTestCount: number;
  vendorCount: number;
};

const fallbackPanelDefinition: ClientPanelDefinition = {
  brandName: "Client workspace",
  productName: "Client admin",
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
  private readonly companyCache = new Map<string, { company: ClientCompany; expiresAt: number }>();
  private readonly dataCache = new Map<
    string,
    { data: Awaited<ReturnType<AdminPanelService["queryData"]>>; expiresAt: number }
  >();
  private readonly statsCache = new Map<string, { stats: PeptracePanelStats; expiresAt: number }>();

  constructor(private readonly prisma: PrismaService) {}

  async getContext(user: AuthenticatedClientUser) {
    const company = await this.getCompany(user.tenantId);
    const isPeptrace = company.slug === "peptrace";
    const stats = isPeptrace
      ? await this.getPeptraceStats(user.tenantId, user.tenantName)
      : {
          accountWorkItems: [],
          apiSurfaceCount: 0,
          labTestCount: 0,
          vendorCount: 0
        };

    return {
      mode: "client" as const,
      viewer: {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
        tenant: user.tenant
      },
      company,
      panel: this.buildClientPanel(company, stats)
    };
  }

  async getData(user: AuthenticatedClientUser) {
    const cachedData = this.dataCache.get(user.tenantId);
    if (cachedData) {
      if (cachedData.expiresAt <= Date.now()) {
        cachedData.expiresAt = Date.now() + ADMIN_PANEL_CACHE_TTL_MS;
        this.refreshData(user);
      }

      return cachedData.data;
    }

    const data = await this.queryData(user);
    this.dataCache.set(user.tenantId, {
      data,
      expiresAt: Date.now() + ADMIN_PANEL_CACHE_TTL_MS
    });

    return data;
  }

  private queryData(user: AuthenticatedClientUser) {
    const includeCatalogData = user.tenantSlug === "peptrace";
    return this.prisma
      .withConnectionRetry(() =>
        Promise.all([
          this.prisma.clientTenant.findMany({
            where: { id: user.tenantId },
            orderBy: { name: "asc" }
          }),
          includeCatalogData
            ? this.prisma.vendor.findMany({
                include: { products: true },
                orderBy: { displayName: "asc" }
              })
            : Promise.resolve([]),
          includeCatalogData
            ? this.prisma.peptide.findMany({
                include: { tests: true },
                orderBy: { label: "asc" }
              })
            : Promise.resolve([]),
          includeCatalogData
            ? this.prisma.lab.findMany({
                include: { tests: true },
                orderBy: { displayName: "asc" }
              })
            : Promise.resolve([]),
          includeCatalogData
            ? this.prisma.labTest.findMany({
                include: {
                  lab: true,
                  peptide: true,
                  vendor: true
                },
                orderBy: { createdAt: "desc" }
              })
            : Promise.resolve([]),
          includeCatalogData
            ? this.prisma.apiSurface.findMany({
                orderBy: { group: "asc" }
              })
            : Promise.resolve([]),
          this.prisma.accountWorkItem.findMany({
            where: { account: user.tenantName },
            orderBy: { dueAt: "asc" }
          })
        ])
      )
      .then(([clients, vendors, peptides, labs, tests, apiSurfaces, accountWorkItems]) => ({
        accountWorkItems,
        apiSurfaces,
        clients,
        labs,
        peptides,
        tests,
        vendors
      }));
  }

  private refreshData(user: AuthenticatedClientUser): void {
    void this.queryData(user)
      .then((data) => {
        this.dataCache.set(user.tenantId, {
          data,
          expiresAt: Date.now() + ADMIN_PANEL_CACHE_TTL_MS
        });
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Unknown database error";
        this.logger.warn(`Could not refresh cached client data: ${message}`);
      });
  }

  private async getPeptraceStats(tenantId: string, account: string): Promise<PeptracePanelStats> {
    const cachedStats = this.statsCache.get(tenantId);
    if (cachedStats) {
      if (cachedStats.expiresAt <= Date.now()) {
        cachedStats.expiresAt = Date.now() + ADMIN_PANEL_CACHE_TTL_MS;
        this.refreshPeptraceStats(tenantId, account);
      }

      return cachedStats.stats;
    }

    const stats = await this.queryPeptraceStats(account);
    this.statsCache.set(tenantId, {
      stats,
      expiresAt: Date.now() + ADMIN_PANEL_CACHE_TTL_MS
    });

    return stats;
  }

  private async queryPeptraceStats(account: string): Promise<PeptracePanelStats> {
    const [accountWorkItems, vendorCount, labTestCount, apiSurfaceCount] =
      await this.prisma.withConnectionRetry(() =>
        Promise.all([
          this.getAccountWorkItems(account),
          this.prisma.vendor.count(),
          this.prisma.labTest.count(),
          this.prisma.apiSurface.count()
        ])
      );

    return {
      accountWorkItems,
      apiSurfaceCount,
      labTestCount,
      vendorCount
    };
  }

  private refreshPeptraceStats(tenantId: string, account: string): void {
    void this.queryPeptraceStats(account)
      .then((stats) => {
        this.statsCache.set(tenantId, {
          stats,
          expiresAt: Date.now() + ADMIN_PANEL_CACHE_TTL_MS
        });
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Unknown database error";
        this.logger.warn(`Could not refresh cached Peptrace statistics: ${message}`);
      });
  }

  private async getCompany(tenantId: string): Promise<ClientCompany> {
    const cachedCompany = this.companyCache.get(tenantId);
    if (cachedCompany) {
      if (cachedCompany.expiresAt <= Date.now()) {
        cachedCompany.expiresAt = Date.now() + ADMIN_PANEL_CACHE_TTL_MS;
        this.refreshCompany(tenantId);
      }

      return cachedCompany.company;
    }

    const company = await this.queryCompany(tenantId);

    if (!company) {
      throw new NotFoundException("Client company not found");
    }

    this.companyCache.set(tenantId, {
      company,
      expiresAt: Date.now() + ADMIN_PANEL_CACHE_TTL_MS
    });

    return company;
  }

  private queryCompany(tenantId: string): Promise<ClientCompany | null> {
    return this.prisma.withConnectionRetry(() =>
      this.prisma.clientTenant.findUnique({
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
        where: { id: tenantId }
      })
    );
  }

  private refreshCompany(tenantId: string): void {
    void this.queryCompany(tenantId)
      .then((company) => {
        if (company) {
          this.companyCache.set(tenantId, {
            company,
            expiresAt: Date.now() + ADMIN_PANEL_CACHE_TTL_MS
          });
        }
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Unknown database error";
        this.logger.warn(`Could not refresh the cached client panel: ${message}`);
      });
  }

  private getAccountWorkItems(account: string) {
    return this.prisma.accountWorkItem.findMany({
      orderBy: { dueAt: "asc" },
      where: { account }
    });
  }

  private buildClientPanel(
    company: ClientCompany,
    data: {
      accountWorkItems: Array<{ dueAt: Date; kind: string; priority: string }>;
      apiSurfaceCount: number;
      labTestCount: number;
      vendorCount: number;
    }
  ) {
    const definition = this.toPanelDefinition(company.whiteLabelPanel);
    const workItems = data.accountWorkItems.map((item) => ({
      label: item.kind,
      detail: `Due ${this.formatDate(item.dueAt)}`,
      priority: this.toPriority(item.priority)
    }));
    const isPeptrace = company.slug === "peptrace";
    const isShamstay = company.slug === "shamstay-bnb";
    const isRealEstate = company.slug === "sham-real-estate-hub";
    const primaryRecords = isPeptrace
      ? [
          {
            label: "Vendor catalog",
            detail: "Database-backed vendor records",
            status: "Ready",
            value: `${data.vendorCount} vendors`
          },
          {
            label: "Lab testing",
            detail: "Database-backed testing workflow",
            status: data.labTestCount > 0 ? "In review" : "Ready",
            value: `${data.labTestCount} tests`
          },
          {
            label: "Customer API",
            detail: "Database-backed API surface readiness",
            status: "Scoped",
            value: `${data.apiSurfaceCount} surfaces`
          }
        ]
      : definition.primaryRecords;
    const panelWorkItems = isPeptrace && workItems.length > 0 ? workItems : definition.workItems;

    return {
      ...definition,
      primaryRecords: primaryRecords.length > 0 ? primaryRecords : definition.primaryRecords,
      workItems: panelWorkItems.length > 0 ? panelWorkItems : definition.workItems,
      metrics: [
        {
          label: isShamstay ? "Portfolio plan" : isRealEstate ? "Brokerage plan" : "Plan",
          value: company.plan,
          change: isShamstay || isRealEstate ? `${company.seats} team seats` : `${company.seats} seats provisioned`,
          tone: "info" as AdminPanelTone
        },
        {
          label: isShamstay ? "Portfolio status" : isRealEstate ? "Pipeline status" : "Workspace status",
          value: company.status,
          change:
            isShamstay || isRealEstate ? `${company.dataRegion} operating region` : `${company.dataRegion} data region`,
          tone: company.status === "Healthy" ? ("success" as AdminPanelTone) : ("warning" as AdminPanelTone)
        },
        {
          label: isShamstay ? "Stay tasks" : isRealEstate ? "Deal tasks" : "Open items",
          value: company.openItems.toString(),
          change: isShamstay
            ? "Reservations and turnover queue"
            : isRealEstate
              ? "Leads, viewings, and offers"
              : "Tenant-scoped queue",
          tone: company.openItems > 1 ? ("warning" as AdminPanelTone) : ("success" as AdminPanelTone)
        },
        {
          label: isShamstay ? "Monthly bookings" : isRealEstate ? "Pipeline value" : "Monthly spend",
          value: this.formatClientCurrency(company.slug, company.monthlySpend),
          change: isShamstay ? "Current owner reporting" : isRealEstate ? "Active listings and offers" : "Current billing scope",
          tone: "neutral" as AdminPanelTone
        }
      ]
    };
  }

  private formatCurrency(amount: number): string {
    return `$${amount.toLocaleString("en-US")}`;
  }

  private formatClientCurrency(slug: string, amount: number): string {
    return slug === "shamstay-bnb" || slug === "sham-real-estate-hub"
      ? `USD ${amount.toLocaleString("en-US")}`
      : this.formatCurrency(amount);
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

  private formatDate(value: Date): string {
    return new Intl.DateTimeFormat("en", {
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(value);
  }

  private toPriority(value: string): "High" | "Medium" | "Low" {
    return value === "High" || value === "Medium" || value === "Low" ? value : "Medium";
  }
}
