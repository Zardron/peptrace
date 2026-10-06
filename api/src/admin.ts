import crypto from 'node:crypto';
import { Router, type NextFunction, type Request, type Response } from 'express';
import { DUMMY_PASSWORD_HASH, hashPassword, isValidEmail, verifyPassword } from './auth.js';
import { isUuid, normalizeAdminSearch, revokeAllOwnedSessions } from './security.js';
import { getServiceClient, providerRequiresEmailConfirmation, sessionSecret } from './supabase.js';
import {
  isAdminRole,
  roleHasPermission,
  type AdminPermission,
  type AdminRole,
} from './admin-policy.js';
import { consumeRateLimit } from './rate-limit.js';
import { registerCatalogRoutes } from './admin-catalog.js';
import type { AdminRouteDeps } from './admin-input.js';
import { registerShipmentRoutes } from './admin-shipments.js';
import { registerContentAdminRoutes } from './site-content.js';
import { registerPrivacyRoutes } from './admin-privacy.js';
import { registerAdminUserRoutes } from './admin-admins.js';
import { registerVendorApplicationAdminRoutes } from './vendor-applications.js';

const ADMIN_COOKIE = 'peptrace_admin_session';
const ADMIN_SESSION_SECONDS = 12 * 60 * 60;
const ADMIN_SESSION_SECONDS_REMEMBERED = 7 * 24 * 60 * 60;
const MAX_FAILED_LOGINS = 5;
const LOCK_SECONDS = 15 * 60;


interface AdminUserRecord {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  role: AdminRole;
  is_active: boolean;
  failed_login_count: number;
  locked_until: string | null;
  last_login_at: string | null;
  created_at: string;
  must_change_password: boolean;
}

interface AdminContext {
  id: string;
  email: string;
  displayName: string;
  role: AdminRole;
  sessionId: string;
  rawSessionToken: string;
  expiresAt: string;
  mustChangePassword: boolean;
}

type AdminRequest = Request & { admin?: AdminContext };

const normalizeEmail = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const cleanText = (value: unknown, maxLength: number): string =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

const sha256 = (value: string): string =>
  crypto.createHash('sha256').update(value).digest('hex');

const operationalSecret = (): string => {
  const value = process.env.ADMIN_SESSION_SECRET ?? sessionSecret();
  if (!value) {
    throw new Error('Missing ADMIN_SESSION_SECRET/AUTH_SESSION_SECRET');
  }
  return value;
};

const csrfForToken = (token: string): string =>
  crypto.createHmac('sha256', operationalSecret()).update(`csrf:${token}`).digest('base64url');

const requestIpHash = (req: Request): string | null => {
  const address = req.ip || req.socket.remoteAddress;
  return address
    ? crypto.createHmac('sha256', operationalSecret()).update(`ip:${address}`).digest('hex')
    : null;
};

const requestId = (req: Request): string | null => {
  const value = req.headers['x-request-id'];
  return typeof value === 'string' ? value.slice(0, 128) : null;
};

const parseCookies = (header: string | undefined): Record<string, string> => {
  if (!header) return {};
  return Object.fromEntries(
    header.split(';').flatMap((part) => {
      const separator = part.indexOf('=');
      if (separator < 1) return [];
      const key = part.slice(0, separator).trim();
      const value = part.slice(separator + 1).trim();
      try {
        return [[key, decodeURIComponent(value)]];
      } catch {
        return [];
      }
    }),
  );
};

const setAdminCookie = (res: Response, token: string, maxAgeSeconds: number): void => {
  res.cookie(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/client-api',
    maxAge: maxAgeSeconds * 1000,
  });
};

const clearAdminCookie = (res: Response): void => {
  res.clearCookie(ADMIN_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/client-api',
  });
};

const allowedAdminOrigins = (): Set<string> => {
  const configured = (process.env.ADMIN_CORS_ORIGINS ?? process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return new Set([
    'https://admin.peptrace.co',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    ...configured,
  ]);
};

const enforceAdminOrigin = (req: Request, res: Response, next: NextFunction): void => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }
  const origin = req.headers.origin;
  if (typeof origin !== 'string' || !allowedAdminOrigins().has(origin)) {
    res.status(403).json({ error: 'Request origin is not allowed' });
    return;
  }
  next();
};

