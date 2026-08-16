import {
  AlertCircle,
  Activity,
  BadgeDollarSign,
  Beaker,
  Bell,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  EyeOff,
  Filter,
  FlaskConical,
  Home,
  KeyRound,
  LayoutDashboard,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Mail,
  Microscope,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Store,
  UserRoundCog,
  UsersRound,
  Wrench
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import {
  PeptraceApiClient,
  PeptraceApiError,
  type AdminPanelCompany,
  type AdminPanelContext,
  type AdminPanelData,
  type AdminPanelMetric,
  type AdminSession
} from "@peptrace/api-client";
import type { ApiSurface, ClientTenant, Lab, LabTest, Peptide, TestingStatus, Vendor } from "@peptrace/domain";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import esteemedEngineeringLogoUrl from "./assets/esteemedengineering-logo-a3.png";

type AdminSection = "overview" | "clients" | "vendors" | "peptides" | "testing" | "labs" | "access";

type NavItem = {
  id: AdminSection;
  label: string;
  icon: typeof LayoutDashboard;
};

const navigationGroups: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Operate",
    items: [
      { id: "overview", label: "Overview", icon: LayoutDashboard },
      { id: "clients", label: "Clients", icon: UsersRound },
      { id: "testing", label: "Testing", icon: Microscope }
    ]
  },
  {
    label: "Catalog",
    items: [
      { id: "vendors", label: "Vendors", icon: Store },
      { id: "peptides", label: "Peptides", icon: FlaskConical },
      { id: "labs", label: "Labs", icon: Beaker }
    ]
  },
  {
    label: "Platform",
    items: [{ id: "access", label: "Access", icon: KeyRound }]
  }
];

const sectionMeta: Record<AdminSection, { breadcrumb: string; title: string; description: string }> = {
  overview: {
    breadcrumb: "Operations / Overview",
    title: "Client operations overview",
    description: "Tenant health, testing workflow, vendor quality, and catalog readiness across Peptrace."
  },
  clients: {
    breadcrumb: "Operations / Clients",
    title: "Client workspaces",
    description: "Monitor plans, owners, open items, regions, and tenant health before onboarding scales."
  },
  vendors: {
    breadcrumb: "Catalog / Vendors",
    title: "Vendor performance",
    description: "Compare supplier ratings, product coverage, quality signals, and test volume."
  },
  peptides: {
    breadcrumb: "Catalog / Peptides",
    title: "Peptide index",
    description: "Reference catalog coverage, test history, and average product pricing."
  },
  testing: {
    breadcrumb: "Operations / Testing",
    title: "Lab test tracking",
    description: "Follow lab status, assay type, purity results, and label claim accuracy."
  },
  labs: {
    breadcrumb: "Catalog / Labs",
    title: "Laboratory network",
    description: "Track partner labs and their Peptrace testing footprint."
  },
  access: {
    breadcrumb: "EsteemedEngineering / Access",
    title: "Security and billing controls",
    description: "Manage secure access, billing policy, and API permissions."
  }
};

const statusLabels: Record<TestingStatus, string> = {
  COMPLETE: "Complete",
  FAILED: "Failed",
  IN_REVIEW: "In review",
  PENDING: "Pending",
  RETEST_REQUESTED: "Retest"
};

const priorityOrder = {
  High: 0,
  Medium: 1,
  Low: 2
};

const LOCAL_DEV_API_URL = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(?:\/|$)/i;

const getApiBaseUrl = (configuredUrl: string | undefined, fallbackUrl: string): string => {
  if (!configuredUrl) {
    return fallbackUrl;
  }

  return import.meta.env.DEV && LOCAL_DEV_API_URL.test(configuredUrl) ? fallbackUrl : configuredUrl;
};

const superAdminApiClient = new PeptraceApiClient({
  baseUrl: getApiBaseUrl(import.meta.env.VITE_SUPERADMIN_API_BASE_URL ?? import.meta.env.VITE_API_BASE_URL, "/api")
});
const clientApiClient = new PeptraceApiClient({
  baseUrl: getApiBaseUrl(import.meta.env.VITE_CLIENT_API_BASE_URL, "/client-api")
});
const SESSION_STORAGE_KEY = "peptrace.admin.session";
const TEST_ADMIN_EMAIL = "admin@esteemedengineering.com";
const TEST_ADMIN_PASSWORD = "Admin@123";

function EsteemedEngineeringLogo({ className, title }: { className?: string; title?: string }) {
  return (
    <img
      alt={title ?? ""}
      aria-hidden={title ? undefined : true}
      className={className}
      decoding="async"
      src={esteemedEngineeringLogoUrl}
    />
  );
}

const readStoredSession = (): AdminSession | null => {
  const readFromStorage = (storage: Storage): AdminSession | null => {
    const value = storage.getItem(SESSION_STORAGE_KEY);
    return value ? (JSON.parse(value) as AdminSession) : null;
  };

  try {
    return readFromStorage(window.localStorage) ?? readFromStorage(window.sessionStorage);
  } catch {
    return null;
  }
};

const writeStoredSession = (session: AdminSession, rememberMe: boolean): void => {
  try {
    const storage = rememberMe ? window.localStorage : window.sessionStorage;
    const fallbackStorage = rememberMe ? window.sessionStorage : window.localStorage;

    fallbackStorage.removeItem(SESSION_STORAGE_KEY);
    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // The authenticated in-memory session still works when browser storage is disabled.
  }
};

const clearStoredSession = (): void => {
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
  window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
};

const isSuperAdminSession = (session: AdminSession): boolean =>
  session.user.role === "superadmin" || session.user.role === "platform_admin";

const getSessionApiClient = (session: AdminSession): PeptraceApiClient =>
  isSuperAdminSession(session) ? superAdminApiClient : clientApiClient;

const setSessionToken = (session: AdminSession | null): void => {
  superAdminApiClient.setToken(session && isSuperAdminSession(session) ? session.accessToken : undefined);
  clientApiClient.setToken(session && !isSuperAdminSession(session) ? session.accessToken : undefined);
};

const loginToBackend = async (body: { email: string; password: string }): Promise<AdminSession> => {
  const normalizedEmail = body.email.trim().toLowerCase();
  return normalizedEmail.endsWith("@esteemedengineering.com")
    ? superAdminApiClient.login(body)
    : clientApiClient.login(body);
};

const formatUserName = (email: string): string => {
  const localPart = email.split("@")[0] ?? "";
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
};

const formatRole = (role: string): string => `${role.charAt(0).toUpperCase()}${role.slice(1)}`;

const getAccountInitials = (session: AdminSession): string => {
  const source = session.user.displayName ?? session.user.tenantName ?? session.user.email;
  const initials = source
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "PT";
};

