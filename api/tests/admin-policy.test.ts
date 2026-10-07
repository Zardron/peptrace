import assert from 'node:assert/strict';
import test from 'node:test';
import { roleHasPermission, type AdminPermission, type AdminRole } from '../src/admin-policy.js';

const expected: Record<AdminRole, AdminPermission[]> = {
  super_admin: [
    'dashboard:read', 'users:read', 'users:manage', 'shipments:read', 'shipments:manage',
    'vendors:manage', 'billing:read', 'privacy:read', 'privacy:manage', 'support:read', 'support:manage',
    'catalog:read', 'catalog:manage', 'content:manage', 'admins:manage', 'audit:read', 'system:read',
  ],
  support_admin: [
    'dashboard:read', 'users:read', 'users:manage', 'shipments:read', 'shipments:manage',
    'vendors:manage', 'privacy:read', 'privacy:manage', 'support:read', 'support:manage', 'catalog:read',
  ],
  billing_admin: ['dashboard:read', 'billing:read'],
  content_admin: ['dashboard:read', 'catalog:read', 'catalog:manage', 'content:manage'],
  analyst: ['dashboard:read', 'catalog:read', 'system:read'],
};

const permissions = expected.super_admin;

test('every Admin role has exactly its server-side permission matrix', () => {
  for (const [role, allowed] of Object.entries(expected) as [AdminRole, AdminPermission[]][]) {
    for (const permission of permissions) {
      assert.equal(
        roleHasPermission(role, permission),
        allowed.includes(permission),
        `${role} ${permission}`,
      );
    }
  }
});

test('read-only and specialist roles cannot mutate unrelated resources', () => {
  assert.equal(roleHasPermission('analyst', 'users:manage'), false);
  assert.equal(roleHasPermission('analyst', 'support:manage'), false);
  assert.equal(roleHasPermission('analyst', 'vendors:manage'), false);
  assert.equal(roleHasPermission('billing_admin', 'users:manage'), false);
  assert.equal(roleHasPermission('billing_admin', 'support:manage'), false);
  assert.equal(roleHasPermission('support_admin', 'billing:read'), false);
  assert.equal(roleHasPermission('content_admin', 'shipments:manage'), false);
  assert.equal(roleHasPermission('support_admin', 'catalog:manage'), false);
  assert.equal(roleHasPermission('analyst', 'catalog:manage'), false);
  assert.equal(roleHasPermission('content_admin', 'admins:manage'), false);
});
