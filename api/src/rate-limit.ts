import { getServiceClient } from './supabase.js';
import { parseRateLimitResult, type RateLimitResult } from './rate-limit-result.js';

export const consumeRateLimit = async (
  scope: string,
  keyHash: string,
  windowSeconds: number,
  maximumAttempts: number,
): Promise<RateLimitResult | null> => {
  const { data, error } = await getServiceClient().rpc('consume_security_rate_limit', {
    p_scope: scope,
    p_key_hash: keyHash,
    p_window_seconds: windowSeconds,
    p_max_attempts: maximumAttempts,
  });
  if (error) return null;
  return parseRateLimitResult(data);
};
