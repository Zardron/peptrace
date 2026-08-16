import {
  AlertCircle,
  Activity,
  BadgeDollarSign,
  Beaker,
  Bell,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Database,
  Download,
  Eye,
  EyeOff,
  Filter,
  FlaskConical,
  Home,
  History,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
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
  Vault,
  Wrench,
  X
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import {
  PeptraceApiClient,
  PeptraceApiError,
  type AdminPanelCompany,
  type AdminPanelContext,
  type AdminPanelData,
  type AdminPanelMetric,
  type AdminSession,
  type ClientUserList,
  type LockerSecretList,
  type PlatformSecretLockerSummary
} from "@peptrace/api-client";
import type { ApiSurface, ClientTenant, Lab, LabTest, Peptide, TestingStatus, Vendor } from "@peptrace/domain";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import esteemedEngineeringLogoUrl from "./assets/esteemedengineering-logo-a3.png";
import { PlatformSecretDialog } from "./PlatformSecretDialog";
import { SystemConfiguration } from "./SystemConfiguration";

type AdminSection =
  | "overview"
  | "clients"
  | "onboarding"
  | "provisioning"
  | "support"
  | "activity"
  | "vendors"
  | "peptides"
  | "testing"
  | "labs"
  | "users"
  | "secrets"
  | "system"
  | "access";

type NavItem = {
  id: AdminSection;
  label: string;
  icon: typeof LayoutDashboard;
};

type GlobalSearchResult = {
  category: string;
  description: string;
  filterValue: string;
  icon: typeof LayoutDashboard;
  id: string;
  isNavigation: boolean;
  keywords: string;
  section: AdminSection;
  title: string;
};

type NotificationItem = {
  detail: string;
  filterValue: string;
  icon: typeof LayoutDashboard;
  id: string;
  meta: string;
  section: AdminSection;
  title: string;
  tone: "info" | "success" | "warning";
};

type LoginPortal = {
  accessValue: string;
  aliases: string[];
  brandName: string;
  brandSubtitle: string;
  code: string;
  defaultEmail: string;
  description: string;
  eyebrow: string;
  features: Array<{
    description: string;
    icon: typeof LayoutDashboard;
    title: string;
  }>;
  formDescription: string;
  headline: string;
  id: "esteemedengineering" | "peptrace" | "shamstay-bnb" | "sham-real-estate-hub";
  initials: string;
  kind: "client" | "superadmin";
  path: string;
  services: Array<{
    icon: typeof LayoutDashboard;
    label: string;
  }>;
  suiteLabel: string;
  suiteSummary: string;
  tenantSlug: string | null;
  theme: {
    accent: string;
    accentStrong: string;
    glow: string;
    mark: string;
    soft: string;
  };
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
    items: [
      { id: "users", label: "Users", icon: UserRoundCog },
      { id: "secrets", label: "Secret Locker", icon: Vault },
      { id: "access", label: "Access", icon: KeyRound }
    ]
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
    description: "Monitor owners, access, open items, regions, and tenant health before onboarding scales."
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
  users: {
    breadcrumb: "Platform / Users",
    title: "Workspace users",
    description: "Manage database-backed user accounts, roles, status, and recent access."
  },
  secrets: {
    breadcrumb: "Platform / Secret Locker",
    title: "Secret Locker",
    description: "Manage tenant-isolated secret metadata, encrypted versions, and access state."
  },
  system: {
    breadcrumb: "Platform / System Configuration",
    title: "System configuration",
    description: "Assign and verify encrypted database connections for each client company."
  },
  access: {
    breadcrumb: "EsteemedEngineering / Access",
    title: "Security and access controls",
    description: "Manage secure access, company permissions, and API permissions."
  },
  onboarding: {
    breadcrumb: "Operations / Onboarding",
    title: "Client onboarding",
    description: "Track workspace setup, owner activation, configuration, and handoff readiness."
  },
  provisioning: {
    breadcrumb: "Operations / Provisioning",
    title: "Client access provisioning",
    description: "Review workspace access, enabled accounts, company ownership, and handoff readiness."
  },
  support: {
    breadcrumb: "Operations / Support",
    title: "Client support queue",
    description: "Prioritize client workspaces by open workload, health, and recent activity."
  },
  activity: {
    breadcrumb: "Operations / Activity",
    title: "Platform activity",
    description: "Review client workspace activity and administrator sign-in history."
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
const LEGACY_SESSION_STORAGE_KEY = "peptrace.admin.session";
const SESSION_STORAGE_KEY_PREFIX = "peptrace.admin.session.portal";
const TEST_ADMIN_PASSWORD = "Admin@123";

const loginPortals: LoginPortal[] = [
  {
    accessValue: "Internal admin workspace",
    aliases: ["/", "/login", "/esteemedengineering"],
    brandName: "EsteemedEngineering",
    brandSubtitle: "Software operations",
    code: "EE-OPS",
    defaultEmail: "admin@esteemedengineering.com",
    description: "Manage apps, delivery records, access, and operational signals from one secure workspace.",
    eyebrow: "Enterprise command center",
    features: [
      { description: "Encrypted sign-in and role-aware controls", icon: ShieldCheck, title: "Protected sessions" },
      { description: "Project workflows, launch readiness, and support queues", icon: Activity, title: "Delivery oversight" },
      { description: "Permission, profile, and workspace management", icon: KeyRound, title: "Account governance" }
    ],
    formDescription: "Sign in to manage your software operations workspace.",
    headline: "Run software operations with clarity.",
    id: "esteemedengineering",
    initials: "EE",
    kind: "superadmin",
    path: "/",
    services: [
      { icon: LayoutDashboard, label: "Web apps" },
      { icon: Sparkles, label: "Mobile apps" },
      { icon: Wrench, label: "Admin tools" },
      { icon: Activity, label: "API services" }
    ],
    suiteLabel: "Service suite",
    suiteSummary: "Production-ready systems",
    tenantSlug: null,
    theme: {
      accent: "#68d391",
      accentStrong: "#0e7467",
      glow: "rgba(20, 184, 166, 0.18)",
      mark: "#0c3156",
      soft: "#edf6f3"
    }
  },
  {
    accessValue: "Peptrace admin workspace",
    aliases: ["/peptrace"],
    brandName: "Peptrace",
    brandSubtitle: "Peptide quality intelligence",
    code: "PT-ADMIN",
    defaultEmail: "owner@peptrace.com",
    description: "Manage peptide records, supplier readiness, lab testing, and quality evidence in one workspace.",
    eyebrow: "Quality operations",
    features: [
      { description: "Track supplier status and catalog coverage", icon: Store, title: "Supplier readiness" },
      { description: "Follow assays, purity, and release decisions", icon: Microscope, title: "Test oversight" },
      { description: "Control keys and connected quality systems", icon: KeyRound, title: "API access" }
    ],
    formDescription: "Sign in to manage the Peptrace quality workspace.",
    headline: "Trace every product from vendor to verified result.",
    id: "peptrace",
    initials: "PT",
    kind: "client",
    path: "/peptrace",
    services: [
      { icon: Store, label: "Vendor catalog" },
      { icon: FlaskConical, label: "Peptide records" },
      { icon: Beaker, label: "Lab testing" },
      { icon: ClipboardCheck, label: "Quality reports" }
    ],
    suiteLabel: "Quality workspace",
    suiteSummary: "Evidence-led operations",
    tenantSlug: "peptrace",
    theme: {
      accent: "#5ee0b1",
      accentStrong: "#087767",
      glow: "rgba(45, 212, 191, 0.2)",
      mark: "#123f51",
      soft: "#eaf8f4"
    }
  },
  {
    accessValue: "Shamstay host workspace",
    aliases: ["/shamstay-bnb", "/shamstaybnb"],
    brandName: "Shamstay BnB",
    brandSubtitle: "Hospitality operations",
    code: "SS-HOST",
    defaultEmail: "owner@shamstaybnb.com",
    description: "Coordinate stays, guests, properties, and service teams across your hospitality business in Syria.",
    eyebrow: "Stay operations",
    features: [
      { description: "See upcoming stays and occupancy at a glance", icon: CalendarCheck, title: "Reservation control" },
      { description: "Keep guest requests and service work moving", icon: LifeBuoy, title: "Guest operations" },
      { description: "Manage host, reservations, and property roles", icon: UsersRound, title: "Team access" }
    ],
    formDescription: "Sign in to manage the Shamstay BnB hospitality workspace.",
    headline: "Keep every stay, guest, and property in sync.",
    id: "shamstay-bnb",
    initials: "SB",
    kind: "client",
    path: "/shamstay-bnb",
    services: [
      { icon: CalendarCheck, label: "Reservations" },
      { icon: Home, label: "Properties" },
      { icon: UsersRound, label: "Guests" },
      { icon: ClipboardCheck, label: "Housekeeping" }
    ],
    suiteLabel: "Hospitality workspace",
    suiteSummary: "Guest-ready operations",
    tenantSlug: "shamstay-bnb",
    theme: {
      accent: "#67e8d1",
      accentStrong: "#0f766e",
      glow: "rgba(34, 211, 238, 0.18)",
      mark: "#12485a",
      soft: "#eaf9f7"
    }
  },
  {
    accessValue: "Sham Real Estate workspace",
    aliases: ["/sham-real-estate-hub", "/shamrealestatehub"],
    brandName: "Sham Real Estate Hub",
    brandSubtitle: "Real estate operations",
    code: "SRH-CRM",
    defaultEmail: "owner@shamrealestatehub.com",
    description: "Manage listings, leads, viewings, and property deals for your real estate business in Syria.",
    eyebrow: "Brokerage command center",
    features: [
      { description: "Keep active properties and availability current", icon: Building2, title: "Portfolio control" },
      { description: "Move leads from inquiry through negotiation", icon: Activity, title: "Pipeline oversight" },
      { description: "Manage owner, manager, and agent permissions", icon: KeyRound, title: "Agent access" }
    ],
    formDescription: "Sign in to manage the Sham Real Estate Hub workspace.",
    headline: "Move listings, leads, and deals forward.",
    id: "sham-real-estate-hub",
    initials: "SR",
    kind: "client",
    path: "/sham-real-estate-hub",
    services: [
      { icon: Building2, label: "Listings" },
      { icon: UsersRound, label: "Leads" },
      { icon: CalendarCheck, label: "Viewings" },
      { icon: BadgeDollarSign, label: "Deals" }
    ],
    suiteLabel: "Brokerage workspace",
    suiteSummary: "Pipeline-led operations",
    tenantSlug: "sham-real-estate-hub",
    theme: {
      accent: "#f2c66d",
      accentStrong: "#8a5a12",
      glow: "rgba(242, 198, 109, 0.2)",
      mark: "#3b3b42",
      soft: "#fff7e5"
    }
  }
];

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

const normalizePortalPath = (pathname: string): string => {
  const normalizedPath = pathname.trim().toLowerCase().replace(/\/+$/, "");
  return normalizedPath || "/";
};

const getLoginPortal = (pathname: string): LoginPortal => {
  const normalizedPath = normalizePortalPath(pathname);
  return loginPortals.find((portal) => portal.aliases.includes(normalizedPath)) ?? loginPortals[0]!;
};

const isSuperAdminSession = (session: AdminSession): boolean =>
  session.user.role === "superadmin" || session.user.role === "platform_admin";

const sessionMatchesPortal = (session: AdminSession, portal: LoginPortal): boolean =>
  portal.kind === "superadmin"
    ? isSuperAdminSession(session)
    : !isSuperAdminSession(session) && session.user.tenantSlug === portal.tenantSlug;

const getPortalSessionStorageKey = (portal: LoginPortal): string =>
  `${SESSION_STORAGE_KEY_PREFIX}.${portal.id}`;

const parseStoredSession = (value: string | null): AdminSession | null => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as AdminSession;
  } catch {
    return null;
  }
};

const readStoredSession = (portal: LoginPortal): AdminSession | null => {
  const storageKey = getPortalSessionStorageKey(portal);

  try {
    for (const storage of [window.localStorage, window.sessionStorage]) {
      const portalSession = parseStoredSession(storage.getItem(storageKey));
      if (portalSession && sessionMatchesPortal(portalSession, portal)) {
        return portalSession;
      }
    }

    for (const storage of [window.localStorage, window.sessionStorage]) {
      const legacySession = parseStoredSession(storage.getItem(LEGACY_SESSION_STORAGE_KEY));
      if (legacySession && sessionMatchesPortal(legacySession, portal)) {
        storage.setItem(storageKey, JSON.stringify(legacySession));
        storage.removeItem(LEGACY_SESSION_STORAGE_KEY);
        return legacySession;
      }
    }
  } catch {
    // Continue to the login page when browser storage is disabled.
  }

  return null;
};

const writeStoredSession = (session: AdminSession, rememberMe: boolean, portal: LoginPortal): void => {
  try {
    const storage = rememberMe ? window.localStorage : window.sessionStorage;
    const fallbackStorage = rememberMe ? window.sessionStorage : window.localStorage;
    const storageKey = getPortalSessionStorageKey(portal);

    fallbackStorage.removeItem(storageKey);
    window.localStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);
    window.sessionStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);
    storage.setItem(storageKey, JSON.stringify(session));
  } catch {
    // The authenticated in-memory session still works when browser storage is disabled.
  }
};

