import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;

function getSupabaseUrl(): string {
  if (!supabaseUrl) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY/SUPABASE_ANON_KEY in environment',
    );
  }
  return supabaseUrl;
}

function getSupabaseKey(): string {
  if (!supabaseKey) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY/SUPABASE_ANON_KEY in environment',
    );
  }
  return supabaseKey;
}

let _supabase: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(getSupabaseUrl(), getSupabaseKey());
  }
  return _supabase;
}

// Re-export for backwards compatibility
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_, prop) {
    return getSupabase()[prop as keyof ReturnType<typeof createClient>];
  },
});

// Queries through this client run as the given user, so RLS policies apply.
export const createUserClient = (accessToken: string) =>
  createClient(getSupabaseUrl(), getSupabaseKey(), {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