const audit = async (
  req: Request,
  details: {
    actor?: Pick<AdminContext, 'id' | 'email'> | null;
    action: string;
    targetType?: string;
    targetId?: string;
    reason?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<boolean> => {
  const { error } = await getServiceClient().from('admin_audit_log').insert({
    actor_id: details.actor?.id ?? null,
    actor_email: details.actor?.email ?? null,
    action: details.action,
    target_type: details.targetType ?? null,
    target_id: details.targetId ?? null,
    reason: details.reason ?? null,
    metadata: details.metadata ?? {},
    request_id: requestId(req),
    ip_hash: requestIpHash(req),
  });
  if (error) {
    console.error(JSON.stringify({ event: 'admin_audit_write_failed', code: error.code }));
    return false;
  }
  return true;
};

const requireAuditRecord = async (
  req: AdminRequest,
  res: Response,
  details: Parameters<typeof audit>[1],
): Promise<boolean> => {
  if (await audit(req, details)) return true;
  res.status(503).json({ error: 'The action could not be recorded securely' });
  return false;
};

const toSessionResponse = (admin: AdminContext) => ({
  accessToken: '',
  csrfToken: csrfForToken(admin.rawSessionToken),
  expiresIn: Math.max(0, Math.floor((new Date(admin.expiresAt).getTime() - Date.now()) / 1000)),
  tokenType: 'Bearer' as const,
  user: {
    id: admin.id,
    email: admin.email,
    displayName: admin.displayName,
    membershipId: null,
    role: admin.role,
    mustChangePassword: admin.mustChangePassword,
    tenantId: 'peptrace',
    tenantName: 'PepTrace',
    tenantSlug: 'peptrace',
    tenants: [
      {
        id: 'peptrace',
        membershipId: null,
        name: 'PepTrace',
        role: admin.role,
        slug: 'peptrace',
      },
    ],
  },
});

const loadAdminSession = async (req: AdminRequest): Promise<AdminContext | null> => {
  const rawSessionToken = parseCookies(req.headers.cookie)[ADMIN_COOKIE];
  if (!rawSessionToken || rawSessionToken.length < 32) return null;

  const db = getServiceClient();
  const { data: session, error } = await db
    .from('admin_sessions')
    .select('id, admin_user_id, expires_at, revoked_at, last_seen_at')
    .eq('token_hash', sha256(rawSessionToken))
    .maybeSingle();
  if (error || !session || session.revoked_at || new Date(session.expires_at).getTime() <= Date.now()) {
    return null;
  }

  const { data: user, error: userError } = await db
    .from('admin_users')
    .select('id, email, display_name, role, is_active, must_change_password')
    .eq('id', session.admin_user_id)
    .maybeSingle();
  if (userError || !user || !user.is_active || !isAdminRole(user.role)) return null;

  if (Date.now() - new Date(session.last_seen_at).getTime() > 5 * 60 * 1000) {
    void db.from('admin_sessions').update({ last_seen_at: new Date().toISOString() }).eq('id', session.id);
  }

  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    role: user.role,
    sessionId: session.id,
    rawSessionToken,
    expiresAt: session.expires_at,
    mustChangePassword: user.must_change_password,
  };
};

const requireAdmin = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const admin = await loadAdminSession(req);
    if (!admin) {
      clearAdminCookie(res);
      res.status(401).json({ error: 'Admin session is invalid or expired' });
      return;
    }
    req.admin = admin;
    next();
  } catch {
    res.status(503).json({ error: 'Admin authentication is unavailable' });
  }
};

const requireCsrf = (req: AdminRequest, res: Response, next: NextFunction): void => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }
  const provided = req.headers['x-csrf-token'];
  const expected = req.admin ? csrfForToken(req.admin.rawSessionToken) : '';
  if (
    typeof provided !== 'string' ||
    provided.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
  ) {
    res.status(403).json({ error: 'CSRF validation failed' });
    return;
  }
  next();
};

const requirePermission = (permission: AdminPermission) =>
  (req: AdminRequest, res: Response, next: NextFunction): void => {
    const role = req.admin?.role;
    if (!role || !roleHasPermission(role, permission)) {
      res.status(403).json({ error: 'You do not have permission to perform this action' });
      return;
    }
    next();
  };

const loginRateLimit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const ipHash = requestIpHash(req) ?? sha256('unknown-admin-ip');
  const credentialHash = sha256(`${ipHash}:${normalizeEmail(req.body?.email)}`);
  const [ipResult, credentialResult] = await Promise.all([
    consumeRateLimit('admin-auth-ip', ipHash, 15 * 60, 30),
    consumeRateLimit('admin-auth-credential', credentialHash, 15 * 60, 10),
  ]);
  if (!ipResult || !credentialResult) {
    res.status(503).json({ error: 'Sign-in protection is unavailable' });
    return;
  }
  if (!ipResult.allowed || !credentialResult.allowed) {
    res.setHeader('Retry-After', Math.max(ipResult.retryAfterSeconds, credentialResult.retryAfterSeconds));
    res.status(429).json({ error: 'Too many sign-in attempts. Try again later.' });
    return;
  }
  next();
};

const pagination = (req: Request) => {
  const page = Math.max(1, Number.parseInt(String(req.query.page ?? '1'), 10) || 1);
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(String(req.query.pageSize ?? '25'), 10) || 25));
  return { page, pageSize, from: (page - 1) * pageSize, to: page * pageSize - 1 };
};

const subjectHash = (userId: string): string =>
  crypto.createHmac('sha256', operationalSecret()).update(`subject:${userId}`).digest('hex');

const countRows = async (table: string, configure?: (query: any) => any): Promise<number> => {
  let query: any = getServiceClient().from(table).select('*', { count: 'exact', head: true });
  if (configure) query = configure(query);
  const { count, error } = await query;
  if (error) throw new Error(`${table}:${error.code}`);
  return count ?? 0;
};

const getDashboard = async (rangeDays: number) => {
  const since = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000).toISOString();
  const [
    totalUsers,
    newUsers,
    suspendedUsers,
    totalShipments,
    newShipments,
    totalTestResults,
    activeSubscriptions,
    openSupportRequests,
    pendingDeletions,
    pendingExports,
    failedNotifications,
    failedWebhooks,
  ] = await Promise.all([
    countRows('user_accounts'),
    countRows('user_accounts', (query) => query.gte('created_at', since)),
    countRows('account_admin_state', (query) => query.eq('status', 'suspended')),
    countRows('shipments'),
    countRows('shipments', (query) => query.gte('created_at', since)),
    countRows('test_results'),
    countRows('subscriptions', (query) => query.in('status', ['active', 'trialing'])),
    countRows('support_requests', (query) => query.in('status', ['open', 'pending'])),
    countRows('account_deletion_requests', (query) => query.in('status', ['requested', 'scheduled', 'processing'])),
    countRows('data_export_requests', (query) => query.in('status', ['requested', 'processing'])),
    countRows('notification_events', (query) => query.in('status', ['failed', 'retrying'])),
    countRows('billing_webhook_events', (query) => query.eq('status', 'failed')),
  ]);

  return {
    rangeDays,
    generatedAt: new Date().toISOString(),
    metrics: {
      totalUsers,
      newUsers,
      activeUsers: Math.max(0, totalUsers - suspendedUsers),
      suspendedUsers,
      totalShipments,
      newShipments,
      totalTestResults,
      activeSubscriptions,
      openSupportRequests,
      pendingDeletions,
      pendingExports,
      failedNotifications,
      failedWebhooks,
    },
  };
};

