import {
  AlertCircle,
  Activity,
  BadgeDollarSign,
  Beaker,
  Bell,
  CheckCircle2,
  ChevronDown,
  Download,
  Filter,
  FlaskConical,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Mail,
  Microscope,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Store,
  UserRoundCog,
  UsersRound
} from "lucide-react";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { PeptraceApiClient, PeptraceApiError, type AdminSession } from "@peptrace/api-client";
import {
  accountWorkItems,
  apiSurfaces,
  clientTenants,
  dashboardMetrics,
  formatScore,
  getLabName,
  getPeptideLabel,
  getVendorName,
  labTests,
  labs,
  peptides,
  type ClientTenant,
  type TestingStatus,
  vendors
} from "@peptrace/domain";

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
    breadcrumb: "Platform / Access",
    title: "Security and billing controls",
    description: "Manage secure access, billing policy, and client-facing API permissions."
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

const apiClient = new PeptraceApiClient({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? "/api"
});
const SESSION_STORAGE_KEY = "peptrace.admin.session";
const TEST_ADMIN_EMAIL = "admin@peptrace.com";
const TEST_ADMIN_PASSWORD = "Admin@123";
const TEST_ADMIN_SESSION: AdminSession = {
  accessToken: "local-test-session",
  expiresIn: 3600,
  tokenType: "Bearer",
  user: {
    email: TEST_ADMIN_EMAIL,
    id: "local-test-admin",
    role: "owner",
    tenantId: "client-esteem-engineering",
    tenantName: "EsteemedEngineering"
  }
};

const readStoredSession = (): AdminSession | null => {
  try {
    const value = window.localStorage.getItem(SESSION_STORAGE_KEY);
    return value ? (JSON.parse(value) as AdminSession) : null;
  } catch {
    return null;
  }
};

