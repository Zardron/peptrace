export const hasVerifiedEmailProviderConfiguration = (value: unknown): boolean => {
  if (!value || typeof value !== 'object') return false;
  const settings = value as { external?: { email?: unknown }; mailer_autoconfirm?: unknown };
  return settings.external?.email === true && settings.mailer_autoconfirm === false;
};

export const passwordMeetsPolicy = (
  value: unknown,
  minimum: number,
  maximum: number,
): value is string => typeof value === 'string' && value.length >= minimum && value.length <= maximum;

// Email confirmation links prove mailbox access but do not prove that the
// password meets PepTrace's stronger policy. Email accounts must use the
// server-side password login route; OAuth identities may use bearer exchange.
export const providerMayUseBearerExchange = (provider: unknown): boolean =>
  typeof provider === 'string' && provider !== 'email';

export type ProviderRegistrationErrorDisposition = 'accepted' | 'rate_limited' | 'unavailable';

// Preserve deliberately ambiguous provider 4xx responses so registration
// cannot enumerate accounts, but never claim mail was queued during a real
// provider outage.
export const classifyProviderRegistrationError = (
  value: unknown,
): ProviderRegistrationErrorDisposition => {
  if (!value || typeof value !== 'object') return 'accepted';
  const error = value as { status?: unknown };
  if (error.status === 429) return 'rate_limited';
  if (typeof error.status === 'number' && error.status >= 500) return 'unavailable';
  return 'accepted';
};

export const isRecentProviderSession = (
  source: unknown,
  createdAt: unknown,
  now = Date.now(),
  maximumAgeMs = 10 * 60 * 1000,
): boolean => {
  if (source !== 'supabase' || typeof createdAt !== 'string') return false;
  const age = now - new Date(createdAt).getTime();
  return Number.isFinite(age) && age >= 0 && age <= maximumAgeMs;
};