const clearStoredSession = (portal: LoginPortal): void => {
  try {
    const storageKey = getPortalSessionStorageKey(portal);
    window.localStorage.removeItem(storageKey);
    window.sessionStorage.removeItem(storageKey);
    window.localStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);
    window.sessionStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);
  } catch {
    // The in-memory session is cleared even when browser storage is disabled.
  }
};

class PortalAccessError extends Error {}

const getSessionApiClient = (session: AdminSession): PeptraceApiClient =>
  isSuperAdminSession(session) ? superAdminApiClient : clientApiClient;

const setSessionToken = (session: AdminSession | null): void => {
  superAdminApiClient.setToken(session && isSuperAdminSession(session) ? session.accessToken : undefined);
  clientApiClient.setToken(session && !isSuperAdminSession(session) ? session.accessToken : undefined);
};

const loginToPortal = async (
  portal: LoginPortal,
  body: { email: string; password: string }
): Promise<AdminSession> => {
  const api = portal.kind === "superadmin" ? superAdminApiClient : clientApiClient;
  const session = await api.login({ ...body, email: body.email.trim().toLowerCase() });

  if (!sessionMatchesPortal(session, portal)) {
    throw new PortalAccessError(`This sign-in page only accepts ${portal.brandName} accounts.`);
  }

  return session;
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
  if (isSuperAdminSession(session)) {
    return "EE";
  }

  const source = session.user.tenantName ?? session.user.displayName ?? session.user.email;
  const parts = source
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean);

  if (parts.length === 1) {
    const capitalLetters = source.match(/[A-Z]/g)?.join("").slice(0, 2);
    return capitalLetters && capitalLetters.length > 1 ? capitalLetters : source.slice(0, 2).toUpperCase();
  }

  const initials = parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("");

  return initials || "PT";
};

