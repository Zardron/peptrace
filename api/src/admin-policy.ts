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
  | 'support:read'
  | 'support:manage'
  | 'audit:read'
  | 'system:read';

export const ROLE_PERMISSIONS: Record<AdminRole, ReadonlySet<AdminPermission>> = {
  super_admin: new Set([
    'dashboard:read', 'users:read', 'users:manage', 'shipments:read', 'shipments:manage', 'vendors:manage',
    'billing:read', 'privacy:read', 'support:read', 'support:manage', 'audit:read', 'system:read',
  ]),
  support_admin: new Set([
    'dashboard:read', 'users:read', 'users:manage', 'shipments:read', 'shipments:manage', 'vendors:manage',
    'privacy:read', 'support:read', 'support:manage',
  ]),
  billing_admin: new Set(['dashboard:read', 'billing:read']),
  content_admin: new Set(['dashboard:read']),
  analyst: new Set(['dashboard:read', 'system:read']),
};

export const isAdminRole = (value: unknown): value is AdminRole =>
  typeof value === 'string' && (ADMIN_ROLES as readonly string[]).includes(value);

export const roleHasPermission = (role: AdminRole, permission: AdminPermission): boolean =>
  ROLE_PERMISSIONS[role].has(permission);