export function App() {
  const [session, setSession] = useState<AdminSession | null>(() => readStoredSession());
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [query, setQuery] = useState("");
  const activeMeta = sectionMeta[activeSection];
  const visibleVendors = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return vendors;
    }

    return vendors.filter((vendor) =>
      [vendor.displayName, vendor.slug, ...vendor.products.map((product) => product.label)]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [query]);

  apiClient.setToken(session?.accessToken);

  if (!session) {
    return (
      <LoginScreen
        onLogin={(nextSession) => {
          window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
          apiClient.setToken(nextSession.accessToken);
          setSession(nextSession);
        }}
      />
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            PT
          </div>
          <div>
            <p>Peptrace</p>
            <span>SaaS operations</span>
          </div>
        </div>

        <button className="tenant-switcher" type="button">
          <span className="tenant-avatar">EE</span>
          <span>
            <strong>{session.user.tenantName ?? "Peptrace"}</strong>
            <small>Enterprise workspace</small>
          </span>
          <ChevronDown size={16} strokeWidth={2} />
        </button>

        <nav className="nav-sections">
          {navigationGroups.map((group) => (
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
            <strong>{session.user.tenantName ?? "Peptrace"}</strong>
          </div>

          <div className="search-control">
            <Search size={18} strokeWidth={2} />
            <input
              aria-label="Search vendors"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search clients, vendors, products"
              type="search"
              value={query}
            />
          </div>

          <div className="topbar-actions">
            <button className="icon-button" aria-label="Notifications" title="Notifications" type="button">
              <Bell size={18} strokeWidth={2} />
            </button>
            <button className="account-button" type="button">
              <span className="user-dot" aria-hidden="true" />
              <span>{session.user.role}</span>
              <ChevronDown size={16} strokeWidth={2} />
            </button>
            <button
              className="icon-button"
              aria-label="Sign out"
              title="Sign out"
              type="button"
              onClick={() => {
                window.localStorage.removeItem(SESSION_STORAGE_KEY);
                apiClient.setToken(undefined);
                setSession(null);
              }}
            >
              <LogOut size={18} strokeWidth={2} />
            </button>
          </div>
        </header>

        <PageHeader meta={activeMeta} section={activeSection} />

        {activeSection === "overview" && <Overview />}
        {activeSection === "clients" && <ClientsView />}
        {activeSection === "vendors" && <VendorsView vendors={visibleVendors} />}
        {activeSection === "peptides" && <PeptidesView />}
        {activeSection === "testing" && <TestingView />}
        {activeSection === "labs" && <LabsView />}
        {activeSection === "access" && <AccessView />}
      </main>
    </div>
  );
}

function LoginScreen({ onLogin }: { onLogin: (session: AdminSession) => void }) {
  const [email, setEmail] = useState(import.meta.env.DEV ? TEST_ADMIN_EMAIL : "");
  const [password, setPassword] = useState(import.meta.env.DEV ? TEST_ADMIN_PASSWORD : "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const nextSession = await apiClient.login({ email, password });
      onLogin(nextSession);
    } catch (loginError) {
      if (import.meta.env.DEV && email.trim().toLowerCase() === TEST_ADMIN_EMAIL && password === TEST_ADMIN_PASSWORD) {
        onLogin(TEST_ADMIN_SESSION);
        return;
      }

      if (loginError instanceof PeptraceApiError && loginError.status === 401) {
        setError("The email or password is incorrect.");
      } else {
        setError("Could not reach the Peptrace API. Check that the backend is running.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-shell">
      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-panel-top">
          <span className="security-pill">
            <ShieldCheck size={15} strokeWidth={2} />
            Secure workspace
          </span>
        </div>

        <div className="login-copy">
          <p>Admin sign in</p>
          <h1 id="login-title">Welcome back</h1>
          <span>Access Peptrace operations for your client workspace.</span>
        </div>

        <form className="login-form" onSubmit={submitLogin}>
          <label>
            <span>Email</span>
            <div className="input-frame">
              <Mail size={17} strokeWidth={2} />
              <input
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
              <input
                autoComplete="current-password"
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
                type="password"
                value={password}
              />
            </div>
          </label>

          {error && (
            <div className="login-error" role="alert">
              <AlertCircle size={17} strokeWidth={2} />
              <span>{error}</span>
            </div>
          )}

          <button className="primary-button login-submit" disabled={isSubmitting} type="submit">
            <span>{isSubmitting ? "Signing in" : "Sign in"}</span>
          </button>
        </form>

        <div className="login-support">
          <span>Need access?</span>
          <a href="mailto:support@peptrace.com">Contact support</a>
        </div>
      </section>
    </main>
  );
}

function PageHeader({ meta, section }: { meta: (typeof sectionMeta)[AdminSection]; section: AdminSection }) {
  const primaryAction = section === "testing" ? "New test" : section === "vendors" ? "Add vendor" : "Create report";

  return (
    <section className="page-header" aria-labelledby="page-title">
      <div>
        <p>{meta.breadcrumb}</p>
        <h1 id="page-title">{meta.title}</h1>
        <span>{meta.description}</span>
      </div>
      <div className="page-actions">
        <button className="secondary-button" type="button">
          <Download size={17} strokeWidth={2} />
          <span>Export</span>
        </button>
        <button className="primary-button" type="button">
          {section === "vendors" ? <Plus size={17} strokeWidth={2} /> : <Activity size={17} strokeWidth={2} />}
          <span>{primaryAction}</span>
        </button>
      </div>
    </section>
  );
}

function Overview() {
  const queue = [...accountWorkItems].sort((left, right) => priorityOrder[left.priority] - priorityOrder[right.priority]);

  return (
    <section className="page-flow" aria-label="Overview dashboard">
      <div className="scope-strip" aria-label="Current data scope">
        <ScopeItem label="Tenant" value="EsteemedEngineering" />
        <ScopeItem label="Role" value="Owner" />
        <ScopeItem label="Region" value="US data plane" />
        <ScopeItem label="Window" value="Last 30 days" />
      </div>

      <div className="metric-grid">
        <Metric icon={UsersRound} label="Client accounts" tone="info" value={dashboardMetrics.clients.toString()} change="3 active workspaces" />
        <Metric icon={Microscope} label="Open tests" tone="warning" value={dashboardMetrics.openReviews.toString()} change={`${dashboardMetrics.retestRequests} retest request`} />
        <Metric icon={CheckCircle2} label="Controls ready" tone="success" value={`${dashboardMetrics.apiReady}/${apiSurfaces.length}`} change="Access policy active" />
        <Metric icon={Store} label="Avg. vendor rating" tone="neutral" value={formatScore(dashboardMetrics.averageVendorRating)} change="Across catalog" />
      </div>

      <div className="overview-grid">
        <section className="panel panel-wide" aria-labelledby="watchlist-title">
          <PanelTitle
            actions={<TableActions />}
            icon={Microscope}
            id="watchlist-title"
            subtitle="Tests that need operational attention before client reporting."
            title="Quality watchlist"
          />
          <ResponsiveTable
            headers={["Peptide", "Vendor", "Lab", "Assay", "Purity", "Status"]}
            rows={labTests.map((test) => [
              getPeptideLabel(test.peptideId),
              getVendorName(test.vendorId),
              getLabName(test.labId),
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
            subtitle="Prioritized tenant-facing work across support, billing, and quality."
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
          subtitle="A multi-tenant surface for customer success, support, and platform owners."
          title="Client health"
        />
        <ResponsiveTable
          headers={["Client", "Plan", "Owner", "Region", "Open items", "Health"]}
          rows={clientTenants.map((client) => [
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

function ClientsView() {
  return (
    <section className="page-flow" aria-label="Client workspaces">
      <section className="panel" aria-label="Client tenant table">
        <PanelTitle actions={<TableActions />} icon={UsersRound} id="clients-table-title" title="Tenant registry" />
        <ResponsiveTable
          headers={["Client", "Plan", "Seats", "Monthly spend", "Owner", "Last activity", "Health"]}
          rows={clientTenants.map((client) => [
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

function VendorsView({ vendors: vendorRows }: { vendors: typeof vendors }) {
  return (
    <section className="page-flow" aria-label="Vendor performance">
      <section className="panel" aria-label="Vendor table">
        <PanelTitle actions={<TableActions />} icon={Store} id="vendors-table-title" title="Vendor scorecard" />
        <ResponsiveTable
          headers={["Vendor", "Rating", "Products", "Best purity", "Tests", "Actions"]}
          rows={vendorRows.map((vendor) => {
            const bestPurity = Math.max(...vendor.products.map((product) => product.purityPercent));
            const testsCount = vendor.products.reduce((total, product) => total + product.testsCount, 0);
            return [
              <VendorCell key={vendor.id} vendor={vendor} />,
              formatScore(vendor.overallRating),
              vendor.products.map((product) => product.label).join(", "),
              `${bestPurity.toFixed(1)}%`,
              testsCount.toLocaleString(),
              <button className="row-action" aria-label={`Open ${vendor.displayName} actions`} key={vendor.id} type="button">
                <MoreHorizontal size={17} strokeWidth={2} />
              </button>
            ];
          })}
        />
      </section>
    </section>
  );
}

function PeptidesView() {
  return (
    <section className="page-flow" aria-label="Peptide index">
      <div className="collection-grid">
        {peptides.map((peptide) => {
          const vendorMatches = vendors.flatMap((vendor) =>
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

function TestingView() {
  return (
    <section className="page-flow" aria-label="Lab test tracking">
      <section className="panel" aria-label="Lab test table">
        <PanelTitle actions={<TableActions />} icon={Microscope} id="testing-table-title" title="Testing workflow" />
        <ResponsiveTable
          headers={["Test", "Peptide", "Vendor", "Assay", "Purity", "Label claim", "Status"]}
          rows={labTests.map((test) => [
            test.id,
            getPeptideLabel(test.peptideId),
            getVendorName(test.vendorId),
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

function LabsView() {
  return (
    <section className="page-flow" aria-label="Laboratory network">
      <div className="collection-grid">
        {labs.map((lab) => (
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

function AccessView() {
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
      <button className="tool-button" type="button">
        <Filter size={16} strokeWidth={2} />
        <span>Filter</span>
      </button>
      <button className="icon-button compact" aria-label="Table settings" title="Table settings" type="button">
        <SlidersHorizontal size={16} strokeWidth={2} />
      </button>
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

function StatusBadge({ status }: { status: TestingStatus }) {
  return (
    <span className="status-badge" data-status={status}>
      {statusLabels[status]}
    </span>
  );
}

function TenantBadge({ status }: { status: ClientTenant["status"] }) {
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

function VendorCell({ vendor }: { vendor: (typeof vendors)[number] }) {
  return (
    <div className="entity-cell">
      <strong>{vendor.displayName}</strong>
      <span>{vendor.slug}</span>
    </div>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
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
