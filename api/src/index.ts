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

app.get('/vendors', (_req, res) => {
  const vendors = Array.from({ length: 100 }, (_, i) => {
    const seed = i + 1;
    const baseCost = 0.5 + (Math.sin(seed * 9999) * 10000 - Math.floor(Math.sin(seed * 9999) * 10000)) * 5.5;
    const cost = `$${baseCost.toFixed(2)}/mg`;
    const score = Math.max(58, Math.round(92 - (Math.sin(seed * 7 * 9999) * 10000 - Math.floor(Math.sin(seed * 7 * 9999) * 10000)) * 40));
    const tests = Math.floor(5 + (Math.sin(seed * 13 * 9999) * 10000 - Math.floor(Math.sin(seed * 13 * 9999) * 10000)) * 45);
    const products = Math.floor(1 + (Math.sin(seed * 17 * 9999) * 10000 - Math.floor(Math.sin(seed * 17 * 9999) * 10000)) * 5);
    const daysAgo = Math.floor((Math.sin(seed * 19 * 9999) * 10000 - Math.floor(Math.sin(seed * 19 * 9999) * 10000)) * 730);
    const date = new Date('2026-08-08');
    date.setDate(date.getDate() - daysAgo);
    const latest = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const locations = ['China', 'US', 'UK', 'Germany', 'Hong Kong', 'Japan', 'India', 'Canada', 'Australia', '—'];
    const location = locations[Math.floor((Math.sin(seed * 23 * 9999) * 10000 - Math.floor(Math.sin(seed * 23 * 9999) * 10000)) * locations.length)];
    const names = [
      'Zenith Jode Peptide ZJ',
      'Peptide Partners',
      'AlphaPeptides',
      'BioSynth Labs',
      'ChemPure Supply',
      'Delta Peptides',
      'Elite Research Chems',
      'Fusion Biologics',
      'GenX Peptides',
      'Helix BioTech',
    ];
    const name = i === 0 ? names[0] : names[1 + Math.floor((Math.sin(seed * 3 * 9999) * 10000 - Math.floor(Math.sin(seed * 3 * 9999) * 10000)) * (names.length - 1))];
    return { id: String(seed), name, score, cost, tests, products, latest, location };
  });
  res.json({ vendors });
});

app.get('/auth/me', async (req, res) => {
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