const compatibleContext = async (admin: AdminContext) => {
  const dashboard = await getDashboard(30);
  const metrics = dashboard.metrics;
  return {
    mode: 'client' as const,
    viewer: {
      id: admin.id,
      displayName: admin.displayName,
      email: admin.email,
      role: admin.role,
      tenant: { id: 'peptrace', name: 'PepTrace', slug: 'peptrace' },
    },
    company: {
      id: 'peptrace',
      name: 'PepTrace',
      slug: 'peptrace',
      accessStatus: 'Granted',
      status: metrics.failedNotifications + metrics.failedWebhooks > 0 ? 'Watch' : 'Healthy',
      owner: 'PepTrace',
      enabledAccounts: metrics.activeUsers,
      operationalValue: metrics.totalShipments,
      openItems: metrics.openSupportRequests + metrics.pendingDeletions,
      dataRegion: 'AU',
      lastActivityAt: dashboard.generatedAt,
      adminUsers: [],
      createdAt: dashboard.generatedAt,
      updatedAt: dashboard.generatedAt,
    },
    panel: {
      brandName: 'PepTrace',
      productName: 'PepTrace Admin',
      industry: 'Peptide testing operations',
      accentColor: '#0d8f63',
      overviewTitle: 'Operational overview',
      overviewDescription: 'Live production account, shipment, testing, privacy, and support state.',
      operationsTitle: 'Operations',
      operationsDescription: 'Production-backed workflows only.',
      enabledModules: ['users', 'billing', 'privacy', 'support', 'audit', 'system'],
      metrics: [
        { label: 'Users', value: String(metrics.totalUsers), change: `${metrics.newUsers} new`, tone: 'info' },
        { label: 'Shipments', value: String(metrics.totalShipments), change: `${metrics.newShipments} new`, tone: 'neutral' },
        { label: 'Tests', value: String(metrics.totalTestResults), change: 'Persisted results', tone: 'success' },
        { label: 'Open support', value: String(metrics.openSupportRequests), change: 'Needs attention', tone: metrics.openSupportRequests ? 'warning' : 'success' },
      ],
      primaryRecords: [],
      workItems: [],
    },
  };
};

