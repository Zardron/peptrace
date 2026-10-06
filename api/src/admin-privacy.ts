import type { Request, Router } from 'express';
import { reasonFrom, type AdminRouteDeps } from './admin-input.js';
import { isUuid } from './security.js';
import { getServiceClient } from './supabase.js';

const DELETION_STATUSES = ['requested', 'scheduled', 'processing', 'completed', 'canceled', 'failed'] as const;
const EXPORT_STATUSES = ['requested', 'processing', 'complete', 'failed', 'expired'] as const;
const MAX_AUTOMATIC_ATTEMPTS = 10;

const pagination = (req: Request) => {
  const page = Math.max(1, Number.parseInt(String(req.query.page ?? '1'), 10) || 1);
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(String(req.query.pageSize ?? '25'), 10) || 25));
  return { page, pageSize, from: (page - 1) * pageSize, to: page * pageSize - 1 };
};

const statusFilter = <T extends string>(req: Request, allowed: readonly T[]): T | '' | null => {
  const value = req.query.status;
  if (value === undefined || value === '') return '';
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? value as T : null;
};

const withEmails = async <T extends { user_id: string | null }>(rows: T[]): Promise<Array<T & { email: string | null }>> => {
  const ids = [...new Set(rows.map((row) => row.user_id).filter((id): id is string => Boolean(id)))];
  if (!ids.length) return rows.map((row) => ({ ...row, email: null }));
  const { data } = await getServiceClient().from('user_accounts').select('id, email').in('id', ids);
  const emails = new Map((data ?? []).map((account) => [account.id as string, account.email as string]));
  return rows.map((row) => ({ ...row, email: row.user_id ? emails.get(row.user_id) ?? null : null }));
};

