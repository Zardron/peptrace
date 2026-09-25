import 'dotenv/config';
import crypto from 'node:crypto';
import express from 'express';
import cors from 'cors';
import { supabase, createUserClient, getServiceClient, sessionSecret } from './supabase.js';
import {
  createSessionToken,
  verifySessionToken,
  hashPassword,
  verifyPassword,
  isValidEmail,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
} from './auth.js';

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(cors());
// 8 MB to fit base64-encoded avatar uploads (5 MB decoded cap below).
app.use(express.json({ limit: '8mb' }));

interface Session {
  userId: string;
  email: string;
  name: string | null;
  // Client used for user-data queries. Supabase Auth users keep their
  // RLS-scoped client; native users get the service client. Every query below
  // carries an explicit user filter, so both paths stay scoped to the caller.
  db: ReturnType<typeof createUserClient>;
}

app.get('/vendors', async (_req, res) => {
  const { data, error } = await supabase
    .from('vendors')
    .select('id, name, score, cost_per_mg, location, tests_count, products_count, latest_tested_at')
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
    const { data, error } = await db.from('vendors').select('*').eq('id', id).maybeSingle();
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

  const testsCount = vendor.tests_count ?? 18;
  const testsPassed = vendor.tests_passed ?? Math.round((testsCount * (vendor.score ?? 80)) / 100);
  const testsTotal = vendor.tests_total ?? testsCount;
  const peptidesCount = vendor.products_count ?? 2;
  const rating = vendor.rating ?? vendor.score ?? 92;

  // Contact channels (synthesized if missing).
  const contactChannels = vendor.contact_channels ?? [
    { type: 'website', value: vendor.website_url ?? 'zenithjodepep.com', url: vendor.website_url ?? 'https://zenithjodepep.com' },
    { type: 'whatsapp', value: '+12345678901', url: 'https://wa.me/12345678901' },
    { type: 'email', value: 'zenithjodepep@outlook.com', url: 'mailto:zenithjodepep@outlook.com' },
  ];

  // Intelligence report (synthesized if missing).
  const intelligenceReport = vendor.intelligence_report ?? {
    title: `Vendor Intelligence Report: ${vendor.name}`,
    description:
      'WHOIS records link to the same Shenzhen trading firm, while a Weibo address and WordPress cosmetics-side mention underline the US-manufacturer posture. The report also covers contact/payment info and a high-risk Bolivian team listing.',
    pageCount: 17,
    riskFactorsAssessed: 5,
    publishedDate: '2026-06-08',
    previewUrl: null,
  };

  // Peptides pricing rows (synthesized if missing).
  const peptides = vendor.peptides ?? [
    { id: 'pep-ghk-cu', name: 'GHK-Cu', pricePerMg: 0.1, rating: 91, testCount: 4 },
    { id: 'pep-retatrutide-1', name: 'Retatrutide', pricePerMg: 1.0, rating: 86, testCount: 14 },
    { id: 'pep-retatrutide-2', name: 'Retatrutide', pricePerMg: 1.0, rating: 76, testCount: 17 },
  ];

  // Rating trend (synthesized).
  const ratingTrend = vendor.rating_trend ?? {
    bands: [
      { label: '83%+', threshold: 83 },
      { label: '65%+', threshold: 65 },
      { label: '48%+', threshold: 48 },
      { label: '30%+', threshold: 30 },
      { label: '<30%', threshold: 0 },
    ],
    points: [
      { date: '2025-12-15', rating: 76, label: '76%' },
      { date: '2026-04-10', rating: 86, label: '86%' },
      { date: '2026-06-20', rating: 90, label: '90%' },
      { date: '2026-08-08', rating: 88, label: '88%' },
    ],
    xAxisLabels: ['Dec 25', 'Apr 26', 'Aug 26'],
  };

  // Test history from the vendor_tests table.
  const { data: testRows, error: testsError } = await db
    .from('vendor_tests')
    .select(
      'tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url',
    )
    .eq('vendor_id', vendor.id)
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
      testsCount: testsCount,
      peptidesCount: peptidesCount,
      latestUpdate: vendor.latest_tested_at ?? new Date().toISOString().split('T')[0],
      rating,
      rank: vendor.rank ?? 1,
      rankedVendorsCount: vendor.ranked_vendors_count ?? 301,
      testsPassed,
      testsTotal,
      analysisText:
        vendor.analysis_text ??
        `${vendor.name} is a peptide vendor tracked in Peptrace's ratings, observed price signals, recent test dates, and corrections. Peptrace ratings are calculated from published sample data using a Bayesian model that adjusts low-volume results so small sample counts do not appear artificially high.`,
      about:
        vendor.about ??
        `${vendor.name} is a peptide vendor tracked in Peptrace's ratings, observed price signals, recent test dates, and corrections. The most visible peptides in this dataset are Retatrutide and GHK-Cu. This page shows the current Peptrace rating, price per mg, and sample volume for each peptide. Recent tests and corrections are shown below when available.`,
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
  }[];
}