const compatiblePanelData = async () => {
  const db = getServiceClient();
  const [{ data: vendors, error: vendorsError }, { data: peptides, error: peptidesError }, { data: tests, error: testsError }] =
    await Promise.all([
      db.from('vendors').select('id, name, slug, score, cost_per_mg').eq('is_demo', false).order('name'),
      db.from('peptides').select('id, name').order('name'),
      db.from('vendor_tests').select('id, vendor_id, peptide_name, lab_name, tested_at, result, purity, tested_mg, label_mg').eq('is_demo', false).order('tested_at', { ascending: false }),
    ]);
  if (vendorsError || peptidesError || testsError) throw new Error('catalog_read_failed');

  const peptideByName = new Map((peptides ?? []).map((item) => [String(item.name).toLowerCase(), item.id]));
  const labsByName = new Map<string, { id: string; displayName: string; slug: string; partnerSince: string; tests: string[] }>();
  for (const test of tests ?? []) {
    const name = String(test.lab_name);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const existing = labsByName.get(name) ?? { id: `lab-${slug}`, displayName: name, slug, partnerSince: String(test.tested_at), tests: [] };
    existing.tests.push(test.id);
    labsByName.set(name, existing);
  }

  return {
    accountWorkItems: [],
    apiSurfaces: [],
    clients: [],
    vendors: (vendors ?? []).map((vendor) => ({
      id: vendor.id,
      displayName: vendor.name,
      slug: vendor.slug ?? vendor.id,
      overallRating: vendor.score == null ? 0 : Number(vendor.score) / 100,
      products: [],
    })),
    peptides: (peptides ?? []).map((peptide) => ({
      id: peptide.id,
      label: peptide.name,
      slug: String(peptide.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      tests: [],
    })),
    labs: [...labsByName.values()],
    tests: (tests ?? []).map((test) => ({
      id: test.id,
      labId: labsByName.get(String(test.lab_name))?.id ?? 'lab-unknown',
      vialSizeMg: Number(test.label_mg ?? test.tested_mg ?? 0),
      vendorId: test.vendor_id,
      resultsReleasedAt: test.tested_at,
      testingStatus: 'COMPLETE',
      peptideId: peptideByName.get(String(test.peptide_name).toLowerCase()) ?? '',
      assay: 'HPLC',
      purityPercent: test.purity == null ? null : Number(test.purity),
      labelClaimPercent:
        test.tested_mg != null && test.label_mg != null && Number(test.label_mg) !== 0
          ? (Number(test.tested_mg) / Number(test.label_mg)) * 100
          : null,
    })),
  };
};

export const ensureAdminBootstrap = async (): Promise<void> => {
  const email = normalizeEmail(process.env.ADMIN_BOOTSTRAP_EMAIL);
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD ?? '';
  const displayName = cleanText(process.env.ADMIN_BOOTSTRAP_NAME, 100) || 'PepTrace Owner';
  const db = getServiceClient();
  const { count, error } = await db.from('admin_users').select('*', { count: 'exact', head: true });
  if (error) {
    console.warn(JSON.stringify({ event: 'admin_bootstrap_unavailable', code: error.code }));
    return;
  }
  if ((count ?? 0) > 0) return;
  if (!isValidEmail(email) || password.length < 12) {
    console.warn(JSON.stringify({ event: 'admin_bootstrap_not_configured' }));
    return;
  }
  const { error: insertError } = await db.from('admin_users').insert({
    email,
    password_hash: hashPassword(password),
    display_name: displayName,
    role: 'super_admin',
    must_change_password: true,
  });
  if (insertError) throw new Error(`Could not bootstrap admin: ${insertError.code}`);
  console.info(JSON.stringify({ event: 'admin_bootstrap_created' }));
};

export const createAdminRouter = (): Router => {
  const router = Router();
  router.use(enforceAdminOrigin);

  router.post('/auth/login', loginRateLimit, async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const rememberMe = req.body?.rememberMe === true;
    if (!isValidEmail(email) || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const db = getServiceClient();
    const { data, error } = await db
      .from('admin_users')
      .select('id, email, password_hash, display_name, role, is_active, failed_login_count, locked_until, last_login_at, created_at, must_change_password')
      .eq('email', email)
      .maybeSingle();
    const user = data as AdminUserRecord | null;
    const locked = user?.locked_until && new Date(user.locked_until).getTime() > Date.now();
    const passwordMatches = verifyPassword(password, user?.password_hash ?? DUMMY_PASSWORD_HASH);
    const valid = Boolean(user && user.is_active && !locked && passwordMatches);

    if (error || !valid || !user || !isAdminRole(user.role)) {
      if (user) {
        const failedLoginCount = (user.failed_login_count ?? 0) + 1;
        await db.from('admin_users').update({
          failed_login_count: failedLoginCount,
          locked_until: failedLoginCount >= MAX_FAILED_LOGINS
            ? new Date(Date.now() + LOCK_SECONDS * 1000).toISOString()
            : user.locked_until,
          updated_at: new Date().toISOString(),
        }).eq('id', user.id);
      }
      await audit(req, {
        actor: user ? { id: user.id, email: user.email } : null,
        action: 'admin.login.failed',
        targetType: 'admin_user',
        targetId: user?.id,
        metadata: { reason: locked ? 'locked' : 'invalid_credentials' },
      });
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const rawSessionToken = crypto.randomBytes(48).toString('base64url');
    const maxAge = rememberMe ? ADMIN_SESSION_SECONDS_REMEMBERED : ADMIN_SESSION_SECONDS;
    const expiresAt = new Date(Date.now() + maxAge * 1000).toISOString();
    const { data: session, error: sessionError } = await db.from('admin_sessions').insert({
      admin_user_id: user.id,
      token_hash: sha256(rawSessionToken),
      expires_at: expiresAt,
      ip_hash: requestIpHash(req),
      user_agent: cleanText(req.headers['user-agent'], 500) || null,
    }).select('id').single();
    if (sessionError || !session) {
      res.status(503).json({ error: 'Could not create admin session' });
      return;
    }

    await db.from('admin_users').update({
      failed_login_count: 0,
      locked_until: null,
      last_login_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);
    const admin: AdminContext = {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
      sessionId: session.id,
      rawSessionToken,
      expiresAt,
      mustChangePassword: user.must_change_password,
    };
    setAdminCookie(res, rawSessionToken, maxAge);
    await audit(req, { actor: admin, action: 'admin.login.succeeded', targetType: 'admin_user', targetId: admin.id });
    res.json(toSessionResponse(admin));
  });

  router.use(requireAdmin);
  router.use(requireCsrf);

  router.get('/auth/me', (req: AdminRequest, res) => {
    res.json(toSessionResponse(req.admin!));
  });

  router.post('/auth/logout', async (req: AdminRequest, res) => {
    await getServiceClient().from('admin_sessions').update({ revoked_at: new Date().toISOString() }).eq('id', req.admin!.sessionId);
    await audit(req, { actor: req.admin!, action: 'admin.logout', targetType: 'admin_user', targetId: req.admin!.id });
    clearAdminCookie(res);
    res.status(204).end();
  });

  router.post('/auth/change-password', async (req: AdminRequest, res) => {
    const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
    if (newPassword.length < 12 || newPassword.length > 128) {
      res.status(400).json({ error: 'New password must be 12-128 characters' });
      return;
    }
    const db = getServiceClient();
    const { data } = await db.from('admin_users').select('password_hash').eq('id', req.admin!.id).maybeSingle();
    if (!data || !verifyPassword(currentPassword, data.password_hash)) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }
    if (!await requireAuditRecord(req, res, {
      actor: req.admin!,
      action: 'admin.password.change.authorized',
      targetType: 'admin_user',
      targetId: req.admin!.id,
      reason: 'Authenticated password change',
    })) return;
    const now = new Date().toISOString();
    const { error: revokeError } = await revokeAllOwnedSessions(db, 'admin', req.admin!.id, now);
    if (revokeError) {
      res.status(503).json({ error: 'Could not revoke active Admin sessions' });
      return;
    }
    const { error: passwordError } = await db.from('admin_users').update({
      password_hash: hashPassword(newPassword),
      password_changed_at: now,
      must_change_password: false,
      updated_at: now,
    }).eq('id', req.admin!.id);
    if (passwordError) {
      clearAdminCookie(res);
      res.status(500).json({ error: 'Could not update Admin password' });
      return;
    }
    await audit(req, { actor: req.admin!, action: 'admin.password.changed', targetType: 'admin_user', targetId: req.admin!.id });
    clearAdminCookie(res);
    res.json({ updated: true, reauthenticationRequired: true });
  });

  router.use((req: AdminRequest, res, next) => {
    if (req.admin?.mustChangePassword) {
      res.status(403).json({ error: 'Password change is required' });
      return;
    }
    next();
  });

  const routeDeps: AdminRouteDeps = {
    actor: (req) => (req as AdminRequest).admin!,
    audit,
    requireAuditRecord,
    requirePermission,
  };
  registerCatalogRoutes(router, routeDeps);
  registerShipmentRoutes(router, routeDeps);
  registerContentAdminRoutes(router, routeDeps);
  registerPrivacyRoutes(router, routeDeps);
  registerAdminUserRoutes(router, routeDeps);
  registerVendorApplicationAdminRoutes(router, routeDeps);

  router.get('/admin-panel/context', requirePermission('dashboard:read'), async (req: AdminRequest, res) => {
    res.json(await compatibleContext(req.admin!));
  });

  router.get('/admin-panel/data', requirePermission('dashboard:read'), async (_req, res) => {
    res.json(await compatiblePanelData());
  });

  router.get('/dashboard', requirePermission('dashboard:read'), async (req, res) => {
    const rangeDays = [7, 30, 90].includes(Number(req.query.rangeDays)) ? Number(req.query.rangeDays) : 30;
    res.json(await getDashboard(rangeDays));
  });

  router.get('/users', requirePermission('users:read'), async (req, res) => {
    const { page, pageSize, from, to } = pagination(req);
    const search = normalizeAdminSearch(req.query.search);
    if (search === null) {
      res.status(400).json({ error: 'Invalid user search' });
      return;
    }
    const status = cleanText(req.query.status, 30);
    if (status && !['active', 'inactive'].includes(status)) {
      res.status(400).json({ error: 'Invalid user status filter' });
      return;
    }
    if (!await requireAuditRecord(req as AdminRequest, res, {
      actor: (req as AdminRequest).admin!,
      action: 'users.directory.viewed',
      targetType: 'user_directory',
      reason: 'Administrative user directory access',
      metadata: { page, pageSize, status: status || null, searched: Boolean(search) },
    })) return;
    const db = getServiceClient();
    let query = db.from('admin_user_directory').select(
      'id, email, created_at, last_sign_in_at, full_name, role, profile_updated_at, account_status, status, status_reason, state_updated_at',
      { count: 'exact' },
    );
    if (search) query = query.ilike('email', `%${search}%`);
    if (status) query = query.eq('status', status);
    query = query.order('created_at', { ascending: false }).range(from, to);
    const { data: accounts, count, error } = await query;
    if (error) {
      res.status(500).json({ error: 'Could not load users' });
      return;
    }
    const items = (accounts ?? []).map((account) => ({
        id: account.id,
        displayName: account.full_name || account.email.split('@')[0],
        email: account.email,
        role: account.role || 'member',
        status: account.status,
        accountStatus: account.account_status,
        statusReason: account.status_reason,
        lastLoginAt: account.last_sign_in_at,
        createdAt: account.created_at,
        updatedAt: account.state_updated_at ?? account.profile_updated_at ?? account.created_at,
      }));
    res.json({ items, page, pageSize, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / pageSize) });
  });

  router.get('/users/:id', requirePermission('users:read'), async (req, res) => {
    if (!isUuid(req.params.id)) {
      res.status(400).json({ error: 'Invalid user identifier' });
      return;
    }
    const db = getServiceClient();
    const [{ data: account }, { data: profile }, { data: state }, shipmentCount, exportCount, deletionCount] = await Promise.all([
      db.from('user_accounts').select('id, email, created_at, last_sign_in_at').eq('id', req.params.id).maybeSingle(),
      db.from('user_profiles').select('full_name, organization, role, updated_at').eq('account_id', req.params.id).maybeSingle(),
      db.from('account_admin_state').select('status, reason, suspended_at, restored_at, updated_at').eq('account_id', req.params.id).maybeSingle(),
      countRows('shipments', (query) => query.eq('account_id', req.params.id)),
      countRows('data_export_requests', (query) => query.eq('user_id', req.params.id)),
      countRows('account_deletion_requests', (query) => query.eq('user_id', req.params.id)),
    ]);
    if (!account) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    if (!await requireAuditRecord(req as AdminRequest, res, {
      actor: (req as AdminRequest).admin!,
      action: 'user.record.viewed',
      targetType: 'user_account',
      targetId: account.id,
      reason: 'Administrative user record access',
    })) return;
    res.json({
      id: account.id,
      email: account.email,
      displayName: profile?.full_name || account.email.split('@')[0],
      organization: profile?.organization ?? null,
      role: profile?.role ?? 'member',
      status: state?.status ?? 'active',
      statusReason: state?.reason ?? null,
      suspendedAt: state?.suspended_at ?? null,
      restoredAt: state?.restored_at ?? null,
      lastLoginAt: account.last_sign_in_at,
      createdAt: account.created_at,
      counts: { shipments: shipmentCount, exportRequests: exportCount, deletionRequests: deletionCount },
    });
  });

  router.patch('/users/:id/status', requirePermission('users:manage'), async (req: AdminRequest, res) => {
    if (!isUuid(req.params.id)) {
      res.status(400).json({ error: 'Invalid user identifier' });
      return;
    }
    const status = req.body?.status;
    const reason = cleanText(req.body?.reason, 500);
    if (!['active', 'suspended'].includes(status) || !reason) {
      res.status(400).json({ error: 'Status and reason are required' });
      return;
    }
    const db = getServiceClient();
    const { data: account } = await db.from('user_accounts').select('id').eq('id', req.params.id).maybeSingle();
    if (!account) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    if (!await requireAuditRecord(req, res, {
      actor: req.admin!,
      action: 'user.status.change.authorized',
      targetType: 'user_account',
      targetId: account.id,
      reason,
      metadata: { status },
    })) return;
    const now = new Date().toISOString();
    if (status === 'suspended') {
      const { error: revokeError } = await revokeAllOwnedSessions(db, 'customer', account.id, now);
      if (revokeError) {
        res.status(503).json({ error: 'Active sessions could not be revoked' });
        return;
      }
    }
    const { error } = await db.from('account_admin_state').upsert({
      account_id: account.id,
      status,
      reason,
      changed_by: req.admin!.id,
      suspended_at: status === 'suspended' ? now : null,
      restored_at: status === 'active' ? now : null,
      updated_at: now,
    });
    if (error) {
      res.status(500).json({ error: 'Could not update account status' });
      return;
    }
    await audit(req, {
      actor: req.admin!,
      action: status === 'suspended' ? 'user.suspended' : 'user.restored',
      targetType: 'user_account',
      targetId: account.id,
      reason,
    });
    res.json({ id: account.id, status, reason, updatedAt: now });
  });

  router.get('/shipments', requirePermission('shipments:read'), async (req, res) => {
    const { page, pageSize, from, to } = pagination(req);
    const search = normalizeAdminSearch(req.query.search);
    if (search === null) {
      res.status(400).json({ error: 'Invalid shipment search' });
      return;
    }
    const status = cleanText(req.query.status, 30);
    if (status && !['submitted', 'in_transit', 'testing', 'delivered'].includes(status)) {
      res.status(400).json({ error: 'Invalid shipment status filter' });
      return;
    }
    if (!await requireAuditRecord(req as AdminRequest, res, {
      actor: (req as AdminRequest).admin!,
      action: 'shipments.directory.viewed',
      targetType: 'shipment_directory',
      reason: 'Administrative shipment directory access',
      metadata: { page, pageSize, status: status || null, searched: Boolean(search) },
    })) return;
    const db = getServiceClient();
    let query = db.from('shipments')
      .select('id, account_id, tracking_id, status, created_at, updated_at', { count: 'exact' });
    if (search) query = query.ilike('tracking_id', `%${search}%`);
    if (status) query = query.eq('status', status);
    query = query.order('created_at', { ascending: false }).range(from, to);
    const { data: shipments, count, error } = await query;
    if (error) {
      res.status(500).json({ error: 'Could not load shipments' });
      return;
    }
    const shipmentIds = (shipments ?? []).map((shipment) => shipment.id);
    const accountIds = [...new Set((shipments ?? []).map((shipment) => shipment.account_id).filter(Boolean))];
    const [{ data: samples }, { data: accounts }] = await Promise.all([
      shipmentIds.length
        ? db.from('shipment_samples').select('shipment_id').in('shipment_id', shipmentIds)
        : Promise.resolve({ data: [] }),
      accountIds.length
        ? db.from('user_accounts').select('id, email').in('id', accountIds)
        : Promise.resolve({ data: [] }),
    ]);
    const sampleCounts = new Map<string, number>();
    for (const sample of samples ?? []) {
      sampleCounts.set(sample.shipment_id, (sampleCounts.get(sample.shipment_id) ?? 0) + 1);
    }
    const emailById = new Map((accounts ?? []).map((account) => [account.id, account.email]));
    res.json({
      items: (shipments ?? []).map((shipment) => ({
        ...shipment,
        account_email: emailById.get(shipment.account_id) ?? null,
        sample_count: sampleCounts.get(shipment.id) ?? 1,
      })),
      page,
      pageSize,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / pageSize),
    });
  });

  router.patch('/shipments/:id/status', requirePermission('shipments:manage'), async (req: AdminRequest, res) => {
    if (!isUuid(req.params.id)) {
      res.status(400).json({ error: 'Invalid shipment identifier' });
      return;
    }
    const status = cleanText(req.body?.status, 30);
    const reason = cleanText(req.body?.reason, 500);
    if (!['submitted', 'in_transit', 'testing', 'delivered'].includes(status) || !reason) {
      res.status(400).json({ error: 'A valid status and reason are required' });
      return;
    }
    const now = new Date().toISOString();
    const { data: existing } = await getServiceClient().from('shipments')
      .select('id, account_id')
      .eq('id', req.params.id)
      .maybeSingle();
    if (!existing) {
      res.status(404).json({ error: 'Shipment not found' });
      return;
    }
    if (!await requireAuditRecord(req, res, {
      actor: req.admin!,
      action: 'shipment.status.change.authorized',
      targetType: 'shipment',
      targetId: existing.id,
      reason,
      metadata: { accountId: existing.account_id, status },
    })) return;
    const { data, error } = await getServiceClient().from('shipments')
      .update({ status, updated_at: now })
      .eq('id', req.params.id)
      .select('id, account_id, tracking_id, status, updated_at')
      .maybeSingle();
    if (error) {
      res.status(500).json({ error: 'Could not update shipment status' });
      return;
    }
    if (!data) {
      res.status(404).json({ error: 'Shipment not found' });
      return;
    }
    await audit(req, {
      actor: req.admin!,
      action: 'shipment.status.updated',
      targetType: 'shipment',
      targetId: data.id,
      reason,
      metadata: { accountId: data.account_id, status },
    });
    res.json(data);
  });

  router.get('/billing/subscriptions', requirePermission('billing:read'), async (req, res) => {
    const { page, pageSize, from, to } = pagination(req);
    const status = cleanText(req.query.status, 30);
    if (status && !['trialing', 'active', 'past_due', 'paused', 'canceled', 'expired', 'incomplete'].includes(status)) {
      res.status(400).json({ error: 'Invalid subscription status filter' });
      return;
    }
    if (!await requireAuditRecord(req as AdminRequest, res, {
      actor: (req as AdminRequest).admin!,
      action: 'billing.subscriptions.viewed',
      targetType: 'subscription_directory',
      reason: 'Administrative billing access',
      metadata: { page, pageSize, status: status || null },
    })) return;
    let query = getServiceClient().from('subscriptions').select(
      'id, user_id, provider, plan, status, trial_start, trial_end, current_period_start, current_period_end, cancel_at_period_end, canceled_at, expires_at, currency, amount_cents, last_webhook_at, created_at, updated_at',
      { count: 'exact' },
    );
    if (status) query = query.eq('status', status);
    const { data, count, error } = await query.order('updated_at', { ascending: false }).range(from, to);
    if (error) {
      res.status(500).json({ error: 'Could not load subscriptions' });
      return;
    }
    res.json({ items: data ?? [], page, pageSize, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / pageSize) });
  });

  router.get('/support/requests', requirePermission('support:read'), async (req, res) => {
    const { page, pageSize, from, to } = pagination(req);
    const status = cleanText(req.query.status, 30);
    if (status && !['open', 'pending', 'resolved', 'closed'].includes(status)) {
      res.status(400).json({ error: 'Invalid support status filter' });
      return;
    }
    if (!await requireAuditRecord(req as AdminRequest, res, {
      actor: (req as AdminRequest).admin!, action: 'support.requests.viewed', targetType: 'support_directory',
      reason: 'Administrative support access', metadata: { page, pageSize, status: status || null },
    })) return;
    let query = getServiceClient().from('support_requests')
      .select('id, user_id, category, subject, status, assigned_admin_id, created_at, updated_at, resolved_at', { count: 'exact' });
    if (status) query = query.eq('status', status);
    const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to);
    if (error) {
      res.status(500).json({ error: 'Could not load support requests' });
      return;
    }
    res.json({ items: data ?? [], page, pageSize, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / pageSize) });
  });

  router.get('/support/requests/:id', requirePermission('support:read'), async (req, res) => {
    if (!isUuid(req.params.id)) {
      res.status(400).json({ error: 'Invalid support request identifier' });
      return;
    }
    const db = getServiceClient();
    const [{ data: request, error }, { data: notes }] = await Promise.all([
      db.from('support_requests')
        .select('id, user_id, contact_email, category, subject, message, status, assigned_admin_id, created_at, updated_at, resolved_at')
        .eq('id', req.params.id)
        .maybeSingle(),
      db.from('support_internal_notes')
        .select('id, admin_id, note, created_at')
        .eq('request_id', req.params.id)
        .order('created_at', { ascending: true }),
    ]);
    if (error) {
      res.status(500).json({ error: 'Could not load support request' });
      return;
    }
    if (!request) {
      res.status(404).json({ error: 'Support request not found' });
      return;
    }
    if (!await requireAuditRecord(req as AdminRequest, res, {
      actor: (req as AdminRequest).admin!, action: 'support.request.viewed', targetType: 'support_request',
      targetId: request.id, reason: 'Administrative support record access',
    })) return;
    res.json({ ...request, notes: notes ?? [] });
  });

  router.patch('/support/requests/:id', requirePermission('support:manage'), async (req: AdminRequest, res) => {
    if (!isUuid(req.params.id)) {
      res.status(400).json({ error: 'Invalid support request identifier' });
      return;
    }
    const status = req.body?.status;
    const assignToSelf = req.body?.assignToSelf === true;
    const unassign = req.body?.unassign === true;
    const reason = cleanText(req.body?.reason, 500);
    if (status !== undefined && !['open', 'pending', 'resolved', 'closed'].includes(status)) {
      res.status(400).json({ error: 'Invalid support status' });
      return;
    }
    if (assignToSelf && unassign) {
      res.status(400).json({ error: 'Choose either assignment or unassignment' });
      return;
    }
    if (status === undefined && !assignToSelf && !unassign) {
      res.status(400).json({ error: 'No support changes were provided' });
      return;
    }
    if (!reason) {
      res.status(400).json({ error: 'A reason is required' });
      return;
    }

    const db = getServiceClient();
    const { data: existing } = await db.from('support_requests').select('id').eq('id', req.params.id).maybeSingle();
    if (!existing) {
      res.status(404).json({ error: 'Support request not found' });
      return;
    }
    if (!await requireAuditRecord(req, res, {
      actor: req.admin!, action: 'support.request.change.authorized', targetType: 'support_request',
      targetId: existing.id, reason,
      metadata: { status: status ?? null, assignment: assignToSelf ? 'self' : unassign ? 'none' : 'unchanged' },
    })) return;
    const now = new Date().toISOString();
    const updates: Record<string, unknown> = { updated_at: now };
    if (status !== undefined) {
      updates.status = status;
      updates.resolved_at = ['resolved', 'closed'].includes(status) ? now : null;
    }
    if (assignToSelf) updates.assigned_admin_id = req.admin!.id;
    if (unassign) updates.assigned_admin_id = null;
    const { data, error } = await db.from('support_requests').update(updates)
      .eq('id', req.params.id)
      .select('id, status, assigned_admin_id, updated_at, resolved_at')
      .single();
    if (error || !data) {
      res.status(500).json({ error: 'Could not update support request' });
      return;
    }
    await audit(req, {
      actor: req.admin!,
      action: 'support.request.updated',
      targetType: 'support_request',
      targetId: String(req.params.id),
      reason,
      metadata: { status: status ?? null, assignment: assignToSelf ? 'self' : unassign ? 'none' : 'unchanged' },
    });
    res.json(data);
  });

  router.post('/support/requests/:id/notes', requirePermission('support:manage'), async (req: AdminRequest, res) => {
    if (!isUuid(req.params.id)) {
      res.status(400).json({ error: 'Invalid support request identifier' });
      return;
    }
    const note = cleanText(req.body?.note, 5000);
    if (!note) {
      res.status(400).json({ error: 'A note is required' });
      return;
    }
    const db = getServiceClient();
    const { data: existing } = await db.from('support_requests').select('id').eq('id', req.params.id).maybeSingle();
    if (!existing) {
      res.status(404).json({ error: 'Support request not found' });
      return;
    }
    if (!await requireAuditRecord(req, res, {
      actor: req.admin!, action: 'support.note.create.authorized', targetType: 'support_request',
      targetId: existing.id, reason: 'Internal support note creation',
    })) return;
    const { data, error } = await db.from('support_internal_notes').insert({
      request_id: req.params.id,
      admin_id: req.admin!.id,
      note,
    }).select('id, admin_id, note, created_at').single();
    if (error || !data) {
      res.status(500).json({ error: 'Could not add support note' });
      return;
    }
    await audit(req, {
      actor: req.admin!,
      action: 'support.note.created',
      targetType: 'support_request',
      targetId: String(req.params.id),
      metadata: { noteId: data.id },
    });
    res.status(201).json(data);
  });

  router.get('/audit', requirePermission('audit:read'), async (req, res) => {
    const { page, pageSize, from, to } = pagination(req);
    const action = cleanText(req.query.action, 100);
    if (action && !/^[a-z0-9._-]{1,100}$/i.test(action)) {
      res.status(400).json({ error: 'Invalid audit action filter' });
      return;
    }
    if (!await requireAuditRecord(req as AdminRequest, res, {
      actor: (req as AdminRequest).admin!, action: 'audit.log.viewed', targetType: 'admin_audit_log',
      reason: 'Administrative audit access', metadata: { page, pageSize, filtered: Boolean(action) },
    })) return;
    let query = getServiceClient().from('admin_audit_log')
      .select('id, actor_id, actor_email, action, target_type, target_id, reason, metadata, request_id, created_at', { count: 'exact' });
    if (action) query = query.eq('action', action);
    const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to);
    if (error) {
      res.status(500).json({ error: 'Could not load audit history' });
      return;
    }
    res.json({ items: data ?? [], page, pageSize, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / pageSize) });
  });

  router.get('/system/health', requirePermission('system:read'), async (_req, res) => {
    const started = Date.now();
    const db = getServiceClient();
    const { error: databaseError } = await db.from('user_accounts').select('id', { head: true, count: 'exact' });
    const [{ count: webhookFailures }, { count: notificationFailures }, { count: systemFailures }, storageCheck, authenticationCheck] = await Promise.all([
      db.from('billing_webhook_events').select('*', { head: true, count: 'exact' }).eq('status', 'failed'),
      db.from('notification_events').select('*', { head: true, count: 'exact' }).in('status', ['failed', 'retrying']),
      db.from('system_events').select('*', { head: true, count: 'exact' }).eq('status', 'open').in('severity', ['error', 'critical']),
      db.storage.getBucket('profile_photos'),
      providerRequiresEmailConfirmation().then(() => true).catch(() => false),
    ]);
    res.json({
      checkedAt: new Date().toISOString(),
      services: {
        backend: { status: 'operational', latencyMs: Date.now() - started },
        database: { status: databaseError ? 'degraded' : 'operational' },
        authentication: { status: authenticationCheck ? 'operational' : 'degraded' },
        storage: { status: storageCheck.error ? 'degraded' : 'operational' },
        billing: { status: process.env.BILLING_PROVIDER ? 'configured' : 'not_configured', failures: webhookFailures ?? 0 },
        email: {
          status: authenticationCheck
            ? (process.env.EMAIL_PROVIDER ? 'configured' : 'authentication_only')
            : 'degraded',
          failures: notificationFailures ?? 0,
        },
        push: { status: process.env.PUSH_PROVIDER ? 'configured' : 'not_configured' },
        ai: { status: process.env.AI_PROVIDER ? 'configured' : 'not_configured' },
        workers: { status: process.env.PRIVACY_WORKER_ENABLED === 'false' ? 'disabled' : 'configured' },
        systemEvents: { status: (systemFailures ?? 0) > 0 ? 'degraded' : 'operational', failures: systemFailures ?? 0 },
      },
    });
  });

  return router;
};

export const getAccountOperationalStatus = async (userId: string): Promise<string> => {
  const { data, error } = await getServiceClient().from('account_admin_state').select('status').eq('account_id', userId).maybeSingle();
  if (error) throw new Error(`Could not load account status: ${error.code}`);
  return data?.status ?? 'active';
};

export const hashUserSubject = subjectHash;