export function App() {
  const portal = useMemo(() => getLoginPortal(window.location.pathname), []);
  const [session, setSession] = useState<AdminSession | null>(() => readStoredSession(portal));
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const [panelContext, setPanelContext] = useState<AdminPanelContext | null>(null);
  const [panelData, setPanelData] = useState<AdminPanelData | null>(null);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [pageFilter, setPageFilter] = useState("");
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationItems = useMemo(() => (panelContext ? buildNotificationItems(panelContext, panelData) : []), [panelContext, panelData]);
  const visibleVendors = useMemo(() => {
    const dataVendors = panelData?.vendors ?? [];
    const normalizedQuery = pageFilter.trim().toLowerCase();
    if (!normalizedQuery) {
      return dataVendors;
    }

    return dataVendors.filter((vendor) =>
      [vendor.displayName, vendor.slug, ...vendor.products.map((product) => product.label)]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [pageFilter, panelData]);

  setSessionToken(session);

  useEffect(() => {
    document.title = session ? `${portal.brandName} Admin` : `${portal.brandName} Admin Login`;
  }, [portal.brandName, session]);

  useEffect(() => {
    setActiveSection("overview");
    setPanelError(null);
    setPanelContext(null);
    setPanelData(null);
    setPageFilter("");
    setQuery("");

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

  useEffect(() => {
    if (!isNotificationMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (notificationMenuRef.current?.contains(event.target as Node)) {
        return;
      }

      setIsNotificationMenuOpen(false);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [isNotificationMenuOpen]);

  if (!session) {
    return (
      <LoginScreen
        portal={portal}
        onLogin={(nextSession, rememberMe) => {
          writeStoredSession(nextSession, rememberMe, portal);
          setSessionToken(nextSession);
          setSession(nextSession);
        }}
      />
    );
  }

  const signOut = () => {
    clearStoredSession(portal);
    setSessionToken(null);
    setIsAccountMenuOpen(false);
    setIsNotificationMenuOpen(false);
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
  const workspaceInitials = portal.initials || (isPeptraceClient ? "PT" : getWorkspaceInitials(workspaceName));
  const workspaceSubline = portal.brandSubtitle;
  const navigation = getPanelNavigationGroups(panelContext);
  const isEsteemedEngineeringWorkspace = portal.kind === "superadmin";
  const notificationCount = getNotificationCount(notificationItems);
  const workspaceThemeStyle = {
    "--sidebar-accent": portal.theme.accent,
    "--sidebar-accent-strong": portal.theme.accentStrong,
    "--sidebar-soft": portal.theme.soft
  } as CSSProperties;

  const selectNotification = (item: NotificationItem) => {
    setActiveSection(item.section);
    setPageFilter(item.filterValue);
    setQuery(item.filterValue);
    setIsNotificationMenuOpen(false);
  };

  return (
    <div className="app-shell" data-portal={portal.id} style={workspaceThemeStyle}>
      <aside className="sidebar" aria-label={`${workspaceName} navigation`}>
        <div className="tenant-switcher">
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
        </div>

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
                      onClick={() => {
                        setActiveSection(item.id);
                        setPageFilter("");
                        setQuery("");
                      }}
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
            <strong>{portal.kind === "superadmin" ? "Protected platform access" : "Protected client access"}</strong>
            <span>{portal.code} / {roleLabel}</span>
          </div>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div className="topbar-context">
            <span>{activeMeta.breadcrumb}</span>
            <strong>{workspaceName}</strong>
          </div>

          <GlobalSearch
            context={panelContext}
            data={panelData}
            navigation={navigation}
            onNavigate={(section, filterValue) => {
              setActiveSection(section);
              setPageFilter(filterValue);
              setQuery(filterValue);
            }}
            onQueryChange={(value) => {
              setPageFilter("");
              setQuery(value);
            }}
            query={query}
            workspaceName={workspaceName}
          />

          <div className="topbar-actions">
            <div
              className="notification-menu"
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setIsNotificationMenuOpen(false);
                }
              }}
              ref={notificationMenuRef}
            >
              <Button
                aria-expanded={isNotificationMenuOpen}
                aria-haspopup="menu"
                aria-label={notificationCount > 0 ? `Notifications, ${notificationCount} open alerts` : "Notifications"}
                className="icon-button notification-button"
                data-active={isNotificationMenuOpen}
                onClick={() => {
                  setIsAccountMenuOpen(false);
                  setIsNotificationMenuOpen((isOpen) => !isOpen);
                }}
                title="Notifications"
                type="button"
                variant="outline"
                size="icon"
              >
                <Bell size={18} strokeWidth={2} />
                {notificationCount > 0 && (
                  <span className="notification-count" aria-hidden="true">
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </span>
                )}
              </Button>

              {isNotificationMenuOpen && (
                <div className="notification-dropdown" role="menu" aria-label="Notifications">
                  <div className="notification-dropdown-header">
                    <div>
                      <strong>Notifications</strong>
                      <span>{workspaceName}</span>
                    </div>
                    <span className="notification-summary">{notificationCount > 0 ? `${notificationCount} open` : "Clear"}</span>
                  </div>

                  <div className="notification-list">
                    {notificationItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          className="notification-item"
                          data-tone={item.tone}
                          key={item.id}
                          onClick={() => selectNotification(item)}
                          role="menuitem"
                          type="button"
                        >
                          <span className="notification-item-icon" aria-hidden="true">
                            <Icon size={17} strokeWidth={2} />
                          </span>
                          <span className="notification-copy">
                            <strong>{item.title}</strong>
                            <span>{item.detail}</span>
                          </span>
                          <span className="notification-meta">{item.meta}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
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
                onClick={() => {
                  setIsNotificationMenuOpen(false);
                  setIsAccountMenuOpen((isOpen) => !isOpen);
                }}
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
                    <div className="account-dropdown-identity">
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
          <SuperAdminPanel context={panelContext} query={pageFilter} section={activeSection} />
        ) : (
          <ClientAdminPanel
            context={panelContext}
            data={panelData!}
            query={pageFilter}
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

function GlobalSearch({
  context,
  data,
  navigation,
  onNavigate,
  onQueryChange,
  query,
  workspaceName
}: {
  context: AdminPanelContext;
  data: AdminPanelData | null;
  navigation: Array<{ label: string; items: NavItem[] }>;
  onNavigate: (section: AdminSection, filterValue: string) => void;
  onQueryChange: (value: string) => void;
  query: string;
  workspaceName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeResultIndex, setActiveResultIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const searchIndex = useMemo(
    () => buildGlobalSearchIndex(context, data, navigation),
    [context, data, navigation]
  );
  const results = useMemo(() => filterGlobalSearchResults(searchIndex, query), [query, searchIndex]);
  const activeResult = results[activeResultIndex];

  useEffect(() => {
    setActiveResultIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  const selectResult = (result: GlobalSearchResult) => {
    onNavigate(result.section, result.isNavigation ? "" : result.filterValue);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div className="global-search" ref={searchRef}>
      <div className="search-control" data-open={isOpen}>
        <Search aria-hidden="true" size={18} strokeWidth={2} />
        <input
          aria-activedescendant={isOpen && activeResult ? getGlobalSearchResultDomId(activeResult.id) : undefined}
          aria-autocomplete="list"
          aria-controls={isOpen ? "global-search-results" : undefined}
          aria-expanded={isOpen}
          aria-label={`Search ${workspaceName}`}
          onChange={(event) => {
            onQueryChange(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setIsOpen(true);
              setActiveResultIndex((index) => (results.length > 0 ? (index + 1) % results.length : 0));
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              setIsOpen(true);
              setActiveResultIndex((index) => (results.length > 0 ? (index - 1 + results.length) % results.length : 0));
            }

            if (event.key === "Enter" && activeResult) {
              event.preventDefault();
              selectResult(activeResult);
            }

            if (event.key === "Escape") {
              setIsOpen(false);
              inputRef.current?.blur();
            }
          }}
          placeholder={`Search ${workspaceName}`}
          ref={inputRef}
          role="combobox"
          type="search"
          value={query}
        />
        {query && (
          <button
            aria-label="Clear search"
            className="search-clear"
            onClick={() => {
              onQueryChange("");
              setIsOpen(true);
              inputRef.current?.focus();
            }}
            title="Clear search"
            type="button"
          >
            <X size={15} strokeWidth={2} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="search-popover" id="global-search-results">
          <div className="search-popover-header">
            <strong>{query.trim() ? "Results" : "Workspace"}</strong>
            <span>{results.length}</span>
          </div>

          <div className="search-results-list" role={results.length > 0 ? "listbox" : undefined}>
            {results.map((result, index) => {
              const Icon = result.icon;
              return (
                <button
                  aria-selected={index === activeResultIndex}
                  className="search-result"
                  data-active={index === activeResultIndex}
                  id={getGlobalSearchResultDomId(result.id)}
                  key={result.id}
                  onClick={() => selectResult(result)}
                  onPointerMove={() => setActiveResultIndex(index)}
                  role="option"
                  type="button"
                >
                  <span className="search-result-icon" aria-hidden="true">
                    <Icon size={17} strokeWidth={2} />
                  </span>
                  <span className="search-result-copy">
                    <strong>{result.title}</strong>
                    <small>{result.description}</small>
                  </span>
                  <span className="search-result-category">{result.category}</span>
                </button>
              );
            })}

            {results.length === 0 && (
              <div className="search-empty" role="status">
                <Search size={18} strokeWidth={2} />
                <span>No matches in {workspaceName}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function buildNotificationItems(context: AdminPanelContext, data: AdminPanelData | null): NotificationItem[] {
  const items: NotificationItem[] = [];
  const addItem = (item: NotificationItem) => items.push(item);

  if (context.mode === "superadmin") {
    [...context.platform.clients]
      .filter((company) => company.openItems > 0)
      .sort((left, right) => right.openItems - left.openItems || left.name.localeCompare(right.name))
      .slice(0, 4)
      .forEach((company) => {
        addItem({
          detail: `${company.panel.productName} access is ${company.status.toLowerCase()}.`,
          filterValue: company.name,
          icon: company.status === "Healthy" ? Activity : AlertCircle,
          id: `client-open-items-${company.id}`,
          meta: `${company.dataRegion} workspace`,
          section: "support",
          title: `${company.name} has ${company.openItems} open ${company.openItems === 1 ? "item" : "items"}`,
          tone: company.status === "Healthy" ? "info" : "warning"
        });
      });

    const inactiveAccountCount = [
      ...context.platform.internalAccounts,
      ...context.platform.clients.flatMap((company) => company.adminUsers)
    ].filter((account) => !account.lastLoginAt).length;

    if (inactiveAccountCount > 0) {
      addItem({
        detail: "Follow up before the next workspace handoff.",
        filterValue: "",
        icon: UserRoundCog,
        id: "admin-accounts-never-active",
        meta: "Account directory",
        section: "testing",
        title: `${inactiveAccountCount} admin ${inactiveAccountCount === 1 ? "account has" : "accounts have"} never signed in`,
        tone: "info"
      });
    }
  } else if (data) {
    [...data.accountWorkItems]
      .sort((left, right) => priorityOrder[left.priority] - priorityOrder[right.priority] || new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime())
      .slice(0, 2)
      .forEach((item) => {
        addItem({
          detail: `${item.priority} priority due ${formatDate(item.dueAt)}.`,
          filterValue: item.account,
          icon: UserRoundCog,
          id: `account-work-${item.id}`,
          meta: item.kind,
          section: "overview",
          title: item.account,
          tone: item.priority === "High" ? "warning" : "info"
        });
      });

    const peptideNames = new Map(data.peptides.map((peptide) => [peptide.id, peptide.label]));
    const vendorNames = new Map(data.vendors.map((vendor) => [vendor.id, vendor.displayName]));
    const labNames = new Map(data.labs.map((lab) => [lab.id, lab.displayName]));

    data.tests
      .filter((test) => test.testingStatus !== "COMPLETE")
      .sort((left, right) => getTestingStatusPriority(left.testingStatus) - getTestingStatusPriority(right.testingStatus))
      .slice(0, 3)
      .forEach((test) => {
        const peptideName = peptideNames.get(test.peptideId) ?? "Peptide test";
        addItem({
          detail: `${test.assay} with ${vendorNames.get(test.vendorId) ?? "vendor"} at ${labNames.get(test.labId) ?? "lab"}.`,
          filterValue: peptideName,
          icon: test.testingStatus === "FAILED" || test.testingStatus === "RETEST_REQUESTED" ? AlertCircle : Microscope,
          id: `test-status-${test.id}`,
          meta: formatTestingStatus(test.testingStatus),
          section: "testing",
          title: peptideName,
          tone: test.testingStatus === "FAILED" || test.testingStatus === "RETEST_REQUESTED" ? "warning" : "info"
        });
      });
  } else {
    [...context.panel.workItems]
      .sort((left, right) => priorityOrder[left.priority] - priorityOrder[right.priority] || left.label.localeCompare(right.label))
      .slice(0, 4)
      .forEach((item, index) => {
        addItem({
          detail: item.detail,
          filterValue: item.label,
          icon: item.priority === "High" ? AlertCircle : Activity,
          id: `panel-work-${index}-${item.label}`,
          meta: `${item.priority} priority`,
          section: getClientWorkItemSection(context, item.label, item.detail),
          title: item.label,
          tone: item.priority === "High" ? "warning" : "info"
        });
      });
  }

  if (items.length > 0) {
    return items.slice(0, 5);
  }

  return [
    {
      detail: "No workspace items need attention right now.",
      filterValue: "",
      icon: CheckCircle2,
      id: "notifications-clear",
      meta: "All caught up",
      section: "overview",
      title: "No open alerts",
      tone: "success"
    }
  ];
}

function getNotificationCount(items: NotificationItem[]): number {
  return items.filter((item) => item.tone !== "success").length;
}

function getTestingStatusPriority(status: TestingStatus): number {
  if (status === "FAILED" || status === "RETEST_REQUESTED") {
    return 0;
  }

  if (status === "IN_REVIEW") {
    return 1;
  }

  if (status === "PENDING") {
    return 2;
  }

  return 3;
}

function buildGlobalSearchIndex(
  context: AdminPanelContext,
  data: AdminPanelData | null,
  navigation: Array<{ label: string; items: NavItem[] }>
): GlobalSearchResult[] {
  const results: GlobalSearchResult[] = [];
  const addResult = (
    result: Omit<GlobalSearchResult, "filterValue" | "keywords"> & {
      filterValue?: string;
      keywords?: string;
    }
  ) => {
    results.push({
      ...result,
      filterValue: result.filterValue ?? result.title,
      keywords: [result.title, result.description, result.category, result.keywords ?? ""].join(" ").toLowerCase()
    });
  };

  navigation.forEach((group) => {
    group.items.forEach((item) => {
      const meta = getPanelSectionMeta(context, item.id);
      addResult({
        category: group.label,
        description: meta.description,
        icon: item.icon,
        id: `nav-${item.id}`,
        isNavigation: true,
        keywords: `${meta.title} ${meta.breadcrumb}`,
        section: item.id,
        title: item.label
      });
    });
  });

  if (context.mode === "superadmin") {
    context.platform.clients.forEach((company) => {
      addResult({
        category: "Clients",
        description: `${company.panel.productName} | ${company.accessStatus} access | ${company.dataRegion}`,
        icon: Building2,
        id: `company-${company.id}`,
        isNavigation: false,
        keywords: `${company.slug} ${company.status} ${company.owner} ${company.panel.industry}`,
        section: "clients",
        title: company.name
      });

      company.adminUsers.forEach((account) => {
        addResult({
          category: company.name,
          description: `${account.email} | ${formatRole(account.role)}`,
          icon: UserRoundCog,
          id: `account-${account.id}`,
          isNavigation: false,
          keywords: `${company.name} ${company.slug}`,
          section: "users",
          title: account.displayName
        });
      });
    });

    context.platform.internalAccounts.forEach((account) => {
      addResult({
        category: "EsteemedEngineering",
        description: `${account.email} | ${formatRole(account.role)}`,
        icon: ShieldCheck,
        id: `internal-account-${account.id}`,
        isNavigation: false,
        section: "users",
        title: account.displayName
      });
    });
  } else {
    context.company.adminUsers.forEach((account) => {
      addResult({
        category: "Team",
        description: `${account.email} | ${formatRole(account.role)}`,
        icon: UserRoundCog,
        id: `account-${account.id}`,
        isNavigation: false,
        section: "users",
        title: account.displayName
      });
    });

    context.panel.metrics.forEach((metric, index) => {
      addResult({
        category: "Overview",
        description: `${metric.value} | ${metric.change}`,
        icon: getMetricIcon(metric),
        id: `metric-${index}-${metric.label}`,
        isNavigation: false,
        section: "overview",
        title: metric.label
      });
    });

    context.panel.primaryRecords.forEach((record, index) => {
      addResult({
        category: getPanelSectionMeta(context, getClientRecordSection(context, record)).title,
        description: `${record.detail} | ${record.value} | ${record.status}`,
        icon: Home,
        id: `record-${index}-${record.label}`,
        isNavigation: false,
        section: getClientRecordSection(context, record),
        title: record.label
      });
    });

    context.panel.workItems.forEach((item, index) => {
      const section = getClientWorkItemSection(context, item.label, item.detail);
      addResult({
        category: getPanelSectionMeta(context, section).title,
        description: `${item.detail} | ${item.priority} priority`,
        icon: Activity,
        id: `work-${index}-${item.label}`,
        isNavigation: false,
        section,
        title: item.label
      });
    });
  }

  if (context.mode === "client" && data) {
    data.clients.forEach((client) => {
      addResult({
        category: "Clients",
        description: `${client.accessStatus} access | ${client.status} | ${client.dataRegion}`,
        icon: Building2,
        id: `client-${client.id}`,
        isNavigation: false,
        keywords: `${client.slug} ${client.owner}`,
        section: "clients",
        title: client.name
      });
    });

    data.vendors.forEach((vendor) => {
      addResult({
        category: "Vendors",
        description: `${vendor.products.length} products | ${Math.round(vendor.overallRating * 100)}% rating`,
        icon: Store,
        id: `vendor-${vendor.id}`,
        isNavigation: false,
        keywords: `${vendor.slug} ${vendor.products.map((product) => product.label).join(" ")}`,
        section: "vendors",
        title: vendor.displayName
      });
    });

    data.peptides.forEach((peptide) => {
      addResult({
        category: "Peptides",
        description: `${peptide.tests.length} linked tests`,
        icon: FlaskConical,
        id: `peptide-${peptide.id}`,
        isNavigation: false,
        keywords: peptide.slug,
        section: "peptides",
        title: peptide.label
      });
    });

    data.labs.forEach((lab) => {
      addResult({
        category: "Labs",
        description: `${lab.tests.length} tests | Partner since ${formatDate(lab.partnerSince)}`,
        icon: Beaker,
        id: `lab-${lab.id}`,
        isNavigation: false,
        keywords: lab.slug,
        section: "labs",
        title: lab.displayName
      });
    });

    data.tests.forEach((test) => {
      const peptide = data.peptides.find((item) => item.id === test.peptideId);
      const vendor = data.vendors.find((item) => item.id === test.vendorId);
      const lab = data.labs.find((item) => item.id === test.labId);
      addResult({
        category: "Testing",
        description: `${vendor?.displayName ?? "Vendor"} | ${lab?.displayName ?? "Lab"} | ${statusLabels[test.testingStatus]}`,
        filterValue: peptide?.label ?? test.assay,
        icon: Microscope,
        id: `test-${test.id}`,
        isNavigation: false,
        keywords: `${test.assay} ${test.testingStatus} ${test.purityPercent ?? ""}`,
        section: "testing",
        title: `${peptide?.label ?? "Test"} ${test.assay}`
      });
    });

    data.apiSurfaces.forEach((surface, index) => {
      addResult({
        category: "Access",
        description: `${surface.owner} | ${surface.readiness}`,
        icon: KeyRound,
        id: `api-${index}-${surface.group}`,
        isNavigation: false,
        keywords: surface.routes.join(" "),
        section: "access",
        title: surface.group
      });
    });
  }

  return results;
}

function filterGlobalSearchResults(results: GlobalSearchResult[], query: string): GlobalSearchResult[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) {
    return results.filter((result) => result.isNavigation).slice(0, 8);
  }

  return results
    .filter((result) => terms.every((term) => result.keywords.includes(term)))
    .sort((left, right) => {
      const leftStartsWith = left.title.toLowerCase().startsWith(terms[0] ?? "") ? 0 : 1;
      const rightStartsWith = right.title.toLowerCase().startsWith(terms[0] ?? "") ? 0 : 1;
      return leftStartsWith - rightStartsWith || left.title.localeCompare(right.title);
    })
    .slice(0, 10);
}

function getGlobalSearchResultDomId(value: string): string {
  return `global-search-result-${value.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function getClientRecordSection(
  context: Extract<AdminPanelContext, { mode: "client" }>,
  record: Extract<AdminPanelContext, { mode: "client" }>["panel"]["primaryRecords"][number]
): AdminSection {
  const value = [record.label, record.detail, record.status, record.value].join(" ").toLowerCase();

  if (isShamstayClientContext(context)) {
    if (/maintenance|repair|fix|blocked|vendor visit/.test(value)) {
      return "labs";
    }
    if (/reservation|booking|guest|check-in|check-out|stay/.test(value)) {
      return "testing";
    }
    return "vendors";
  }

  if (isShamRealEstateHubClientContext(context)) {
    if (/offer|pipeline|negotiation|valuation|closing|deal/.test(value)) {
      return "labs";
    }
    if (/lead|buyer|tenant|inquiry|follow-up/.test(value)) {
      return "testing";
    }
    return "vendors";
  }

  return "overview";
}

function getClientWorkItemSection(
  context: Extract<AdminPanelContext, { mode: "client" }>,
  label: string,
  detail: string
): AdminSection {
  const value = `${label} ${detail}`.toLowerCase();

  if (isShamstayClientContext(context)) {
    if (/maintenance|repair|fix/.test(value)) {
      return "labs";
    }
    if (/turnover|clean|linen|inspection/.test(value)) {
      return "peptides";
    }
    return "testing";
  }

  if (isShamRealEstateHubClientContext(context)) {
    if (/viewing|tour|appointment/.test(value)) {
      return "peptides";
    }
    if (/listing|seller|portal/.test(value)) {
      return "vendors";
    }
    if (/lead|buyer|tenant|inquiry/.test(value)) {
      return "testing";
    }
    return "labs";
  }

  if (/api|access|security|permission/.test(value)) {
    return "access";
  }
  if (/vendor/.test(value)) {
    return "vendors";
  }
  if (/lab|test|review/.test(value)) {
    return "testing";
  }
  return "overview";
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

function getPlatformSecretLocker(
  context: Extract<AdminPanelContext, { mode: "superadmin" }>
): PlatformSecretLockerSummary {
  return (
    context.platform.secretLocker ?? {
      companies: context.platform.clients.map((company) => ({
        enabledSecrets: 0,
        lastUpdatedAt: null,
        secretCount: 0,
        secrets: [],
        tenantId: company.id,
        tenantName: company.name,
        tenantSlug: company.slug,
        versionCount: 0
      })),
      enabledSecrets: 0,
      totalSecrets: 0,
      totalVersions: 0
    }
  );
}

function getPanelNavigationGroups(context: AdminPanelContext): Array<{ label: string; items: NavItem[] }> {
  if (context.mode === "superadmin") {
    return [
      {
        label: "Client management",
        items: [
          { id: "overview", label: "Overview", icon: LayoutDashboard },
          { id: "clients", label: "Companies", icon: Building2 },
          { id: "users", label: "User Management", icon: UserRoundCog },
          { id: "onboarding", label: "Onboarding", icon: ClipboardCheck }
        ]
      },
      {
        label: "Service operations",
        items: [
          { id: "provisioning", label: "Provisioning", icon: ShieldCheck },
          { id: "support", label: "Support", icon: LifeBuoy },
          { id: "activity", label: "Activity", icon: History }
        ]
      },
      {
        label: "Platform governance",
        items: [
          { id: "secrets", label: "Secret Locker", icon: Vault },
          { id: "system", label: "System Configuration", icon: Database },
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
          { id: "users", label: "Users", icon: UserRoundCog },
          { id: "secrets", label: "Secret Locker", icon: Vault },
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
          { id: "users", label: "Users", icon: UserRoundCog },
          { id: "secrets", label: "Secret Locker", icon: Vault },
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
        { id: "testing", label: "Operations", icon: Activity },
        { id: "users", label: "Users", icon: UserRoundCog },
        { id: "secrets", label: "Secret Locker", icon: Vault },
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
        description: "Every company, access state, region, health state, and account count."
      },
      testing: {
        breadcrumb: "EsteemedEngineering / Accounts",
        title: "Account directory",
        description: "All admin accounts grouped under their companies."
      },
      users: {
        breadcrumb: "EsteemedEngineering / User Management",
        title: "Platform user management",
        description: "All internal and client users grouped by their database tenant."
      },
      secrets: {
        breadcrumb: "EsteemedEngineering / Secret Locker",
        title: "Secret Locker governance",
        description: "Cross-company secret metadata and version health without access to encrypted values."
      },
      system: {
        breadcrumb: "EsteemedEngineering / System Configuration",
        title: "Client database connections",
        description: "Configure shared or dedicated database assignments with encrypted credentials and live health tests."
      },
      onboarding: {
        breadcrumb: "EsteemedEngineering / Onboarding",
        title: "Client onboarding",
        description: "Move each client from workspace setup through owner activation and operational handoff."
      },
      provisioning: {
        breadcrumb: "EsteemedEngineering / Provisioning",
        title: "Access provisioning",
        description: "Review granted workspace access, enabled accounts, owners, and handoff readiness."
      },
      support: {
        breadcrumb: "EsteemedEngineering / Support",
        title: "Client support queue",
        description: "Prioritize client workload using open items, workspace health, and recent activity."
      },
      activity: {
        breadcrumb: "EsteemedEngineering / Activity",
        title: "Client activity",
        description: "Monitor workspace updates and administrator sign-ins across all client companies."
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
      users: {
        breadcrumb: "Shamstay BnB / Users",
        title: "Hospitality users",
        description: "Database-backed host, reservations, property, and service-team accounts."
      },
      secrets: {
        breadcrumb: "Shamstay BnB / Secret Locker",
        title: "Hospitality Secret Locker",
        description: "Encrypted credentials and integration secrets isolated to the Shamstay BnB workspace."
      },
      access: {
        breadcrumb: "Shamstay BnB / Settings",
        title: "Workspace settings",
        description: "Data region, access roles, and white-label workspace controls."
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
      users: {
        breadcrumb: "Sham Real Estate Hub / Users",
        title: "Brokerage users",
        description: "Database-backed owner, manager, agent, and coordinator accounts."
      },
      secrets: {
        breadcrumb: "Sham Real Estate Hub / Secret Locker",
        title: "Brokerage Secret Locker",
        description: "Encrypted portal credentials and integration secrets isolated to this brokerage."
      },
      access: {
        breadcrumb: "Sham Real Estate Hub / Settings",
        title: "Workspace settings",
        description: "Data region, role access, and white-label brokerage controls."
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
    users: {
      breadcrumb: `${context.panel.brandName} / Users`,
      title: "Workspace users",
      description: "Database-backed users, roles, status, and recent access for this company."
    },
    secrets: {
      breadcrumb: `${context.panel.brandName} / Secret Locker`,
      title: "Secret Locker",
      description: "Tenant-isolated secret metadata, encrypted versions, and access state."
    },
    access: {
      breadcrumb: `${context.panel.brandName} / Settings`,
      title: "Workspace settings",
      description: "Data region and role access settings."
    }
  };

  return clientMeta[section] ?? clientMeta.overview!;
}

function getPrimaryActionLabel(context: AdminPanelContext, section: AdminSection): string {
  if (context.mode === "superadmin") {
    const platformActions: Partial<Record<AdminSection, string>> = {
      clients: "Add client",
      testing: "Invite admin",
      users: "Invite admin",
      onboarding: "Review onboarding",
      provisioning: "Grant access",
      support: "Open request",
      activity: "Export activity",
      secrets: "Review locker",
      access: "Review access"
    };

    return platformActions[section] ?? "Create report";
  }

  if (section === "users") {
    return "Invite user";
  }

  if (section === "secrets") {
    return "Create secret";
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

  if (label.includes("account") || label.includes("agent") || label.includes("client") || label.includes("user")) {
    return UsersRound;
  }

  if (label.includes("pipeline") || label.includes("value")) {
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

  if (section === "testing" || section === "users") {
    return <SuperAdminAccounts context={context} query={query} />;
  }

  if (section === "secrets") {
    return <SuperAdminSecretLocker context={context} query={query} />;
  }

  if (section === "system") {
    return <SystemConfiguration api={superAdminApiClient} />;
  }

  if (section === "onboarding") {
    return <SuperAdminOnboarding context={context} query={query} />;
  }

  if (section === "provisioning") {
    return <SuperAdminProvisioning context={context} query={query} />;
  }

  if (section === "support") {
    return <SuperAdminSupport context={context} query={query} />;
  }

  if (section === "activity") {
    return <SuperAdminActivity context={context} query={query} />;
  }

  if (section === "access") {
    return <SuperAdminAccess context={context} />;
  }

  return <SuperAdminOverview context={context} query={query} />;
}

function SuperAdminOverview({ context, query }: { context: Extract<AdminPanelContext, { mode: "superadmin" }>; query: string }) {
  const managedUserCount =
    context.platform.internalAccounts.length +
    context.platform.clients.reduce((total, company) => total + company.adminUsers.length, 0);
  const secretLocker = getPlatformSecretLocker(context);

  return (
    <section className="page-flow" aria-label="Superadmin overview">
      <MetricGrid metrics={context.platform.metrics} />
      <div className="scope-strip" aria-label="Platform service inventory">
        <ScopeItem label="User service" value={`${managedUserCount} managed users`} />
        <ScopeItem label="Tenant vaults" value={`${secretLocker.companies.length} isolated`} />
        <ScopeItem label="Stored secrets" value={secretLocker.totalSecrets.toString()} />
        <ScopeItem label="Encrypted versions" value={secretLocker.totalVersions.toString()} />
      </div>
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
        headers={["Company", "Panel", "Access", "Accounts", "Region", "Open items", "Health"]}
        rows={clients.map((client) => [
          <CompanyCell company={client} key={client.id} />,
          client.panel.productName,
          client.accessStatus,
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
      description: `${company.panel.productName} | ${company.dataRegion} access`,
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

function SuperAdminSecretLocker({
  context,
  query
}: {
  context: Extract<AdminPanelContext, { mode: "superadmin" }>;
  query: string;
}) {
  const normalizedQuery = query.trim().toLowerCase();
  const [summary, setSummary] = useState(() => getPlatformSecretLocker(context));
  const [selectedVault, setSelectedVault] = useState<PlatformSecretLockerSummary["companies"][number] | null>(null);

  useEffect(() => {
    setSummary(getPlatformSecretLocker(context));
  }, [context]);

  const companies = summary.companies
    .map((company) => {
      const companyMatches = [company.tenantName, company.tenantSlug].join(" ").toLowerCase().includes(normalizedQuery);
      const secrets =
        !normalizedQuery || companyMatches
          ? company.secrets
          : company.secrets.filter((secret) =>
              [secret.name, secret.description, secret.resourceName, secret.latestState]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(normalizedQuery)
            );
      return { ...company, secrets };
    })
    .filter((company) => !normalizedQuery || company.secrets.length > 0);
  const protectedCompanies = summary.companies.filter((company) => company.secretCount > 0).length;

  return (
    <section className="page-flow" aria-label="Superadmin Secret Locker governance">
      <div className="metric-grid">
        <Metric icon={Building2} label="Tenant vaults" tone="info" value={summary.companies.length.toString()} change={`${protectedCompanies} storing secrets`} />
        <Metric icon={Vault} label="Secret containers" tone="neutral" value={summary.totalSecrets.toString()} change="Metadata visibility only" />
        <Metric icon={History} label="Encrypted versions" tone="info" value={summary.totalVersions.toString()} change="Payloads remain client-scoped" />
        <Metric icon={ShieldCheck} label="Enabled secrets" tone="success" value={summary.enabledSecrets.toString()} change="Latest version enabled" />
      </div>

      {companies.map((company) => (
        <section className="panel account-company-panel" aria-labelledby={`secret-company-${company.tenantId}`} key={company.tenantId}>
          <div className="account-company-header">
            <div className="account-company-identity">
              <span className="company-monogram" aria-hidden="true">
                {getWorkspaceInitials(company.tenantName)}
              </span>
              <div>
                <h2 id={`secret-company-${company.tenantId}`}>{company.tenantName}</h2>
                <p>{company.tenantSlug}</p>
              </div>
            </div>
            <div className="account-company-summary">
              <Button className="tool-button" onClick={() => setSelectedVault(company)} type="button" variant="outline">
                <Plus size={16} strokeWidth={2} />
                <span>Add secret</span>
              </Button>
              <span className="soft-pill">Isolated</span>
              <strong>{company.secretCount} {company.secretCount === 1 ? "secret" : "secrets"}</strong>
            </div>
          </div>

          {company.secrets.length > 0 ? (
            <ResponsiveTable
              headers={["Secret", "Resource", "Versions", "Latest state", "Updated"]}
              rows={company.secrets.map((secret) => {
                const state = secret.latestState ?? "No versions";
                const status = state === "ENABLED" ? "COMPLETE" : state === "DISABLED" ? "PENDING" : "FAILED";
                return [
                  <div className="entity-cell" key={secret.id}>
                    <strong>{secret.name}</strong>
                    <span>{secret.description ?? "No description"}</span>
                  </div>,
                  secret.resourceName,
                  secret.versionCount,
                  <span className="status-badge" data-status={status} key={`${secret.id}-state`}>
                    {state}
                  </span>,
                  formatDate(secret.updatedAt)
                ];
              })}
            />
          ) : (
            <div className="service-empty">No secrets have been created for this client.</div>
          )}
        </section>
      ))}

      {companies.length === 0 && (
        <section className="panel account-directory-empty" aria-live="polite">
          <Vault size={20} strokeWidth={2} />
          <strong>No Secret Locker records match this search.</strong>
        </section>
      )}

      {selectedVault && (
        <PlatformSecretDialog
          api={superAdminApiClient}
          client={selectedVault}
          onClose={() => setSelectedVault(null)}
          onCreated={(result) => {
            setSummary((current) => ({
              ...current,
              enabledSecrets: current.enabledSecrets + 1,
              totalSecrets: current.totalSecrets + 1,
              totalVersions: current.totalVersions + 1,
              companies: current.companies.map((company) =>
                company.tenantId === result.tenantId
                  ? {
                      ...company,
                      enabledSecrets: company.enabledSecrets + 1,
                      lastUpdatedAt: result.secret.updatedAt,
                      secretCount: company.secretCount + 1,
                      secrets: [result.secret, ...company.secrets],
                      versionCount: company.versionCount + 1
                    }
                  : company
              )
            }));
            setSelectedVault(null);
          }}
        />
      )}
    </section>
  );
}

function SuperAdminOnboarding({
  context,
  query
}: {
  context: Extract<AdminPanelContext, { mode: "superadmin" }>;
  query: string;
}) {
  const clients = filterCompanies(context.platform.clients, query);
  const onboardingStates = context.platform.clients.map(getClientOnboardingState);
  const readyCount = onboardingStates.filter((state) => state.progress === 100).length;
  const activationPendingCount = onboardingStates.filter((state) => !state.hasActiveAccount).length;
  const totalOpenItems = context.platform.clients.reduce((total, company) => total + company.openItems, 0);

  return (
    <section className="page-flow" aria-label="Client onboarding">
      <div className="metric-grid three-up">
        <Metric
          change={`${context.platform.clients.length} client workspaces`}
          icon={CheckCircle2}
          label="Ready for handoff"
          tone="success"
          value={readyCount.toString()}
        />
        <Metric
          change="No administrator login recorded"
          icon={UserRoundCog}
          label="Activation pending"
          tone={activationPendingCount > 0 ? "warning" : "success"}
          value={activationPendingCount.toString()}
        />
        <Metric
          change="Across onboarding workspaces"
          icon={ClipboardCheck}
          label="Open setup items"
          tone={totalOpenItems > 0 ? "warning" : "success"}
          value={totalOpenItems.toString()}
        />
      </div>

      <section className="panel" aria-label="Client onboarding table">
        <PanelTitle
          actions={<TableActions />}
          icon={ClipboardCheck}
          id="superadmin-onboarding-title"
          subtitle="Workspace, account activation, operational health, and handoff readiness."
          title="Onboarding tracker"
        />
        <ResponsiveTable
          headers={["Company", "Progress", "Account activation", "Open items", "Next action"]}
          rows={clients.map((company) => {
            const state = getClientOnboardingState(company);
            return [
              <CompanyCell company={company} key={company.id} />,
              <div className="onboarding-progress-cell" key={`${company.id}-progress`}>
                <div
                  aria-label={`${state.progress}% complete`}
                  aria-valuemax={100}
                  aria-valuemin={0}
                  aria-valuenow={state.progress}
                  className="onboarding-progress"
                  role="progressbar"
                >
                  <span style={{ width: `${state.progress}%` }} />
                </div>
                <strong>{state.progress}%</strong>
              </div>,
              <span className="soft-pill" key={`${company.id}-activation`}>
                {state.activeAccountCount}/{company.adminUsers.length} active
              </span>,
              company.openItems,
              <div className="entity-cell" key={`${company.id}-next-action`}>
                <strong>{state.nextAction}</strong>
                <span>{company.status} workspace</span>
              </div>
            ];
          })}
        />
      </section>
    </section>
  );
}

function SuperAdminProvisioning({
  context,
  query
}: {
  context: Extract<AdminPanelContext, { mode: "superadmin" }>;
  query: string;
}) {
  const clients = filterCompanies(context.platform.clients, query);
  const enabledAccountCount = context.platform.clients.reduce((total, company) => total + company.adminUsers.length, 0);
  const readyCount = context.platform.clients.map(getClientOnboardingState).filter((state) => state.progress === 100).length;

  return (
    <section className="page-flow" aria-label="Client access provisioning">
      <div className="metric-grid three-up">
        <Metric
          change="Company panel access"
          icon={ShieldCheck}
          label="Access granted"
          tone="success"
          value={context.platform.clients.length.toString()}
        />
        <Metric
          change="Provisioned across all companies"
          icon={UsersRound}
          label="Enabled accounts"
          tone="info"
          value={enabledAccountCount.toString()}
        />
        <Metric
          change="Workspace setup complete"
          icon={CheckCircle2}
          label="Ready workspaces"
          tone="neutral"
          value={readyCount.toString()}
        />
      </div>

      <section className="panel" aria-label="Access provisioning table">
        <PanelTitle
          actions={<TableActions />}
          icon={ShieldCheck}
          id="superadmin-provisioning-title"
          subtitle="Company workspace access, enabled accounts, owner, and operating region."
          title="Client access provisioning"
        />
        <ResponsiveTable
          headers={["Company", "Access", "Enabled accounts", "Region", "Owner", "Health"]}
          rows={clients.map((company) => [
            <CompanyCell company={company} key={company.id} />,
            <span className="soft-pill" key={`${company.id}-access`}>
              {company.accessStatus}
            </span>,
            company.adminUsers.length,
            company.dataRegion,
            company.owner,
            <span className="tenant-badge" data-status={company.status} key={`${company.id}-health`}>
              {company.status}
            </span>
          ])}
        />
      </section>
    </section>
  );
}

function SuperAdminSupport({
  context,
  query
}: {
  context: Extract<AdminPanelContext, { mode: "superadmin" }>;
  query: string;
}) {
  const clients = filterCompanies(context.platform.clients, query).sort(
    (left, right) =>
      getClientSupportPriority(right).rank - getClientSupportPriority(left).rank ||
      right.openItems - left.openItems ||
      left.name.localeCompare(right.name)
  );
  const openItemCount = context.platform.clients.reduce((total, company) => total + company.openItems, 0);
  const attentionCount = context.platform.clients.filter(
    (company) => company.status !== "Healthy" || company.openItems > 1
  ).length;
  const clearCount = context.platform.clients.filter(
    (company) => company.status === "Healthy" && company.openItems === 0
  ).length;

  return (
    <section className="page-flow" aria-label="Client support">
      <div className="metric-grid three-up">
        <Metric
          change="Database-backed client workload"
          icon={LifeBuoy}
          label="Open client items"
          tone={openItemCount > 0 ? "warning" : "success"}
          value={openItemCount.toString()}
        />
        <Metric
          change="Health or workload needs review"
          icon={AlertCircle}
          label="Needs attention"
          tone={attentionCount > 0 ? "warning" : "success"}
          value={attentionCount.toString()}
        />
        <Metric
          change="Healthy with no open items"
          icon={CheckCircle2}
          label="Clear workspaces"
          tone="success"
          value={clearCount.toString()}
        />
      </div>

      <section className="panel" aria-label="Client support queue">
        <PanelTitle
          actions={<TableActions />}
          icon={LifeBuoy}
          id="superadmin-support-title"
          subtitle="Sorted by workspace health and open operational workload."
          title="Client support queue"
        />
        <ResponsiveTable
          headers={["Company", "Priority", "Open items", "Health", "Last activity", "Owner"]}
          rows={clients.map((company) => {
            const priority = getClientSupportPriority(company);
            return [
              <CompanyCell company={company} key={company.id} />,
              <span className="priority-pill" data-priority={priority.label} key={`${company.id}-priority`}>
                {priority.label}
              </span>,
              company.openItems,
              <span className="tenant-badge" data-status={company.status} key={`${company.id}-status`}>
                {company.status}
              </span>,
              formatDate(company.lastActivityAt),
              company.owner
            ];
          })}
        />
      </section>
    </section>
  );
}

function SuperAdminActivity({
  context,
  query
}: {
  context: Extract<AdminPanelContext, { mode: "superadmin" }>;
  query: string;
}) {
  const normalizedQuery = query.trim().toLowerCase();
  const accountGroups = [
    { company: "EsteemedEngineering", accounts: context.platform.internalAccounts },
    ...context.platform.clients.map((company) => ({ company: company.name, accounts: company.adminUsers }))
  ];
  const workspaceEvents = context.platform.clients.map((company) => ({
    company: company.name,
    date: company.lastActivityAt,
    detail: `${company.status} | ${company.openItems} open ${company.openItems === 1 ? "item" : "items"}`,
    id: `workspace-${company.id}`,
    title: `${company.name} workspace updated`,
    type: "Workspace"
  }));
  const accountEvents = accountGroups.flatMap((group) =>
    group.accounts.flatMap((account) => {
      const events = [
        {
          company: group.company,
          date: account.createdAt,
          detail: `${account.email} | ${formatRole(account.role)}`,
          id: `account-created-${account.id}`,
          title: `${account.displayName} provisioned`,
          type: "Account"
        }
      ];

      if (account.lastLoginAt) {
        events.push({
          company: group.company,
          date: account.lastLoginAt,
          detail: `${account.email} | ${formatRole(account.role)}`,
          id: `account-login-${account.id}`,
          title: `${account.displayName} signed in`,
          type: "Sign-in"
        });
      }

      return events;
    })
  );
  const allEvents = [...workspaceEvents, ...accountEvents].sort(
    (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()
  );
  const events = allEvents.filter((event) =>
    normalizedQuery
      ? [event.title, event.detail, event.company, event.type].join(" ").toLowerCase().includes(normalizedQuery)
      : true
  );
  const signInCount = allEvents.filter((event) => event.type === "Sign-in").length;

  return (
    <section className="page-flow" aria-label="Platform activity">
      <div className="metric-grid three-up">
        <Metric
          change="Workspace, account, and login records"
          icon={History}
          label="Recorded events"
          tone="info"
          value={allEvents.length.toString()}
        />
        <Metric
          change="Across client and platform admins"
          icon={UserRoundCog}
          label="Administrator sign-ins"
          tone="success"
          value={signInCount.toString()}
        />
        <Metric
          change="Latest company activity records"
          icon={Building2}
          label="Workspace updates"
          tone="neutral"
          value={workspaceEvents.length.toString()}
        />
      </div>

      <section className="panel" aria-label="Activity table">
        <PanelTitle
          actions={<TableActions />}
          icon={History}
          id="superadmin-activity-title"
          subtitle="Company activity and administrator account events from the platform database."
          title="Activity history"
        />
        <ResponsiveTable
          headers={["Event", "Company", "Type", "Date"]}
          rows={events.map((event) => [
            <div className="entity-cell" key={event.id}>
              <strong>{event.title}</strong>
              <span>{event.detail}</span>
            </div>,
            event.company,
            <span className="soft-pill" key={`${event.id}-type`}>
              {event.type}
            </span>,
            formatDate(event.date)
          ])}
        />
      </section>
    </section>
  );
}

function getClientOnboardingState(company: AdminPanelCompany) {
  const activeAccountCount = company.adminUsers.filter((account) => account.lastLoginAt).length;
  const hasOwner = company.adminUsers.some((account) => account.role.toLowerCase() === "owner");
  const hasActiveAccount = activeAccountCount > 0;
  const isOperationallyReady = company.status === "Healthy" && company.openItems <= 1;
  const completedSteps = [true, company.adminUsers.length > 0, hasOwner, hasActiveAccount, isOperationallyReady].filter(Boolean).length;
  const progress = completedSteps * 20;
  const nextAction =
    company.adminUsers.length === 0
      ? "Invite an administrator"
      : !hasOwner
        ? "Assign a company owner"
        : !hasActiveAccount
          ? "Activate the first account"
          : company.status !== "Healthy"
            ? "Review workspace health"
            : company.openItems > 1
              ? "Resolve setup items"
              : "Ready for handoff";

  return {
    activeAccountCount,
    hasActiveAccount,
    nextAction,
    progress
  };
}

function getClientSupportPriority(company: AdminPanelCompany): { label: "High" | "Medium" | "Low"; rank: number } {
  if (company.status === "At risk" || company.openItems >= 3) {
    return { label: "High", rank: 3 };
  }
  if (company.status === "Watch" || company.openItems > 0) {
    return { label: "Medium", rank: 2 };
  }
  return { label: "Low", rank: 1 };
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
  if (section === "users") {
    return <ClientUsersView query={query} />;
  }

  if (section === "secrets") {
    return <SecretLockerView query={query} />;
  }

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

function ClientUsersView({ query }: { query: string }) {
  const [data, setData] = useState<ClientUserList | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);

    clientApiClient
      .listClientUsers({ pageSize: 100 })
      .then((response) => {
        if (!cancelled) {
          setData(response);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load workspace users from the client API.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) {
    return <ClientServiceState error={error} icon={UserRoundCog} label="workspace users" />;
  }

  const normalizedQuery = query.trim().toLowerCase();
  const users = data.items.filter((user) =>
    [user.displayName, user.email, user.role, user.status].join(" ").toLowerCase().includes(normalizedQuery)
  );
  const activeUsers = data.items.filter((user) => user.status === "active").length;
  const administrators = data.items.filter((user) => user.role === "owner" || user.role === "admin").length;

  return (
    <section className="page-flow" aria-label="Database-backed workspace users">
      <div className="metric-grid three-up">
        <Metric icon={UsersRound} label="Total users" tone="info" value={data.total.toString()} change="Current tenant only" />
        <Metric icon={ShieldCheck} label="Active users" tone="success" value={activeUsers.toString()} change={`${data.total - activeUsers} inactive`} />
        <Metric icon={UserRoundCog} label="Administrators" tone="neutral" value={administrators.toString()} change="Owners and admins" />
      </div>

      <section className="panel" aria-label="Workspace user directory">
        <PanelTitle icon={UserRoundCog} id="workspace-users-title" title="User directory" />
        {users.length > 0 ? (
          <ResponsiveTable
            headers={["User", "Role", "Status", "Created", "Last login"]}
            rows={users.map((user) => [
              <div className="entity-cell" key={user.id}>
                <strong>{user.displayName}</strong>
                <span>{user.email}</span>
              </div>,
              formatRole(user.role),
              <span
                className={user.status === "active" ? "soft-pill" : "readiness-pill"}
                data-readiness={user.status === "active" ? undefined : "Needs policy"}
                key={`${user.id}-status`}
              >
                {formatRole(user.status)}
              </span>,
              formatDate(user.createdAt),
              user.lastLoginAt ? formatDate(user.lastLoginAt) : "Never"
            ])}
          />
        ) : (
          <div className="service-empty">No users match the current search.</div>
        )}
      </section>
    </section>
  );
}

function SecretLockerView({ query }: { query: string }) {
  const [data, setData] = useState<LockerSecretList | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);

    clientApiClient
      .listLockerSecrets({ pageSize: 100 })
      .then((response) => {
        if (!cancelled) {
          setData(response);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load Secret Locker metadata from the client API.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) {
    return <ClientServiceState error={error} icon={Vault} label="Secret Locker" />;
  }

  const normalizedQuery = query.trim().toLowerCase();
  const secrets = data.items.filter((secret) =>
    [secret.name, secret.description, secret.resourceName, ...Object.keys(secret.labels)]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery)
  );
  const versionCount = data.items.reduce((total, secret) => total + secret.versionCount, 0);
  const enabledSecrets = data.items.filter((secret) => secret.latestVersion?.state === "ENABLED").length;

  return (
    <section className="page-flow" aria-label="Tenant Secret Locker">
      <div className="metric-grid three-up">
        <Metric icon={Vault} label="Secrets" tone="info" value={data.total.toString()} change="Tenant-isolated containers" />
        <Metric icon={History} label="Versions" tone="neutral" value={versionCount.toString()} change="Immutable encrypted versions" />
        <Metric icon={ShieldCheck} label="Enabled" tone="success" value={enabledSecrets.toString()} change="Latest version available" />
      </div>

      <section className="panel" aria-label="Secret metadata directory">
        <PanelTitle icon={Vault} id="secret-locker-title" title="Secret metadata" />
        {secrets.length > 0 ? (
          <ResponsiveTable
            headers={["Secret", "Resource", "Versions", "Latest state", "Updated"]}
            rows={secrets.map((secret) => {
              const state = secret.latestVersion?.state ?? "No versions";
              const status = state === "ENABLED" ? "COMPLETE" : state === "DISABLED" ? "PENDING" : "FAILED";
              return [
                <div className="entity-cell" key={secret.id}>
                  <strong>{secret.name}</strong>
                  <span>{secret.description ?? "No description"}</span>
                </div>,
                secret.resourceName,
                secret.versionCount,
                <span className="status-badge" data-status={status} key={`${secret.id}-state`}>
                  {state}
                </span>,
                formatDate(secret.updatedAt)
              ];
            })}
          />
        ) : (
          <div className="service-empty">
            {data.total === 0 ? "No secrets have been created for this workspace." : "No secrets match the current search."}
          </div>
        )}
      </section>
    </section>
  );
}

function ClientServiceState({
  error,
  icon: Icon,
  label
}: {
  error: string | null;
  icon: typeof LayoutDashboard;
  label: string;
}) {
  return (
    <section className="page-flow" aria-label={`${label} state`}>
      <section className="panel service-state" role={error ? "alert" : "status"}>
        {error ? <AlertCircle size={22} strokeWidth={2} /> : <LoaderCircle className="button-spinner" size={24} strokeWidth={2} />}
        <div>
          <strong>{error ? `Unable to load ${label}` : `Loading ${label}`}</strong>
          <span>{error ?? "Reading the latest records from the workspace database."}</span>
        </div>
        {!error && <Icon className="service-state-icon" size={22} strokeWidth={2} />}
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
        <Metric icon={UsersRound} label="Company access" tone="info" value={context.company.accessStatus} change={`${context.company.adminUsers.length} enabled accounts`} />
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
      company.status,
      company.adminUsers.map((account) => `${account.displayName} ${account.email} ${account.role}`).join(" ")
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery)
  );
}

function LoginScreen({
  onLogin,
  portal
}: {
  onLogin: (session: AdminSession, rememberMe: boolean) => void;
  portal: LoginPortal;
}) {
  const [email, setEmail] = useState(import.meta.env.DEV ? portal.defaultEmail : "");
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
      const nextSession = await loginToPortal(portal, { email, password });
      onLogin(nextSession, rememberMe);
    } catch (loginError) {
      if (loginError instanceof PortalAccessError) {
        setError(loginError.message);
      } else if (loginError instanceof PeptraceApiError && loginError.status === 401) {
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

  const themeStyle = {
    "--portal-accent": portal.theme.accent,
    "--portal-accent-strong": portal.theme.accentStrong,
    "--portal-glow": portal.theme.glow,
    "--portal-mark": portal.theme.mark,
    "--portal-soft": portal.theme.soft
  } as CSSProperties;

  return (
    <main className="login-shell" data-portal={portal.id} style={themeStyle}>
      <section className="login-panel" aria-labelledby="login-title">
        <aside className="login-brand-panel" aria-label={`${portal.brandName} admin portal overview`}>
          <div className="login-brand-header">
            <span className="login-brand-mark" aria-hidden="true">
              {portal.kind === "superadmin" ? (
                <EsteemedEngineeringLogo className="ee-logo" />
              ) : (
                <span className="login-client-initials">{portal.initials}</span>
              )}
            </span>
            <div>
              <strong>{portal.brandName}</strong>
              <span>{portal.brandSubtitle}</span>
            </div>
          </div>

          <div className="login-brand-copy">
            <p>{portal.eyebrow}</p>
            <h2>{portal.headline}</h2>
            <span>{portal.description}</span>
          </div>

          <div className="login-service-map" aria-hidden="true">
            <div>
              <span>{portal.suiteLabel}</span>
              <strong>{portal.suiteSummary}</strong>
            </div>
            <ul>
              {portal.services.map((service) => {
                const Icon = service.icon;
                return (
                  <li key={service.label}>
                    <Icon size={16} strokeWidth={2} />
                    <span>{service.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="login-feature-stack">
            {portal.features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div className="login-feature-item" key={feature.title}>
                  <Icon size={18} strokeWidth={2} />
                  <div>
                    <strong>{feature.title}</strong>
                    <span>{feature.description}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="login-brand-foot">
            <span>Access mode</span>
            <strong>{portal.accessValue}</strong>
          </div>
        </aside>

        <div className="login-form-panel">
          <div className="login-panel-top">
            <span className="security-pill">
              <ShieldCheck size={15} strokeWidth={2} />
              Protected access
            </span>
            <span className="login-panel-code">{portal.code}</span>
          </div>

          <div className="login-copy">
            <p>{portal.brandName} secure sign in</p>
            <h1 id="login-title">Welcome back</h1>
            <span>{portal.formDescription}</span>
          </div>

          <form className="login-form" onSubmit={submitLogin}>
            <label>
              <span>Email</span>
              <div className="input-frame">
                <Mail size={17} strokeWidth={2} />
                <Input
                  autoComplete="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={portal.defaultEmail}
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
            {portal.brandName} access is monitored and protected for authorized team members.
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
      {section !== "system" && section !== "secrets" && <div className="page-actions">
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
      </div>}
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
            subtitle="Prioritized account work across support, access, and quality."
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
          headers={["Client", "Access", "Owner", "Region", "Open items", "Health"]}
          rows={data.clients.map((client) => [
            <ClientCell client={client} key={client.id} />,
            client.accessStatus,
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
          headers={["Client", "Access", "Owner", "Last activity", "Health"]}
          rows={clients.map((client) => [
            <ClientCell client={client} key={client.id} />,
            client.accessStatus,
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
    <section className="page-flow" aria-label="Security and access controls">
      <div className="metric-grid three-up">
        <Metric icon={ShieldCheck} label="Session policy" tone="success" value="Active" change="Role-based access" />
        <Metric icon={KeyRound} label="Client API keys" tone="info" value="Scoped" change="Tenant permissions" />
        <Metric icon={UsersRound} label="Company access" tone="success" value="Granted" change="Managed by direct approval" />
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
