import assert from 'node:assert/strict';
import test from 'node:test';
import {
  detectUploadType,
  extensionForUploadType,
  isUuid,
  normalizeAdminSearch,
  revokeAllOwnedSessions,
  trustedClientAddress,
} from '../src/security.js';

test('trusted client address ignores attacker-controlled forwarded headers', () => {
  const request = {
    ip: '203.0.113.10',
    socket: { remoteAddress: '172.18.0.2' },
    headers: { 'x-forwarded-for': '198.51.100.99' },
  } as never;
  assert.equal(trustedClientAddress(request), '203.0.113.10');
});

test('security events revoke every active session owned by the account', async () => {
  const calls: unknown[] = [];
  const db = {
    from(table: string) {
      calls.push(['from', table]);
      return {
        update(values: Record<string, unknown>) {
          calls.push(['update', values]);
          return {
            eq(column: string, value: string) {
              calls.push(['eq', column, value]);
              return {
                is(isColumn: string, isValue: null) {
                  calls.push(['is', isColumn, isValue]);
                  return Promise.resolve({ error: null });
                },
              };
            },
          };
        },
      };
    },
  };

  await revokeAllOwnedSessions(db, 'customer', 'customer-id', '2026-10-02T00:00:00.000Z');
  await revokeAllOwnedSessions(db, 'admin', 'admin-id', '2026-10-02T00:00:01.000Z');

  assert.deepEqual(calls, [
    ['from', 'customer_sessions'],
    ['update', { revoked_at: '2026-10-02T00:00:00.000Z' }],
    ['eq', 'user_id', 'customer-id'],
    ['is', 'revoked_at', null],
    ['from', 'admin_sessions'],
    ['update', { revoked_at: '2026-10-02T00:00:01.000Z' }],
    ['eq', 'admin_user_id', 'admin-id'],
    ['is', 'revoked_at', null],
  ]);
});

test('resource identifiers must be canonical UUIDs', () => {
  assert.equal(isUuid('71abc4dc-4932-4f98-a3dc-b272c9934c65'), true);
  assert.equal(isUuid("' OR 1=1 --"), false);
  assert.equal(isUuid('../another-user'), false);
});

test('admin searches accept useful values and reject filter syntax', () => {
  assert.equal(normalizeAdminSearch(' person+tag@example.com '), 'person+tag@example.com');
  assert.equal(normalizeAdminSearch("%' OR 1=1 --"), null);
  assert.equal(normalizeAdminSearch('name_(*)'), null);
});

test('uploads are classified from magic bytes, not declared MIME or extension', () => {
  assert.equal(detectUploadType(Buffer.from('<html><script>alert(1)</script>')), null);
  assert.equal(detectUploadType(Buffer.from('%PDF-1.7\n')), 'application/pdf');
  assert.equal(detectUploadType(Buffer.from([0xff, 0xd8, 0xff, 0xe0])), 'image/jpeg');
  assert.equal(detectUploadType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), 'image/png');
  assert.equal(detectUploadType(Buffer.from('RIFF0000WEBP')), 'image/webp');
  assert.equal(extensionForUploadType('application/pdf'), 'pdf');
  assert.equal(extensionForUploadType('image/jpeg'), 'jpg');
});
