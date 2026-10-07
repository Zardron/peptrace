import crypto from 'node:crypto';
import type { Express, Router } from 'express';
import { bodyOf, reasonFrom, sendError, type AdminRouteDeps } from './admin-input.js';
import { consumeRateLimit } from './rate-limit.js';
import { isUuid, trustedClientAddress } from './security.js';
import { getServiceClient, sessionSecret } from './supabase.js';
import { APPLICATION_STATUSES, applicationValues, reviewValues } from './vendor-application-input.js';

const COLUMNS = 'id, email, vendor_name, website_url, distributes_commercially, situation, batch_identifiers, premium_interest, status, admin_note, vendor_id, reviewed_at, created_at, updated_at';

interface ApplicationRow {
  id: string;
  email: string;
  vendor_name: string;
  website_url: string | null;
  distributes_commercially: boolean;
  situation: string;
  batch_identifiers: string | null;
  premium_interest: boolean;
  status: string;
  admin_note: string | null;
  vendor_id: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

const toApplication = (row: ApplicationRow) => ({
  id: row.id,
  email: row.email,
  vendorName: row.vendor_name,
  websiteUrl: row.website_url,
  distributesCommercially: row.distributes_commercially,
  situation: row.situation,
  batchIdentifiers: row.batch_identifiers,
  premiumInterest: row.premium_interest,
  status: row.status,
  adminNote: row.admin_note,
  vendorId: row.vendor_id,
  reviewedAt: row.reviewed_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const registerPublicVendorApplicationRoutes = (app: Express): void => {
  app.post('/vendor-applications', async (req, res) => {
    const secret = sessionSecret();
    if (!secret) {
      res.status(503).json({ error: 'Vendor registration is temporarily unavailable' });
      return;
    }
    const ipHash = crypto.createHmac('sha256', secret).update(`vendor-application:${trustedClientAddress(req)}`).digest('hex');
    const limit = await consumeRateLimit('vendor-application-ip', ipHash, 60 * 60, 5);
    if (!limit) {
      res.status(503).json({ error: 'Vendor registration is temporarily unavailable' });
      return;
    }
    if (!limit.allowed) {
      res.setHeader('Retry-After', limit.retryAfterSeconds);
      res.status(429).json({ error: 'Too many registrations from this connection. Try again later.' });
      return;
    }
    try {
      const values = applicationValues(bodyOf(req));
      const { data, error } = await getServiceClient().from('vendor_applications')
        .insert({ ...values, ip_hash: ipHash })
        .select('id, created_at').single();
      if (error) throw error;
      res.status(201).json({ id: data.id, createdAt: data.created_at });
    } catch (error) {
      sendError(res, error, 'Could not submit your registration');
    }
  });
};

export const registerVendorApplicationAdminRoutes = (router: Router, deps: AdminRouteDeps): void => {
  const { actor, audit, requireAuditRecord, requirePermission } = deps;

  router.get('/vendor-applications', requirePermission('catalog:read'), async (req, res) => {
    const page = Math.max(1, Number.parseInt(String(req.query.page ?? '1'), 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(String(req.query.pageSize ?? '25'), 10) || 25));
    const status = typeof req.query.status === 'string' ? req.query.status : '';
    if (status && !(APPLICATION_STATUSES as readonly string[]).includes(status)) {
      res.status(400).json({ error: 'Invalid status filter' });
      return;
    }
    if (!await requireAuditRecord(req, res, {
      actor: actor(req), action: 'vendor_applications.viewed', targetType: 'vendor_application_directory',
      reason: 'Vendor registration review', metadata: { page, pageSize, status: status || null },
    })) return;
    const db = getServiceClient();
    let query = db.from('vendor_applications').select(COLUMNS, { count: 'exact' });
    if (status) query = query.eq('status', status);
    const [{ data, count, error }, { count: newCount }] = await Promise.all([
      query.order('created_at', { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1),
      db.from('vendor_applications').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    ]);
    if (error) {
      res.status(500).json({ error: 'Could not load vendor registrations' });
      return;
    }
    res.json({
      items: (data as ApplicationRow[]).map(toApplication),
      newCount: newCount ?? 0,
      page,
      pageSize,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / pageSize),
    });
  });

  router.patch('/vendor-applications/:id', requirePermission('catalog:manage'), async (req, res) => {
    const id = String(req.params.id);
    const reason = reasonFrom(req);
    if (!isUuid(id) || !reason) {
      res.status(400).json({ error: 'A valid registration and reason are required' });
      return;
    }
    try {
      const values = reviewValues(bodyOf(req));
      if (typeof values.vendor_id === 'string' && !isUuid(values.vendor_id)) {
        res.status(400).json({ error: 'Invalid vendor' });
        return;
      }
      if (!await requireAuditRecord(req, res, {
        actor: actor(req), action: 'vendor_application.review.authorized', targetType: 'vendor_application', targetId: id, reason,
        metadata: { fields: Object.keys(values), status: values.status ?? null },
      })) return;
      const now = new Date().toISOString();
      const { data, error } = await getServiceClient().from('vendor_applications')
        .update({ ...values, reviewed_by: actor(req).id, reviewed_at: now, updated_at: now })
        .eq('id', id).select(COLUMNS).maybeSingle();
      if (error) throw error;
      if (!data) {
        res.status(404).json({ error: 'Registration not found' });
        return;
      }
      await audit(req, {
        actor: actor(req), action: 'vendor_application.reviewed', targetType: 'vendor_application', targetId: id, reason,
        metadata: { status: values.status ?? null, vendorId: values.vendor_id ?? null },
      });
      res.json(toApplication(data as ApplicationRow));
    } catch (error) {
      if ((error as { code?: string })?.code === '23503') {
        res.status(400).json({ error: 'That vendor no longer exists' });
        return;
      }
      sendError(res, error, 'Could not update the registration');
    }
  });
};
