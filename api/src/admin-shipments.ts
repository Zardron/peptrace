import crypto from 'node:crypto';
import type { Request, Router } from 'express';
import { recomputeVendorStats } from './admin-catalog.js';
import { bodyOf, reasonFrom, requiredText, sendError, ValidationError, type AdminRouteDeps } from './admin-input.js';
import { roleHasPermission } from './admin-policy.js';
import { notifyCatalogChanged } from './catalog-cache.js';
import { detectUploadType, extensionForUploadType, isUuid, type SafeUploadType } from './security.js';
import { isStoragePath, LAB_REPORT_UPLOAD_TYPE, resultValues, shipmentValues } from './shipment-input.js';
import { getServiceClient } from './supabase.js';

const FORM_UPLOADS_BUCKET = 'form-uploads';
const MAX_REPORT_BYTES = 5 * 1024 * 1024;
const REPORT_TYPES: SafeUploadType[] = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const SIGNED_URL_SECONDS = 10 * 60;

const SHIPMENT_COLUMNS =
  'id, account_id, tracking_id, status, created_at, updated_at, origin_city, origin_address, destination_city, destination_address, service, package_type, weight, dimensions, temperature, milestones, timeline_events, billing_items, total_amount, invoice_number, invoice_url, payment_status, payment_method, amount_due, due_date, payment_notice_title, payment_notice_body, peptide:peptides(name), vendor:vendors(name)';
const SAMPLE_COLUMNS =
  'id, peptide_id, vendor_id, vendor_name, form_factor, batch_id, batch_proof_url, quantity_mg, lab, vendor_provided_coa, coa_when, coa_other_text, coa_match, coa_url, coa_file_url, proof_file_url, order_id, order_date, num_vials, price_per_vial, price_currency, created_at, peptide:peptides(name), vendor:vendors(name)';
const RESULT_COLUMNS =
  'id, shipment_id, batch_code, purity, outcome, result, tested_at, dosage_deviation, tested_mg, label_mg, batch_info, sender, coa_url, lab_name';

const signPaths = async (paths: string[]): Promise<Map<string, string>> => {
  const unique = [...new Set(paths.filter(isStoragePath))];
  if (unique.length === 0) return new Map();
  const { data } = await getServiceClient().storage.from(FORM_UPLOADS_BUCKET).createSignedUrls(unique, SIGNED_URL_SECONDS);
  const signed = new Map<string, string>();
  for (const item of data ?? []) {
    if (item.path && item.signedUrl && !item.error) signed.set(item.path, item.signedUrl);
  }
  return signed;
};

const fileLink = (value: unknown, signed: Map<string, string>): string | null => {
  if (typeof value !== 'string' || !value) return null;
  if (isStoragePath(value)) return signed.get(value) ?? null;
  return /^https?:\/\//.test(value) ? value : null;
};

const toResult = (row: Record<string, any>, signed: Map<string, string>) => ({
  id: row.id,
  outcome: row.outcome ?? row.result ?? null,
  purity: row.purity == null ? null : Number(row.purity),
  testedAt: row.tested_at,
  batchCode: row.batch_code,
  labName: row.lab_name,
  dosageDeviation: row.dosage_deviation,
  testedMg: row.tested_mg == null ? null : Number(row.tested_mg),
  labelMg: row.label_mg == null ? null : Number(row.label_mg),
  batchInfo: row.batch_info,
  sender: row.sender,
  coaUrl: row.coa_url,
  coaLink: fileLink(row.coa_url, signed),
});

const loadShipmentOwner = async (id: string): Promise<{ id: string; account_id: string } | null> => {
  const { data } = await getServiceClient().from('shipments').select('id, account_id').eq('id', id).maybeSingle();
  return data;
};