export const registerPrivacyRoutes = (router: Router, deps: AdminRouteDeps): void => {
  const { actor, audit, requireAuditRecord, requirePermission } = deps;

  router.get('/privacy/consents', requirePermission('privacy:read'), async (req, res) => {
    const { page, pageSize, from, to } = pagination(req);
    if (!await requireAuditRecord(req, res, {
      actor: actor(req), action: 'privacy.consents.viewed', targetType: 'consent_directory',
      reason: 'Administrative privacy access', metadata: { page, pageSize },
    })) return;
    const { data, count, error } = await getServiceClient().from('user_consents')
      .select('id, user_id, consent_type, policy_version, accepted, recorded_at, withdrawn_at, source', { count: 'exact' })
      .order('recorded_at', { ascending: false }).range(from, to);
    if (error) {
      res.status(500).json({ error: 'Could not load consent history' });
      return;
    }
    res.json({ items: await withEmails(data ?? []), page, pageSize, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / pageSize) });
  });

  router.get('/privacy/exports', requirePermission('privacy:read'), async (req, res) => {
    const { page, pageSize, from, to } = pagination(req);
    const status = statusFilter(req, EXPORT_STATUSES);
    if (status === null) {
      res.status(400).json({ error: 'Invalid export status filter' });
      return;
    }
    if (!await requireAuditRecord(req, res, {
      actor: actor(req), action: 'privacy.exports.viewed', targetType: 'data_export_directory',
      reason: 'Administrative privacy access', metadata: { page, pageSize, status: status || null },
    })) return;
    let query = getServiceClient().from('data_export_requests')
      .select('id, user_id, status, expires_at, error_code, requested_at, completed_at, updated_at', { count: 'exact' });
    if (status) query = query.eq('status', status);
    const { data, count, error } = await query.order('requested_at', { ascending: false }).range(from, to);
    if (error) {
      res.status(500).json({ error: 'Could not load export requests' });
      return;
    }
    res.json({ items: await withEmails(data ?? []), page, pageSize, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / pageSize) });
  });

  router.get('/privacy/deletions', requirePermission('privacy:read'), async (req, res) => {
    const { page, pageSize, from, to } = pagination(req);
    const status = statusFilter(req, DELETION_STATUSES);
    if (status === null) {
      res.status(400).json({ error: 'Invalid deletion status filter' });
      return;
    }
    if (!await requireAuditRecord(req, res, {
      actor: actor(req), action: 'privacy.deletions.viewed', targetType: 'deletion_directory',
      reason: 'Administrative privacy access', metadata: { page, pageSize, status: status || null },
    })) return;
    let query = getServiceClient().from('account_deletion_requests')
      .select('id, user_id, status, reason, requested_at, scheduled_for, completed_at, canceled_at, failure_code, cleanup_attempts, updated_at', { count: 'exact' });
    if (status) query = query.eq('status', status);
    const { data, count, error } = await query.order('requested_at', { ascending: false }).range(from, to);
    if (error) {
      res.status(500).json({ error: 'Could not load deletion requests' });
      return;
    }
    const items = (await withEmails(data ?? [])).map((item) => ({
      ...item,
      retryable: item.status === 'failed' && Number(item.cleanup_attempts ?? 0) >= MAX_AUTOMATIC_ATTEMPTS,
    }));
    res.json({ items, page, pageSize, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / pageSize) });
  });

  router.post('/privacy/deletions/:id/cancel', requirePermission('privacy:manage'), async (req, res) => {
    const id = String(req.params.id);
    const reason = reasonFrom(req);
    if (!isUuid(id) || !reason) {
      res.status(400).json({ error: 'A valid request and reason are required' });
      return;
    }
    const db = getServiceClient();
    const { data: request } = await db.from('account_deletion_requests').select('id, user_id, status').eq('id', id).maybeSingle();
    if (!request) {
      res.status(404).json({ error: 'Deletion request not found' });
      return;
    }
    if (!['requested', 'scheduled'].includes(request.status)) {
      res.status(409).json({ error: 'Only requests that have not started processing can be canceled' });
      return;
    }
    if (!await requireAuditRecord(req, res, {
      actor: actor(req), action: 'privacy.deletion.cancel.authorized', targetType: 'account_deletion_request', targetId: id, reason,
    })) return;
    const now = new Date().toISOString();
    const { data: canceled, error } = await db.from('account_deletion_requests')
      .update({ status: 'canceled', canceled_at: now, updated_at: now })
      .eq('id', id).in('status', ['requested', 'scheduled'])
      .select('id').maybeSingle();
    if (error || !canceled) {
      res.status(409).json({ error: 'The request changed while you were canceling it. Refresh and try again.' });
      return;
    }
    if (request.user_id) {
      await db.from('account_admin_state')
        .update({ status: 'active', reason: `Deletion canceled by admin: ${reason}`, restored_at: now, updated_at: now })
        .eq('account_id', request.user_id).eq('status', 'deletion_pending');
    }
    await audit(req, { actor: actor(req), action: 'privacy.deletion.canceled', targetType: 'account_deletion_request', targetId: id, reason });
    res.json({ id, status: 'canceled', canceledAt: now });
  });

  router.post('/privacy/deletions/:id/retry', requirePermission('privacy:manage'), async (req, res) => {
    const id = String(req.params.id);
    const reason = reasonFrom(req);
    if (!isUuid(id) || !reason) {
      res.status(400).json({ error: 'A valid request and reason are required' });
      return;
    }
    if (!await requireAuditRecord(req, res, {
      actor: actor(req), action: 'privacy.deletion.retry.authorized', targetType: 'account_deletion_request', targetId: id, reason,
    })) return;
    const now = new Date().toISOString();
    const { data, error } = await getServiceClient().from('account_deletion_requests')
      .update({ cleanup_attempts: 0, updated_at: now })
      .eq('id', id).eq('status', 'failed')
      .select('id').maybeSingle();
    if (error || !data) {
      res.status(409).json({ error: 'Only failed deletion requests can be retried' });
      return;
    }
    await audit(req, { actor: actor(req), action: 'privacy.deletion.retry_queued', targetType: 'account_deletion_request', targetId: id, reason });
    res.json({ id, status: 'failed', retryQueued: true });
  });
};
