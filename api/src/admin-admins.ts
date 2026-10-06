import crypto from 'node:crypto';
import type { Router } from 'express';
import { bodyOf, reasonFrom, sendError, ValidationError, type AdminRouteDeps } from './admin-input.js';
import { isAdminRole, type AdminRole } from './admin-policy.js';
import { hashPassword, isValidEmail } from './auth.js';
import { isUuid, revokeAllOwnedSessions } from './security.js';
import { getServiceClient } from './supabase.js';

interface AdminUserRow {
  id: string;
  email: string;
  display_name: string;
  role: AdminRole;
  is_active: boolean;
  must_change_password: boolean;
  failed_login_count: number;
  locked_until: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

const COLUMNS = 'id, email, display_name, role, is_active, must_change_password, failed_login_count, locked_until, last_login_at, created_at, updated_at';

const toAdmin = (row: AdminUserRow) => ({
  id: row.id,
  email: row.email,
  displayName: row.display_name,
  role: row.role,
  isActive: row.is_active,
  mustChangePassword: row.must_change_password,
  lockedUntil: row.locked_until && new Date(row.locked_until).getTime() > Date.now() ? row.locked_until : null,
  lastLoginAt: row.last_login_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// 18 URL-safe characters (~108 bits); shown once to the inviting admin, who
// shares it out of band. The recipient must replace it at first sign-in.
export const temporaryPassword = (): string => crypto.randomBytes(14).toString('base64url').slice(0, 18);

const displayNameFrom = (value: unknown): string => {
  const name = typeof value === 'string' ? value.trim() : '';
  if (!name) throw new ValidationError('Name is required');
  if (name.length > 100) throw new ValidationError('Name must be 100 characters or fewer');
  return name;
};

const roleFrom = (value: unknown): AdminRole => {
  if (typeof value !== 'string' || !isAdminRole(value)) throw new ValidationError('Choose a valid role');
  return value;
};

const activeSuperAdminCount = async (): Promise<number> => {
  const { count, error } = await getServiceClient().from('admin_users')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'super_admin').eq('is_active', true);
  if (error) throw error;
  return count ?? 0;
};

export const registerAdminUserRoutes = (router: Router, deps: AdminRouteDeps): void => {
  const { actor, audit, requireAuditRecord, requirePermission } = deps;
  const canManage = requirePermission('admins:manage');

  router.get('/admins', canManage, async (req, res) => {
    if (!await requireAuditRecord(req, res, {
      actor: actor(req), action: 'admins.directory.viewed', targetType: 'admin_directory', reason: 'Administrative access review',
    })) return;
    const { data, error } = await getServiceClient().from('admin_users').select(COLUMNS).order('created_at', { ascending: true });
    if (error) {
      res.status(500).json({ error: 'Could not load administrators' });
      return;
    }
    res.json({ items: (data as AdminUserRow[]).map(toAdmin) });
  });

  router.post('/admins', canManage, async (req, res) => {
    const reason = reasonFrom(req);
    if (!reason) {
      res.status(400).json({ error: 'A reason is required' });
      return;
    }
    try {
      const body = bodyOf(req);
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      if (!isValidEmail(email)) throw new ValidationError('Enter a valid email address');
      const displayName = displayNameFrom(body.displayName);
      const role = roleFrom(body.role);
      if (!await requireAuditRecord(req, res, {
        actor: actor(req), action: 'admin.create.authorized', targetType: 'admin_user', reason, metadata: { email, role },
      })) return;
      const password = temporaryPassword();
      const { data, error } = await getServiceClient().from('admin_users').insert({
        email,
        display_name: displayName,
        role,
        password_hash: hashPassword(password),
        must_change_password: true,
      }).select(COLUMNS).single();
      if (error) throw error;
      await audit(req, { actor: actor(req), action: 'admin.created', targetType: 'admin_user', targetId: data.id, reason, metadata: { role } });
      res.status(201).json({ admin: toAdmin(data as AdminUserRow), temporaryPassword: password });
    } catch (error) {
      sendError(res, error, 'Could not create the administrator', 'An administrator with that email already exists');
    }
  });

  router.patch('/admins/:id', canManage, async (req, res) => {
    const id = String(req.params.id);
    const reason = reasonFrom(req);
    if (!isUuid(id) || !reason) {
      res.status(400).json({ error: 'A valid administrator and reason are required' });
      return;
    }
    try {
      const body = bodyOf(req);
      const db = getServiceClient();
      const { data: current } = await db.from('admin_users').select(COLUMNS).eq('id', id).maybeSingle();
      if (!current) {
        res.status(404).json({ error: 'Administrator not found' });
        return;
      }
      const target = current as AdminUserRow;
      const isSelf = target.id === actor(req).id;
      const changes: Record<string, unknown> = {};
      if ('displayName' in body) changes.display_name = displayNameFrom(body.displayName);
      if ('role' in body) changes.role = roleFrom(body.role);
      if ('isActive' in body) {
        if (typeof body.isActive !== 'boolean') throw new ValidationError('isActive must be true or false');
        changes.is_active = body.isActive;
      }
      if (body.unlock === true) {
        changes.failed_login_count = 0;
        changes.locked_until = null;
      }
      if (!Object.keys(changes).length) throw new ValidationError('Nothing to update');
      if (isSelf && ((changes.role && changes.role !== target.role) || changes.is_active === false)) {
        throw new ValidationError('You cannot change your own role or deactivate yourself. Ask another super admin.');
      }
      const losesSuperAdmin = target.role === 'super_admin' && target.is_active &&
        ((changes.role && changes.role !== 'super_admin') || changes.is_active === false);
      if (losesSuperAdmin && await activeSuperAdminCount() <= 1) {
        throw new ValidationError('At least one active super admin is required');
      }
      if (!await requireAuditRecord(req, res, {
        actor: actor(req), action: 'admin.update.authorized', targetType: 'admin_user', targetId: id, reason,
        metadata: { fields: Object.keys(changes) },
      })) return;
      const now = new Date().toISOString();
      if (changes.is_active === false) {
        const { error: revokeError } = await revokeAllOwnedSessions(db, 'admin', id, now);
        if (revokeError) {
          res.status(503).json({ error: 'Active sessions could not be revoked' });
          return;
        }
      }
      const { data, error } = await db.from('admin_users').update({ ...changes, updated_at: now }).eq('id', id).select(COLUMNS).single();
      if (error) throw error;
      await audit(req, {
        actor: actor(req), action: 'admin.updated', targetType: 'admin_user', targetId: id, reason,
        metadata: { fields: Object.keys(changes), role: changes.role ?? null, isActive: changes.is_active ?? null },
      });
      res.json(toAdmin(data as AdminUserRow));
    } catch (error) {
      sendError(res, error, 'Could not update the administrator');
    }
  });

  router.post('/admins/:id/reset-password', canManage, async (req, res) => {
    const id = String(req.params.id);
    const reason = reasonFrom(req);
    if (!isUuid(id) || !reason) {
      res.status(400).json({ error: 'A valid administrator and reason are required' });
      return;
    }
    if (id === actor(req).id) {
      res.status(400).json({ error: 'Use "Change password" from your account menu to change your own password' });
      return;
    }
    const db = getServiceClient();
    const { data: target } = await db.from('admin_users').select('id').eq('id', id).maybeSingle();
    if (!target) {
      res.status(404).json({ error: 'Administrator not found' });
      return;
    }
    if (!await requireAuditRecord(req, res, {
      actor: actor(req), action: 'admin.password_reset.authorized', targetType: 'admin_user', targetId: id, reason,
    })) return;
    const now = new Date().toISOString();
    const { error: revokeError } = await revokeAllOwnedSessions(db, 'admin', id, now);
    if (revokeError) {
      res.status(503).json({ error: 'Active sessions could not be revoked' });
      return;
    }
    const password = temporaryPassword();
    const { data, error } = await db.from('admin_users').update({
      password_hash: hashPassword(password),
      password_changed_at: now,
      must_change_password: true,
      failed_login_count: 0,
      locked_until: null,
      updated_at: now,
    }).eq('id', id).select(COLUMNS).single();
    if (error) {
      res.status(500).json({ error: 'Could not reset the password' });
      return;
    }
    await audit(req, { actor: actor(req), action: 'admin.password_reset', targetType: 'admin_user', targetId: id, reason });
    res.json({ admin: toAdmin(data as AdminUserRow), temporaryPassword: password });
  });
};
