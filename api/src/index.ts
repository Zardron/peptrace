import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { supabase, createUserClient } from './supabase.js';

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(cors());
app.use(express.json());

const authenticate = async (req: express.Request) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return null;
  }
  const token = auth.slice(7);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return null;
  }
  return { user: data.user, token };
};

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'peptrace-api' });
});

app.get('/auth/me', async (req, res) => {
  const session = await authenticate(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { user: authUser, token } = session;
  const userDb = createUserClient(token);

  let isNewAccount = false;
  const { data: account, error: accountError } = await userDb
    .from('user_accounts')
    .select('id, created_at')
    .eq('id', authUser.id)
    .maybeSingle();

  if (accountError) {
    res.status(500).json({ error: 'Failed to load user account' });
    return;
  }

  if (!account) {
    const { error: insertError } = await userDb
      .from('user_accounts')
      .insert({ id: authUser.id, email: authUser.email ?? '' });
    if (insertError) {
      res.status(500).json({ error: 'Failed to create user account' });
      return;
    }
    const { error: profileError } = await userDb
      .from('user_profiles')
      .insert({ account_id: authUser.id });
    if (profileError) {
      res.status(500).json({ error: 'Failed to create user profile' });
      return;
    }
    isNewAccount = true;
  } else {
    await userDb
      .from('user_accounts')
      .update({ last_sign_in_at: new Date().toISOString() })
      .eq('id', authUser.id);
  }

  const { data: profile } = await userDb
    .from('user_profiles')
    .select('full_name, organization, role, phone, bio, avatar_url')
    .eq('account_id', authUser.id)
    .maybeSingle();

  const email = authUser.email ?? '';
  const name =
    profile?.full_name ??
    (typeof authUser.user_metadata?.name === 'string' ? authUser.user_metadata.name : null) ??
    email.split('@')[0];

  res.json({
    id: authUser.id,
    email,
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

  const userDb = createUserClient(session.token);
  const { data: profile, error: profileError } = await userDb
    .from('user_profiles')
    .upsert(
      { account_id: session.user.id, ...updates, updated_at: new Date().toISOString() },
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
  const userDb = createUserClient(session.token);
  const { data, error } = await userDb
    .from('shipping_addresses')
    .select(ADDRESS_SELECT)
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

  const userDb = createUserClient(session.token);
  const { count } = await userDb
    .from('shipping_addresses')
    .select('id', { count: 'exact', head: true });

  const { data, error } = await userDb
    .from('shipping_addresses')
    .insert({
      account_id: session.user.id,
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

  const userDb = createUserClient(session.token);
  const { data, error } = await userDb
    .from('shipping_addresses')
    .update({ ...parsed.values, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .eq('account_id', session.user.id)
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
  const userDb = createUserClient(session.token);

  const { data: deleted, error } = await userDb
    .from('shipping_addresses')
    .delete()
    .eq('id', req.params.id)
    .eq('account_id', session.user.id)
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
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (next) {
      await userDb
        .from('shipping_addresses')
        .update({ is_primary: true })
        .eq('id', next.id);
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
  const userDb = createUserClient(session.token);

  const { data: target } = await userDb
    .from('shipping_addresses')
    .select('id')
    .eq('id', req.params.id)
    .eq('account_id', session.user.id)
    .maybeSingle();
  if (!target) {
    res.status(404).json({ error: 'Address not found' });
    return;
  }

  await userDb
    .from('shipping_addresses')
    .update({ is_primary: false })
    .eq('account_id', session.user.id);
  const { data, error } = await userDb
    .from('shipping_addresses')
    .update({ is_primary: true, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
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
  const userDb = createUserClient(session.token);
  const { data, error } = await userDb
    .from('shipments')
    .select(
      'id, tracking_id, status, created_at, peptide:peptides(name), vendor:vendors(name), test_results(purity)',
    )
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
