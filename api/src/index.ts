import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { supabase, createUserClient } from './supabase.js';

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'peptrace-api' });
});

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
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const token = auth.slice(7);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  const authUser = data.user;
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

app.listen(port, () => {
  console.log(`peptrace-api listening on port ${port}`);
});
