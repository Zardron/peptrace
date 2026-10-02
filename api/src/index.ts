import 'dotenv/config';
import crypto from 'node:crypto';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { supabase, getServiceClient, sessionSecret } from './supabase.js';
import { createAdminRouter, ensureAdminBootstrap, getAccountOperationalStatus, hashUserSubject } from './admin.js';
import {
  hashPassword,
  verifyPassword,
  isValidEmail,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
} from './auth.js';

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.set('trust proxy', 1);
const allowedOrigins = new Set(
  (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
);
app.use(cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origin is not allowed'));
  },
}));
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'same-site' },
}));
app.use((req, res, next) => {
  const incoming = req.headers['x-request-id'];
  const id = typeof incoming === 'string' && /^[a-zA-Z0-9._:-]{1,128}$/.test(incoming)
    ? incoming
    : crypto.randomUUID();
  req.headers['x-request-id'] = id;
  res.setHeader('X-Request-Id', id);
  next();
});
// 8 MB to fit base64-encoded avatar uploads (5 MB decoded cap below).
app.use(express.json({ limit: '8mb' }));
app.use('/admin', createAdminRouter());

interface Session {
  userId: string;
  email: string;
  name: string | null;
  customerSessionId?: string;
  rawCustomerSessionToken?: string;
  // Opaque sessions resolve to the service client. Every user-data query below
  // carries an explicit account filter; the browser never receives this key.
  db: ReturnType<typeof getServiceClient>;
}

const CUSTOMER_SESSION_COOKIE = 'peptrace_session';
const CUSTOMER_SESSION_SECONDS = 7 * 24 * 60 * 60;

const parseCookieHeader = (header: string | undefined): Record<string, string> => {
  if (!header) return {};
  return Object.fromEntries(header.split(';').flatMap((part) => {
    const separator = part.indexOf('=');
    if (separator < 1) return [];
    try {
      return [[part.slice(0, separator).trim(), decodeURIComponent(part.slice(separator + 1).trim())]];
    } catch {
      return [];
    }
  }));
};

const customerTokenHash = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

const customerCsrfToken = (token: string): string =>
  crypto.createHmac('sha256', sessionSecret()!).update(`customer-csrf:${token}`).digest('base64url');

const setCustomerCookie = (res: express.Response, token: string): void => {
  res.cookie(CUSTOMER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api',
    maxAge: CUSTOMER_SESSION_SECONDS * 1000,
  });
};

const clearCustomerCookie = (res: express.Response): void => {
  res.clearCookie(CUSTOMER_SESSION_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api',
  });
};

const createCustomerSession = async (
  req: express.Request,
  res: express.Response,
  userId: string,
  source: 'native' | 'supabase',
): Promise<string> => {
  const token = crypto.randomBytes(48).toString('base64url');
  const expiresAt = new Date(Date.now() + CUSTOMER_SESSION_SECONDS * 1000).toISOString();
  const address = req.ip || req.socket.remoteAddress || 'unknown';
  const { error } = await getServiceClient().from('customer_sessions').insert({
    user_id: userId,
    token_hash: customerTokenHash(token),
    source,
    expires_at: expiresAt,
    ip_hash: crypto.createHmac('sha256', sessionSecret()!).update(`customer-ip:${address}`).digest('hex'),
    user_agent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'].slice(0, 500) : null,
  });
  if (error) throw new Error(`Could not create customer session: ${error.code}`);
  setCustomerCookie(res, token);
  return customerCsrfToken(token);
};