export const registerShipmentRoutes = (router: Router, deps: AdminRouteDeps): void => {
  const { actor, audit, requireAuditRecord, requirePermission } = deps;
  const canRead = requirePermission('shipments:read');
  const canManage = requirePermission('shipments:manage');

  const publishToCatalog = async (req: Request, values: Record<string, unknown>): Promise<string | null> => {
    const body = bodyOf(req);
    if (body.publish !== true) return null;
    if (!roleHasPermission(actor(req).role, 'catalog:manage')) {
      throw new ValidationError('Publishing to the public catalog needs catalog access');
    }
    if (!isUuid(body.vendorId)) throw new ValidationError('Choose the vendor to publish this result under');
    const row = {
      vendor_id: body.vendorId,
      peptide_name: requiredText(body.peptideName, 'Peptide', 120),
      tested_at: values.tested_at,
      result: values.outcome,
      lab_name: requiredText(values.lab_name, 'Lab (needed to publish)', 120),
      purity: values.purity,
      dosage_deviation: values.dosage_deviation ?? null,
      tested_mg: values.tested_mg ?? null,
      label_mg: values.label_mg ?? null,
      batch_code: values.batch_code ?? null,
      sender: values.sender ?? null,
      coa_url: typeof values.coa_url === 'string' && /^https?:\/\//.test(values.coa_url) ? values.coa_url : null,
      is_demo: false,
    };
    const { data, error } = await getServiceClient().from('vendor_tests').insert(row).select('id').single();
    if (error || !data) throw error ?? new Error('catalog_publish_failed');
    await recomputeVendorStats([row.vendor_id as string]);
    notifyCatalogChanged();
    return data.id;
  };

  router.get('/shipments/:id', canRead, async (req, res) => {
    if (!isUuid(req.params.id)) {
      res.status(400).json({ error: 'Invalid shipment identifier' });
      return;
    }
    const db = getServiceClient();
    const { data: shipment, error } = await db.from('shipments').select(SHIPMENT_COLUMNS).eq('id', req.params.id).maybeSingle();
    if (error) {
      res.status(500).json({ error: 'Could not load the shipment' });
      return;
    }
    if (!shipment) {
      res.status(404).json({ error: 'Shipment not found' });
      return;
    }
    if (!await requireAuditRecord(req, res, {
      actor: actor(req), action: 'shipment.details.viewed', targetType: 'shipment', targetId: shipment.id,
      reason: 'Administrative shipment review', metadata: { accountId: shipment.account_id },
    })) return;

    const [{ data: samples }, { data: results }, { data: account }] = await Promise.all([
      db.from('shipment_samples').select(SAMPLE_COLUMNS).eq('shipment_id', shipment.id).order('created_at'),
      db.from('test_results').select(RESULT_COLUMNS).eq('shipment_id', shipment.id).order('tested_at', { ascending: false }),
      db.from('user_accounts').select('id, email').eq('id', shipment.account_id).maybeSingle(),
    ]);
    const sampleRows = (samples ?? []) as Record<string, any>[];
    const resultRows = (results ?? []) as Record<string, any>[];
    const signed = await signPaths([
      ...sampleRows.flatMap((sample) => [sample.batch_proof_url, sample.coa_file_url, sample.proof_file_url]),
      ...resultRows.map((result) => result.coa_url),
    ]);
    const row = shipment as Record<string, any>;
    const array = (value: unknown) => (Array.isArray(value) ? value : []);

    res.json({
      id: row.id,
      trackingId: row.tracking_id,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      account: account ? { id: account.id, email: account.email } : { id: row.account_id, email: null },
      legacyPeptideName: row.peptide?.name ?? null,
      legacyVendorName: row.vendor?.name ?? null,
      originCity: row.origin_city,
      originAddress: row.origin_address,
      destinationCity: row.destination_city,
      destinationAddress: row.destination_address,
      service: row.service,
      packageType: row.package_type,
      weight: row.weight,
      dimensions: row.dimensions,
      temperature: row.temperature,
      milestones: array(row.milestones),
      timelineEvents: array(row.timeline_events),
      billingItems: array(row.billing_items),
      totalAmount: row.total_amount == null ? null : Number(row.total_amount),
      invoiceNumber: row.invoice_number,
      invoiceUrl: row.invoice_url,
      paymentStatus: row.payment_status,
      paymentMethod: row.payment_method,
      amountDue: row.amount_due == null ? null : Number(row.amount_due),
      dueDate: row.due_date,
      paymentNoticeTitle: row.payment_notice_title,
      paymentNoticeBody: row.payment_notice_body,
      samples: sampleRows.map((sample) => ({
        id: sample.id,
        peptideId: sample.peptide_id,
        peptideName: sample.peptide?.name ?? null,
        vendorId: sample.vendor_id,
        vendorName: sample.vendor?.name ?? sample.vendor_name ?? null,
        formFactor: sample.form_factor,
        batchId: sample.batch_id,
        quantityMg: sample.quantity_mg == null ? null : Number(sample.quantity_mg),
        lab: sample.lab,
        vendorProvidedCoa: sample.vendor_provided_coa,
        coaWhen: sample.coa_when,
        coaOtherText: sample.coa_other_text,
        coaMatch: sample.coa_match,
        coaUrl: sample.coa_url,
        orderId: sample.order_id,
        orderDate: sample.order_date,
        numVials: sample.num_vials,
        pricePerVial: sample.price_per_vial == null ? null : Number(sample.price_per_vial),
        priceCurrency: sample.price_currency,
        files: [
          { kind: 'batch-id-proof', label: 'Batch ID proof', url: fileLink(sample.batch_proof_url, signed) },
          { kind: 'coa', label: 'Vendor COA', url: fileLink(sample.coa_file_url, signed) },
          { kind: 'purchase-proof', label: 'Proof of purchase', url: fileLink(sample.proof_file_url, signed) },
        ].filter((file) => file.url),
      })),
      testResults: resultRows.map((result) => toResult(result, signed)),
    });
  });

  router.patch('/shipments/:id', canManage, async (req, res) => {
    if (!isUuid(req.params.id)) {
      res.status(400).json({ error: 'Invalid shipment identifier' });
      return;
    }
    const reason = reasonFrom(req);
    if (!reason) {
      res.status(400).json({ error: 'A reason is required' });
      return;
    }
    try {
      const values = shipmentValues(bodyOf(req));
      if (Object.keys(values).length === 0) {
        res.status(400).json({ error: 'No shipment changes were provided' });
        return;
      }
      const existing = await loadShipmentOwner(String(req.params.id));
      if (!existing) {
        res.status(404).json({ error: 'Shipment not found' });
        return;
      }
      if (!await requireAuditRecord(req, res, {
        actor: actor(req), action: 'shipment.details.update.authorized', targetType: 'shipment', targetId: existing.id,
        reason, metadata: { accountId: existing.account_id, fields: Object.keys(values) },
      })) return;
      const { error } = await getServiceClient().from('shipments')
        .update({ ...values, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (error) throw error;
      await audit(req, {
        actor: actor(req), action: 'shipment.details.updated', targetType: 'shipment', targetId: existing.id,
        reason, metadata: { accountId: existing.account_id, fields: Object.keys(values) },
      });
      res.json({ id: existing.id, updated: Object.keys(values) });
    } catch (error) {
      sendError(res, error, 'Could not update the shipment');
    }
  });

  router.post('/shipments/:id/results/uploads', canManage, async (req, res) => {
    if (!isUuid(req.params.id)) {
      res.status(400).json({ error: 'Invalid shipment identifier' });
      return;
    }
    const body = bodyOf(req);
    if (typeof body.file !== 'string' || typeof body.contentType !== 'string') {
      res.status(400).json({ error: 'A file and content type are required' });
      return;
    }
    const buffer = Buffer.from(body.file, 'base64');
    if (buffer.length === 0 || buffer.length > MAX_REPORT_BYTES) {
      res.status(400).json({ error: 'File must be smaller than 5 MB' });
      return;
    }
    const detected = detectUploadType(buffer);
    if (!detected || detected !== body.contentType || !REPORT_TYPES.includes(detected)) {
      res.status(400).json({ error: 'Only PDF, JPEG, PNG or WebP files are accepted' });
      return;
    }
    const existing = await loadShipmentOwner(String(req.params.id));
    if (!existing) {
      res.status(404).json({ error: 'Shipment not found' });
      return;
    }
    const path = `${existing.account_id}/${LAB_REPORT_UPLOAD_TYPE}/${crypto.randomUUID()}.${extensionForUploadType(detected)}`;
    if (!await requireAuditRecord(req, res, {
      actor: actor(req), action: 'shipment.report.upload.authorized', targetType: 'shipment', targetId: existing.id,
      metadata: { accountId: existing.account_id, path, sizeBytes: buffer.length },
    })) return;
    const db = getServiceClient();
    const storage = db.storage.from(FORM_UPLOADS_BUCKET);
    const { error: uploadError } = await storage.upload(path, buffer, { contentType: detected });
    if (uploadError) {
      res.status(500).json({ error: 'Could not upload the report' });
      return;
    }
    const { error: inventoryError } = await db.from('user_uploads').insert({
      user_id: existing.account_id,
      bucket_id: FORM_UPLOADS_BUCKET,
      object_path: path,
      upload_type: LAB_REPORT_UPLOAD_TYPE,
      content_type: detected,
      size_bytes: buffer.length,
    });
    if (inventoryError) {
      await storage.remove([path]);
      res.status(inventoryError.code === '23514' ? 429 : 500).json({
        error: inventoryError.code === '23514'
          ? "The customer's private file quota is full"
          : 'Could not record the uploaded report',
      });
      return;
    }
    const signed = await signPaths([path]);
    res.status(201).json({ path, url: signed.get(path) ?? null });
  });

  router.post('/shipments/:id/results', canManage, async (req, res) => {
    if (!isUuid(req.params.id)) {
      res.status(400).json({ error: 'Invalid shipment identifier' });
      return;
    }
    try {
      const existing = await loadShipmentOwner(String(req.params.id));
      if (!existing) {
        res.status(404).json({ error: 'Shipment not found' });
        return;
      }
      const values = resultValues(bodyOf(req), existing.account_id, false);
      if (!await requireAuditRecord(req, res, {
        actor: actor(req), action: 'shipment.result.create.authorized', targetType: 'shipment', targetId: existing.id,
        metadata: { accountId: existing.account_id, outcome: values.outcome, publish: bodyOf(req).publish === true },
      })) return;
      const { data, error } = await getServiceClient().from('test_results')
        .insert({ ...values, shipment_id: existing.id })
        .select(RESULT_COLUMNS)
        .single();
      if (error || !data) throw error ?? new Error('result_insert_failed');
      const publishedTestId = await publishToCatalog(req, values);
      await audit(req, {
        actor: actor(req), action: 'shipment.result.created', targetType: 'test_result', targetId: data.id,
        metadata: { shipmentId: existing.id, accountId: existing.account_id, publishedTestId },
      });
      res.status(201).json({ ...toResult(data, await signPaths([data.coa_url])), publishedTestId });
    } catch (error) {
      sendError(res, error, 'Could not save the test result');
    }
  });

  router.patch('/shipments/:id/results/:resultId', canManage, async (req, res) => {
    if (!isUuid(req.params.id) || !isUuid(req.params.resultId)) {
      res.status(400).json({ error: 'Invalid test result identifier' });
      return;
    }
    try {
      const existing = await loadShipmentOwner(String(req.params.id));
      if (!existing) {
        res.status(404).json({ error: 'Shipment not found' });
        return;
      }
      const values = resultValues(bodyOf(req), existing.account_id, true);
      if (Object.keys(values).length === 0) {
        res.status(400).json({ error: 'No test result changes were provided' });
        return;
      }
      if (!await requireAuditRecord(req, res, {
        actor: actor(req), action: 'shipment.result.update.authorized', targetType: 'test_result',
        targetId: String(req.params.resultId), metadata: { shipmentId: existing.id, fields: Object.keys(values) },
      })) return;
      const { data, error } = await getServiceClient().from('test_results').update(values)
        .eq('id', req.params.resultId).eq('shipment_id', existing.id)
        .select(RESULT_COLUMNS).maybeSingle();
      if (error) throw error;
      if (!data) {
        res.status(404).json({ error: 'Test result not found' });
        return;
      }
      await audit(req, {
        actor: actor(req), action: 'shipment.result.updated', targetType: 'test_result', targetId: data.id,
        metadata: { shipmentId: existing.id, fields: Object.keys(values) },
      });
      res.json(toResult(data, await signPaths([data.coa_url])));
    } catch (error) {
      sendError(res, error, 'Could not update the test result');
    }
  });

  router.delete('/shipments/:id/results/:resultId', canManage, async (req, res) => {
    if (!isUuid(req.params.id) || !isUuid(req.params.resultId)) {
      res.status(400).json({ error: 'Invalid test result identifier' });
      return;
    }
    const reason = reasonFrom(req);
    if (!reason) {
      res.status(400).json({ error: 'A reason is required' });
      return;
    }
    try {
      if (!await requireAuditRecord(req, res, {
        actor: actor(req), action: 'shipment.result.delete.authorized', targetType: 'test_result',
        targetId: String(req.params.resultId), reason, metadata: { shipmentId: req.params.id },
      })) return;
      const { data, error } = await getServiceClient().from('test_results').delete()
        .eq('id', req.params.resultId).eq('shipment_id', req.params.id)
        .select('id').maybeSingle();
      if (error) throw error;
      if (!data) {
        res.status(404).json({ error: 'Test result not found' });
        return;
      }
      await audit(req, {
        actor: actor(req), action: 'shipment.result.deleted', targetType: 'test_result', targetId: data.id,
        reason, metadata: { shipmentId: req.params.id },
      });
      res.status(204).end();
    } catch (error) {
      sendError(res, error, 'Could not delete the test result');
    }
  });
};
