import { createClient } from '@supabase/supabase-js';
import { hasVerifiedEmailProviderConfiguration } from './provider-auth.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY/SUPABASE_ANON_KEY in environment',
  );
}

// Service-role key (SUPABASE_SECRET_KEY or a legacy service-role JWT). Used
// for the native_credentials table and for storage uploads on behalf of
// native-auth users; it bypasses RLS, so it must never reach the frontend.
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Short-lived provider client for email/password verification. Provider
// access and refresh tokens stay server-side and are discarded after each
// request; PepTrace issues its own opaque, revocable cookie session instead.
export const createProviderAuthClient = () => createClient(supabaseUrl!, supabaseKey!, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

let providerSettingsCache: { required: boolean; expiresAt: number } | null = null;

export const providerRequiresEmailConfirmation = async (): Promise<boolean> => {
  const now = Date.now();
  if (providerSettingsCache && providerSettingsCache.expiresAt > now) {
    return providerSettingsCache.required;
  }
  const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
    headers: { apikey: supabaseKey },
  });
  if (!response.ok) throw new Error('Provider authentication settings are unavailable');
  const settings = await response.json();
  const required = hasVerifiedEmailProviderConfiguration(settings);
  providerSettingsCache = { required, expiresAt: now + 5 * 60 * 1000 };
  return required;
};

// Queries through this client run as the given user, so RLS policies apply.
export const createUserClient = (accessToken: string) =>
  createClient(supabaseUrl!, supabaseKey!, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

// Privileged client for native-auth credential storage and user-scoped writes
// the API performs itself. Throws when used without a configured service key.
export const getServiceClient = () => {
  if (!supabaseServiceKey) {
    throw new Error(
      'Missing SUPABASE_SECRET_KEY in environment (required for native auth)',
    );
  }
  return createClient(supabaseUrl!, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

// Secret used to sign native session tokens. Falls back to the service key,
// which is already a high-entropy server-only secret.
export const sessionSecret = (): string | null =>
  process.env.AUTH_SESSION_SECRET ?? supabaseServiceKey ?? null;