app.use((req, res, next) => {
  if (req.path.startsWith('/admin/') || ['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }
  if (['/auth/login', '/auth/register', '/auth/exchange'].includes(req.path)) {
    next();
    return;
  }
  const token = parseCookieHeader(req.headers.cookie)[CUSTOMER_SESSION_COOKIE];
  if (!token) {
    next();
    return;
  }
  const provided = req.headers['x-csrf-token'];
  const expected = customerCsrfToken(token);
  if (typeof provided !== 'string' || provided.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) {
    res.status(403).json({ error: 'CSRF validation failed' });
    return;
  }
  next();
});

app.get('/vendors', async (_req, res) => {
  const { data, error } = await supabase
    .from('vendors')
    .select('id, name, score, cost_per_mg, location, tests_count, products_count, latest_tested_at')
    .eq('is_demo', false)
    .order('score', { ascending: false });
  if (error) {
    res.status(500).json({ error: 'Failed to load vendors' });
    return;
  }
  res.json({ vendors: data });
});

app.get('/peptides', async (_req, res) => {
  const { data, error } = await supabase
    .from('peptides')
    .select('id, name, testing_price')
    .order('name', { ascending: true });
  if (error) {
    res.status(500).json({ error: 'Failed to load peptides' });
    return;
  }
  res.json({ peptides: data });
});

app.get('/vendors/:id', async (req, res) => {
  const id = req.params.id;
  const db = getServiceClient();

  // Try lookup by id first (only when the param is a uuid), then by slug.
  let vendor = null;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    const { data, error } = await db
      .from('vendors')
      .select('*')
      .eq('id', id)
      .eq('is_demo', false)
      .maybeSingle();
    if (error) {
      res.status(500).json({ error: 'Failed to load vendor' });
      return;
    }
    vendor = data;
  }
  if (!vendor) {
    const { data: bySlug, error: slugError } = await db
      .from('vendors')
      .select('*')
      .eq('slug', id)
      .eq('is_demo', false)
      .maybeSingle();
    if (slugError) {
      res.status(500).json({ error: 'Failed to load vendor' });
      return;
    }
    vendor = bySlug;
  }
  if (!vendor) {
    res.status(404).json({ error: 'Vendor not found' });
    return;
  }

  // Build a slug if missing (backfill helper).
  const slug =
    vendor.slug ??
    vendor.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  // Test history from the vendor_tests table.
  const { data: testRows, error: testsError } = await db
    .from('vendor_tests')
    .select(
      'tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url',
    )
    .eq('vendor_id', vendor.id)
    .eq('is_demo', false)
    .order('tested_at', { ascending: false });
  if (testsError) {
    res.status(500).json({ error: 'Failed to load vendor test history' });
    return;
  }

  const items = (testRows ?? []).map((t) => ({
    date: t.tested_at,
    result: t.result as 'pass' | 'fail',
    peptideName: t.peptide_name,
    vendorName: vendor.name,
    labName: t.lab_name,
    purity: t.purity == null ? null : Number(t.purity),
    dosageDeviation: t.dosage_deviation,
    testedMg: t.tested_mg == null ? null : Number(t.tested_mg),
    labelMg: t.label_mg == null ? null : Number(t.label_mg),
    batchInfo: t.batch_code,
    sender: t.sender,
    coaUrl: t.coa_url,
  }));

  const passCount = items.filter((item) => item.result === 'pass').length;
  const testsCount = items.length;
  const testsPassed = passCount;
  const testsTotal = testsCount;
  const rating = testsTotal > 0 ? Math.round((testsPassed / testsTotal) * 100) : null;

  const peptideGroups = new Map<string, { pass: number; total: number; purityTotal: number; purityCount: number }>();
  for (const item of items) {
    const group = peptideGroups.get(item.peptideName) ?? { pass: 0, total: 0, purityTotal: 0, purityCount: 0 };
    group.total += 1;
    if (item.result === 'pass') group.pass += 1;
    if (item.purity != null) {
      group.purityTotal += item.purity;
      group.purityCount += 1;
    }
    peptideGroups.set(item.peptideName, group);
  }
  const peptides = [...peptideGroups.entries()].map(([name, group]) => ({
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    name,
    pricePerMg: vendor.cost_per_mg == null ? null : Number(vendor.cost_per_mg),
    rating: group.total > 0 ? Math.round((group.pass / group.total) * 100) : null,
    averagePurity: group.purityCount > 0
      ? Math.round((group.purityTotal / group.purityCount) * 10) / 10
      : null,
    testCount: group.total,
  }));

  const chronologicalItems = [...items].reverse();
  let cumulativePasses = 0;
  const trendPoints = chronologicalItems.map((item, index) => {
    if (item.result === 'pass') cumulativePasses += 1;
    const pointRating = Math.round((cumulativePasses / (index + 1)) * 100);
    return { date: item.date, rating: pointRating, label: `${pointRating}%` };
  });
  const ratingTrend = trendPoints.length > 0 ? {
    bands: [
      { label: '83%+', threshold: 83 },
      { label: '65%+', threshold: 65 },
      { label: '48%+', threshold: 48 },
      { label: '30%+', threshold: 30 },
      { label: '<30%', threshold: 0 },
    ],
    points: trendPoints,
    xAxisLabels: [...new Set([
      trendPoints[0]?.date,
      trendPoints[Math.floor((trendPoints.length - 1) / 2)]?.date,
      trendPoints.at(-1)?.date,
    ].filter((value): value is string => Boolean(value)))],
  } : null;

  const storedContacts = Array.isArray(vendor.contact_channels) ? vendor.contact_channels : [];
  const contactChannels = [...storedContacts];
  if (vendor.website_url && !contactChannels.some((channel: { type?: string }) => channel.type === 'website')) {
    contactChannels.unshift({ type: 'website', value: vendor.website_url, url: vendor.website_url });
  }

  const storedReport = vendor.intelligence_report;
  const intelligenceReport = storedReport && typeof storedReport === 'object' && storedReport.title
    ? storedReport
    : null;

  const { data: rankedTestRows } = await db
    .from('vendor_tests')
    .select('vendor_id, result')
    .eq('is_demo', false);
  const rankTotals = new Map<string, { pass: number; total: number }>();
  for (const row of rankedTestRows ?? []) {
    const value = rankTotals.get(row.vendor_id) ?? { pass: 0, total: 0 };
    value.total += 1;
    if (row.result === 'pass') value.pass += 1;
    rankTotals.set(row.vendor_id, value);
  }
  const rankedVendorIds = [...rankTotals.entries()]
    .sort((a, b) => (b[1].pass / b[1].total) - (a[1].pass / a[1].total))
    .map(([vendorId]) => vendorId);
  const rankIndex = rankedVendorIds.indexOf(vendor.id);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  const testHistory = {
    total: items.length,
    passCount,
    failCount: items.length - passCount,
    items,
    pagination: {
      page: 1,
      pageSize,
      totalPages,
    },
  };

  res.json({
    vendor: {
      id: vendor.id,
      name: vendor.name,
      slug,
      location: vendor.location ?? '—',
      websiteUrl: vendor.website_url ?? '',
      avatarUrl: vendor.avatar_url ?? null,
      testsCount,
      peptidesCount: peptides.length,
      latestUpdate: items[0]?.date ?? null,
      rating,
      rank: rankIndex >= 0 ? rankIndex + 1 : null,
      rankedVendorsCount: rankedVendorIds.length,
      testsPassed,
      testsTotal,
      analysisText: vendor.analysis_text ?? null,
      about: vendor.about ?? null,
      correctionsCount: 0,
      corrections: [],
      contactChannels,
      intelligenceReport,
      peptides,
      ratingTrend,
      testHistory,
    },
  });
});

// One leaderboard card per peptide, rows ranked by rating. Public catalog
// data, read through the service client so no RLS policies on the shared
// admin-portal tables need to change. The query is the slowest in the app,
// so results are cached in memory for 24 hours; the in-flight promise is
// cached too so concurrent cold-cache requests share one database read.
const LEADERBOARDS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface LeaderboardsCard {
  peptideId: string;
  productName: string;
  slug: string;
  testCount: number;
  vendorCount: number;
  lastUpdated: string | null;
  rows: {
    vendorName: string;
    pricePerMg: number | null;
    rating: number | null;
    purityPercent: number | null;
    testCount: number;
  }[];
}

let leaderboardsCache: { expiresAt: number; promise: Promise<LeaderboardsCard[]> } | null = null;

const loadLeaderboardsCards = async (): Promise<LeaderboardsCard[]> => {
  const db = getServiceClient();
  const [{ data: tests, error: testsError }, { data: vendors, error: vendorsError }] = await Promise.all([
    db.from('vendor_tests')
      .select('vendor_id, peptide_name, result, purity, tested_at')
      .eq('is_demo', false),
    db.from('vendors')
      .select('id, name, cost_per_mg')
      .eq('is_demo', false),
  ]);
  if (testsError || vendorsError) {
    throw new Error(testsError?.message ?? vendorsError?.message ?? 'Catalog query failed');
  }

  const vendorById = new Map((vendors ?? []).map((vendor) => [vendor.id, vendor]));
  interface Aggregate {
    vendorId: string;
    vendorName: string;
    pricePerMg: number | null;
    pass: number;
    total: number;
    purityTotal: number;
    purityCount: number;
    latest: string | null;
  }
  const byPeptide = new Map<string, Map<string, Aggregate>>();
  for (const test of tests ?? []) {
    const vendor = vendorById.get(test.vendor_id);
    if (!vendor) continue;
    const vendorGroups = byPeptide.get(test.peptide_name) ?? new Map<string, Aggregate>();
    const aggregate = vendorGroups.get(vendor.id) ?? {
      vendorId: vendor.id,
      vendorName: vendor.name,
      pricePerMg: vendor.cost_per_mg == null ? null : Number(vendor.cost_per_mg),
      pass: 0,
      total: 0,
      purityTotal: 0,
      purityCount: 0,
      latest: null,
    };
    aggregate.total += 1;
    if (test.result === 'pass') aggregate.pass += 1;
    if (test.purity != null) {
      aggregate.purityTotal += Number(test.purity);
      aggregate.purityCount += 1;
    }
    if (!aggregate.latest || test.tested_at > aggregate.latest) aggregate.latest = test.tested_at;
    vendorGroups.set(vendor.id, aggregate);
    byPeptide.set(test.peptide_name, vendorGroups);
  }

  return [...byPeptide.entries()]
    .map(([productName, vendorGroups]) => {
      const groups = [...vendorGroups.values()];
      const slug = productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return {
        peptideId: slug,
        productName,
        slug,
        testCount: groups.reduce((sum, group) => sum + group.total, 0),
        vendorCount: groups.length,
        lastUpdated: groups.map((group) => group.latest).filter((value): value is string => Boolean(value)).sort().at(-1) ?? null,
        rows: groups.map((group) => ({
          vendorName: group.vendorName,
          pricePerMg: group.pricePerMg,
          rating: group.total > 0 ? group.pass / group.total : null,
          purityPercent: group.purityCount > 0 ? group.purityTotal / group.purityCount : null,
          testCount: group.total,
        })),
      };
    })
    .sort((a, b) => b.testCount - a.testCount);
};

const getLeaderboardsCards = (): Promise<LeaderboardsCard[]> => {
  if (!leaderboardsCache || leaderboardsCache.expiresAt <= Date.now()) {
    leaderboardsCache = {
      expiresAt: Date.now() + LEADERBOARDS_CACHE_TTL_MS,
      promise: loadLeaderboardsCards().catch((err) => {
        leaderboardsCache = null;
        throw err;
      }),
    };
  }
  return leaderboardsCache.promise;
};

app.get('/leaderboards', async (_req, res) => {
  try {
    const cards = await getLeaderboardsCards();
    res.json({ cards });
  } catch {
    res.status(500).json({ error: 'Failed to load leaderboards' });
  }
});

// Product-scoped leaderboard metadata and vendor rankings for the FullLeaderboard page.
app.get('/products/:slug/leaderboard', async (req, res) => {
  const slug = req.params.slug;
  const db = getServiceClient();
  const [{ data: tests, error: testsError }, { data: vendorRows, error: vendorError }] = await Promise.all([
    db.from('vendor_tests')
      .select('vendor_id, peptide_name, result, purity, tested_at')
      .eq('is_demo', false),
    db.from('vendors')
      .select('id, name, slug, cost_per_mg')
      .eq('is_demo', false),
  ]);
  if (testsError || vendorError) {
    res.status(500).json({ error: 'Failed to load leaderboard' });
    return;
  }

  const matchingTests = (tests ?? []).filter((test) => (
    test.peptide_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') === slug
  ));
  const productName = matchingTests[0]?.peptide_name ?? slug.replace(/-/g, ' ');
  const vendorById = new Map((vendorRows ?? []).map((vendor) => [vendor.id, vendor]));
  const byVendor = new Map<string, {
    pass: number;
    total: number;
    purityTotal: number;
    purityCount: number;
  }>();
  for (const test of matchingTests) {
    if (!vendorById.has(test.vendor_id)) continue;
    const aggregate = byVendor.get(test.vendor_id) ?? { pass: 0, total: 0, purityTotal: 0, purityCount: 0 };
    aggregate.total += 1;
    if (test.result === 'pass') aggregate.pass += 1;
    if (test.purity != null) {
      aggregate.purityTotal += Number(test.purity);
      aggregate.purityCount += 1;
    }
    byVendor.set(test.vendor_id, aggregate);
  }

  const vendors = [...byVendor.entries()]
    .map(([vendorId, aggregate]) => ({ vendor: vendorById.get(vendorId)!, aggregate }))
    .sort((a, b) => (b.aggregate.pass / b.aggregate.total) - (a.aggregate.pass / a.aggregate.total))
    .map(({ vendor, aggregate }, index) => ({
      rank: index + 1,
      name: vendor.name,
      slug: vendor.slug ?? vendor.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      initials: vendor.name.split(/\s+/).map((word: string) => word[0]).join('').slice(0, 2).toUpperCase(),
      isVerified: aggregate.total > 0,
      pricePerMg: vendor.cost_per_mg == null ? null : Number(vendor.cost_per_mg),
      customerRating: Math.round((aggregate.pass / aggregate.total) * 100),
      purityRating: aggregate.purityCount > 0
        ? Math.round((aggregate.purityTotal / aggregate.purityCount) * 10) / 10
        : null,
      nCount: aggregate.total,
    }));

  const allDates = matchingTests.map((test) => test.tested_at).sort();

  res.json({
    product: {
      name: productName,
      slug,
      vendorCount: vendors.length,
      testCount: vendors.reduce((sum, v) => sum + v.nCount, 0),
      firstTestDate: allDates[0] ?? null,
      latestTestDate: allDates.at(-1) ?? null,
    },
    methodology: {
      type: 'Purity Focused',
      purityThreshold: 'purity 99.5%+',
      doseTolerance: 'dose ±35%',
    },
    vendors,
  });
});

// Lab test history rows for the product's TestHistorySection.
app.get('/products/:slug/tests', async (req, res) => {
  const slug = req.params.slug;
  const db = getServiceClient();

  const { data: testRows, error: testsError } = await db
    .from('vendor_tests')
    .select(
      'tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, vendor_id',
    )
    .eq('is_demo', false)
    .order('tested_at', { ascending: false });

  if (testsError) {
    res.status(500).json({ error: 'Failed to load test history' });
    return;
  }

  const matchingRows = (testRows ?? []).filter((test) => (
    test.peptide_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') === slug
  ));

  let items: {
    date: string;
    result: 'PASS' | 'FAIL';
    productName: string;
    vendorName: string;
    labName: string;
    purity: number | null;
    identityPass: boolean;
    dosageDeviation: string | null;
    testedMg: number | null;
    labelMg: number | null;
    batch: string;
    sender: string;
    coaUrl: string | null;
  }[] = [];

  if (matchingRows.length > 0) {
    const vendorIds = [
      ...new Set((matchingRows as unknown as Array<{ vendor_id: string | null }>).map((t) => t.vendor_id).filter(Boolean)),
    ];
    const { data: vendorRows } =
      vendorIds.length > 0
        ? await db.from('vendors').select('id, name').in('id', vendorIds)
        : { data: [] };
    const vendorNameById = new Map<string, string>(
      (vendorRows ?? []).map((v: unknown) => [(v as { id: string }).id, (v as { name: string }).name]),
    );

    items = (matchingRows as unknown as Array<{
      tested_at: string;
      result: string;
      peptide_name: string;
      lab_name: string;
      purity: number | null;
      dosage_deviation: string | null;
      tested_mg: number | null;
      label_mg: number | null;
      batch_code: string;
      sender: string;
      coa_url: string | null;
      vendor_id: string;
    }>).map((t) => ({
      date: t.tested_at,
      result: (t.result as string)?.toUpperCase() === 'PASS' ? 'PASS' : 'FAIL',
      productName: t.peptide_name,
      vendorName: vendorNameById.get(t.vendor_id) ?? '—',
      labName: t.lab_name,
      purity: t.purity == null ? null : Number(t.purity),
      identityPass: (t.result as string)?.toLowerCase() === 'pass',
      dosageDeviation: t.dosage_deviation,
      testedMg: t.tested_mg == null ? null : Number(t.tested_mg),
      labelMg: t.label_mg == null ? null : Number(t.label_mg),
      batch: t.batch_code,
      sender: t.sender,
      coaUrl: t.coa_url,
    }));
  }

  const passCount = items.filter((i) => i.result === 'PASS').length;

  res.json({
    stats: {
      total: items.length,
      pass: passCount,
      fail: items.length - passCount,
    },
    tests: items,
  });
});

const authenticate = async (req: express.Request): Promise<Session | null> => {
  const rawCustomerSessionToken = parseCookieHeader(req.headers.cookie)[CUSTOMER_SESSION_COOKIE];
  if (rawCustomerSessionToken) {
    const db = getServiceClient();
    const { data: customerSession } = await db.from('customer_sessions')
      .select('id, user_id, expires_at, revoked_at, last_seen_at')
      .eq('token_hash', customerTokenHash(rawCustomerSessionToken))
      .maybeSingle();
    if (customerSession && !customerSession.revoked_at && new Date(customerSession.expires_at).getTime() > Date.now()) {
      const [{ data: account }, status] = await Promise.all([
        db.from('user_accounts').select('email').eq('id', customerSession.user_id).maybeSingle(),
        getAccountOperationalStatus(customerSession.user_id),
      ]);
      if (account && status !== 'suspended' && status !== 'deleted') {
        if (Date.now() - new Date(customerSession.last_seen_at).getTime() > 5 * 60 * 1000) {
          void db.from('customer_sessions').update({ last_seen_at: new Date().toISOString() }).eq('id', customerSession.id);
        }
        return {
          userId: customerSession.user_id,
          email: account.email,
          name: null,
          customerSessionId: customerSession.id,
          rawCustomerSessionToken,
          db,
        };
      }
    }
  }

  return null;
};

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'peptrace-api' });
});

