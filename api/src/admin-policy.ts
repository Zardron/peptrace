export const ADMIN_ROLES = [
  'super_admin',
  'support_admin',
  'billing_admin',
  'content_admin',
  'analyst',
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];
export type AdminPermission =
  | 'dashboard:read'
  | 'users:read'
  | 'users:manage'
  | 'shipments:read'
  | 'shipments:manage'
  | 'vendors:manage'
  | 'billing:read'
  | 'privacy:read'
  | 'privacy:manage'
  | 'support:read'
  | 'support:manage'
  | 'catalog:read'
  | 'catalog:manage'
  | 'content:manage'
  | 'admins:manage'
  | 'audit:read'
  | 'system:read';

export const ROLE_PERMISSIONS: Record<AdminRole, ReadonlySet<AdminPermission>> = {
  super_admin: new Set([
    'dashboard:read', 'users:read', 'users:manage', 'shipments:read', 'shipments:manage', 'vendors:manage',
    'billing:read', 'privacy:read', 'privacy:manage', 'support:read', 'support:manage',
    'catalog:read', 'catalog:manage', 'content:manage', 'admins:manage', 'audit:read', 'system:read',
  ]),
  support_admin: new Set([
    'dashboard:read', 'users:read', 'users:manage', 'shipments:read', 'shipments:manage', 'vendors:manage',
    'privacy:read', 'privacy:manage', 'support:read', 'support:manage', 'catalog:read',
  ]),
  billing_admin: new Set(['dashboard:read', 'billing:read']),
  content_admin: new Set(['dashboard:read', 'catalog:read', 'catalog:manage', 'content:manage']),
  analyst: new Set(['dashboard:read', 'catalog:read', 'system:read']),
};

export const isAdminRole = (value: unknown): value is AdminRole =>
  typeof value === 'string' && (ADMIN_ROLES as readonly string[]).includes(value);

export const roleHasPermission = (role: AdminRole, permission: AdminPermission): boolean =>
  ROLE_PERMISSIONS[role].has(permission);
