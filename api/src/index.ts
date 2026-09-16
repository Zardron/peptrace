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