// ---- Native email/password auth (no Supabase Auth) ----

const normalizeEmail = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const authAttempts = new Map<string, { count: number; resetAt: number }>();
const authRateLimit = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
  const forwarded = req.headers['x-forwarded-for'];
  const source = typeof forwarded === 'string' ? forwarded.split(',')[0] : req.ip;
  const key = crypto.createHash('sha256').update(String(source ?? 'unknown')).digest('hex');
  const now = Date.now();
  const current = authAttempts.get(key);
  if (!current || current.resetAt <= now) {
    authAttempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    next();
    return;
  }
  if (current.count >= 30) {
    res.setHeader('Retry-After', Math.ceil((current.resetAt - now) / 1000));
    res.status(429).json({ error: 'Too many authentication attempts. Try again later.' });
    return;
  }
  current.count += 1;
  next();
};

app.post('/auth/check-email', authRateLimit, async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'A valid email address is required' });
    return;
  }
  // Do not disclose whether an account exists. Kept for compatibility with
  // older clients; current clients let the user choose sign-in or sign-up.
  res.json({ exists: false, deprecated: true });
});

app.post('/auth/register', authRateLimit, async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'A valid email address is required' });
    return;
  }
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    res
      .status(400)
      .json({ error: `Password must be ${MIN_PASSWORD_LENGTH}-${MAX_PASSWORD_LENGTH} characters` });
    return;
  }

  const db = getServiceClient();
  const { data: existing, error: lookupError } = await db
    .from('native_credentials')
    .select('account_id')
    .eq('email', email)
    .maybeSingle();
  if (lookupError) {
    res.status(500).json({ error: 'Failed to check existing account' });
    return;
  }
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists' });
    return;
  }

  const { data: userId, error: registrationError } = await db.rpc('register_native_account', {
    normalized_email: email,
    credential_hash: hashPassword(password),
  });
  if (registrationError || typeof userId !== 'string') {
    if (registrationError?.code === '23505') {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }
    res.status(500).json({ error: 'Failed to create account' });
    return;
  }

  const csrfToken = await createCustomerSession(req, res, userId, 'native');
  res.status(201).json({ csrfToken });
});

app.post('/auth/login', authRateLimit, async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!isValidEmail(email) || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const db = getServiceClient();
  const { data: credential, error } = await db
    .from('native_credentials')
    .select('account_id, password_hash')
    .eq('email', email)
    .maybeSingle();
  if (error) {
    res.status(500).json({ error: 'Failed to load credentials' });
    return;
  }
  if (!credential) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }
  if (!verifyPassword(password, credential.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const csrfToken = await createCustomerSession(req, res, credential.account_id, 'native');
  res.json({ csrfToken });
});

app.post('/auth/exchange', authRateLimit, async (req, res) => {
  const auth = req.headers.authorization;
  const accessToken = auth?.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!accessToken) {
    res.status(401).json({ error: 'Provider session is required' });
    return;
  }
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user?.email || !data.user.email_confirmed_at) {
    res.status(401).json({ error: 'Provider session is invalid' });
    return;
  }
  const db = getServiceClient();
  const externalUserId = data.user.id;
  const email = normalizeEmail(data.user.email);
  let userId = externalUserId;
  const { data: existingLink } = await db.from('account_identity_links')
    .select('account_id')
    .eq('provider', 'supabase')
    .eq('provider_subject', externalUserId)
    .maybeSingle();
  if (existingLink?.account_id) {
    userId = existingLink.account_id;
  } else {
    const { data: matchingAccount } = await db.from('user_accounts').select('id').eq('email', email).maybeSingle();
    if (matchingAccount) userId = matchingAccount.id;
    if (userId !== externalUserId) {
      const { error: linkError } = await db.from('account_identity_links').insert({
        provider: 'supabase',
        provider_subject: externalUserId,
        account_id: userId,
      });
      if (linkError && linkError.code !== '23505') {
        res.status(500).json({ error: 'Could not link provider identity' });
        return;
      }
    }
  }
  const { error: accountError } = await db.from('user_accounts').upsert({ id: userId, email }, { onConflict: 'id' });
  if (accountError) {
    res.status(500).json({ error: 'Could not create customer account' });
    return;
  }
  await db.from('user_profiles').upsert({ account_id: userId }, { onConflict: 'account_id', ignoreDuplicates: true });
  const csrfToken = await createCustomerSession(req, res, userId, 'supabase');
  res.json({ csrfToken });
});

app.post('/auth/logout', async (req, res) => {
  const session = await authenticate(req);
  if (session?.customerSessionId) {
    await getServiceClient().from('customer_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', session.customerSessionId);
  }
  clearCustomerCookie(res);
  res.status(204).end();
});

