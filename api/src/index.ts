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

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

const topVendors = [
  { id: '1', name: 'Zenith Jode Pep', score: 92, cost: '$1.00/mg', tests: 18, products: 2, latest: '8 Aug 2026', location: 'China' },
  { id: '2', name: 'Peptide Partners', score: 85, cost: '$0.70/mg', tests: 16, products: 2, latest: '8 Aug 2026', location: '—' },
  { id: '3', name: 'Peptide Partners', score: 82, cost: '$1.00/mg', tests: 20, products: 2, latest: '5 Aug 2025', location: '—' },
  { id: '4', name: 'Peptide Partners', score: 79, cost: '$0.60/mg', tests: 46, products: 2, latest: '4 Aug 2025', location: '—' },
  { id: '5', name: 'Peptide Partners', score: 78, cost: '$0.60/mg', tests: 19, products: 2, latest: '4 Aug 2025', location: 'US' },
  { id: '6', name: 'Peptide Partners', score: 75, cost: '$1.27/mg', tests: 13, products: 1, latest: '30 Jul 2025', location: 'US' },
  { id: '7', name: 'Peptide Partners', score: 72, cost: '$1.40/mg', tests: 8, products: 1, latest: '27 Jul 2025', location: 'China' },
  { id: '8', name: 'Peptide Partners', score: 69, cost: '$1.50/mg', tests: 16, products: 2, latest: '20 Apr 2025', location: 'China' },
  { id: '9', name: 'Peptide Partners', score: 62, cost: '$5.50/mg', tests: 10, products: 2, latest: '20 Apr 2025', location: 'US' },
  { id: '10', name: 'Peptide Partners', score: 58, cost: '$5.00/mg', tests: 9, products: 1, latest: '8 May 2025', location: '—' },
];

const locations = ['China', 'US', 'UK', 'Germany', 'Hong Kong', 'Japan', 'India', 'Canada', 'Australia', '—'];
const names = ['Zenith Jode Pep', 'Peptide Partners', 'AlphaPeptides', 'BioSynth Labs', 'ChemPure Supply', 'Delta Peptides', 'Elite Research Chems', 'Fusion Biologics', 'GenX Peptides', 'Helix BioTech'];

function formatDate(seed: number): string {
  const daysAgo = Math.floor(seededRandom(seed) * 730);
  const date = new Date('2026-08-08');
  date.setDate(date.getDate() - daysAgo);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatCost(seed: number): string {
  const base = 0.5 + seededRandom(seed) * 5.5;
  return `$${base.toFixed(2)}/mg`;
}

app.get('/vendors', (_req, res) => {
  const generated = Array.from({ length: 90 }, (_, i) => {
    const seed = i + 11;
    const name = names[1 + Math.floor(seededRandom(seed * 3) * (names.length - 1))];
    const score = Math.max(58, Math.round(92 - seededRandom(seed * 7) * 40));
    return {
      id: String(seed),
      name,
      score,
      cost: formatCost(seed * 11),
      tests: Math.floor(5 + seededRandom(seed * 13) * 45),
      products: Math.floor(1 + seededRandom(seed * 17) * 5),
      latest: formatDate(seed * 19),
      location: locations[Math.floor(seededRandom(seed * 23) * locations.length)],
    };
  });
  res.json({ vendors: [...topVendors, ...generated] });
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
