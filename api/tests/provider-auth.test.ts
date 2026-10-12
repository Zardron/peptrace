import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  classifyProviderRegistrationError,
  hasVerifiedEmailProviderConfiguration,
  isRecentProviderSession,
  passwordMeetsPolicy,
  providerMayUseBearerExchange,
} from '../src/provider-auth.js';

test('provider signup distinguishes outages without creating an enumeration oracle', () => {
  assert.equal(classifyProviderRegistrationError({ status: 500 }), 'unavailable');
  assert.equal(classifyProviderRegistrationError({ status: 503 }), 'unavailable');
  assert.equal(classifyProviderRegistrationError({ status: 429 }), 'rate_limited');
  assert.equal(classifyProviderRegistrationError({ status: 400, code: 'user_already_exists' }), 'accepted');
  assert.equal(classifyProviderRegistrationError(null), 'accepted');
});

test('provider registration fails closed unless email confirmation is enabled', () => {
  assert.equal(hasVerifiedEmailProviderConfiguration({ external: { email: true }, mailer_autoconfirm: false }), true);
  assert.equal(hasVerifiedEmailProviderConfiguration({ external: { email: true }, mailer_autoconfirm: true }), false);
  assert.equal(hasVerifiedEmailProviderConfiguration({ external: { email: false }, mailer_autoconfirm: false }), false);
  assert.equal(hasVerifiedEmailProviderConfiguration(null), false);
});

test('provider passwords must satisfy the PepTrace server policy', () => {
  assert.equal(passwordMeetsPolicy('123456789012', 12, 128), true);
  assert.equal(passwordMeetsPolicy('too-short', 12, 128), false);
  assert.equal(passwordMeetsPolicy('x'.repeat(129), 12, 128), false);
});

test('email confirmation bearer sessions cannot bypass password login', () => {
  assert.equal(providerMayUseBearerExchange('email'), false);
  assert.equal(providerMayUseBearerExchange('google'), true);
  assert.equal(providerMayUseBearerExchange(undefined), false);
});

test('destructive privacy actions require a recent provider session', () => {
  const now = Date.parse('2026-10-02T10:00:00.000Z');
  assert.equal(isRecentProviderSession('supabase', '2026-10-02T09:55:00.000Z', now), true);
  assert.equal(isRecentProviderSession('supabase', '2026-10-02T09:40:00.000Z', now), false);
  assert.equal(isRecentProviderSession('native', '2026-10-02T09:59:00.000Z', now), true);
  assert.equal(isRecentProviderSession('other', '2026-10-02T09:59:00.000Z', now), false);
  assert.equal(isRecentProviderSession('supabase', 'invalid', now), false);
});

test('verified-auth migration revokes native sessions and removes legacy credentials', () => {
  const sql = fs.readFileSync(new URL('../migrations/022_verified_provider_auth.sql', import.meta.url), 'utf8');
  assert.match(sql, /where source = 'native'/i);
  assert.match(sql, /delete from public\.native_credentials/i);
  assert.match(sql, /drop function if exists public\.register_native_account/i);
  assert.match(sql, /check \(source = 'supabase'\)/i);
});