app.post('/auth/change-password', async (req, res) => {
  const session = await authenticate(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
  const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
  if (!currentPassword) {
    res.status(400).json({ error: 'Current password is required' });
    return;
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH || newPassword.length > MAX_PASSWORD_LENGTH) {
    res
      .status(400)
      .json({ error: `Password must be ${MIN_PASSWORD_LENGTH}-${MAX_PASSWORD_LENGTH} characters` });
    return;
  }

  const db = getServiceClient();
  const { data: credential, error } = await db
    .from('native_credentials')
    .select('password_hash')
    .eq('account_id', session.userId)
    .maybeSingle();
  if (error) {
    res.status(500).json({ error: 'Failed to load credentials' });
    return;
  }
  if (!credential) {
    res.status(400).json({ error: 'This account has no password set' });
    return;
  }
  if (!verifyPassword(currentPassword, credential.password_hash)) {
    res.status(401).json({ error: 'Current password is incorrect' });
    return;
  }

  const { error: updateError } = await db
    .from('native_credentials')
    .update({ password_hash: hashPassword(newPassword) })
    .eq('account_id', session.userId);
  if (updateError) {
    res.status(500).json({ error: 'Failed to update password' });
    return;
  }

  if (session.customerSessionId) {
    await db.from('customer_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('user_id', session.userId)
      .neq('id', session.customerSessionId);
  }

  res.json({ ok: true });
});

// ---- Account routes (Supabase Auth or native session) ----

app.get('/auth/me', async (req, res) => {
  const session = await authenticate(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const userDb = session.db;

  let isNewAccount = false;
  const { data: account, error: accountError } = await userDb
    .from('user_accounts')
    .select('id, created_at')
    .eq('id', session.userId)
    .maybeSingle();

  if (accountError) {
    res.status(500).json({ error: 'Failed to load user account' });
    return;
  }

  if (!account) {
    const { error: insertError } = await userDb
      .from('user_accounts')
      .insert({ id: session.userId, email: session.email });
    if (insertError) {
      res.status(500).json({ error: 'Failed to create user account' });
      return;
    }
    const { error: profileError } = await userDb
      .from('user_profiles')
      .insert({ account_id: session.userId });
    if (profileError) {
      res.status(500).json({ error: 'Failed to create user profile' });
      return;
    }
    isNewAccount = true;
  } else {
    await userDb
      .from('user_accounts')
      .update({ last_sign_in_at: new Date().toISOString() })
      .eq('id', session.userId);
  }

  const { data: profile } = await userDb
    .from('user_profiles')
    .select('full_name, organization, role, phone, bio, avatar_url')
    .eq('account_id', session.userId)
    .maybeSingle();

  const name = profile?.full_name ?? session.name ?? session.email.split('@')[0];

  const avatarPath = profile?.avatar_url ? storagePathFromUrl(profile.avatar_url) : null;
  const signedAvatar = avatarPath
    ? await getServiceClient().storage.from(PROFILE_PHOTOS_BUCKET).createSignedUrl(avatarPath, 15 * 60)
    : null;

  res.json({
    id: session.userId,
    email: session.email,
    name,
    isNewAccount,
    memberSince: account?.created_at ?? new Date().toISOString(),
    profile: profile ? { ...profile, avatar_url: signedAvatar?.data?.signedUrl ?? null } : null,
    csrfToken: session.rawCustomerSessionToken ? customerCsrfToken(session.rawCustomerSessionToken) : null,
  });
});

const PROFILE_FIELDS = ['full_name', 'organization', 'role', 'phone', 'bio'] as const;

app.put('/account/profile', async (req, res) => {
  const session = await authenticate(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const updates: Record<string, string | null> = {};
  for (const field of PROFILE_FIELDS) {
    const value = req.body?.[field];
    if (value === undefined) {
      continue;
    }
    if (value !== null && typeof value !== 'string') {
      res.status(400).json({ error: `${field} must be a string` });
      return;
    }
    updates[field] = typeof value === 'string' ? value.trim() : null;
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: 'No profile fields provided' });
    return;
  }

  const userDb = session.db;
  const { data: profile, error: profileError } = await userDb
    .from('user_profiles')
    .upsert(
      { account_id: session.userId, ...updates, updated_at: new Date().toISOString() },
      { onConflict: 'account_id' },
    )
    .select('full_name, organization, role, phone, bio, avatar_url')
    .single();

  if (profileError) {
    res.status(500).json({ error: 'Failed to save profile' });
    return;
  }

  const avatarPath = profile.avatar_url ? storagePathFromUrl(profile.avatar_url) : null;
  const signedAvatar = avatarPath
    ? await getServiceClient().storage.from(PROFILE_PHOTOS_BUCKET).createSignedUrl(avatarPath, 15 * 60)
    : null;
  res.json({ profile: { ...profile, avatar_url: signedAvatar?.data?.signedUrl ?? null } });
});

const PROFILE_PHOTOS_BUCKET = 'profile_photos';
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const AVATAR_CONTENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

let profileBucketReady: Promise<void> | null = null;

const ensurePrivateBucket = (bucket: string): Promise<void> => {
  const storage = getServiceClient().storage;
  return storage.getBucket(bucket).then(async ({ data, error }) => {
    if (error || !data) {
      const { error: createError } = await storage.createBucket(bucket, {
        public: false,
        fileSizeLimit: MAX_AVATAR_BYTES,
      });
      if (createError && !/already exists/i.test(createError.message)) throw createError;
      return;
    }
    if (data.public) {
      const { error: updateError } = await storage.updateBucket(bucket, { public: false });
      if (updateError) throw updateError;
    }
  });
};

const ensureProfileBucket = (): Promise<void> => {
  profileBucketReady ??= ensurePrivateBucket(PROFILE_PHOTOS_BUCKET).catch((error) => {
    profileBucketReady = null;
    throw error;
  });
  return profileBucketReady;
};

const storagePathFromUrl = (url: string): string | null => {
  if (!url.includes('://')) return url.replace(/^\/+/, '');
  for (const marker of [`/object/public/${PROFILE_PHOTOS_BUCKET}/`, `/object/sign/${PROFILE_PHOTOS_BUCKET}/`]) {
    const index = url.indexOf(marker);
    if (index !== -1) return decodeURIComponent(url.slice(index + marker.length).split('?')[0]);
  }
  return null;
};

app.post('/account/avatar', async (req, res) => {
  const session = await authenticate(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { image, contentType, extension } = req.body ?? {};
  if (typeof image !== 'string' || typeof contentType !== 'string' || !AVATAR_CONTENT_TYPES.has(contentType)) {
    res.status(400).json({ error: 'A JPEG, PNG, or WebP image is required' });
    return;
  }
  const buffer = Buffer.from(image, 'base64');
  if (buffer.length === 0 || buffer.length > MAX_AVATAR_BYTES) {
    res.status(400).json({ error: 'Photo must be smaller than 5 MB' });
    return;
  }
  const expectedExtension = contentType === 'image/jpeg' ? 'jpg' : contentType === 'image/webp' ? 'webp' : 'png';
  const ext = typeof extension === 'string' && ['jpg', 'jpeg', 'png', 'webp'].includes(extension.toLowerCase())
    ? extension.toLowerCase()
    : expectedExtension;

  try {
    await ensureProfileBucket();
  } catch {
    res.status(503).json({ error: 'Profile photo storage is unavailable' });
    return;
  }

  const path = `${session.userId}/${crypto.randomUUID()}.${ext}`;
  const storage = getServiceClient().storage.from(PROFILE_PHOTOS_BUCKET);
  const { error: uploadError } = await storage.upload(path, buffer, { contentType });
  if (uploadError) {
    res.status(500).json({ error: 'Could not upload the photo' });
    return;
  }
  const { data: current } = await session.db
    .from('user_profiles')
    .select('avatar_url')
    .eq('account_id', session.userId)
    .maybeSingle();
  const oldPath = current?.avatar_url ? storagePathFromUrl(current.avatar_url) : null;

  const { error: updateError } = await session.db
    .from('user_profiles')
    .upsert(
      { account_id: session.userId, avatar_url: path, updated_at: new Date().toISOString() },
      { onConflict: 'account_id' },
    );
  if (updateError) {
    await storage.remove([path]);
    res.status(500).json({ error: 'Failed to save the photo' });
    return;
  }
  if (oldPath && oldPath !== path) {
    await storage.remove([oldPath]);
  }

  const { data: signed } = await storage.createSignedUrl(path, 15 * 60);
  res.json({ avatar_url: signed?.signedUrl ?? null });
});

app.delete('/account/avatar', async (req, res) => {
  const session = await authenticate(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { data: current } = await session.db
    .from('user_profiles')
    .select('avatar_url')
    .eq('account_id', session.userId)
    .maybeSingle();
  const path = current?.avatar_url ? storagePathFromUrl(current.avatar_url) : null;
  if (path) {
    await getServiceClient().storage.from(PROFILE_PHOTOS_BUCKET).remove([path]);
  }
  await session.db
    .from('user_profiles')
    .update({ avatar_url: null, updated_at: new Date().toISOString() })
    .eq('account_id', session.userId);

  res.json({ avatar_url: null });
});

const FORM_UPLOADS_BUCKET = 'form-uploads';
const FORM_UPLOAD_TYPES = ['batch-id-proof', 'coa', 'purchase-proof'] as const;
const MAX_FORM_UPLOAD_BYTES = 5 * 1024 * 1024;

let formBucketReady: Promise<void> | null = null;

const ensureFormUploadsBucket = (): Promise<void> => {
  formBucketReady ??= ensurePrivateBucket(FORM_UPLOADS_BUCKET).catch((err) => {
    formBucketReady = null;
    throw err;
  });
  return formBucketReady;
};

app.post('/uploads/form', async (req, res) => {
  const session = await authenticate(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { file, contentType, extension, uploadType } = req.body ?? {};
  if (
    typeof uploadType !== 'string' ||
    !(FORM_UPLOAD_TYPES as readonly string[]).includes(uploadType)
  ) {
    res.status(400).json({ error: 'A valid upload type is required' });
    return;
  }
  if (
    typeof file !== 'string' ||
    typeof contentType !== 'string' ||
    !(contentType.startsWith('image/') || contentType === 'application/pdf')
  ) {
    res.status(400).json({ error: 'An image or PDF file is required' });
    return;
  }
  const buffer = Buffer.from(file, 'base64');
  if (buffer.length === 0 || buffer.length > MAX_FORM_UPLOAD_BYTES) {
    res.status(400).json({ error: 'File must be smaller than 5 MB' });
    return;
  }
  const ext =
    typeof extension === 'string' && /^[a-z0-9]{1,5}$/.test(extension)
      ? extension
      : contentType === 'application/pdf'
        ? 'pdf'
        : 'png';

  try {
    await ensureFormUploadsBucket();
  } catch {
    res.status(500).json({ error: 'Storage is not available' });
    return;
  }

  const path = `${session.userId}/${uploadType}/${crypto.randomUUID()}.${ext}`;
  const storage = getServiceClient().storage.from(FORM_UPLOADS_BUCKET);
  const { error: uploadError } = await storage.upload(path, buffer, { contentType });
  if (uploadError) {
    res.status(500).json({ error: 'Could not upload the file' });
    return;
  }
  const { data: signed, error: signedError } = await storage.createSignedUrl(path, 15 * 60);
  if (signedError || !signed) {
    await storage.remove([path]);
    res.status(500).json({ error: 'Could not create a private file preview' });
    return;
  }

  res.json({ path, previewUrl: signed.signedUrl, contentType });
});

// ---- Persisted account operations ----

const CONSENT_TYPES = ['privacy_policy', 'terms', 'ai_processing', 'marketing', 'analytics'] as const;
const CONSENT_VERSION = process.env.CONSENT_POLICY_VERSION ?? '2026-10-02';
const DATA_EXPORTS_BUCKET = 'data-exports';
let dataExportsBucketReady: Promise<void> | null = null;

const cleanTextValue = (value: unknown, maxLength: number): string | null => {
  if (typeof value !== 'string') return null;
  const cleaned = value.trim().slice(0, maxLength);
  return cleaned || null;
};

const ensureDataExportsBucket = (): Promise<void> => {
  dataExportsBucketReady ??= ensurePrivateBucket(DATA_EXPORTS_BUCKET).catch((error) => {
    dataExportsBucketReady = null;
    throw error;
  });
  return dataExportsBucketReady;
};

app.get('/account/notifications', async (req, res) => {
  const session = await authenticate(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { data, error } = await getServiceClient()
    .from('notification_preferences')
    .select('email_test_results, email_shipment_updates, email_rankings, email_marketing, push_test_results, push_shipment_updates, push_marketing, frequency, updated_at')
    .eq('user_id', session.userId)
    .maybeSingle();
  if (error) {
    res.status(500).json({ error: 'Failed to load notification preferences' });
    return;
  }
  res.json({
    preferences: data ?? {
      email_test_results: true,
      email_shipment_updates: true,
      email_rankings: false,
      email_marketing: false,
      push_test_results: false,
      push_shipment_updates: false,
      push_marketing: false,
      frequency: 'instant',
      updated_at: null,
    },
  });
});

app.put('/account/notifications', async (req, res) => {
  const session = await authenticate(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const booleanFields = [
    'email_test_results',
    'email_shipment_updates',
    'email_rankings',
    'email_marketing',
    'push_test_results',
    'push_shipment_updates',
    'push_marketing',
  ] as const;
  const updates: Record<string, boolean | string> = {};
  for (const field of booleanFields) {
    if (req.body?.[field] !== undefined) {
      if (typeof req.body[field] !== 'boolean') {
        res.status(400).json({ error: `${field} must be a boolean` });
        return;
      }
      updates[field] = req.body[field];
    }
  }
  if (req.body?.frequency !== undefined) {
    if (!['instant', 'daily', 'weekly'].includes(req.body.frequency)) {
      res.status(400).json({ error: 'Invalid notification frequency' });
      return;
    }
    updates.frequency = req.body.frequency;
  }
  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: 'No notification preferences provided' });
    return;
  }
  const db = getServiceClient();
  const now = new Date().toISOString();
  const { data, error } = await db.from('notification_preferences').upsert({
    user_id: session.userId,
    ...updates,
    updated_at: now,
  }, { onConflict: 'user_id' }).select(
    'email_test_results, email_shipment_updates, email_rankings, email_marketing, push_test_results, push_shipment_updates, push_marketing, frequency, updated_at',
  ).single();
  if (error) {
    res.status(500).json({ error: 'Failed to save notification preferences' });
    return;
  }
  if (typeof updates.email_marketing === 'boolean') {
    await db.from('user_consents').insert({
      user_id: session.userId,
      subject_hash: hashUserSubject(session.userId),
      consent_type: 'marketing',
      policy_version: CONSENT_VERSION,
      accepted: updates.email_marketing,
      withdrawn_at: updates.email_marketing ? null : now,
      source: 'notification_preferences',
      request_id: typeof req.headers['x-request-id'] === 'string' ? req.headers['x-request-id'] : null,
    });
  }
  res.json({ preferences: data });
});

app.get('/account/billing', async (req, res) => {
  const session = await authenticate(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { data, error } = await getServiceClient().from('subscriptions')
    .select('id, provider, plan, status, trial_start, trial_end, current_period_start, current_period_end, cancel_at_period_end, canceled_at, expires_at, currency, amount_cents, created_at, updated_at')
    .eq('user_id', session.userId)
    .order('updated_at', { ascending: false })
    .limit(20);
  if (error) {
    res.status(500).json({ error: 'Failed to load billing information' });
    return;
  }
  res.json({ current: data?.[0] ?? null, history: data ?? [], providerConfigured: Boolean(process.env.BILLING_PROVIDER) });
});

app.get('/account/consents', async (req, res) => {
  const session = await authenticate(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { data, error } = await getServiceClient().from('user_consents')
    .select('id, consent_type, policy_version, accepted, recorded_at, withdrawn_at, source')
    .eq('user_id', session.userId)
    .order('recorded_at', { ascending: false });
  if (error) {
    res.status(500).json({ error: 'Failed to load consent history' });
    return;
  }
  const current: Record<string, unknown> = {};
  for (const consent of data ?? []) {
    if (!(consent.consent_type in current)) current[consent.consent_type] = consent;
  }
  res.json({ current, history: data ?? [] });
});

app.post('/account/consents', async (req, res) => {
  const session = await authenticate(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const consentType = req.body?.consentType;
  const accepted = req.body?.accepted;
  if (!(CONSENT_TYPES as readonly unknown[]).includes(consentType) || typeof accepted !== 'boolean') {
    res.status(400).json({ error: 'A valid consent type and state are required' });
    return;
  }
  const now = new Date().toISOString();
  const { data, error } = await getServiceClient().from('user_consents').insert({
    user_id: session.userId,
    subject_hash: hashUserSubject(session.userId),
    consent_type: consentType,
    policy_version: cleanTextValue(req.body?.policyVersion, 50) ?? CONSENT_VERSION,
    accepted,
    withdrawn_at: accepted ? null : now,
    source: 'account',
    request_id: typeof req.headers['x-request-id'] === 'string' ? req.headers['x-request-id'] : null,
  }).select('id, consent_type, policy_version, accepted, recorded_at, withdrawn_at, source').single();
  if (error) {
    res.status(500).json({ error: 'Failed to record consent' });
    return;
  }
  res.status(201).json({ consent: data });
});

app.get('/account/data-exports', async (req, res) => {
  const session = await authenticate(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { data, error } = await getServiceClient().from('data_export_requests')
    .select('id, status, expires_at, error_code, requested_at, completed_at, updated_at')
    .eq('user_id', session.userId)
    .order('requested_at', { ascending: false })
    .limit(20);
  if (error) {
    res.status(500).json({ error: 'Failed to load export requests' });
    return;
  }
  res.json({ requests: data ?? [] });
});

app.post('/account/data-exports', async (req, res) => {
  const session = await authenticate(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const db = getServiceClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: recentCount } = await db.from('data_export_requests')
    .select('*', { head: true, count: 'exact' })
    .eq('user_id', session.userId)
    .gte('requested_at', since);
  if ((recentCount ?? 0) >= 3) {
    res.status(429).json({ error: 'You can request up to three exports per day' });
    return;
  }
  const { data: requestRecord, error: requestError } = await db.from('data_export_requests').insert({
    user_id: session.userId,
    subject_hash: hashUserSubject(session.userId),
    status: 'processing',
  }).select('id, requested_at').single();
  if (requestError || !requestRecord) {
    res.status(500).json({ error: 'Failed to create export request' });
    return;
  }

  try {
    const [{ data: account }, { data: profile }, { data: addresses }, { data: shipments }, { data: preferences }, { data: consents }, { data: support }] = await Promise.all([
      db.from('user_accounts').select('id, email, created_at, last_sign_in_at').eq('id', session.userId).maybeSingle(),
      db.from('user_profiles').select('full_name, organization, role, phone, bio, updated_at').eq('account_id', session.userId).maybeSingle(),
      db.from('shipping_addresses').select('*').eq('account_id', session.userId),
      db.from('shipments').select('*, shipment_samples(*), test_results(*)').eq('account_id', session.userId),
      db.from('notification_preferences').select('*').eq('user_id', session.userId).maybeSingle(),
      db.from('user_consents').select('consent_type, policy_version, accepted, recorded_at, withdrawn_at, source').eq('user_id', session.userId).order('recorded_at'),
      db.from('support_requests').select('id, category, subject, message, status, created_at, resolved_at').eq('user_id', session.userId).order('created_at'),
    ]);
    await ensureDataExportsBucket();
    const path = `${session.userId}/${requestRecord.id}.json`;
    const payload = Buffer.from(JSON.stringify({
      generatedAt: new Date().toISOString(),
      account,
      profile,
      addresses: addresses ?? [],
      shipments: shipments ?? [],
      notificationPreferences: preferences,
      consentHistory: consents ?? [],
      supportRequests: support ?? [],
    }, null, 2));
    const { error: uploadError } = await db.storage.from(DATA_EXPORTS_BUCKET).upload(path, payload, {
      contentType: 'application/json',
      upsert: false,
    });
    if (uploadError) throw uploadError;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    await db.from('data_export_requests').update({
      status: 'complete',
      storage_path: path,
      expires_at: expiresAt,
      completed_at: now.toISOString(),
      updated_at: now.toISOString(),
    }).eq('id', requestRecord.id);
    res.status(201).json({ id: requestRecord.id, status: 'complete', expiresAt });
  } catch {
    await db.from('data_export_requests').update({
      status: 'failed',
      error_code: 'generation_failed',
      updated_at: new Date().toISOString(),
    }).eq('id', requestRecord.id);
    res.status(500).json({ error: 'Failed to generate data export' });
  }
});

app.get('/account/data-exports/:id/download', async (req, res) => {
  const session = await authenticate(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const db = getServiceClient();
  const { data } = await db.from('data_export_requests')
    .select('storage_path, status, expires_at')
    .eq('id', req.params.id)
    .eq('user_id', session.userId)
    .maybeSingle();
  if (!data || data.status !== 'complete' || !data.storage_path || !data.expires_at) {
    res.status(404).json({ error: 'Export is not available' });
    return;
  }
  if (new Date(data.expires_at).getTime() <= Date.now()) {
    await db.from('data_export_requests').update({ status: 'expired', updated_at: new Date().toISOString() }).eq('id', req.params.id);
    res.status(410).json({ error: 'Export has expired' });
    return;
  }
  const { data: signed, error } = await db.storage.from(DATA_EXPORTS_BUCKET).createSignedUrl(data.storage_path, 10 * 60, {
    download: `peptrace-export-${req.params.id}.json`,
  });
  if (error || !signed) {
    res.status(500).json({ error: 'Could not create export download' });
    return;
  }
  res.json({ url: signed.signedUrl, expiresIn: 600 });
});

app.get('/account/deletion-request', async (req, res) => {
  const session = await authenticate(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { data, error } = await getServiceClient().from('account_deletion_requests')
    .select('id, status, reason, requested_at, scheduled_for, completed_at, canceled_at, failure_code, updated_at')
    .eq('user_id', session.userId)
    .order('requested_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    res.status(500).json({ error: 'Failed to load deletion request' });
    return;
  }
  res.json({ request: data ?? null });
});

app.post('/account/deletion-request', async (req, res) => {
  const session = await authenticate(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const db = getServiceClient();
  const { data: credential } = await db.from('native_credentials').select('password_hash').eq('account_id', session.userId).maybeSingle();
  const confirmed = credential
    ? typeof req.body?.currentPassword === 'string' && verifyPassword(req.body.currentPassword, credential.password_hash)
    : normalizeEmail(req.body?.confirmEmail) === normalizeEmail(session.email);
  if (!confirmed) {
    res.status(401).json({ error: 'Account confirmation failed' });
    return;
  }
  const scheduledFor = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const reason = cleanTextValue(req.body?.reason, 500);
  const { data, error } = await db.from('account_deletion_requests').insert({
    user_id: session.userId,
    subject_hash: hashUserSubject(session.userId),
    status: 'scheduled',
    reason,
    scheduled_for: scheduledFor,
  }).select('id, status, requested_at, scheduled_for').single();
  if (error) {
    if (error.code === '23505') {
      res.status(409).json({ error: 'An active deletion request already exists' });
      return;
    }
    res.status(500).json({ error: 'Failed to schedule account deletion' });
    return;
  }
  await db.from('account_admin_state').upsert({
    account_id: session.userId,
    status: 'deletion_pending',
    reason: 'User requested account deletion',
    updated_at: new Date().toISOString(),
  });
  res.status(201).json({ request: data });
});

app.post('/account/deletion-request/cancel', async (req, res) => {
  const session = await authenticate(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const db = getServiceClient();
  const now = new Date().toISOString();
  const { data, error } = await db.from('account_deletion_requests').update({
    status: 'canceled',
    canceled_at: now,
    updated_at: now,
  }).eq('user_id', session.userId).in('status', ['requested', 'scheduled']).select('id').maybeSingle();
  if (error || !data) {
    res.status(404).json({ error: 'No cancelable deletion request was found' });
    return;
  }
  await db.from('account_admin_state').upsert({
    account_id: session.userId,
    status: 'active',
    reason: 'User canceled account deletion',
    restored_at: now,
    updated_at: now,
  });
  res.json({ canceled: true });
});

app.post('/support/requests', async (req, res) => {
  const session = await authenticate(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const category = cleanTextValue(req.body?.category, 50);
  const subject = cleanTextValue(req.body?.subject, 150);
  const message = cleanTextValue(req.body?.message, 5000);
  if (!category || !subject || !message) {
    res.status(400).json({ error: 'Category, subject, and message are required' });
    return;
  }
  const { data, error } = await getServiceClient().from('support_requests').insert({
    user_id: session.userId,
    subject_hash: hashUserSubject(session.userId),
    contact_email: session.email,
    category,
    subject,
    message,
  }).select('id, category, subject, status, created_at').single();
  if (error) {
    res.status(500).json({ error: 'Failed to submit support request' });
    return;
  }
  res.status(201).json({ request: data });
});

app.get('/support/requests', async (req, res) => {
  const session = await authenticate(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { data, error } = await getServiceClient().from('support_requests')
    .select('id, category, subject, status, created_at, updated_at, resolved_at')
    .eq('user_id', session.userId)
    .order('created_at', { ascending: false });
  if (error) {
    res.status(500).json({ error: 'Failed to load support requests' });
    return;
  }
  res.json({ requests: data ?? [] });
});

const ADDRESS_SELECT =
  'id, nickname, recipient_name, organization, line1, line2, city, state, postal_code, country, is_primary, created_at';
const REQUIRED_ADDRESS_FIELDS = ['nickname', 'recipient_name', 'line1', 'city', 'state', 'postal_code'] as const;
const OPTIONAL_ADDRESS_FIELDS = ['organization', 'line2', 'country'] as const;

const parseAddressBody = (
  body: Record<string, unknown>,
  partial: boolean,
): { values: Record<string, string>; error?: undefined } | { values?: undefined; error: string } => {
  const values: Record<string, string> = {};
  for (const field of [...REQUIRED_ADDRESS_FIELDS, ...OPTIONAL_ADDRESS_FIELDS]) {
    const value = body?.[field];
    if (value === undefined) {
      if (!partial && (REQUIRED_ADDRESS_FIELDS as readonly string[]).includes(field)) {
        return { error: `${field} is required` };
      }
      continue;
    }
    if (typeof value !== 'string') {
      return { error: `${field} must be a string` };
    }
    const trimmed = value.trim();
    if (!partial && (REQUIRED_ADDRESS_FIELDS as readonly string[]).includes(field) && !trimmed) {
      return { error: `${field} is required` };
    }
    values[field] = trimmed;
  }
  return { values };
};

app.get('/account/addresses', async (req, res) => {
  const session = await authenticate(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const userDb = session.db;
  const { data, error } = await userDb
    .from('shipping_addresses')
    .select(ADDRESS_SELECT)
    .eq('account_id', session.userId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500).json({ error: 'Failed to load addresses' });
    return;
  }
  res.json({ addresses: data });
});

app.post('/account/addresses', async (req, res) => {
  const session = await authenticate(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const parsed = parseAddressBody(req.body ?? {}, false);
  if (!parsed.values) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const userDb = session.db;
  const { count } = await userDb
    .from('shipping_addresses')
    .select('id', { count: 'exact', head: true })
    .eq('account_id', session.userId);

  const { data, error } = await userDb
    .from('shipping_addresses')
    .insert({
      account_id: session.userId,
      ...parsed.values,
      country: parsed.values.country || 'Australia',
      is_primary: req.body?.is_primary === true || (count ?? 0) === 0,
    })
    .select(ADDRESS_SELECT)
    .single();

  if (error) {
    res.status(500).json({ error: 'Failed to create address' });
    return;
  }
  res.status(201).json({ address: data });
});

app.put('/account/addresses/:id', async (req, res) => {
  const session = await authenticate(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const parsed = parseAddressBody(req.body ?? {}, false);
  if (!parsed.values) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const userDb = session.db;
  const { data, error } = await userDb
    .from('shipping_addresses')
    .update({ ...parsed.values, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .eq('account_id', session.userId)
    .select(ADDRESS_SELECT)
    .maybeSingle();

  if (error) {
    res.status(500).json({ error: 'Failed to update address' });
    return;
  }
  if (!data) {
    res.status(404).json({ error: 'Address not found' });
    return;
  }
  res.json({ address: data });
});

app.delete('/account/addresses/:id', async (req, res) => {
  const session = await authenticate(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const userDb = session.db;

  const { data: deleted, error } = await userDb
    .from('shipping_addresses')
    .delete()
    .eq('id', req.params.id)
    .eq('account_id', session.userId)
    .select('id, is_primary')
    .maybeSingle();

  if (error) {
    res.status(500).json({ error: 'Failed to delete address' });
    return;
  }
  if (!deleted) {
    res.status(404).json({ error: 'Address not found' });
    return;
  }

  if (deleted.is_primary) {
    const { data: next } = await userDb
      .from('shipping_addresses')
      .select('id')
      .eq('account_id', session.userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (next) {
      await userDb
        .from('shipping_addresses')
        .update({ is_primary: true })
        .eq('id', next.id)
        .eq('account_id', session.userId);
    }
  }

  res.json({ deleted: deleted.id });
});

app.post('/account/addresses/:id/primary', async (req, res) => {
  const session = await authenticate(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const userDb = session.db;

  const { data: target } = await userDb
    .from('shipping_addresses')
    .select('id')
    .eq('id', req.params.id)
    .eq('account_id', session.userId)
    .maybeSingle();
  if (!target) {
    res.status(404).json({ error: 'Address not found' });
    return;
  }

  await userDb
    .from('shipping_addresses')
    .update({ is_primary: false })
    .eq('account_id', session.userId);
  const { data, error } = await userDb
    .from('shipping_addresses')
    .update({ is_primary: true, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .eq('account_id', session.userId)
    .select(ADDRESS_SELECT)
    .single();

  if (error) {
    res.status(500).json({ error: 'Failed to set primary address' });
    return;
  }
  res.json({ address: data });
});

interface ShipmentSampleInput {
  peptideId?: unknown;
  vendor?: unknown;
  formFactor?: unknown;
  batchId?: unknown;
  batchProofFile?: unknown;
  quantityMg?: unknown;
  lab?: unknown;
  addons?: unknown;
  vendorProvidedCOA?: unknown;
  coaWhen?: unknown;
  coaOtherText?: unknown;
  coaMatch?: unknown;
  coaUrl?: unknown;
  coaFile?: unknown;
  proofFile?: unknown;
  orderId?: unknown;
  orderDate?: unknown;
  numVials?: unknown;
  pricePerVial?: unknown;
  priceCurrency?: unknown;
  samplePrice?: unknown;
}

const textOrNull = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

const boolOrNull = (value: unknown): boolean | null =>
  typeof value === 'boolean' ? value : null;

const numberOrNull = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.\-]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const intOrNull = (value: unknown): number | null => {
  const num = numberOrNull(value);
  return num === null ? null : Math.trunc(num);
};

app.post('/shipments', async (req, res) => {
  const session = await authenticate(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { samples, newsletterOptIn, termsAccepted } = req.body ?? {};
  if (termsAccepted !== true) {
    res.status(400).json({ error: 'Terms must be accepted before registering a shipment' });
    return;
  }
  if (!Array.isArray(samples) || samples.length === 0 || samples.length > 20) {
    res.status(400).json({ error: 'At least one sample is required' });
    return;
  }
  for (const s of samples as ShipmentSampleInput[]) {
    if (typeof s?.peptideId !== 'string' || s.peptideId === '') {
      res.status(400).json({ error: 'Each sample needs a product' });
      return;
    }
    const privateFiles: Array<[unknown, string]> = [
      [s.batchProofFile, 'batch-id-proof'],
      [s.coaFile, 'coa'],
      [s.proofFile, 'purchase-proof'],
    ];
    if (privateFiles.some(([value, kind]) =>
      value != null && value !== '' && (
        typeof value !== 'string' || !value.startsWith(`${session.userId}/${kind}/`)
      ))) {
      res.status(400).json({ error: 'One or more uploaded files do not belong to this account' });
      return;
    }
    if (Array.isArray(s.addons) && s.addons.length > 0) {
      res.status(503).json({ error: 'Paid testing add-ons are not available yet' });
      return;
    }
  }

  const peptideIds = [...new Set((samples as ShipmentSampleInput[]).map((sample) => sample.peptideId as string))];
  const { data: selectedPeptides, error: peptideError } = await getServiceClient()
    .from('peptides')
    .select('id, testing_price')
    .in('id', peptideIds);
  if (peptideError || (selectedPeptides ?? []).length !== peptideIds.length) {
    res.status(400).json({ error: 'One or more selected products are unavailable' });
    return;
  }
  if ((selectedPeptides ?? []).some((peptide) => Number(peptide.testing_price ?? 0) > 0)) {
    res.status(503).json({ error: 'Online payment is not configured for paid testing' });
    return;
  }

  // The wizard collects the vendor as a free-text name; link it to a catalog
  // vendor when one exists, otherwise keep the name only.
  const vendorNames = [
    ...new Set(
      (samples as ShipmentSampleInput[])
        .map((s) => textOrNull(s.vendor))
        .filter((v): v is string => v !== null),
    ),
  ];
  const vendorIdByName = new Map<string, string>();
  if (vendorNames.length > 0) {
    const { data: vendorRows } = await getServiceClient()
      .from('vendors')
      .select('id, name')
      .eq('is_demo', false)
      .in('name', vendorNames);
    for (const v of vendorRows ?? []) {
      vendorIdByName.set(v.name, v.id);
    }
  }

  const db = getServiceClient();
  const sampleRows = (samples as ShipmentSampleInput[]).map((s) => {
    const vendorName = textOrNull(s.vendor);
    return {
      peptide_id: s.peptideId as string,
      vendor_id: vendorName ? (vendorIdByName.get(vendorName) ?? null) : null,
      vendor_name: vendorName,
      form_factor: textOrNull(s.formFactor),
      batch_id: textOrNull(s.batchId),
      batch_proof_url: textOrNull(s.batchProofFile),
      quantity_mg: numberOrNull(s.quantityMg),
      lab: textOrNull(s.lab),
      addons: [],
      vendor_provided_coa: boolOrNull(s.vendorProvidedCOA),
      coa_when: textOrNull(s.coaWhen),
      coa_other_text: textOrNull(s.coaOtherText),
      coa_match: boolOrNull(s.coaMatch),
      coa_url: textOrNull(s.coaUrl),
      coa_file_url: textOrNull(s.coaFile),
      proof_file_url: textOrNull(s.proofFile),
      order_id: textOrNull(s.orderId),
      order_date: textOrNull(s.orderDate),
      num_vials: intOrNull(s.numVials),
      price_per_vial: numberOrNull(s.pricePerVial),
      price_currency: textOrNull(s.priceCurrency),
      sample_price: 0,
    };
  });

  const consentRows = [
    {
      user_id: session.userId,
      subject_hash: hashUserSubject(session.userId),
      consent_type: 'terms',
      policy_version: CONSENT_VERSION,
      accepted: true,
      source: 'shipment_registration',
      request_id: req.headers['x-request-id'],
    },
  ];
  if (newsletterOptIn === true) {
    consentRows.push({
      user_id: session.userId,
      subject_hash: hashUserSubject(session.userId),
      consent_type: 'marketing',
      policy_version: CONSENT_VERSION,
      accepted: true,
      source: 'shipment_registration',
      request_id: req.headers['x-request-id'],
    });
  }
  const { error: consentError } = await db.from('user_consents').insert(consentRows);
  if (consentError) {
    res.status(500).json({ error: 'Failed to record shipment consent' });
    return;
  }

  const { data: shipment, error } = await db.rpc('create_shipment_with_samples', {
    owner_id: session.userId,
    newsletter: newsletterOptIn === true,
    samples: sampleRows,
  });
  if (error || !shipment) {
    res.status(500).json({ error: 'Failed to register the shipment' });
    return;
  }

  res.status(201).json(shipment);
});

app.get('/account/dashboard', async (req, res) => {
  const session = await authenticate(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const userDb = session.db;

  interface TestResultRow {
    purity: number;
    outcome: string | null;
    tested_at: string | null;
  }
  interface ShipmentJoinRow {
    peptide: { name: string } | null;
    shipment_samples: { peptide: { name: string } | null }[] | null;
  }

  const peptideNamesFor = (row: ShipmentJoinRow): string[] => {
    const sampleNames = (row.shipment_samples ?? [])
      .map((s) => s.peptide?.name)
      .filter((n): n is string => !!n);
    // Legacy rows (pre shipment_samples) carry the peptide on the shipment.
    return sampleNames.length > 0 ? sampleNames : row.peptide?.name ? [row.peptide.name] : [];
  };

  const latestResult = (results: TestResultRow[]): TestResultRow | null =>
    results.length === 0
      ? null
      : [...results].sort((a, b) => (b.tested_at ?? '').localeCompare(a.tested_at ?? ''))[0];

  const { data, error } = await userDb
    .from('shipments')
    .select(
      'id, tracking_id, status, created_at, peptide:peptides(name), vendor:vendors(name), shipment_samples(peptide:peptides(name)), test_results(purity, outcome, tested_at)',
    )
    .eq('account_id', session.userId)
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500).json({ error: 'Failed to load dashboard' });
    return;
  }

  const shipments = (data ?? []).map((row) => {
    const join = row as unknown as ShipmentJoinRow;
    const peptideNames = peptideNamesFor(join);
    const results = (row.test_results as TestResultRow[]) ?? [];
    return {
      id: row.id,
      tracking_id: row.tracking_id,
      status: row.status,
      created_at: row.created_at,
      peptide_names: peptideNames,
      vendor_name: (row.vendor as unknown as { name: string } | null)?.name ?? '',
      sample_count: peptideNames.length > 0 ? peptideNames.length : 1,
      purities: results.map((r) => Number(r.purity)),
    };
  });

  // Recent Test Results: latest test outcomes across this account's shipments.
  const { data: resultsData } = await userDb
    .from('test_results')
    .select(
      'id, batch_code, purity, outcome, tested_at, shipment:shipments!inner(account_id, peptide:peptides(name), shipment_samples(peptide:peptides(name)))',
    )
    .eq('shipment.account_id', session.userId)
    .order('tested_at', { ascending: false })
    .limit(5);

  const recentResults = (resultsData ?? []).map((row) => ({
    id: row.id,
    peptide_names: peptideNamesFor(row.shipment as unknown as ShipmentJoinRow),
    batch_code: row.batch_code,
    purity: row.purity === null ? null : Number(row.purity),
    outcome: row.outcome,
    tested_at: row.tested_at,
  }));

  // My Supply: every sample the user has registered, with its latest test
  // outcome. Status is derived: 0 mg left -> reorder, otherwise the latest
  // test result decides verified/failed/pending.
  const supplyStatus = (quantityMg: number | null, latest: TestResultRow | null): string => {
    if (quantityMg === 0) return 'reorder';
    if (!latest) return 'pending';
    return latest.outcome === 'pass' ? 'verified' : 'failed';
  };

  const { data: samplesData } = await userDb
    .from('shipment_samples')
    .select(
      'id, quantity_mg, vendor_name, created_at, peptide:peptides(name), vendor:vendors(name), shipment:shipments!inner(account_id, test_results(purity, outcome, tested_at))',
    )
    .eq('shipment.account_id', session.userId)
    .order('created_at', { ascending: false });

  const sampleSupplies = (samplesData ?? []).map((row) => {
    const shipment = row.shipment as unknown as { test_results: TestResultRow[] | null };
    const latest = latestResult(shipment.test_results ?? []);
    const quantityMg = row.quantity_mg === null ? null : Number(row.quantity_mg);
    return {
      id: row.id,
      peptide_name: (row.peptide as unknown as { name: string } | null)?.name ?? '',
      quantity_mg: quantityMg,
      vendor_name:
        (row.vendor as unknown as { name: string } | null)?.name ?? row.vendor_name ?? '',
      purity: latest ? Number(latest.purity) : null,
      status: supplyStatus(quantityMg, latest),
      created_at: row.created_at,
    };
  });

  // Legacy shipments without shipment_samples still count as supply.
  const legacySupplies = (data ?? [])
    .filter((row) => peptideNamesFor(row as unknown as ShipmentJoinRow).length > 0)
    .filter(
      (row) =>
        ((row.shipment_samples as unknown as unknown[] | null) ?? []).length === 0,
    )
    .map((row) => {
      const results = (row.test_results as TestResultRow[]) ?? [];
      const latest = latestResult(results);
      return {
        id: row.id,
        peptide_name: (row.peptide as unknown as { name: string } | null)?.name ?? '',
        quantity_mg: null,
        vendor_name: (row.vendor as unknown as { name: string } | null)?.name ?? '',
        purity: latest ? Number(latest.purity) : null,
        status: supplyStatus(null, latest),
        created_at: row.created_at,
      };
    });

  const allPurities = shipments.flatMap((s) => s.purities);
  const avgBatchPurity =
    allPurities.length > 0
      ? Math.round((allPurities.reduce((sum, p) => sum + p, 0) / allPurities.length) * 10) / 10
      : null;

  res.json({
    shipments: shipments.map(({ purities: _purities, ...shipment }) => shipment),
    recentResults,
    supplies: [...sampleSupplies, ...legacySupplies],
    stats: {
      totalSamples: shipments.reduce((sum, s) => sum + s.sample_count, 0),
      avgBatchPurity,
      activeAnalysis: shipments.filter((s) => s.status === 'testing').length,
    },
  });
});

app.get('/shipment/:id', async (req, res) => {
  const session = await authenticate(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const userDb = session.db;

  const { data, error } = await userDb
    .from('shipments')
    .select(
      'id, tracking_id, status, created_at, updated_at, origin_city, origin_address, destination_city, destination_address, service, package_type, weight, dimensions, temperature, milestones, timeline_events, billing_items, total_amount, invoice_number, invoice_url, payment_status, payment_method, amount_due, due_date, payment_notice_title, payment_notice_body',
    )
    .eq('id', req.params.id)
    .eq('account_id', session.userId)
    .maybeSingle();

  if (error) {
    res.status(500).json({ error: 'Failed to load shipment' });
    return;
  }
  if (!data) {
    res.status(404).json({ error: 'Shipment not found' });
    return;
  }

  const safeArray = (value: unknown) => {
    if (Array.isArray(value)) return value;
    try {
      const parsed = typeof value === 'string' ? JSON.parse(value) : value;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  res.json({
    id: data.id,
    trackingNumber: data.tracking_id,
    status: data.status,
    origin: {
      city: data.origin_city ?? null,
      address: data.origin_address ?? null,
    },
    destination: {
      city: data.destination_city ?? null,
      address: data.destination_address ?? null,
    },
    milestones: safeArray(data.milestones),
    timelineEvents: safeArray(data.timeline_events),
    billingItems: safeArray(data.billing_items),
    totalAmount: data.total_amount == null ? null : Number(data.total_amount),
    invoiceNumber: data.invoice_number ?? null,
    invoiceUrl: data.invoice_url ?? null,
    paymentStatus: data.payment_status ?? null,
    paymentNotice: data.payment_notice_title || data.payment_notice_body ? {
      title: data.payment_notice_title ?? '',
      body: data.payment_notice_body ?? '',
    } : null,
    service: data.service ?? null,
    packageType: data.package_type ?? null,
    weight: data.weight ?? null,
    dimensions: data.dimensions ?? null,
    temperature: data.temperature ?? null,
    paymentMethod: data.payment_method ?? null,
    amountDue: data.amount_due == null ? null : Number(data.amount_due),
    dueDate: data.due_date ?? null,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((error: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const requestId = typeof req.headers['x-request-id'] === 'string' ? req.headers['x-request-id'] : null;
  const originRejected = error instanceof Error && error.message === 'Origin is not allowed';
  console.error(JSON.stringify({
    event: 'request_failed',
    requestId,
    method: req.method,
    path: req.path,
    errorType: error instanceof Error ? error.name : 'UnknownError',
  }));
  res.status(originRejected ? 403 : 500).json({
    error: originRejected ? 'Request origin is not allowed' : 'Internal server error',
    requestId,
  });
});

const privacyWorkerEnabled = process.env.PRIVACY_WORKER_ENABLED !== 'false';
let privacyWorkerRunning = false;

const manifestStrings = (manifest: Record<string, unknown>, key: string): string[] => {
  const value = manifest[key];
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => (
    typeof item === 'string' && item.length > 0 && item.length <= 500 && !item.includes('://') && !item.includes('..')
  )))];
};

const runPrivacyWorker = async (): Promise<void> => {
  if (!privacyWorkerEnabled || privacyWorkerRunning) return;
  privacyWorkerRunning = true;
  const db = getServiceClient();
  try {
    const now = new Date().toISOString();
    const { data: dueRequests, error } = await db.from('account_deletion_requests')
      .select('id')
      .or(`and(status.eq.scheduled,scheduled_for.lte.${now}),and(status.eq.failed,cleanup_attempts.lt.10)`)
      .order('scheduled_for', { ascending: true })
      .limit(10);
    if (error) throw error;

    for (const request of dueRequests ?? []) {
      try {
        const { data, error: prepareError } = await db.rpc('prepare_account_deletion', {
          deletion_request_id: request.id,
        });
        if (prepareError || !data || typeof data !== 'object') throw prepareError ?? new Error('Missing cleanup manifest');
        const manifest = data as Record<string, unknown>;
        const removals: Array<[string, string[]]> = [
          [PROFILE_PHOTOS_BUCKET, manifestStrings(manifest, 'profilePhotos')],
          [FORM_UPLOADS_BUCKET, manifestStrings(manifest, 'formUploads')],
          [DATA_EXPORTS_BUCKET, manifestStrings(manifest, 'dataExports')],
        ];
        for (const [bucket, paths] of removals) {
          if (paths.length === 0) continue;
          const { error: removeError } = await db.storage.from(bucket).remove(paths);
          if (removeError) throw removeError;
        }
        for (const subject of manifestStrings(manifest, 'authSubjects')) {
          if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(subject)) continue;
          const { error: authError } = await db.auth.admin.deleteUser(subject);
          if (authError && authError.status !== 404) throw authError;
        }
        await db.from('account_deletion_requests').update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          failure_code: null,
          updated_at: new Date().toISOString(),
        }).eq('id', request.id);
      } catch (workerError) {
        const errorCode = workerError && typeof workerError === 'object' && 'code' in workerError
          ? String(workerError.code).slice(0, 100)
          : 'cleanup_failed';
        await db.from('account_deletion_requests').update({
          status: 'failed',
          failure_code: errorCode,
          updated_at: new Date().toISOString(),
        }).eq('id', request.id);
        console.error(JSON.stringify({ event: 'account_deletion_failed', requestId: request.id, errorCode }));
      }
    }

    const { data: expiredExports } = await db.from('data_export_requests')
      .select('id, storage_path')
      .eq('status', 'complete')
      .lt('expires_at', now)
      .limit(100);
    const exportPaths = (expiredExports ?? []).map((item) => item.storage_path).filter((path): path is string => Boolean(path));
    if (exportPaths.length > 0) await db.storage.from(DATA_EXPORTS_BUCKET).remove(exportPaths);
    if ((expiredExports ?? []).length > 0) {
      await db.from('data_export_requests').update({ status: 'expired', updated_at: now })
        .in('id', (expiredExports ?? []).map((item) => item.id));
    }
  } finally {
    privacyWorkerRunning = false;
  }
};

const start = async (): Promise<void> => {
  await Promise.allSettled([ensureProfileBucket(), ensureFormUploadsBucket()]);
  await ensureAdminBootstrap().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'unknown';
    console.error(JSON.stringify({ event: 'admin_bootstrap_failed', message }));
  });
  if (privacyWorkerEnabled) {
    void runPrivacyWorker().catch((error: unknown) => {
      console.error(JSON.stringify({ event: 'privacy_worker_failed', errorType: error instanceof Error ? error.name : 'UnknownError' }));
    });
    const timer = setInterval(() => {
      void runPrivacyWorker().catch((error: unknown) => {
        console.error(JSON.stringify({ event: 'privacy_worker_failed', errorType: error instanceof Error ? error.name : 'UnknownError' }));
      });
    }, 5 * 60 * 1000);
    timer.unref();
  }
  app.listen(port, () => {
    console.log(JSON.stringify({ event: 'api_started', port }));
  });
};

void start();
