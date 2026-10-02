export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export const parseRateLimitResult = (value: unknown): RateLimitResult | null => {
  const record = Array.isArray(value) ? value[0] : null;
  if (!record || typeof record !== 'object') return null;
  const row = record as { allowed?: unknown; retry_after_seconds?: unknown };
  if (typeof row.allowed !== 'boolean') return null;
  const retryAfterSeconds = Number(row.retry_after_seconds);
  if (!Number.isInteger(retryAfterSeconds) || retryAfterSeconds < 0) return null;
  return { allowed: row.allowed, retryAfterSeconds };
};
