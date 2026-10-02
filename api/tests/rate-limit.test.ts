import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { parseRateLimitResult } from '../src/rate-limit-result.js';

test('database rate-limit results fail closed when malformed', () => {
  assert.deepEqual(parseRateLimitResult([{ allowed: true, retry_after_seconds: 0 }]), {
    allowed: true,
    retryAfterSeconds: 0,
  });
  assert.deepEqual(parseRateLimitResult([{ allowed: false, retry_after_seconds: 123 }]), {
    allowed: false,
    retryAfterSeconds: 123,
  });
  assert.equal(parseRateLimitResult([]), null);
  assert.equal(parseRateLimitResult([{ allowed: 'yes', retry_after_seconds: 0 }]), null);
  assert.equal(parseRateLimitResult([{ allowed: false, retry_after_seconds: -1 }]), null);
});

test('persistent rate-limit migration is atomic and inaccessible to browser roles', () => {
  const sql = fs.readFileSync(new URL('../migrations/023_persistent_auth_rate_limits.sql', import.meta.url), 'utf8');
  assert.match(sql, /on conflict \(scope, key_hash\) do update/i);
  assert.match(sql, /security definer/i);
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /revoke all on table public\.security_rate_limits from public, anon, authenticated/i);
  assert.match(sql, /grant execute on function public\.consume_security_rate_limit[\s\S]*to service_role/i);
});