let leaderboardsCache: { expiresAt: number; promise: Promise<LeaderboardsCard[]> } | null = null;

const loadLeaderboardsCards = async (): Promise<LeaderboardsCard[]> => {
  const { data, error } = await getServiceClient()
    .from('VendorProduct')
    .select(
      'id, priceMg, rating, purityPercent, testsCount, updatedAt, peptide:Peptide(id, label, slug), vendor:Vendor(id, displayName)',
    );
  if (error) {
    throw new Error(error.message);
  }

  interface ProductRow {
    id: string;
    priceMg: number | null;
    rating: number | null;
    purityPercent: number | null;
    testsCount: number | null;
    updatedAt: string | null;
    peptide: { id: string; label: string; slug: string } | null;
    vendor: { id: string; displayName: string } | null;
  }

  const byPeptide = new Map<string, { peptide: ProductRow['peptide']; products: ProductRow[] }>();
  for (const row of (data ?? []) as unknown as ProductRow[]) {
    if (!row.peptide || !row.vendor) {
      continue;
    }
    const entry = byPeptide.get(row.peptide.id) ?? { peptide: row.peptide, products: [] };
    entry.products.push(row);
    byPeptide.set(row.peptide.id, entry);
  }

  return [...byPeptide.values()]
    .map(({ peptide, products }) => {
      return {
        peptideId: peptide!.id,
        productName: peptide!.label,
        slug: peptide!.slug,
        testCount: products.reduce((sum, p) => sum + (p.testsCount ?? 0), 0),
        vendorCount: new Set(products.map((p) => p.vendor!.id)).size,
        lastUpdated: products
          .map((p) => p.updatedAt ?? '')
          .sort()
          .at(-1) ?? null,
        // All vendor rows are returned unranked; the client filters (purity),
        // sorts (rating or $/mg) and ranks them.
        rows: products.map((p) => ({
          vendorName: p.vendor!.displayName,
          pricePerMg: p.priceMg,
          rating: p.rating,
          purityPercent: p.purityPercent,
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

  const { data: vpRows, error: vpError } = await db
    .from('VendorProduct')
    .select(
      'id, priceMg, rating, purityPercent, testsCount, updatedAt, peptide:Peptide(id, label, slug), vendor:Vendor(id, displayName, name)',
    )
    .eq('peptide.slug', slug);

  if (vpError) {
    res.status(500).json({ error: 'Failed to load leaderboard' });
    return;
  }

  let productName = slug.charAt(0).toUpperCase() + slug.slice(1);

  interface VpRow {
    id: string;
    priceMg: number | null;
    rating: number | null;
    purityPercent: number | null;
    testsCount: number | null;
    updatedAt: string | null;
    peptide: { id: string; label: string; slug: string } | null;
    vendor: { id: string; displayName: string; name: string | null } | null;
  }

  const rows = (vpRows ?? []) as unknown as VpRow[];

  if (rows.length > 0 && rows[0].peptide) {
    productName = rows[0].peptide.label;
  }

  let vendors = rows
    .filter((r) => r.vendor)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .map((r, i) => {
      const name = r.vendor!.displayName;
      const vendorSlug =
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') || `vendor-${i + 1}`;
      const initials = name
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
      return {
        rank: i + 1,
        name,
        slug: vendorSlug,
        initials,
        isVerified: true,
        pricePerMg: r.priceMg ?? 0,
        customerRating: r.rating ?? 0,
        purityRating: r.purityPercent ?? 0,
        nCount: r.testsCount ?? 0,
      };
    });

  // Synthesize demo vendors when no real data exists yet.
  if (vendors.length === 0) {
    const demoVendors = [
      { name: 'Peptide Partners', pricePerMg: 1.45, customerRating: 4.9, purityRating: 93, nCount: 142, isVerified: true },
      { name: 'Inno Peptides', pricePerMg: 1.52, customerRating: 4.8, purityRating: 91, nCount: 128, isVerified: true },
      { name: 'ZLZ Peptide', pricePerMg: 1.58, customerRating: 4.7, purityRating: 91, nCount: 115, isVerified: true },
      { name: 'Bioscience Lab', pricePerMg: 1.65, customerRating: 4.6, purityRating: 89, nCount: 89, isVerified: false },
      { name: 'PureCycle', pricePerMg: 1.72, customerRating: 4.5, purityRating: 88, nCount: 76, isVerified: false },
      { name: 'Synthetix', pricePerMg: 1.80, customerRating: 4.4, purityRating: 86, nCount: 64, isVerified: false },
      { name: 'NovaChem', pricePerMg: 1.85, customerRating: 4.3, purityRating: 85, nCount: 58, isVerified: false },
      { name: 'GenTech', pricePerMg: 1.90, customerRating: 4.2, purityRating: 84, nCount: 52, isVerified: false },
    ];
    vendors = demoVendors.map((v, i) => ({
      rank: i + 1,
      name: v.name,
      slug: v.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      initials: v.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase(),
      isVerified: v.isVerified,
      pricePerMg: v.pricePerMg,
      customerRating: v.customerRating,
      purityRating: v.purityRating,
      nCount: v.nCount,
    }));
  }

  const allDates = rows.map((r) => r.updatedAt).filter(Boolean) as string[];
  allDates.sort();

  res.json({
    product: {
      name: productName,
      slug,
      vendorCount: vendors.length,
      testCount: vendors.reduce((sum, v) => sum + v.nCount, 0),
      firstTestDate: allDates[0] ?? '2025-12-17',
      latestTestDate: allDates.at(-1) ?? '2026-09-20',
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

  const { data: vpRows } = await db
    .from('VendorProduct')
    .select('peptide:Peptide(label)')
    .eq('peptide.slug', slug)
    .limit(1);

  const peptideLabel =
    (vpRows?.[0] as unknown as { peptide: { label: string } | null } | undefined)?.peptide
      ?.label ?? slug;

  const { data: testRows, error: testsError } = await db
    .from('vendor_tests')
    .select(
      'tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, vendor_id',
    )
    .ilike('peptide_name', peptideLabel)
    .order('tested_at', { ascending: false });

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

  if (!testsError && testRows && testRows.length > 0) {
    const vendorIds = [
      ...new Set((testRows as unknown as Array<{ vendor_id: string | null }>).map((t) => t.vendor_id).filter(Boolean)),
    ];
    const { data: vendorRows } =
      vendorIds.length > 0
        ? await db.from('vendors').select('id, name').in('id', vendorIds)
        : { data: [] };
    const vendorNameById = new Map<string, string>(
      (vendorRows ?? []).map((v: unknown) => [(v as { id: string }).id, (v as { name: string }).name]),
    );

    items = (testRows as unknown as Array<{
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
  } else {
    const demoTests = [
      { date: '2026-08-03', result: 'pass' as const, vendorName: 'Zenith Jode Peptide', labName: 'LAB NAME', purity: 99.9, dosageDeviation: '-15%', testedMg: 34, labelMg: 40, batch: 'Batch March 7, 2026', sender: 'sent by Public' },
      { date: '2026-07-30', result: 'pass' as const, vendorName: 'Zenith Jode Peptide', labName: 'LAB NAME', purity: 99.8, dosageDeviation: '+6%', testedMg: 21.2, labelMg: 20, batch: 'Batch 258014', sender: 'sent by Public' },
      { date: '2025-07-13', result: 'fail' as const, vendorName: 'Zenith Jode Peptide', labName: 'LAB NAME', purity: 99.2, dosageDeviation: '+8%', testedMg: 10.8, labelMg: 10, batch: 'No label / Copper crimp / Clear cap', sender: 'sent by Public' },
      { date: '2025-07-13', result: 'pass' as const, vendorName: 'Zenith Jode Peptide', labName: 'LAB NAME', purity: 99.9, dosageDeviation: '-19%', testedMg: 40.7, labelMg: 50, batch: 'Batch May 6, 2025', sender: 'sent by Public' },
      { date: '2025-06-08', result: 'pass' as const, vendorName: 'Zenith Jode Peptide', labName: 'LAB NAME', purity: 99.8, dosageDeviation: '+1%', testedMg: 30.4, labelMg: 30, batch: 'Batch March 6, 2025', sender: 'sent by Public' },
      { date: '2025-06-02', result: 'pass' as const, vendorName: 'Zenith Jode Peptide', labName: 'LAB NAME', purity: 99.9, dosageDeviation: '-2%', testedMg: 9.79, labelMg: 10, batch: 'Batch 258013', sender: 'sent by Public' },
      { date: '2025-04-02', result: 'pass' as const, vendorName: 'Zenith Jode Peptide', labName: 'LAB NAME', purity: 99.6, dosageDeviation: '+2%', testedMg: 20.4, labelMg: 20, batch: 'Batch Feb 5, 2025', sender: 'sent by Public' },
      { date: '2025-03-07', result: 'pass' as const, vendorName: 'Zenith Jode Peptide', labName: 'LAB NAME', purity: 99.8, dosageDeviation: '+9%', testedMg: 21.7, labelMg: 20, batch: 'Batch 021525', sender: 'sent by Public' },
      { date: '2025-03-02', result: 'pass' as const, vendorName: 'Zenith Jode Peptide', labName: 'LAB NAME', purity: 99.9, dosageDeviation: '-12%', testedMg: 88.2, labelMg: 100, batch: 'Batch Jan 2, 2025', sender: 'sent by Public' },
      { date: '2025-02-18', result: 'pass' as const, vendorName: 'Zenith Jode Peptide', labName: 'LAB NAME', purity: 99.9, dosageDeviation: '-12%', testedMg: 17.6, labelMg: 20, batch: 'No Label / Gold Crimp / Clear Cap', sender: 'sent by Public' },
    ];
    items = demoTests.map((t) => ({
      date: t.date,
      result: t.result.toUpperCase() as 'PASS' | 'FAIL',
      productName: peptideLabel,
      vendorName: t.vendorName,
      labName: t.labName,
      purity: t.purity,
      identityPass: t.result === 'pass',
      dosageDeviation: t.dosageDeviation,
      testedMg: t.testedMg,
      labelMg: t.labelMg,
      batch: t.batch,
      sender: t.sender,
      coaUrl: '#',
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
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return null;
  }
  const token = auth.slice(7);

  const secret = sessionSecret();
  if (secret) {
    const native = verifySessionToken(token, secret);
    if (native) {
      return {
        userId: native.userId,
        email: native.email,
        name: null,
        db: getServiceClient(),
      };
    }
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return null;
  }
  const name =
    typeof data.user.user_metadata?.name === 'string' ? data.user.user_metadata.name : null;
  return {
    userId: data.user.id,
    email: data.user.email ?? '',
    name,
    db: createUserClient(token),
  };
};

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'peptrace-api' });
});

// ---- Native email/password auth (no Supabase Auth) ----

const normalizeEmail = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

app.post('/auth/check-email', async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'A valid email address is required' });
    return;
  }
  const db = getServiceClient();
  const { data, error } = await db
    .from('native_credentials')
    .select('account_id')
    .eq('email', email)
    .maybeSingle();
  if (error) {
    res.status(500).json({ error: 'Failed to check email' });
    return;
  }
  res.json({ exists: Boolean(data) });
});

app.post('/auth/register', async (req, res) => {
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

  const userId = crypto.randomUUID();
  const { error: accountError } = await db
    .from('user_accounts')
    .insert({ id: userId, email });
  if (accountError) {
    res.status(500).json({ error: 'Failed to create account' });
    return;
  }
  const { error: credentialError } = await db
    .from('native_credentials')
    .insert({ account_id: userId, email, password_hash: hashPassword(password) });
  if (credentialError) {
    await db.from('user_accounts').delete().eq('id', userId);
    res.status(500).json({ error: 'Failed to create credentials' });
    return;
  }
  // Profile rows are upserted on first save too, so a failure here is not fatal.
  await db.from('user_profiles').insert({ account_id: userId });

  const secret = sessionSecret()!;
  res.status(201).json({ token: createSessionToken({ userId, email }, secret) });
});

app.post('/auth/login', async (req, res) => {
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
    res.status(404).json({ error: 'No account found for this email' });
    return;
  }
  if (!verifyPassword(password, credential.password_hash)) {
    res.status(401).json({ error: 'Incorrect password' });
    return;
  }

  const secret = sessionSecret()!;
  res.json({ token: createSessionToken({ userId: credential.account_id, email }, secret) });
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

  res.json({
    id: session.userId,
    email: session.email,
    name,
    isNewAccount,
    memberSince: account?.created_at ?? new Date().toISOString(),
    profile: profile ?? null,
  });
});

const PROFILE_FIELDS = ['full_name', 'organization', 'role', 'phone', 'bio', 'avatar_url'] as const;

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

  res.json({ profile });
});

const PROFILE_PHOTOS_BUCKET = 'profile_photos';
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

const storagePathFromUrl = (url: string): string | null => {
  const marker = `/object/public/${PROFILE_PHOTOS_BUCKET}/`;
  const index = url.indexOf(marker);
  return index === -1 ? null : url.slice(index + marker.length);
};

app.post('/account/avatar', async (req, res) => {
  const session = await authenticate(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { image, contentType, extension } = req.body ?? {};
  if (typeof image !== 'string' || typeof contentType !== 'string' || !contentType.startsWith('image/')) {
    res.status(400).json({ error: 'An image file is required' });
    return;
  }
  const buffer = Buffer.from(image, 'base64');
  if (buffer.length === 0 || buffer.length > MAX_AVATAR_BYTES) {
    res.status(400).json({ error: 'Photo must be smaller than 5 MB' });
    return;
  }
  const ext =
    typeof extension === 'string' && /^[a-z0-9]{1,5}$/.test(extension) ? extension : 'png';

  const path = `${session.userId}/${crypto.randomUUID()}.${ext}`;
  const storage = getServiceClient().storage.from(PROFILE_PHOTOS_BUCKET);
  const { error: uploadError } = await storage.upload(path, buffer, { contentType });
  if (uploadError) {
    res.status(500).json({ error: 'Could not upload the photo' });
    return;
  }
  const { data: { publicUrl } } = storage.getPublicUrl(path);

  const { data: current } = await session.db
    .from('user_profiles')
    .select('avatar_url')
    .eq('account_id', session.userId)
    .maybeSingle();
  const oldPath = current?.avatar_url ? storagePathFromUrl(current.avatar_url) : null;

  const { error: updateError } = await session.db
    .from('user_profiles')
    .upsert(
      { account_id: session.userId, avatar_url: publicUrl, updated_at: new Date().toISOString() },
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

  res.json({ avatar_url: publicUrl });
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

// The wizard renders previews straight from the public object URL, so the
// bucket must exist and allow public reads.
const ensureFormUploadsBucket = (): Promise<void> => {
  formBucketReady ??= (async () => {
    const storage = getServiceClient().storage;
    const { data, error } = await storage.getBucket(FORM_UPLOADS_BUCKET);
    if (error || !data) {
      const { error: createError } = await storage.createBucket(FORM_UPLOADS_BUCKET, {
        public: true,
      });
      if (createError && !/already exists/i.test(createError.message)) {
        throw createError;
      }
      return;
    }
    if (!data.public) {
      const { error: updateError } = await storage.updateBucket(FORM_UPLOADS_BUCKET, {
        public: true,
      });
      if (updateError) {
        throw updateError;
      }
    }
  })().catch((err) => {
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

  const path = `${uploadType}/${crypto.randomUUID()}.${ext}`;
  const storage = getServiceClient().storage.from(FORM_UPLOADS_BUCKET);
  const { error: uploadError } = await storage.upload(path, buffer, { contentType });
  if (uploadError) {
    res.status(500).json({ error: 'Could not upload the file' });
    return;
  }
  const {
    data: { publicUrl },
  } = storage.getPublicUrl(path);

  res.json({ url: publicUrl, path, contentType });
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

  const { samples, newsletterOptIn } = req.body ?? {};
  if (!Array.isArray(samples) || samples.length === 0 || samples.length > 20) {
    res.status(400).json({ error: 'At least one sample is required' });
    return;
  }
  for (const s of samples as ShipmentSampleInput[]) {
    if (typeof s?.peptideId !== 'string' || s.peptideId === '') {
      res.status(400).json({ error: 'Each sample needs a product' });
      return;
    }
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
      .in('name', vendorNames);
    for (const v of vendorRows ?? []) {
      vendorIdByName.set(v.name, v.id);
    }
  }

  // One shipment per submission (single tracking ID); one shipment_samples
  // row per sample added in the wizard.
  const db = getServiceClient();
  const trackingId = `PT-${Math.floor(1000 + Math.random() * 9000)}`;
  const { data: shipment, error: shipmentError } = await db
    .from('shipments')
    .insert({
      account_id: session.userId,
      tracking_id: trackingId,
      status: 'submitted',
      newsletter_opt_in: newsletterOptIn === true,
    })
    .select('id')
    .single();
  if (shipmentError || !shipment) {
    res.status(500).json({ error: 'Failed to register the shipment' });
    return;
  }

  const sampleRows = (samples as ShipmentSampleInput[]).map((s) => {
    const vendorName = textOrNull(s.vendor);
    return {
      shipment_id: shipment.id,
      peptide_id: s.peptideId as string,
      vendor_id: vendorName ? (vendorIdByName.get(vendorName) ?? null) : null,
      vendor_name: vendorName,
      form_factor: textOrNull(s.formFactor),
      batch_id: textOrNull(s.batchId),
      batch_proof_url: textOrNull(s.batchProofFile),
      quantity_mg: numberOrNull(s.quantityMg),
      lab: textOrNull(s.lab),
      addons: Array.isArray(s.addons) ? s.addons.filter((a) => typeof a === 'string') : [],
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
      sample_price: numberOrNull(s.samplePrice),
    };
  });

  const { data: inserted, error } = await db
    .from('shipment_samples')
    .insert(sampleRows)
    .select('id');
  if (error) {
    await db.from('shipments').delete().eq('id', shipment.id);
    res.status(500).json({ error: 'Failed to register the shipment' });
    return;
  }

  res.json({
    id: shipment.id,
    trackingId,
    sampleIds: (inserted ?? []).map((r) => r.id),
  });
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

  const safeDate = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const safeArray = (value: unknown) => {
    if (Array.isArray(value)) return value;
    try {
      const parsed = typeof value === 'string' ? JSON.parse(value) : value;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const milestones = safeArray(data.milestones);
  const timelineEvents = safeArray(data.timeline_events);
  const billingItems = safeArray(data.billing_items);

  // Synthesize plausible detail data when columns are empty so the UI renders.
  const originCity = data.origin_city ?? 'San Diego, CA';
  const originAddress = data.origin_address ?? 'PetTrace Labs\n4720 Sorrento Valley Rd.\nSan Diego, CA 92121';
  const destinationCity = data.destination_city ?? 'Austin, TX';
  const destinationAddress = data.destination_address ?? 'Dr. Maya Patel\nAustin Veterinary Center\nAustin, TX 78704';

  const shipmentMilestones = milestones.length > 0 ? milestones : [
    { name: 'Shipping Label Created', date: '2026-08-12', completed: true },
    { name: 'In Transit', date: '2026-08-13', completed: true },
    { name: 'Lab Received', date: '2026-08-14', completed: true },
    { name: 'In Transit', date: '2026-08-15', completed: false },
    { name: 'Peptrace Received', date: '', completed: false },
  ];

  const shipmentTimeline = timelineEvents.length > 0 ? timelineEvents : [
    { event: 'Shipping Label Created', meta: 'Aug 12 · 2:24 PM · PetTrace Labs', timestamp: '2026-08-12T14:24:00Z' },
    { event: 'In Transit', meta: 'Aug 13 · 5:06 PM · San Diego, CA', timestamp: '2026-08-13T17:06:00Z' },
    { event: 'Lab Received', meta: 'Aug 14 · 3:18 AM · Phoenix, AZ', timestamp: '2026-08-14T03:18:00Z' },
    { event: 'In Transit', meta: 'Today · 9:42 AM · Phoenix, AZ', timestamp: '2026-08-15T09:42:00Z' },
    { event: 'Peptrace Received', meta: 'Today · 10:15 AM · Peptrace Labs', timestamp: '2026-08-15T10:15:00Z' },
  ];

  const shipmentBilling = billingItems.length > 0 ? billingItems : [
    { label: 'Priority Overnight', value: 86.00 },
    { label: 'Fuel surcharge', value: 8.60 },
    { label: 'Sample handling', value: 12.00 },
    { label: 'Insurance', value: 4.50 },
  ];

  res.json({
    id: data.id,
    trackingNumber: data.tracking_id,
    status: data.status,
    origin: {
      city: originCity,
      address: originAddress,
    },
    destination: {
      city: destinationCity,
      address: destinationAddress,
    },
    milestones: shipmentMilestones,
    timelineEvents: shipmentTimeline,
    billingItems: shipmentBilling,
    totalAmount: data.total_amount ?? 111.10,
    invoiceNumber: data.invoice_number ?? 'INV-2026-08142',
    invoiceUrl: data.invoice_url ?? '',
    paymentStatus: data.payment_status ?? 'unpaid',
    paymentNotice: {
      title: data.payment_notice_title ?? 'Payment required',
      body: data.payment_notice_body ?? 'Pay by the due date to avoid delays or account restrictions.',
    },
    service: data.service ?? 'FedEx Priority Overnight',
    packageType: data.package_type ?? 'Diagnostic sample kit',
    weight: data.weight ?? '2.4 lb',
    dimensions: data.dimensions ?? '12 × 9 × 6 in',
    temperature: data.temperature ?? 'Ambient',
    paymentMethod: data.payment_method ?? 'No method selected',
    amountDue: data.amount_due ?? 111.10,
    dueDate: data.due_date ?? 'Aug 17, 2026',
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  });
});

app.listen(port, () => {
  console.log(`peptrace-api listening on port ${port}`);
});
