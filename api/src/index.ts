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

app.get('/vendors/:id', async (req, res) => {
  const id = req.params.id;
  const db = getServiceClient();

  // Try lookup by id first, then by slug.
  let { data: vendor, error } = await db.from('vendors').select('*').eq('id', id).maybeSingle();
  if (error) {
    res.status(500).json({ error: 'Failed to load vendor' });
    return;
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
  const testsFailed = Math.max(0, testsTotal - testsPassed);
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

  // Test history (synthesized mock items).
  const peptideNames = ['Retatrutide', 'GHK-Cu'];
  const mockItems = Array.from({ length: testsTotal }).map((_, i) => {
    const isPass = i < testsPassed;
    const date = new Date('2026-08-03');
    date.setDate(date.getDate() - i * 35);
    return {
      date: date.toISOString().split('T')[0],
      result: isPass ? 'pass' : 'fail',
      peptideName: peptideNames[i % peptideNames.length],
      vendorName: vendor.name,
      labName: 'LabCorp',
      purity: isPass ? 99.2 : 94.5,
      dosageDeviation: isPass ? null : '-12%',
      testedMg: isPass ? 10 : 8.8,
      labelMg: 10,
      batchInfo: `Batch-${202500 + i}`,
      sender: i % 3 === 0 ? 'Peptrace' : 'Community',
      coaUrl: isPass ? '#' : null,
    };
  });

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(mockItems.length / pageSize));

  const testHistory = {
    total: testsTotal,
    passCount: testsPassed,
    failCount: testsFailed,
    items: mockItems.slice(0, pageSize),
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
// admin-portal tables need to change.
app.get('/leaderboards', async (_req, res) => {
  const { data, error } = await getServiceClient()
    .from('VendorProduct')
    .select(
      'id, priceMg, rating, purityPercent, testsCount, updatedAt, peptide:Peptide(id, label, slug), vendor:Vendor(id, displayName)',
    );
  if (error) {
    res.status(500).json({ error: 'Failed to load leaderboards' });
    return;
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

  const cards = [...byPeptide.values()]
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

  res.json({ cards });
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

app.get('/account/dashboard', async (req, res) => {
  const session = await authenticate(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const userDb = session.db;
  const { data, error } = await userDb
    .from('shipments')
    .select(
      'id, tracking_id, status, created_at, peptide:peptides(name), vendor:vendors(name), test_results(purity)',
    )
    .eq('account_id', session.userId)
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500).json({ error: 'Failed to load dashboard' });
    return;
  }

  const shipments = (data ?? []).map((row) => ({
    id: row.id,
    tracking_id: row.tracking_id,
    status: row.status,
    created_at: row.created_at,
    peptide_name: (row.peptide as unknown as { name: string } | null)?.name ?? '',
    vendor_name: (row.vendor as unknown as { name: string } | null)?.name ?? '',
    purities: (row.test_results as { purity: number }[]).map((r) => Number(r.purity)),
  }));

  const allPurities = shipments.flatMap((s) => s.purities);
  const avgBatchPurity =
    allPurities.length > 0
      ? Math.round((allPurities.reduce((sum, p) => sum + p, 0) / allPurities.length) * 10) / 10
      : null;

  res.json({
    shipments: shipments.map(({ purities: _purities, ...shipment }) => shipment),
    stats: {
      totalSamples: shipments.length,
      avgBatchPurity,
      activeAnalysis: shipments.filter((s) => s.status === 'testing').length,
    },
  });
});

app.listen(port, () => {
  console.log(`peptrace-api listening on port ${port}`);
});