export function App() {
  const [session, setSession] = useState<AdminSession | null>(() => readStoredSession());
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [panelContext, setPanelContext] = useState<AdminPanelContext | null>(null);
  const [panelData, setPanelData] = useState<AdminPanelData | null>(null);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const visibleVendors = useMemo(() => {
    const dataVendors = panelData?.vendors ?? [];
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return dataVendors;
    }

    return dataVendors.filter((vendor) =>
      [vendor.displayName, vendor.slug, ...vendor.products.map((product) => product.label)]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [panelData, query]);

  setSessionToken(session);

  useEffect(() => {
    setActiveSection("overview");
    setPanelError(null);
    setPanelContext(null);
    setPanelData(null);

    if (!session) {
      return;
    }

    let cancelled = false;
    const api = getSessionApiClient(session);

    const needsPeptraceData = !isSuperAdminSession(session) && session.user.tenantSlug === "peptrace";

    Promise.all([api.getAdminPanelContext(), needsPeptraceData ? api.getAdminPanelData() : Promise.resolve(null)])
      .then(([context, data]) => {
        if (cancelled) {
          return;
        }

        if (data) {
          setPanelData(data);
        }

        setPanelContext(context);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setPanelContext(null);
        setPanelData(null);
        setPanelError("Could not load the admin panel for this account.");
      });

    return () => {
      cancelled = true;
    };
  }, [session]);

  useEffect(() => {
    if (!isAccountMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (accountMenuRef.current?.contains(event.target as Node)) {
        return;
      }

      setIsAccountMenuOpen(false);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [isAccountMenuOpen]);

  if (!session) {
    return (
      <LoginScreen
        onLogin={(nextSession, rememberMe) => {
          writeStoredSession(nextSession, rememberMe);
          setSessionToken(nextSession);
          setSession(nextSession);
        }}
      />
    );
  }

  const signOut = () => {
    clearStoredSession();
    setSessionToken(null);
    setIsAccountMenuOpen(false);
    setPanelContext(null);
    setPanelData(null);
    setSession(null);
  };

  if (!panelContext) {
    return <PanelContextState error={panelError} onSignOut={signOut} />;
  }

  if (isPeptraceClientContext(panelContext) && !panelData) {
    return <PanelContextState error={panelError} onSignOut={signOut} />;
  }

  const activeMeta = getPanelSectionMeta(panelContext, activeSection);
  const isPeptraceClient = isPeptraceClientContext(panelContext);
  const accountInitials = getAccountInitials(session);
  const accountName = session.user.displayName ?? formatUserName(session.user.email);
  const roleLabel = formatRole(session.user.role);
  const workspaceName = panelContext.mode === "client" ? panelContext.company.name : "EsteemedEngineering";
  const workspaceInitials = isPeptraceClient ? "PT" : getWorkspaceInitials(workspaceName);
  const workspaceSubline = panelContext.mode === "client" ? `${panelContext.company.plan} plan` : "Admin console";
  const navigation = getPanelNavigationGroups(panelContext);
  const isEsteemedEngineeringWorkspace = workspaceName === "EsteemedEngineering";

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary">
        <button className="tenant-switcher" type="button">
          <span className={isEsteemedEngineeringWorkspace ? "tenant-avatar tenant-avatar-logo" : "tenant-avatar"}>
            {isEsteemedEngineeringWorkspace ? (
              <EsteemedEngineeringLogo className="tenant-logo" title="EsteemedEngineering" />
            ) : (
              workspaceInitials
            )}
          </span>
          <span>
            <strong>{workspaceName}</strong>
            <small>{workspaceSubline}</small>
          </span>
          <ChevronDown size={16} strokeWidth={2} />
        </button>

        <nav className="nav-sections">
          {navigation.map((group) => (
            <div className="nav-group" key={group.label}>
              <span className="nav-group-label">{group.label}</span>
              <div className="nav-stack">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      className="nav-item"
                      data-active={activeSection === item.id}
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      type="button"
                    >
                      <Icon size={17} strokeWidth={2} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="sidebar-status">
          <ShieldCheck size={18} strokeWidth={2} />
          <div>
            <strong>Secure workspace</strong>
            <span>Role-based access enabled</span>
          </div>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div className="topbar-context">
            <span>{activeMeta.breadcrumb}</span>
            <strong>{workspaceName}</strong>
          </div>

          <div className="search-control">
            <Search size={18} strokeWidth={2} />
            <input
              aria-label="Search admin panel"
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                panelContext.mode === "superadmin"
                  ? "Search clients, companies, accounts"
                  : isPeptraceClient
                    ? "Search clients, vendors, products"
                  : `Search ${panelContext.panel.brandName} records`
              }
              type="search"
              value={query}
            />
          </div>

          <div className="topbar-actions">
            <Button className="icon-button" variant="outline" size="icon" aria-label="Notifications" title="Notifications" type="button">
              <Bell size={18} strokeWidth={2} />
            </Button>
            <div
              className="account-menu"
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setIsAccountMenuOpen(false);
                }
              }}
              ref={accountMenuRef}
            >
              <button
                aria-expanded={isAccountMenuOpen}
                aria-haspopup="menu"
                aria-label="Open account menu"
                className="account-avatar-button"
                onClick={() => setIsAccountMenuOpen((isOpen) => !isOpen)}
                title={session.user.email}
                type="button"
              >
                <span className="account-avatar" aria-hidden="true">
                  {accountInitials}
                </span>
                <ChevronDown className="account-chevron" size={14} strokeWidth={2} />
              </button>

              {isAccountMenuOpen && (
                <div className="account-dropdown" role="menu" aria-label="Account menu">
                  <div className="account-dropdown-profile">
                    <span className="account-avatar account-avatar-large" aria-hidden="true">
                      {accountInitials}
                    </span>
                    <div>
                      <strong>{accountName || "Admin user"}</strong>
                      <span>{session.user.email}</span>
                    </div>
                  </div>

                  <dl className="account-details">
                    <div>
                      <dt>Profile</dt>
                      <dd>{roleLabel}</dd>
                    </div>
                    <div>
                      <dt>Workspace</dt>
                      <dd>{workspaceName}</dd>
                    </div>
                  </dl>

                  <Button className="account-menu-item danger" onClick={signOut} role="menuitem" type="button" variant="ghost">
                    <LogOut size={16} strokeWidth={2} />
                    <span>Log out</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </header>

        <PageHeader meta={activeMeta} primaryAction={getPrimaryActionLabel(panelContext, activeSection)} section={activeSection} />

        {panelContext.mode === "superadmin" ? (
          <SuperAdminPanel context={panelContext} query={query} section={activeSection} />
        ) : (
          <ClientAdminPanel
            context={panelContext}
            data={panelData!}
            query={query}
            section={activeSection}
            vendors={visibleVendors}
          />
        )}
      </main>
    </div>
  );
}

function PanelContextState({ error, onSignOut }: { error: string | null; onSignOut: () => void }) {
  return (
    <main className="login-shell">
      <section
        aria-busy={!error}
        aria-labelledby="panel-state-title"
        className={`panel-state-card${error ? "" : " loading-state-card"}`}
      >
        {!error && (
          <div className="loading-state-visual" aria-hidden="true">
            <span className="loading-logo-frame">
              <EsteemedEngineeringLogo className="loading-logo" />
            </span>
          </div>
        )}
        <div className="login-copy">
          <p>Admin panel</p>
          <h1 id="panel-state-title">{error ? "Panel unavailable" : "Loading admin panel"}</h1>
          <span>{error ?? "Preparing your admin workspace."}</span>
        </div>

        {!error && (
          <div className="loading-progress" aria-hidden="true">
            <span />
          </div>
        )}

        {error && (
          <Button className="secondary-button login-submit" onClick={onSignOut} type="button" variant="outline">
            <LogOut size={17} strokeWidth={2} />
            <span>Log out</span>
          </Button>
        )}
      </section>
    </main>
  );
}

function getWorkspaceInitials(value: string): string {
  const initials = value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "PT";
}

function isPeptraceClientContext(context: AdminPanelContext): boolean {
  return context.mode === "client" && context.company.slug === "peptrace";
}

function isShamstayClientContext(context: AdminPanelContext): boolean {
  return context.mode === "client" && context.company.slug === "shamstay-bnb";
}

function isShamRealEstateHubClientContext(context: AdminPanelContext): boolean {
  return context.mode === "client" && context.company.slug === "sham-real-estate-hub";
}

function getPanelNavigationGroups(context: AdminPanelContext): Array<{ label: string; items: NavItem[] }> {
  if (context.mode === "superadmin") {
    return [
      {
        label: "EsteemedEngineering",
        items: [
          { id: "overview", label: "Overview", icon: LayoutDashboard },
          { id: "clients", label: "Clients", icon: UsersRound },
          { id: "testing", label: "Accounts", icon: UserRoundCog },
          { id: "access", label: "Access", icon: KeyRound }
        ]
      }
    ];
  }

  if (isPeptraceClientContext(context)) {
    return navigationGroups;
  }

  if (isShamstayClientContext(context)) {
    return [
      {
        label: "Stays",
        items: [
          { id: "overview", label: "Dashboard", icon: LayoutDashboard },
          { id: "vendors", label: "Properties", icon: Home },
          { id: "testing", label: "Reservations", icon: CalendarCheck }
        ]
      },
      {
        label: "Operations",
        items: [
          { id: "peptides", label: "Turnovers", icon: Sparkles },
          { id: "labs", label: "Maintenance", icon: Wrench }
        ]
      },
      {
        label: "Admin",
        items: [
          { id: "clients", label: "Team", icon: UsersRound },
          { id: "access", label: "Settings", icon: KeyRound }
        ]
      }
    ];
  }

  if (isShamRealEstateHubClientContext(context)) {
    return [
      {
        label: "Portfolio",
        items: [
          { id: "overview", label: "Dashboard", icon: LayoutDashboard },
          { id: "vendors", label: "Listings", icon: Home },
          { id: "testing", label: "Leads", icon: UsersRound }
        ]
      },
      {
        label: "Sales",
        items: [
          { id: "peptides", label: "Viewings", icon: CalendarCheck },
          { id: "labs", label: "Pipeline", icon: BadgeDollarSign }
        ]
      },
      {
        label: "Admin",
        items: [
          { id: "clients", label: "Agents", icon: UserRoundCog },
          { id: "access", label: "Settings", icon: KeyRound }
        ]
      }
    ];
  }

  return [
    {
      label: context.panel.brandName,
      items: [
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "clients", label: "Accounts", icon: UsersRound },
        { id: "testing", label: "Operations", icon: Activity },
        { id: "access", label: "Settings", icon: KeyRound }
      ]
    }
  ];
}

function getPanelSectionMeta(
  context: AdminPanelContext,
  section: AdminSection
): { breadcrumb: string; title: string; description: string } {
  if (context.mode === "superadmin") {
    const platformMeta: Partial<Record<AdminSection, { breadcrumb: string; title: string; description: string }>> = {
      overview: {
        breadcrumb: "EsteemedEngineering / Overview",
        title: context.platform.title,
        description: context.platform.description
      },
      clients: {
        breadcrumb: "EsteemedEngineering / Clients",
        title: "Client companies",
        description: "Every company, plan, region, health state, and account count."
      },
      testing: {
        breadcrumb: "EsteemedEngineering / Accounts",
        title: "Account directory",
        description: "All admin accounts grouped under their companies."
      },
      access: {
        breadcrumb: "EsteemedEngineering / Access",
        title: "Platform access controls",
        description: "Superadmin visibility, tenant isolation, and role ownership."
      }
    };

    return platformMeta[section] ?? platformMeta.overview!;
  }

  if (isPeptraceClientContext(context)) {
    return sectionMeta[section];
  }

  if (isShamstayClientContext(context)) {
    const shamstayMeta: Partial<Record<AdminSection, { breadcrumb: string; title: string; description: string }>> = {
      overview: {
        breadcrumb: "Shamstay BnB / Dashboard",
        title: context.panel.overviewTitle,
        description: context.panel.overviewDescription
      },
      vendors: {
        breadcrumb: "Shamstay BnB / Properties",
        title: "Property portfolio",
        description: "Homes, occupancy, owner notes, pricing health, and guest-ready status."
      },
      testing: {
        breadcrumb: "Shamstay BnB / Reservations",
        title: "Reservations",
        description: "Upcoming stays, guest requests, booking value, and check-in readiness."
      },
      peptides: {
        breadcrumb: "Shamstay BnB / Turnovers",
        title: "Turnover schedule",
        description: "Cleaning, linen, inspection, and pre-arrival tasks between stays."
      },
      labs: {
        breadcrumb: "Shamstay BnB / Maintenance",
        title: "Maintenance queue",
        description: "Property fixes, owner approvals, vendor visits, and blocked-stay risks."
      },
      clients: {
        breadcrumb: "Shamstay BnB / Team",
        title: "Team access",
        description: "Reservation, operations, and owner-reporting users for this workspace."
      },
      access: {
        breadcrumb: "Shamstay BnB / Settings",
        title: "Workspace settings",
        description: "Plan, data region, access roles, and white-label workspace controls."
      }
    };

    return shamstayMeta[section] ?? shamstayMeta.overview!;
  }

  if (isShamRealEstateHubClientContext(context)) {
    const realEstateMeta: Partial<Record<AdminSection, { breadcrumb: string; title: string; description: string }>> = {
      overview: {
        breadcrumb: "Sham Real Estate Hub / Dashboard",
        title: context.panel.overviewTitle,
        description: context.panel.overviewDescription
      },
      vendors: {
        breadcrumb: "Sham Real Estate Hub / Listings",
        title: "Listing portfolio",
        description: "Active properties, asking prices, owner notes, portal quality, and listing readiness."
      },
      testing: {
        breadcrumb: "Sham Real Estate Hub / Leads",
        title: "Buyer and tenant leads",
        description: "Qualified inquiries, hot buyers, portal follow-ups, and agent routing."
      },
      peptides: {
        breadcrumb: "Sham Real Estate Hub / Viewings",
        title: "Viewing schedule",
        description: "Upcoming property tours, agent coverage, buyer fit, and viewing confirmations."
      },
      labs: {
        breadcrumb: "Sham Real Estate Hub / Pipeline",
        title: "Deal pipeline",
        description: "Offers, negotiations, commercial prospects, valuation reviews, and closing risk."
      },
      clients: {
        breadcrumb: "Sham Real Estate Hub / Agents",
        title: "Agent access",
        description: "Brokerage users, lead-routing roles, and listing responsibility."
      },
      access: {
        breadcrumb: "Sham Real Estate Hub / Settings",
        title: "Workspace settings",
        description: "Plan, data region, role access, and white-label brokerage controls."
      }
    };

    return realEstateMeta[section] ?? realEstateMeta.overview!;
  }

  const clientMeta: Partial<Record<AdminSection, { breadcrumb: string; title: string; description: string }>> = {
    overview: {
      breadcrumb: `${context.panel.brandName} / Overview`,
      title: context.panel.overviewTitle,
      description: context.panel.overviewDescription
    },
    clients: {
      breadcrumb: `${context.panel.brandName} / Accounts`,
      title: "Company accounts",
      description: "Users who can access this admin workspace."
    },
    testing: {
      breadcrumb: `${context.panel.brandName} / Operations`,
      title: context.panel.operationsTitle,
      description: context.panel.operationsDescription
    },
    access: {
      breadcrumb: `${context.panel.brandName} / Settings`,
      title: "Workspace settings",
      description: "Plan, data region, and role access settings."
    }
  };

  return clientMeta[section] ?? clientMeta.overview!;
}

function getPrimaryActionLabel(context: AdminPanelContext, section: AdminSection): string {
  if (context.mode === "superadmin") {
    return section === "clients" ? "Add client" : section === "testing" ? "Invite admin" : "Create report";
  }

  if (isPeptraceClientContext(context)) {
    return section === "testing" ? "New test" : section === "vendors" ? "Add vendor" : "Create report";
  }

  if (isShamstayClientContext(context)) {
    const shamstayActions: Partial<Record<AdminSection, string>> = {
      overview: "Create report",
      vendors: "Add property",
      testing: "New reservation",
      peptides: "Schedule turnover",
      labs: "Create maintenance",
      clients: "Invite teammate",
      access: "Review settings"
    };

    return shamstayActions[section] ?? "Create report";
  }

  if (isShamRealEstateHubClientContext(context)) {
    const realEstateActions: Partial<Record<AdminSection, string>> = {
      overview: "Create report",
      vendors: "Add listing",
      testing: "Add lead",
      peptides: "Schedule viewing",
      labs: "Update deal",
      clients: "Invite agent",
      access: "Review settings"
    };

    return realEstateActions[section] ?? "Create report";
  }

  return section === "clients" ? "Invite user" : section === "testing" ? "New task" : "Create report";
}

function getMetricIcon(metric: AdminPanelMetric): typeof LayoutDashboard {
  const label = metric.label.toLowerCase();

  if (label.includes("account") || label.includes("agent") || label.includes("client") || label.includes("seat")) {
    return UsersRound;
  }

  if (label.includes("pipeline") || label.includes("spend") || label.includes("revenue") || label.includes("plan")) {
    return BadgeDollarSign;
  }

  if (label.includes("portfolio")) {
    return Home;
  }

  if (label.includes("status") || label.includes("access")) {
    return ShieldCheck;
  }

  if (
    label.includes("booking") ||
    label.includes("deal") ||
    label.includes("item") ||
    label.includes("lead") ||
    label.includes("reservation") ||
    label.includes("review") ||
    label.includes("task")
  ) {
    return Activity;
  }

  return LayoutDashboard;
}

function SuperAdminPanel({
  context,
  query,
  section
}: {
  context: Extract<AdminPanelContext, { mode: "superadmin" }>;
  query: string;
  section: AdminSection;
}) {
  if (section === "clients") {
    return (
      <section className="page-flow" aria-label="Superadmin clients">
        <SuperAdminClients context={context} query={query} />
      </section>
    );
  }

  if (section === "testing") {
    return <SuperAdminAccounts context={context} query={query} />;
  }

  if (section === "access") {
    return <SuperAdminAccess context={context} />;
  }

  return <SuperAdminOverview context={context} query={query} />;
}

function SuperAdminOverview({ context, query }: { context: Extract<AdminPanelContext, { mode: "superadmin" }>; query: string }) {
  return (
    <section className="page-flow" aria-label="Superadmin overview">
      <MetricGrid metrics={context.platform.metrics} />
      <SuperAdminClients context={context} query={query} />
    </section>
  );
}

function SuperAdminClients({ context, query }: { context: Extract<AdminPanelContext, { mode: "superadmin" }>; query: string }) {
  const clients = filterCompanies(context.platform.clients, query);

  return (
    <section className="panel" aria-label="Client company table">
      <PanelTitle actions={<TableActions />} icon={UsersRound} id="superadmin-client-title" title="Client companies" />
      <ResponsiveTable
        headers={["Company", "Panel", "Plan", "Accounts", "Region", "Open items", "Health"]}
        rows={clients.map((client) => [
          <CompanyCell company={client} key={client.id} />,
          client.panel.productName,
          client.plan,
          client.adminUsers.length,
          client.dataRegion,
          client.openItems,
          <span className="tenant-badge" data-status={client.status} key={client.id}>
            {client.status}
          </span>
        ])}
      />
    </section>
  );
}

function SuperAdminAccounts({ context, query }: { context: Extract<AdminPanelContext, { mode: "superadmin" }>; query: string }) {
  const normalizedQuery = query.trim().toLowerCase();
  const groups = [
    {
      id: "esteemed-engineering",
      name: "EsteemedEngineering",
      description: "Platform administration",
      status: "Superadmin",
      adminUsers: context.platform.internalAccounts
    },
    ...context.platform.clients.map((company) => ({
      id: company.id,
      name: company.name,
      description: `${company.panel.productName} | ${company.plan} plan | ${company.dataRegion}`,
      status: company.status,
      adminUsers: company.adminUsers
    }))
  ]
    .map((group) => {
      const groupMatches = [group.name, group.description, group.status]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
      const accounts =
        groupMatches || !normalizedQuery
          ? group.adminUsers
          : group.adminUsers.filter((account) =>
              [account.displayName, account.email, account.role].join(" ").toLowerCase().includes(normalizedQuery)
            );

      return { ...group, adminUsers: accounts };
    })
    .filter((group) => group.adminUsers.length > 0);

  return (
    <section className="page-flow" aria-label="Superadmin accounts">
      {groups.map((group) => (
        <section className="panel account-company-panel" aria-labelledby={`account-company-${group.id}`} key={group.id}>
          <div className="account-company-header">
            <div className="account-company-identity">
              <span className="company-monogram" aria-hidden="true">
                {getWorkspaceInitials(group.name)}
              </span>
              <div>
                <h2 id={`account-company-${group.id}`}>{group.name}</h2>
                <p>{group.description}</p>
              </div>
            </div>
            <div className="account-company-summary">
              <span className="tenant-badge" data-status={group.status}>
                {group.status}
              </span>
              <strong>
                {group.adminUsers.length} {group.adminUsers.length === 1 ? "account" : "accounts"}
              </strong>
            </div>
          </div>
          <ResponsiveTable
            headers={["Account", "Role", "Last login"]}
            rows={group.adminUsers.map((account) => [
              <AccountCell account={account} key={account.id} />,
              <span className="soft-pill" key={`${account.id}-role`}>
                {formatRole(account.role)}
              </span>,
              account.lastLoginAt ? formatDate(account.lastLoginAt) : "Never"
            ])}
          />
        </section>
      ))}
      {groups.length === 0 && (
        <section className="panel account-directory-empty" aria-live="polite">
          <UserRoundCog size={20} strokeWidth={2} />
          <strong>No company accounts match this search.</strong>
        </section>
      )}
    </section>
  );
}

function SuperAdminAccess({ context }: { context: Extract<AdminPanelContext, { mode: "superadmin" }> }) {
  const superadminCount = context.platform.clients.reduce(
    (total, company) => total + company.adminUsers.filter((account) => account.role === "superadmin").length,
    context.platform.internalAccounts.length
  );

  return (
    <section className="page-flow" aria-label="Superadmin access">
      <div className="metric-grid three-up">
        <Metric icon={ShieldCheck} label="Tenant isolation" tone="success" value="Active" change="Client users see one company" />
        <Metric icon={UsersRound} label="Superadmins" tone="info" value={superadminCount.toString()} change="Platform-wide access" />
        <Metric icon={KeyRound} label="Scoped clients API" tone="success" value="Protected" change="/clients is role-aware" />
      </div>
    </section>
  );
}

function ClientAdminPanel({
  context,
  data,
  query,
  section,
  vendors: vendorRows
}: {
  context: Extract<AdminPanelContext, { mode: "client" }>;
  data: AdminPanelData | null;
  query: string;
  section: AdminSection;
  vendors: Vendor[];
}) {
  if (isPeptraceClientContext(context)) {
    if (!data) {
      return null;
    }

    if (section === "clients") {
      return <ClientsView clients={data.clients} />;
    }

    if (section === "vendors") {
      return <VendorsView vendors={vendorRows} />;
    }

    if (section === "peptides") {
      return <PeptidesView peptides={data.peptides} vendors={data.vendors} />;
    }

    if (section === "testing") {
      return <TestingView peptides={data.peptides} tests={data.tests} vendors={data.vendors} />;
    }

    if (section === "labs") {
      return <LabsView labs={data.labs} />;
    }

    if (section === "access") {
      return <AccessView apiSurfaces={data.apiSurfaces} />;
    }

    return <Overview data={data} />;
  }

  if (isShamstayClientContext(context)) {
    return <ShamstayAdminPanel context={context} query={query} section={section} />;
  }

  if (isShamRealEstateHubClientContext(context)) {
    return <RealEstateAdminPanel context={context} query={query} section={section} />;
  }

  if (section === "clients") {
    return <ClientAccounts context={context} query={query} />;
  }

  if (section === "testing") {
    return (
      <section className="page-flow" aria-label={`${context.panel.brandName} operations`}>
        <ClientOperations context={context} query={query} />
      </section>
    );
  }

  if (section === "access") {
    return <ClientSettings context={context} />;
  }

  return <ClientOverview context={context} query={query} />;
}

function ShamstayAdminPanel({
  context,
  query,
  section
}: {
  context: Extract<AdminPanelContext, { mode: "client" }>;
  query: string;
  section: AdminSection;
}) {
  if (section === "clients") {
    return <ClientAccounts context={context} query={query} title="Team members" />;
  }

  if (section === "vendors") {
    return (
      <section className="page-flow tenant-panel" style={{ "--tenant-accent": context.panel.accentColor } as CSSProperties}>
        <ShamstayRecordTable
          context={context}
          headers={["Property", "Stay detail", "Performance", "Status"]}
          icon={Home}
          query={query}
          title="Property portfolio"
        />
      </section>
    );
  }

  if (section === "testing") {
    return (
      <section className="page-flow tenant-panel" style={{ "--tenant-accent": context.panel.accentColor } as CSSProperties}>
        <ShamstayRecordTable
          context={context}
          headers={["Reservation", "Guest request", "Value", "Status"]}
          icon={CalendarCheck}
          query={query}
          title="Reservation board"
        />
      </section>
    );
  }

  if (section === "peptides") {
    return (
      <section className="page-flow tenant-panel" style={{ "--tenant-accent": context.panel.accentColor } as CSSProperties}>
        <section className="panel" aria-label="Turnover schedule">
          <PanelTitle
            actions={<TableActions />}
            icon={Sparkles}
            id="shamstay-turnovers-title"
            subtitle="Cleaning, linen, inspection, and guest-ready tasks between stays."
            title="Turnover schedule"
          />
          <WorkItemList items={context.panel.workItems} />
        </section>
      </section>
    );
  }

  if (section === "labs") {
    const maintenanceRecords = context.panel.primaryRecords.filter((record) =>
      [record.label, record.detail, record.status].join(" ").toLowerCase().includes("maintenance")
    );

    return (
      <section className="page-flow tenant-panel" style={{ "--tenant-accent": context.panel.accentColor } as CSSProperties}>
        <ShamstayRecordTable
          context={context}
          headers={["Property", "Issue", "Impact", "Status"]}
          icon={Wrench}
          query={query}
          records={maintenanceRecords.length > 0 ? maintenanceRecords : context.panel.primaryRecords}
          title="Maintenance queue"
        />
      </section>
    );
  }

  if (section === "access") {
    return <ClientSettings context={context} />;
  }

  return <ShamstayOverview context={context} query={query} />;
}

function ShamstayOverview({ context, query }: { context: Extract<AdminPanelContext, { mode: "client" }>; query: string }) {
  return (
    <section
      className="page-flow tenant-panel"
      style={{ "--tenant-accent": context.panel.accentColor } as CSSProperties}
      aria-label="Shamstay BnB dashboard"
    >
      <div className="scope-strip tenant-scope" aria-label="Current tenant scope">
        <ScopeItem label="Business" value="Short-term rentals" />
        <ScopeItem label="Properties" value={context.panel.primaryRecords.length.toString()} />
        <ScopeItem label="Region" value={context.company.dataRegion} />
        <ScopeItem label="Role" value={formatRole(context.viewer.role)} />
      </div>

      <MetricGrid metrics={context.panel.metrics} />

      <div className="overview-grid">
        <section className="panel panel-wide" aria-label="Guest operations">
          <PanelTitle
            icon={CalendarCheck}
            id="shamstay-guest-ops-title"
            subtitle={context.panel.operationsDescription}
            title={context.panel.operationsTitle}
          />
          <WorkItemList items={context.panel.workItems} />
        </section>

        <section className="panel" aria-label="Reservation team">
          <PanelTitle icon={UsersRound} id="shamstay-team-title" title="Reservation team" />
          <div className="queue-list">
            {context.company.adminUsers.map((account) => (
              <div className="queue-row" key={account.id}>
                <AccountCell account={account} />
                <span className="soft-pill">{formatRole(account.role)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <ShamstayRecordTable
        context={context}
        headers={["Property", "Stay detail", "Performance", "Status"]}
        icon={Home}
        query={query}
        title="Live property board"
      />
    </section>
  );
}

function ShamstayRecordTable({
  context,
  headers,
  icon,
  query,
  records,
  title
}: {
  context: Extract<AdminPanelContext, { mode: "client" }>;
  headers: [string, string, string, string];
  icon: typeof LayoutDashboard;
  query: string;
  records?: Extract<AdminPanelContext, { mode: "client" }>["panel"]["primaryRecords"];
  title: string;
}) {
  const normalizedQuery = query.trim().toLowerCase();
  const recordRows = (records ?? context.panel.primaryRecords).filter((record) =>
    normalizedQuery
      ? [record.label, record.detail, record.status, record.value].join(" ").toLowerCase().includes(normalizedQuery)
      : true
  );

  return (
    <section className="panel" aria-label={title}>
      <PanelTitle actions={<TableActions />} icon={icon} id={`${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-title`} title={title} />
      <ResponsiveTable
        headers={headers}
        rows={recordRows.map((record) => [
          <div className="entity-cell" key={record.label}>
            <strong>{record.label}</strong>
            <span>{context.panel.brandName}</span>
          </div>,
          record.detail,
          record.value,
          <span className="readiness-pill" data-readiness="Scoped" key={record.label}>
            {record.status}
          </span>
        ])}
      />
    </section>
  );
}

function RealEstateAdminPanel({
  context,
  query,
  section
}: {
  context: Extract<AdminPanelContext, { mode: "client" }>;
  query: string;
  section: AdminSection;
}) {
  if (section === "clients") {
    return <ClientAccounts context={context} query={query} title="Agents and coordinators" />;
  }

  if (section === "vendors") {
    return (
      <section className="page-flow tenant-panel" style={{ "--tenant-accent": context.panel.accentColor } as CSSProperties}>
        <RealEstateRecordTable
          context={context}
          headers={["Listing", "Owner or buyer note", "Value", "Stage"]}
          icon={Home}
          query={query}
          title="Listing portfolio"
        />
      </section>
    );
  }

  if (section === "testing") {
    return (
      <section className="page-flow tenant-panel" style={{ "--tenant-accent": context.panel.accentColor } as CSSProperties}>
        <RealEstateRecordTable
          context={context}
          headers={["Lead", "Requirement", "Budget", "Status"]}
          icon={UsersRound}
          query={query}
          title="Lead desk"
        />
      </section>
    );
  }

  if (section === "peptides") {
    return (
      <section className="page-flow tenant-panel" style={{ "--tenant-accent": context.panel.accentColor } as CSSProperties}>
        <section className="panel" aria-label="Viewing schedule">
          <PanelTitle
            actions={<TableActions />}
            icon={CalendarCheck}
            id="real-estate-viewings-title"
            subtitle="Tours, callbacks, agent coverage, and buyer-fit follow-ups."
            title="Viewing schedule"
          />
          <WorkItemList items={context.panel.workItems} />
        </section>
      </section>
    );
  }

  if (section === "labs") {
    const pipelineRecords = context.panel.primaryRecords.filter((record) =>
      [record.label, record.detail, record.status].join(" ").toLowerCase().match(/offer|pipeline|negotiation|valuation|review/)
    );

    return (
      <section className="page-flow tenant-panel" style={{ "--tenant-accent": context.panel.accentColor } as CSSProperties}>
        <RealEstateRecordTable
          context={context}
          headers={["Deal", "Next step", "Value", "Stage"]}
          icon={BadgeDollarSign}
          query={query}
          records={pipelineRecords.length > 0 ? pipelineRecords : context.panel.primaryRecords}
          title="Deal pipeline"
        />
      </section>
    );
  }

  if (section === "access") {
    return <ClientSettings context={context} />;
  }

  return <RealEstateOverview context={context} query={query} />;
}

function RealEstateOverview({ context, query }: { context: Extract<AdminPanelContext, { mode: "client" }>; query: string }) {
  return (
    <section
      className="page-flow tenant-panel"
      style={{ "--tenant-accent": context.panel.accentColor } as CSSProperties}
      aria-label="Sham Real Estate Hub dashboard"
    >
      <div className="scope-strip tenant-scope" aria-label="Current tenant scope">
        <ScopeItem label="Business" value="Real estate brokerage" />
        <ScopeItem label="Active listings" value={context.panel.primaryRecords.length.toString()} />
        <ScopeItem label="Region" value={context.company.dataRegion} />
        <ScopeItem label="Role" value={formatRole(context.viewer.role)} />
      </div>

      <MetricGrid metrics={context.panel.metrics} />

      <div className="overview-grid">
        <section className="panel panel-wide" aria-label="Brokerage operations">
          <PanelTitle
            icon={Activity}
            id="real-estate-brokerage-ops-title"
            subtitle={context.panel.operationsDescription}
            title={context.panel.operationsTitle}
          />
          <WorkItemList items={context.panel.workItems} />
        </section>

        <section className="panel" aria-label="Brokerage team">
          <PanelTitle icon={UserRoundCog} id="real-estate-team-title" title="Brokerage team" />
          <div className="queue-list">
            {context.company.adminUsers.map((account) => (
              <div className="queue-row" key={account.id}>
                <AccountCell account={account} />
                <span className="soft-pill">{formatRole(account.role)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <RealEstateRecordTable
        context={context}
        headers={["Listing", "Lead or seller note", "Value", "Stage"]}
        icon={Home}
        query={query}
        title="Active listings and deals"
      />
    </section>
  );
}

function RealEstateRecordTable({
  context,
  headers,
  icon,
  query,
  records,
  title
}: {
  context: Extract<AdminPanelContext, { mode: "client" }>;
  headers: [string, string, string, string];
  icon: typeof LayoutDashboard;
  query: string;
  records?: Extract<AdminPanelContext, { mode: "client" }>["panel"]["primaryRecords"];
  title: string;
}) {
  const normalizedQuery = query.trim().toLowerCase();
  const recordRows = (records ?? context.panel.primaryRecords).filter((record) =>
    normalizedQuery
      ? [record.label, record.detail, record.status, record.value].join(" ").toLowerCase().includes(normalizedQuery)
      : true
  );

  return (
    <section className="panel" aria-label={title}>
      <PanelTitle actions={<TableActions />} icon={icon} id={`${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-title`} title={title} />
      <ResponsiveTable
        headers={headers}
        rows={recordRows.map((record) => [
          <div className="entity-cell" key={record.label}>
            <strong>{record.label}</strong>
            <span>{context.panel.brandName}</span>
          </div>,
          record.detail,
          record.value,
          <span className="readiness-pill" data-readiness="Scoped" key={record.label}>
            {record.status}
          </span>
        ])}
      />
    </section>
  );
}

function ClientOverview({ context, query }: { context: Extract<AdminPanelContext, { mode: "client" }>; query: string }) {
  return (
    <section
      className="page-flow tenant-panel"
      style={{ "--tenant-accent": context.panel.accentColor } as CSSProperties}
      aria-label={`${context.panel.brandName} overview`}
    >
      <div className="scope-strip tenant-scope" aria-label="Current tenant scope">
        <ScopeItem label="Company" value={context.company.name} />
        <ScopeItem label="Industry" value={context.panel.industry} />
        <ScopeItem label="Region" value={context.company.dataRegion} />
        <ScopeItem label="Role" value={formatRole(context.viewer.role)} />
      </div>

      <MetricGrid metrics={context.panel.metrics} />

      <div className="overview-grid">
        <section className="panel panel-wide" aria-label="Workspace operations">
          <PanelTitle
            icon={Activity}
            id="client-operations-title"
            subtitle={context.panel.operationsDescription}
            title={context.panel.operationsTitle}
          />
          <WorkItemList items={context.panel.workItems} />
        </section>

        <section className="panel" aria-label="Workspace accounts">
          <PanelTitle icon={UserRoundCog} id="client-account-summary-title" title="Workspace accounts" />
          <div className="queue-list">
            {context.company.adminUsers.map((account) => (
              <div className="queue-row" key={account.id}>
                <AccountCell account={account} />
                <span className="soft-pill">{formatRole(account.role)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <ClientOperations context={context} query={query} />
    </section>
  );
}

function ClientAccounts({
  context,
  query,
  title = "Company accounts"
}: {
  context: Extract<AdminPanelContext, { mode: "client" }>;
  query: string;
  title?: string;
}) {
  const accounts = context.company.adminUsers.filter((account) =>
    [account.displayName, account.email, account.role].join(" ").toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <section className="page-flow" aria-label="Workspace accounts">
      <section className="panel" aria-label="Workspace account table">
        <PanelTitle actions={<TableActions />} icon={UsersRound} id="client-accounts-title" title={title} />
        <ResponsiveTable
          headers={["Account", "Role", "Created", "Last login"]}
          rows={accounts.map((account) => [
            <AccountCell account={account} key={account.id} />,
            formatRole(account.role),
            formatDate(account.createdAt),
            account.lastLoginAt ? formatDate(account.lastLoginAt) : "Never"
          ])}
        />
      </section>
    </section>
  );
}

function ClientOperations({ context, query }: { context: Extract<AdminPanelContext, { mode: "client" }>; query: string }) {
  const records = context.panel.primaryRecords.filter((record) =>
    [record.label, record.detail, record.status, record.value].join(" ").toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <section className="panel" aria-label={`${context.panel.brandName} operations table`}>
      <PanelTitle actions={<TableActions />} icon={Activity} id="client-records-title" title={context.panel.operationsTitle} />
      <ResponsiveTable
        headers={["Record", "Detail", "Value", "Status"]}
        rows={records.map((record) => [
          <div className="entity-cell" key={record.label}>
            <strong>{record.label}</strong>
            <span>{context.panel.brandName}</span>
          </div>,
          record.detail,
          record.value,
          <span className="readiness-pill" data-readiness="Scoped" key={record.label}>
            {record.status}
          </span>
        ])}
      />
    </section>
  );
}

function ClientSettings({ context }: { context: Extract<AdminPanelContext, { mode: "client" }> }) {
  return (
    <section className="page-flow" aria-label="Workspace settings">
      <div className="metric-grid three-up">
        <Metric icon={ShieldCheck} label="Workspace scope" tone="success" value="Dedicated" change={context.company.name} />
        <Metric icon={BadgeDollarSign} label="Plan" tone="info" value={context.company.plan} change={formatCurrency(context.company.monthlySpend)} />
        <Metric icon={KeyRound} label="Admin panel" tone="success" value="Active" change={context.panel.productName} />
      </div>
    </section>
  );
}

function MetricGrid({ metrics }: { metrics: AdminPanelMetric[] }) {
  return (
    <div className="metric-grid">
      {metrics.map((metric) => (
        <Metric
          change={metric.change}
          icon={getMetricIcon(metric)}
          key={metric.label}
          label={metric.label}
          tone={metric.tone}
          value={metric.value}
        />
      ))}
    </div>
  );
}

function WorkItemList({ items }: { items: Extract<AdminPanelContext, { mode: "client" }>["panel"]["workItems"] }) {
  return (
    <div className="queue-list">
      {items.map((item) => (
        <div className="queue-row" key={item.label}>
          <div>
            <strong>{item.label}</strong>
            <span>{item.detail}</span>
          </div>
          <span className="priority-pill" data-priority={item.priority}>
            {item.priority}
          </span>
        </div>
      ))}
    </div>
  );
}

function CompanyCell({ company }: { company: AdminPanelCompany }) {
  return (
    <div className="entity-cell">
      <strong>{company.name}</strong>
      <span>{company.slug}</span>
    </div>
  );
}

function AccountCell({ account }: { account: AdminPanelCompany["adminUsers"][number] }) {
  return (
    <div className="entity-cell">
      <strong>{account.displayName}</strong>
      <span>{account.email}</span>
    </div>
  );
}

function filterCompanies<T extends AdminPanelCompany>(companies: T[], query: string): T[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return companies;
  }

  return companies.filter((company) =>
    [
      company.name,
      company.slug,
      company.plan,
      company.status,
      company.adminUsers.map((account) => `${account.displayName} ${account.email} ${account.role}`).join(" ")
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery)
  );
}

function LoginScreen({ onLogin }: { onLogin: (session: AdminSession, rememberMe: boolean) => void }) {
  const [email, setEmail] = useState(import.meta.env.DEV ? TEST_ADMIN_EMAIL : "");
  const [password, setPassword] = useState(import.meta.env.DEV ? TEST_ADMIN_PASSWORD : "");
  const [rememberMe, setRememberMe] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const nextSession = await loginToBackend({ email, password });
      onLogin(nextSession, rememberMe);
    } catch (loginError) {
      if (loginError instanceof PeptraceApiError && loginError.status === 401) {
        setError("The email or password is incorrect.");
      } else {
        const detail = loginError instanceof Error ? loginError.message : "Unknown browser error";
        setError(
          import.meta.env.DEV
            ? `Could not reach the sign-in service: ${detail}`
            : "Could not reach the sign-in service. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-shell">
      <section className="login-panel" aria-labelledby="login-title">
        <aside className="login-brand-panel" aria-label="Admin console overview">
          <div className="login-brand-header">
            <span className="login-brand-mark" aria-hidden="true">
              <EsteemedEngineeringLogo className="ee-logo" />
            </span>
            <div>
              <strong>EsteemedEngineering</strong>
              <span>Software operations</span>
            </div>
          </div>

          <div className="login-brand-copy">
            <p>Enterprise command center</p>
            <h2>Run software operations with clarity.</h2>
            <span>
              Manage apps, delivery records, access, and operational signals from one secure workspace.
            </span>
          </div>

          <div className="login-service-map" aria-hidden="true">
            <div>
              <span>Service suite</span>
              <strong>Production-ready systems</strong>
            </div>
            <ul>
              <li>
                <LayoutDashboard size={16} strokeWidth={2} />
                <span>Web apps</span>
              </li>
              <li>
                <Sparkles size={16} strokeWidth={2} />
                <span>Mobile apps</span>
              </li>
              <li>
                <Wrench size={16} strokeWidth={2} />
                <span>Admin tools</span>
              </li>
              <li>
                <Activity size={16} strokeWidth={2} />
                <span>API services</span>
              </li>
            </ul>
          </div>

          <div className="login-feature-stack">
            <div className="login-feature-item">
              <ShieldCheck size={18} strokeWidth={2} />
              <div>
                <strong>Protected sessions</strong>
                <span>Encrypted sign-in and role-aware controls</span>
              </div>
            </div>
            <div className="login-feature-item">
              <Activity size={18} strokeWidth={2} />
              <div>
                <strong>Delivery oversight</strong>
                <span>Project workflows, launch readiness, and support queues</span>
              </div>
            </div>
            <div className="login-feature-item">
              <KeyRound size={18} strokeWidth={2} />
              <div>
                <strong>Account governance</strong>
                <span>Permission, profile, and workspace management</span>
              </div>
            </div>
          </div>

          <div className="login-brand-foot">
            <span>Access mode</span>
            <strong>Internal admin workspace</strong>
          </div>
        </aside>

        <div className="login-form-panel">
          <div className="login-panel-top">
            <span className="security-pill">
              <ShieldCheck size={15} strokeWidth={2} />
              Protected access
            </span>
            <span className="login-panel-code">EE-OPS</span>
          </div>

          <div className="login-copy">
            <p>Secure sign in</p>
            <h1 id="login-title">Welcome back</h1>
            <span>Sign in to manage your software operations workspace.</span>
          </div>

          <form className="login-form" onSubmit={submitLogin}>
            <label>
              <span>Email</span>
              <div className="input-frame">
                <Mail size={17} strokeWidth={2} />
                <Input
                  autoComplete="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@company.com"
                  required
                  type="email"
                  value={email}
                />
              </div>
            </label>

            <label>
              <span>Password</span>
              <div className="input-frame">
                <LockKeyhole size={17} strokeWidth={2} />
                <Input
                  autoComplete="current-password"
                  minLength={8}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                  type={isPasswordVisible ? "text" : "password"}
                  value={password}
                />
                <Button
                  aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                  aria-pressed={isPasswordVisible}
                  className="password-toggle"
                  onClick={() => setIsPasswordVisible((isVisible) => !isVisible)}
                  size="icon"
                  title={isPasswordVisible ? "Hide password" : "Show password"}
                  type="button"
                  variant="ghost"
                >
                  {isPasswordVisible ? <EyeOff size={17} strokeWidth={2} /> : <Eye size={17} strokeWidth={2} />}
                </Button>
              </div>
            </label>

            <div className="login-form-row">
              <label className="remember-control">
                <Checkbox
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <span>Remember me</span>
              </label>
              <a className="forgot-password-link" href="mailto:support@esteemedengineering.com?subject=Password%20reset%20request">
                Forgot password?
              </a>
            </div>

            {error && (
              <div className="login-error" role="alert">
                <AlertCircle size={17} strokeWidth={2} />
                <span>{error}</span>
              </div>
            )}

            <Button className="primary-button login-submit" disabled={isSubmitting} type="submit">
              {isSubmitting && <LoaderCircle className="button-spinner" size={18} strokeWidth={2.2} />}
              <span>{isSubmitting ? "Signing in" : "Sign in"}</span>
            </Button>
          </form>

          <div className="login-support">
            <span>Need access?</span>
            <a href="mailto:support@esteemedengineering.com">Contact support</a>
          </div>

          <p className="login-assurance">
            Administrative access is monitored and protected for authorized team members.
          </p>
        </div>
      </section>
    </main>
  );
}

function PageHeader({
  meta,
  primaryAction,
  section
}: {
  meta: (typeof sectionMeta)[AdminSection];
  primaryAction?: string;
  section: AdminSection;
}) {
  return (
    <section className="page-header" aria-labelledby="page-title">
      <div className="page-header-copy">
        <p>{meta.breadcrumb}</p>
        <h1 id="page-title">{meta.title}</h1>
        <span>{meta.description}</span>
      </div>
      <div className="page-actions">
        <Button className="secondary-button" type="button" variant="outline">
          <Download size={17} strokeWidth={2} />
          <span>Export</span>
        </Button>
        <Button className="primary-button" type="button">
          {section === "vendors" || primaryAction?.startsWith("Add") || primaryAction?.startsWith("Invite") ? (
            <Plus size={17} strokeWidth={2} />
          ) : (
            <Activity size={17} strokeWidth={2} />
          )}
          <span>{primaryAction ?? "Create report"}</span>
        </Button>
      </div>
    </section>
  );
}

function Overview({ data }: { data: AdminPanelData }) {
  const queue = [...data.accountWorkItems].sort((left, right) => priorityOrder[left.priority] - priorityOrder[right.priority]);
  const peptideNames = new Map(data.peptides.map((peptide) => [peptide.id, peptide.label]));
  const vendorNames = new Map(data.vendors.map((vendor) => [vendor.id, vendor.displayName]));
  const labNames = new Map(data.labs.map((lab) => [lab.id, lab.displayName]));
  const openTests = data.tests.filter((test) => test.testingStatus !== "COMPLETE").length;
  const retestRequests = data.tests.filter((test) => test.testingStatus === "RETEST_REQUESTED").length;
  const readySurfaces = data.apiSurfaces.filter((surface) => surface.readiness === "Scoped").length;
  const averageVendorRating =
    data.vendors.length > 0
      ? data.vendors.reduce((total, vendor) => total + vendor.overallRating, 0) / data.vendors.length
      : 0;

  return (
    <section className="page-flow" aria-label="Overview dashboard">
      <div className="scope-strip" aria-label="Current data scope">
        <ScopeItem label="Tenant" value="Peptrace" />
        <ScopeItem label="Role" value="Owner" />
        <ScopeItem label="Region" value="US data plane" />
        <ScopeItem label="Window" value="Last 30 days" />
      </div>

      <div className="metric-grid">
        <Metric
          icon={UsersRound}
          label="Client accounts"
          tone="info"
          value={data.clients.length.toString()}
          change={`${data.clients.filter((client) => client.status === "Healthy").length} healthy workspace`}
        />
        <Metric
          icon={Microscope}
          label="Open tests"
          tone="warning"
          value={openTests.toString()}
          change={`${retestRequests} retest request`}
        />
        <Metric
          icon={CheckCircle2}
          label="Controls ready"
          tone="success"
          value={`${readySurfaces}/${data.apiSurfaces.length}`}
          change="Access policy active"
        />
        <Metric
          icon={Store}
          label="Avg. vendor rating"
          tone="neutral"
          value={formatScore(averageVendorRating)}
          change="Across catalog"
        />
      </div>

      <div className="overview-grid">
        <section className="panel panel-wide" aria-labelledby="watchlist-title">
          <PanelTitle
            actions={<TableActions />}
            icon={Microscope}
            id="watchlist-title"
            subtitle="Tests that need operational attention before reporting."
            title="Quality watchlist"
          />
          <ResponsiveTable
            headers={["Peptide", "Vendor", "Lab", "Assay", "Purity", "Status"]}
            rows={data.tests.map((test) => [
              peptideNames.get(test.peptideId) ?? "Unknown peptide",
              vendorNames.get(test.vendorId) ?? "Unknown vendor",
              labNames.get(test.labId) ?? "Unknown lab",
              test.assay,
              test.purityPercent ? `${test.purityPercent.toFixed(1)}%` : "Pending",
              <StatusBadge key={test.id} status={test.testingStatus} />
            ])}
          />
        </section>

        <section className="panel" aria-labelledby="queue-title">
          <PanelTitle
            icon={UserRoundCog}
            id="queue-title"
            subtitle="Prioritized account work across support, billing, and quality."
            title="Account queue"
          />
          <div className="queue-list">
            {queue.map((item) => (
              <div className="queue-row" key={item.id}>
                <div>
                  <strong>{item.account}</strong>
                  <span>
                    {item.kind} · due {formatDate(item.dueAt)}
                  </span>
                </div>
                <span className="priority-pill" data-priority={item.priority}>
                  {item.priority}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="panel" aria-labelledby="client-health-title">
        <PanelTitle
          actions={<TableActions />}
          icon={UsersRound}
          id="client-health-title"
          subtitle="A clear operating view for support, account health, and service quality."
          title="Client health"
        />
        <ResponsiveTable
          headers={["Client", "Plan", "Owner", "Region", "Open items", "Health"]}
          rows={data.clients.map((client) => [
            <ClientCell client={client} key={client.id} />,
            client.plan,
            client.owner,
            client.dataRegion,
            client.openItems,
            <TenantBadge key={client.id} status={client.status} />
          ])}
        />
      </section>
    </section>
  );
}

function ClientsView({ clients }: { clients: ClientTenant[] }) {
  return (
    <section className="page-flow" aria-label="Client workspaces">
      <section className="panel" aria-label="Client tenant table">
        <PanelTitle actions={<TableActions />} icon={UsersRound} id="clients-table-title" title="Tenant registry" />
        <ResponsiveTable
          headers={["Client", "Plan", "Seats", "Monthly spend", "Owner", "Last activity", "Health"]}
          rows={clients.map((client) => [
            <ClientCell client={client} key={client.id} />,
            client.plan,
            client.seats,
            formatCurrency(client.monthlySpend),
            client.owner,
            formatDate(client.lastActivityAt),
            <TenantBadge key={client.id} status={client.status} />
          ])}
        />
      </section>
    </section>
  );
}

function VendorsView({ vendors: vendorRows }: { vendors: Vendor[] }) {
  return (
    <section className="page-flow" aria-label="Vendor performance">
      <section className="panel" aria-label="Vendor table">
        <PanelTitle actions={<TableActions />} icon={Store} id="vendors-table-title" title="Vendor scorecard" />
        <ResponsiveTable
          headers={["Vendor", "Rating", "Products", "Best purity", "Tests", "Actions"]}
          rows={vendorRows.map((vendor) => {
            const bestPurity =
              vendor.products.length > 0 ? Math.max(...vendor.products.map((product) => product.purityPercent)) : null;
            const testsCount = vendor.products.reduce((total, product) => total + product.testsCount, 0);
            return [
              <VendorCell key={vendor.id} vendor={vendor} />,
              formatScore(vendor.overallRating),
              vendor.products.map((product) => product.label).join(", "),
              bestPurity ? `${bestPurity.toFixed(1)}%` : "Pending",
              testsCount.toLocaleString(),
              <Button className="row-action" aria-label={`Open ${vendor.displayName} actions`} key={vendor.id} type="button" variant="ghost" size="icon">
                <MoreHorizontal size={17} strokeWidth={2} />
              </Button>
            ];
          })}
        />
      </section>
    </section>
  );
}

function PeptidesView({ peptides: peptideRows, vendors: vendorRows }: { peptides: Peptide[]; vendors: Vendor[] }) {
  return (
    <section className="page-flow" aria-label="Peptide index">
      <div className="collection-grid">
        {peptideRows.map((peptide) => {
          const vendorMatches = vendorRows.flatMap((vendor) =>
            vendor.products
              .filter((product) => product.peptideId === peptide.id)
              .map((product) => ({ vendor, product }))
          );
          const averagePrice =
            vendorMatches.reduce((total, match) => total + match.product.priceMg, 0) / Math.max(vendorMatches.length, 1);

          return (
            <article className="record-card" key={peptide.id}>
              <div className="record-card-top">
                <span className="record-icon">
                  <FlaskConical size={18} strokeWidth={2} />
                </span>
                <StatusBadge status={peptide.tests[0]?.testingStatus ?? "PENDING"} />
              </div>
              <h2>{peptide.label}</h2>
              <dl className="record-stats">
                <div>
                  <dt>Slug</dt>
                  <dd>{peptide.slug}</dd>
                </div>
                <div>
                  <dt>Tests</dt>
                  <dd>{peptide.tests.length}</dd>
                </div>
                <div>
                  <dt>Avg. $/mg</dt>
                  <dd>${averagePrice.toFixed(2)}</dd>
                </div>
              </dl>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function TestingView({
  peptides: peptideRows,
  tests,
  vendors: vendorRows
}: {
  peptides: Peptide[];
  tests: LabTest[];
  vendors: Vendor[];
}) {
  const peptideNames = new Map(peptideRows.map((peptide) => [peptide.id, peptide.label]));
  const vendorNames = new Map(vendorRows.map((vendor) => [vendor.id, vendor.displayName]));

  return (
    <section className="page-flow" aria-label="Lab test tracking">
      <section className="panel" aria-label="Lab test table">
        <PanelTitle actions={<TableActions />} icon={Microscope} id="testing-table-title" title="Testing workflow" />
        <ResponsiveTable
          headers={["Test", "Peptide", "Vendor", "Assay", "Purity", "Label claim", "Status"]}
          rows={tests.map((test) => [
            test.id,
            peptideNames.get(test.peptideId) ?? "Unknown peptide",
            vendorNames.get(test.vendorId) ?? "Unknown vendor",
            test.assay,
            test.purityPercent ? `${test.purityPercent.toFixed(1)}%` : "Pending",
            test.labelClaimPercent ? `${test.labelClaimPercent.toFixed(1)}%` : "Pending",
            <StatusBadge key={test.id} status={test.testingStatus} />
          ])}
        />
      </section>
    </section>
  );
}

function LabsView({ labs: labRows }: { labs: Lab[] }) {
  return (
    <section className="page-flow" aria-label="Laboratory network">
      <div className="collection-grid">
        {labRows.map((lab) => (
          <article className="record-card" key={lab.id}>
            <div className="record-card-top">
              <span className="record-icon">
                <Beaker size={18} strokeWidth={2} />
              </span>
              <span className="soft-pill">{lab.tests.length} tests</span>
            </div>
            <h2>{lab.displayName}</h2>
            <dl className="record-stats">
              <div>
                <dt>Slug</dt>
                <dd>{lab.slug}</dd>
              </div>
              <div>
                <dt>Partner since</dt>
                <dd>{formatDate(lab.partnerSince)}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function AccessView({ apiSurfaces }: { apiSurfaces: ApiSurface[] }) {
  return (
    <section className="page-flow" aria-label="Security and billing controls">
      <div className="metric-grid three-up">
        <Metric icon={ShieldCheck} label="Session policy" tone="success" value="Active" change="Role-based access" />
        <Metric icon={KeyRound} label="Client API keys" tone="info" value="Scoped" change="Tenant permissions" />
        <Metric icon={BadgeDollarSign} label="Billing controls" tone="warning" value="Review" change="Plan and seat rules" />
      </div>

      <section className="panel" aria-label="Access policy table">
        <PanelTitle actions={<TableActions />} icon={KeyRound} id="access-table-title" title="Access policy" />
        <ResponsiveTable
          headers={["Area", "Owner", "Status", "Coverage"]}
          rows={apiSurfaces.map((surface) => [
            surface.group,
            surface.owner,
            <span className="readiness-pill" data-readiness={surface.readiness} key={surface.group}>
              {formatReadiness(surface.readiness)}
            </span>,
            `${surface.routes.length} permission scopes`
          ])}
        />
      </section>
    </section>
  );
}

function ScopeItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="scope-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  change,
  tone
}: {
  icon: typeof LayoutDashboard;
  label: string;
  value: string;
  change: string;
  tone: "info" | "neutral" | "success" | "warning";
}) {
  return (
    <article className="metric-card" data-tone={tone}>
      <span className="metric-icon">
        <Icon size={18} strokeWidth={2} />
      </span>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{change}</small>
    </article>
  );
}

function PanelTitle({
  actions,
  icon: Icon,
  id,
  subtitle,
  title
}: {
  actions?: ReactNode;
  icon: typeof LayoutDashboard;
  id: string;
  subtitle?: string;
  title: string;
}) {
  return (
    <div className="panel-title">
      <div>
        <span className="panel-icon">
          <Icon size={18} strokeWidth={2} />
        </span>
        <div>
          <h2 id={id}>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {actions}
    </div>
  );
}

function TableActions() {
  return (
    <div className="table-actions">
      <Button className="tool-button" type="button" variant="outline" size="sm">
        <Filter size={16} strokeWidth={2} />
        <span>Filter</span>
      </Button>
      <Button className="icon-button compact" aria-label="Table settings" title="Table settings" type="button" variant="outline" size="icon">
        <SlidersHorizontal size={16} strokeWidth={2} />
      </Button>
    </div>
  );
}

function ResponsiveTable({ headers, rows }: { headers: string[]; rows: Array<Array<ReactNode>> }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td data-label={headers[cellIndex]} key={`${headers[cellIndex]}-${cellIndex}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: TestingStatus | string }) {
  return (
    <span className="status-badge" data-status={status}>
      {formatTestingStatus(status)}
    </span>
  );
}

function TenantBadge({ status }: { status: ClientTenant["status"] | string }) {
  return (
    <span className="tenant-badge" data-status={status}>
      {status}
    </span>
  );
}

function ClientCell({ client }: { client: ClientTenant }) {
  return (
    <div className="entity-cell">
      <strong>{client.name}</strong>
      <span>{client.slug}</span>
    </div>
  );
}

function VendorCell({ vendor }: { vendor: Vendor }) {
  return (
    <div className="entity-cell">
      <strong>{vendor.displayName}</strong>
      <span>{vendor.slug}</span>
    </div>
  );
}

function formatDate(value: string | Date): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function formatTestingStatus(status: TestingStatus | string): string {
  return statusLabels[status as TestingStatus] ?? status;
}

function formatScore(score: number): string {
  return `${Math.round(score * 100)}%`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(value);
}

function formatReadiness(value: string): string {
  if (value === "Scoped") {
    return "Active";
  }

  if (value === "Draft") {
    return "In review";
  }

  if (value === "Needs policy") {
    return "Policy needed";
  }

  return value;
}
