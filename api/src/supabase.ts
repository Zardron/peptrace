import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY/SUPABASE_ANON_KEY in environment',
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Queries through this client run as the given user, so RLS policies apply.
export const createUserClient = (accessToken: string) =>
  createClient(supabaseUrl!, supabaseKey!, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
