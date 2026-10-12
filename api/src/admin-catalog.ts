import crypto from 'node:crypto';
import type { Router } from 'express';
import {
  bodyOf,
  has,
  optionalNumber,
  optionalText,
  optionalUrl,
  reasonFrom,
  requiredDate,
  requiredText,
  sendError,
  ValidationError,
  type AdminRouteDeps,
} from './admin-input.js';
import { notifyCatalogChanged } from './catalog-cache.js';
import { detectUploadType, extensionForUploadType, isUuid, type SafeUploadType } from './security.js';
import { getServiceClient } from './supabase.js';
import { VENDOR_PRODUCT_COLUMNS, resolveProductPeptide, toVendorProduct, vendorProductValues } from './vendor-products.js';

const CATALOG_ASSETS_BUCKET = 'catalog-assets';
const MAX_CATALOG_ASSET_BYTES = 5 * 1024 * 1024;
const CATALOG_ASSET_TYPES: SafeUploadType[] = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const CONTACT_TYPES = new Set(['website', 'whatsapp', 'email']);

const VENDOR_COLUMNS =
  'id, name, slug, score, cost_per_mg, location, website_url, avatar_url, about, analysis_text, contact_channels, intelligence_report, tests_count, products_count, latest_tested_at, rating, tests_passed, tests_total, is_demo';
const TEST_COLUMNS =
  'id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at';

export const slugify = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const parseContactChannels = (value: unknown) => {
  if (value === null || value === undefined) return [];
  if (!Array.isArray(value) || value.length > 10) throw new ValidationError('Contact channels must be a list of up to 10 items');
  return value.map((channel, index) => {
    if (!channel || typeof channel !== 'object') throw new ValidationError(`Contact channel ${index + 1} is invalid`);
    const record = channel as Record<string, unknown>;
    const type = requiredText(record.type, `Contact channel ${index + 1} type`, 20);
    if (!CONTACT_TYPES.has(type)) throw new ValidationError('Contact channel type must be website, whatsapp or email');
    return {
      type,
      value: requiredText(record.value, `Contact channel ${index + 1} value`, 200),
      url: optionalUrl(record.url, `Contact channel ${index + 1} link`),
    };
  });
};

const parseIntelligenceReport = (value: unknown) => {
  if (value === null || value === undefined) return {};
  if (typeof value !== 'object' || Array.isArray(value)) throw new ValidationError('Intelligence report is invalid');
  const record = value as Record<string, unknown>;
  const title = optionalText(record.title, 'Report title', 200);
  if (!title) return {};
  return {
    title,
    description: optionalText(record.description, 'Report description', 2000),
    pageCount: optionalNumber(record.pageCount, 'Report page count', 0, 10000),
    riskFactorsAssessed: optionalNumber(record.riskFactorsAssessed, 'Risk factors assessed', 0, 10000),
    publishedDate: optionalText(record.publishedDate, 'Report published date', 40),
    previewUrl: optionalUrl(record.previewUrl, 'Report preview link'),
  };
};

const vendorValues = (body: Record<string, unknown>, partial: boolean): Record<string, unknown> => {
  const values: Record<string, unknown> = {};
  if (!partial || has(body, 'name')) values.name = requiredText(body.name, 'Vendor name', 120);
  if (!partial || has(body, 'slug')) {
    const slug = slugify(optionalText(body.slug, 'Slug', 120) ?? String(values.name ?? ''));
    if (!slug) throw new ValidationError('Slug must contain letters or numbers');
    values.slug = slug;
  }
  if (!partial || has(body, 'location')) values.location = optionalText(body.location, 'Location', 120);
  if (!partial || has(body, 'websiteUrl')) values.website_url = optionalUrl(body.websiteUrl, 'Website');
  if (!partial || has(body, 'avatarUrl')) values.avatar_url = optionalUrl(body.avatarUrl, 'Logo');
  if (!partial || has(body, 'about')) values.about = optionalText(body.about, 'About', 5000);
  if (!partial || has(body, 'analysisText')) values.analysis_text = optionalText(body.analysisText, 'Analysis', 5000);
  if (!partial || has(body, 'costPerMg')) values.cost_per_mg = optionalNumber(body.costPerMg, 'Cost per mg', 0, 100000);
  if (!partial || has(body, 'contactChannels')) values.contact_channels = parseContactChannels(body.contactChannels);
  if (!partial || has(body, 'intelligenceReport')) values.intelligence_report = parseIntelligenceReport(body.intelligenceReport);
  if (!partial || has(body, 'isDemo')) values.is_demo = body.isDemo === true;
  return values;
};

const peptideValues = (body: Record<string, unknown>, partial: boolean): Record<string, unknown> => {
  const values: Record<string, unknown> = {};
  if (!partial || has(body, 'name')) values.name = requiredText(body.name, 'Peptide name', 120);
  if (!partial || has(body, 'description')) values.description = optionalText(body.description, 'Description', 2000);
  if (!partial || has(body, 'testingPrice')) {
    values.testing_price = optionalNumber(body.testingPrice, 'Testing price', 0, 100000) ?? 0;
  }
  return values;
};

const testValues = (body: Record<string, unknown>, partial: boolean): Record<string, unknown> => {
  const values: Record<string, unknown> = {};
  if (!partial || has(body, 'vendorId')) {
    if (!isUuid(body.vendorId)) throw new ValidationError('Choose a vendor');
    values.vendor_id = body.vendorId;
  }
  if (!partial || has(body, 'peptideName')) values.peptide_name = requiredText(body.peptideName, 'Peptide', 120);
  if (!partial || has(body, 'testedAt')) values.tested_at = requiredDate(body.testedAt, 'Test date');
  if (!partial || has(body, 'result')) {
    if (!['pass', 'fail'].includes(String(body.result))) throw new ValidationError('Result must be pass or fail');
    values.result = body.result;
  }
  if (!partial || has(body, 'labName')) values.lab_name = requiredText(body.labName, 'Lab', 120);
  if (!partial || has(body, 'purity')) values.purity = optionalNumber(body.purity, 'Purity', 0, 100);
  if (!partial || has(body, 'dosageDeviation')) values.dosage_deviation = optionalText(body.dosageDeviation, 'Dosage deviation', 40);
  if (!partial || has(body, 'testedMg')) values.tested_mg = optionalNumber(body.testedMg, 'Tested mg', 0, 999999);
  if (!partial || has(body, 'labelMg')) values.label_mg = optionalNumber(body.labelMg, 'Label mg', 0, 999999);
  if (!partial || has(body, 'batchCode')) values.batch_code = optionalText(body.batchCode, 'Batch code', 120);
  if (!partial || has(body, 'sender')) values.sender = optionalText(body.sender, 'Sender', 120);
  if (!partial || has(body, 'coaUrl')) values.coa_url = optionalUrl(body.coaUrl, 'COA link');
  return values;
};

const toVendor = (row: Record<string, any>) => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  score: row.score,
  costPerMg: row.cost_per_mg == null ? null : Number(row.cost_per_mg),
  location: row.location,
  websiteUrl: row.website_url,
  avatarUrl: row.avatar_url,
  about: row.about,
  analysisText: row.analysis_text,
  contactChannels: Array.isArray(row.contact_channels) ? row.contact_channels : [],
  intelligenceReport: row.intelligence_report && row.intelligence_report.title ? row.intelligence_report : null,
  testsCount: row.tests_count ?? 0,
  productsCount: row.products_count ?? 0,
  latestTestedAt: row.latest_tested_at,
  rating: row.rating,
  testsPassed: row.tests_passed ?? 0,
  testsTotal: row.tests_total ?? 0,
  isDemo: row.is_demo === true,
});

const toTest = (row: Record<string, any>, vendorName?: string | null) => ({
  id: row.id,
  vendorId: row.vendor_id,
  vendorName: vendorName ?? null,
  testedAt: row.tested_at,
  result: row.result,
  peptideName: row.peptide_name,
  labName: row.lab_name,
  purity: row.purity == null ? null : Number(row.purity),
  dosageDeviation: row.dosage_deviation,
  testedMg: row.tested_mg == null ? null : Number(row.tested_mg),
  labelMg: row.label_mg == null ? null : Number(row.label_mg),
  batchCode: row.batch_code,
  sender: row.sender,
  coaUrl: row.coa_url,
  createdAt: row.created_at,
});

// The public vendor list reads stored stats; keep them in step with vendor_tests.
export const recomputeVendorStats = async (vendorIds: Iterable<string>): Promise<void> => {
  const db = getServiceClient();
  for (const vendorId of new Set(vendorIds)) {
    const { data: tests, error } = await db
      .from('vendor_tests')
      .select('result, peptide_name, tested_at')
      .eq('vendor_id', vendorId);
    if (error) throw new Error(`vendor_stats_read_failed:${error.code}`);
    const rows = tests ?? [];
    const passed = rows.filter((row) => row.result === 'pass').length;
    const rating = rows.length > 0 ? Math.round((passed / rows.length) * 100) : null;
    const { error: updateError } = await db.from('vendors').update({
      tests_count: rows.length,
      tests_total: rows.length,
      tests_passed: passed,
      products_count: new Set(rows.map((row) => String(row.peptide_name).toLowerCase())).size,
      latest_tested_at: rows.map((row) => row.tested_at).sort().at(-1) ?? null,
      rating,
      score: rating,
    }).eq('id', vendorId);
    if (updateError) throw new Error(`vendor_stats_write_failed:${updateError.code}`);
  }
};

let catalogBucketReady: Promise<void> | null = null;

const ensureCatalogBucket = (): Promise<void> => {
  catalogBucketReady ??= (async () => {
    const storage = getServiceClient().storage;
    const options = { public: true, fileSizeLimit: MAX_CATALOG_ASSET_BYTES, allowedMimeTypes: CATALOG_ASSET_TYPES };
    const { data, error } = await storage.getBucket(CATALOG_ASSETS_BUCKET);
    if (error || !data) {
      const { error: createError } = await storage.createBucket(CATALOG_ASSETS_BUCKET, options);
      if (createError && !/already exists/i.test(createError.message)) throw createError;
      return;
    }
    if (!data.public || Number(data.file_size_limit) !== MAX_CATALOG_ASSET_BYTES) {
      const { error: updateError } = await storage.updateBucket(CATALOG_ASSETS_BUCKET, options);
      if (updateError) throw updateError;
    }
  })().catch((error) => {
    catalogBucketReady = null;
    throw error;
  });
  return catalogBucketReady;
};

export const registerCatalogRoutes = (router: Router, deps: AdminRouteDeps): void => {
  const { actor, audit, requireAuditRecord, requirePermission } = deps;
  const canRead = requirePermission('catalog:read');
  const canManage = requirePermission('catalog:manage');

  const afterWrite = async (vendorIds: Array<string | null | undefined>) => {
    await recomputeVendorStats(vendorIds.filter((id): id is string => Boolean(id)));
    notifyCatalogChanged();
  };

  router.get('/catalog/vendors', canRead, async (_req, res) => {
    const { data, error } = await getServiceClient().from('vendors').select(VENDOR_COLUMNS).order('name');
    if (error) {
      res.status(500).json({ error: 'Could not load vendors' });
      return;
    }
    res.json({ items: (data ?? []).map(toVendor) });
  });

  router.post('/catalog/vendors', canManage, async (req, res) => {
    try {
      const values = vendorValues(bodyOf(req), false);
      if (!await requireAuditRecord(req, res, {
        actor: actor(req), action: 'catalog.vendor.create.authorized', targetType: 'vendor',
        metadata: { name: values.name, slug: values.slug },
      })) return;
      const { data, error } = await getServiceClient().from('vendors').insert(values).select(VENDOR_COLUMNS).single();
      if (error || !data) throw error ?? new Error('vendor_insert_failed');
      notifyCatalogChanged();
      await audit(req, { actor: actor(req), action: 'catalog.vendor.created', targetType: 'vendor', targetId: data.id });
      res.status(201).json(toVendor(data));
    } catch (error) {
      sendError(res, error, 'Could not create the vendor');
    }
  });

  router.patch('/catalog/vendors/:id', canManage, async (req, res) => {
    if (!isUuid(req.params.id)) {
      res.status(400).json({ error: 'Invalid vendor identifier' });
      return;
    }
    try {
      const values = vendorValues(bodyOf(req), true);
      if (Object.keys(values).length === 0) {
        res.status(400).json({ error: 'No vendor changes were provided' });
        return;
      }
      if (!await requireAuditRecord(req, res, {
        actor: actor(req), action: 'catalog.vendor.update.authorized', targetType: 'vendor',
        targetId: String(req.params.id), metadata: { fields: Object.keys(values) },
      })) return;
      const { data, error } = await getServiceClient().from('vendors').update(values)
        .eq('id', req.params.id).select(VENDOR_COLUMNS).maybeSingle();
      if (error) throw error;
      if (!data) {
        res.status(404).json({ error: 'Vendor not found' });
        return;
      }
      notifyCatalogChanged();
      await audit(req, { actor: actor(req), action: 'catalog.vendor.updated', targetType: 'vendor', targetId: data.id });
      res.json(toVendor(data));
    } catch (error) {
      sendError(res, error, 'Could not update the vendor');
    }
  });

  router.delete('/catalog/vendors/:id', canManage, async (req, res) => {
    if (!isUuid(req.params.id)) {
      res.status(400).json({ error: 'Invalid vendor identifier' });
      return;
    }
    const reason = reasonFrom(req);
    if (!reason) {
      res.status(400).json({ error: 'A reason is required' });
      return;
    }
    try {
      if (!await requireAuditRecord(req, res, {
        actor: actor(req), action: 'catalog.vendor.delete.authorized', targetType: 'vendor',
        targetId: String(req.params.id), reason,
      })) return;
      const { data, error } = await getServiceClient().from('vendors').delete().eq('id', req.params.id).select('id').maybeSingle();
      if (error) throw error;
      if (!data) {
        res.status(404).json({ error: 'Vendor not found' });
        return;
      }
      notifyCatalogChanged();
      await audit(req, { actor: actor(req), action: 'catalog.vendor.deleted', targetType: 'vendor', targetId: data.id, reason });
      res.status(204).end();
    } catch (error) {
      sendError(res, error, 'Could not delete the vendor');
    }
  });

  router.get('/catalog/peptides', canRead, async (_req, res) => {
    const db = getServiceClient();
    const [{ data: peptides, error }, { data: tests, error: testsError }] = await Promise.all([
      db.from('peptides').select('id, name, description, testing_price, status').order('name'),
      db.from('vendor_tests').select('peptide_name'),
    ]);
    if (error || testsError) {
      res.status(500).json({ error: 'Could not load peptides' });
      return;
    }
    const testCounts = new Map<string, number>();
    for (const test of tests ?? []) {
      const key = String(test.peptide_name).toLowerCase();
      testCounts.set(key, (testCounts.get(key) ?? 0) + 1);
    }
    res.json({
      items: (peptides ?? []).map((peptide) => ({
        id: peptide.id,
        name: peptide.name,
        slug: slugify(String(peptide.name)),
        description: peptide.description,
        testingPrice: peptide.testing_price == null ? 0 : Number(peptide.testing_price),
        status: peptide.status ?? 'listed',
        testCount: testCounts.get(String(peptide.name).toLowerCase()) ?? 0,
      })),
    });
  });

  router.post('/catalog/peptides', canManage, async (req, res) => {
    try {
      const values = peptideValues(bodyOf(req), false);
      if (!await requireAuditRecord(req, res, {
        actor: actor(req), action: 'catalog.peptide.create.authorized', targetType: 'peptide',
        metadata: { name: values.name },
      })) return;
      const { data, error } = await getServiceClient().from('peptides').insert(values)
        .select('id, name, description, testing_price, status').single();
      if (error || !data) throw error ?? new Error('peptide_insert_failed');
      notifyCatalogChanged();
      await audit(req, { actor: actor(req), action: 'catalog.peptide.created', targetType: 'peptide', targetId: data.id });
      res.status(201).json({ ...data, testingPrice: Number(data.testing_price ?? 0) });
    } catch (error) {
      sendError(res, error, 'Could not create the peptide');
    }
  });

  router.patch('/catalog/peptides/:id', canManage, async (req, res) => {
    if (!isUuid(req.params.id)) {
      res.status(400).json({ error: 'Invalid peptide identifier' });
      return;
    }
    try {
      const values = peptideValues(bodyOf(req), true);
      if (Object.keys(values).length === 0) {
        res.status(400).json({ error: 'No peptide changes were provided' });
        return;
      }
      const db = getServiceClient();
      const { data: existing } = await db.from('peptides').select('id, name').eq('id', req.params.id).maybeSingle();
      if (!existing) {
        res.status(404).json({ error: 'Peptide not found' });
        return;
      }
      if (!await requireAuditRecord(req, res, {
        actor: actor(req), action: 'catalog.peptide.update.authorized', targetType: 'peptide',
        targetId: existing.id, metadata: { fields: Object.keys(values) },
      })) return;
      const { data, error } = await db.from('peptides').update(values)
        .eq('id', existing.id).select('id, name, description, testing_price, status').single();
      if (error || !data) throw error ?? new Error('peptide_update_failed');

      // Lab results reference peptides by name, so carry a rename through to them.
      const renamedVendors: string[] = [];
      if (typeof values.name === 'string' && values.name !== existing.name) {
        const { data: tests } = await db.from('vendor_tests').select('id, vendor_id, peptide_name');
        const matching = (tests ?? []).filter((test) =>
          String(test.peptide_name).toLowerCase() === String(existing.name).toLowerCase());
        if (matching.length > 0) {
          const { error: renameError } = await db.from('vendor_tests')
            .update({ peptide_name: values.name })
            .in('id', matching.map((test) => test.id));
          if (renameError) throw renameError;
          renamedVendors.push(...matching.map((test) => test.vendor_id));
        }
      }
      await afterWrite(renamedVendors);
      await audit(req, { actor: actor(req), action: 'catalog.peptide.updated', targetType: 'peptide', targetId: data.id });
      res.json({ ...data, testingPrice: Number(data.testing_price ?? 0) });
    } catch (error) {
      sendError(res, error, 'Could not update the peptide');
    }
  });

  router.post('/catalog/peptides/:id/approve', canManage, async (req, res) => {
    if (!isUuid(req.params.id)) {
      res.status(400).json({ error: 'Invalid peptide identifier' });
      return;
    }
    try {
      if (!await requireAuditRecord(req, res, {
        actor: actor(req), action: 'catalog.peptide.approve.authorized', targetType: 'peptide', targetId: String(req.params.id),
      })) return;
      const { data, error } = await getServiceClient().from('peptides')
        .update({ status: 'listed' })
        .eq('id', req.params.id).eq('status', 'pending_approval')
        .select('id, name, description, testing_price, status').maybeSingle();
      if (error) throw error;
      if (!data) {
        res.status(404).json({ error: 'No pending peptide found' });
        return;
      }
      notifyCatalogChanged();
      await audit(req, { actor: actor(req), action: 'catalog.peptide.approved', targetType: 'peptide', targetId: data.id });
      res.json({ ...data, testingPrice: Number(data.testing_price ?? 0) });
    } catch (error) {
      sendError(res, error, 'Could not approve the peptide');
    }
  });

  router.post('/catalog/peptides/:id/deny', canManage, async (req, res) => {
    if (!isUuid(req.params.id)) {
      res.status(400).json({ error: 'Invalid peptide identifier' });
      return;
    }
    const reason = reasonFrom(req);
    if (!reason) {
      res.status(400).json({ error: 'A reason is required' });
      return;
    }
    try {
      if (!await requireAuditRecord(req, res, {
        actor: actor(req), action: 'catalog.peptide.deny.authorized', targetType: 'peptide',
        targetId: String(req.params.id), reason,
      })) return;
      const { data, error } = await getServiceClient().from('peptides').delete()
        .eq('id', req.params.id).eq('status', 'pending_approval').select('id').maybeSingle();
      if (error) throw error;
      if (!data) {
        res.status(404).json({ error: 'No pending peptide found' });
        return;
      }
      await audit(req, { actor: actor(req), action: 'catalog.peptide.denied', targetType: 'peptide', targetId: data.id, reason });
      res.status(204).end();
    } catch (error) {
      sendError(res, error, 'Could not deny the peptide');
    }
  });

  router.delete('/catalog/peptides/:id', canManage, async (req, res) => {
    if (!isUuid(req.params.id)) {
      res.status(400).json({ error: 'Invalid peptide identifier' });
      return;
    }
    const reason = reasonFrom(req);
    if (!reason) {
      res.status(400).json({ error: 'A reason is required' });
      return;
    }
    try {
      if (!await requireAuditRecord(req, res, {
        actor: actor(req), action: 'catalog.peptide.delete.authorized', targetType: 'peptide',
        targetId: String(req.params.id), reason,
      })) return;
      const { data, error } = await getServiceClient().from('peptides').delete().eq('id', req.params.id).select('id').maybeSingle();
      if (error) throw error;
      if (!data) {
        res.status(404).json({ error: 'Peptide not found' });
        return;
      }
      notifyCatalogChanged();
      await audit(req, { actor: actor(req), action: 'catalog.peptide.deleted', targetType: 'peptide', targetId: data.id, reason });
      res.status(204).end();
    } catch (error) {
      sendError(res, error, 'Could not delete the peptide');
    }
  });

  router.get('/catalog/tests', canRead, async (req, res) => {
    const page = Math.max(1, Number.parseInt(String(req.query.page ?? '1'), 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(String(req.query.pageSize ?? '25'), 10) || 25));
    const vendorId = typeof req.query.vendorId === 'string' && isUuid(req.query.vendorId) ? req.query.vendorId : null;
    const peptide = typeof req.query.peptide === 'string' ? req.query.peptide.trim().slice(0, 120) : '';
    const result = typeof req.query.result === 'string' && ['pass', 'fail'].includes(req.query.result) ? req.query.result : null;

    const db = getServiceClient();
    let query = db.from('vendor_tests').select(TEST_COLUMNS, { count: 'exact' });
    if (vendorId) query = query.eq('vendor_id', vendorId);
    if (peptide) query = query.eq('peptide_name', peptide);
    if (result) query = query.eq('result', result);
    const { data, count, error } = await query
      .order('tested_at', { ascending: false })
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (error) {
      res.status(500).json({ error: 'Could not load lab results' });
      return;
    }
    const vendorIds = [...new Set((data ?? []).map((row) => row.vendor_id))];
    const { data: vendors } = vendorIds.length
      ? await db.from('vendors').select('id, name').in('id', vendorIds)
      : { data: [] as Array<{ id: string; name: string }> };
    const nameById = new Map((vendors ?? []).map((vendor) => [vendor.id, vendor.name]));
    res.json({
      items: (data ?? []).map((row) => toTest(row, nameById.get(row.vendor_id))),
      page,
      pageSize,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / pageSize),
    });
  });

  router.get('/catalog/vendor-products', canRead, async (req, res) => {
    const page = Math.max(1, Number.parseInt(String(req.query.page ?? '1'), 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(String(req.query.pageSize ?? '25'), 10) || 25));
    const vendorId = typeof req.query.vendorId === 'string' && isUuid(req.query.vendorId) ? req.query.vendorId : null;

    const db = getServiceClient();
    let query = db.from('vendor_products').select(VENDOR_PRODUCT_COLUMNS, { count: 'exact' });
    if (vendorId) query = query.eq('vendor_id', vendorId);
    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (error) {
      res.status(500).json({ error: 'Could not load vendor products' });
      return;
    }
    const vendorIds = [...new Set((data ?? []).map((row) => row.vendor_id))];
    const { data: vendors } = vendorIds.length
      ? await db.from('vendors').select('id, name').in('id', vendorIds)
      : { data: [] as Array<{ id: string; name: string }> };
    const nameById = new Map((vendors ?? []).map((vendor) => [vendor.id, vendor.name]));
    res.json({
      items: (data ?? []).map((row) => ({ ...toVendorProduct(row), vendorName: nameById.get(row.vendor_id) ?? null })),
      page,
      pageSize,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / pageSize),
    });
  });

  router.patch('/catalog/vendor-products/:id', canManage, async (req, res) => {
    if (!isUuid(req.params.id)) {
      res.status(400).json({ error: 'Invalid product identifier' });
      return;
    }
    try {
      const values = vendorProductValues(bodyOf(req), true);
      const body = bodyOf(req);
      if (has(body, 'peptideName') || has(body, 'peptideId')) {
        Object.assign(values, await resolveProductPeptide(getServiceClient(), body, 'listed'));
      }
      if (Object.keys(values).length === 0) {
        res.status(400).json({ error: 'No product changes were provided' });
        return;
      }
      if (!await requireAuditRecord(req, res, {
        actor: actor(req), action: 'catalog.vendor_product.update.authorized', targetType: 'vendor_product',
        targetId: String(req.params.id), metadata: { fields: Object.keys(values) },
      })) return;
      const { data, error } = await getServiceClient().from('vendor_products')
        .update({ ...values, updated_at: new Date().toISOString() })
        .eq('id', req.params.id).select(VENDOR_PRODUCT_COLUMNS).maybeSingle();
      if (error) throw error;
      if (!data) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      await audit(req, { actor: actor(req), action: 'catalog.vendor_product.updated', targetType: 'vendor_product', targetId: data.id });
      res.json(toVendorProduct(data));
    } catch (error) {
      sendError(res, error, 'Could not update the product');
    }
  });

  router.delete('/catalog/vendor-products/:id', canManage, async (req, res) => {
    if (!isUuid(req.params.id)) {
      res.status(400).json({ error: 'Invalid product identifier' });
      return;
    }
    const reason = reasonFrom(req);
    if (!reason) {
      res.status(400).json({ error: 'A reason is required' });
      return;
    }
    try {
      if (!await requireAuditRecord(req, res, {
        actor: actor(req), action: 'catalog.vendor_product.delete.authorized', targetType: 'vendor_product',
        targetId: String(req.params.id), reason,
      })) return;
      const { data, error } = await getServiceClient().from('vendor_products')
        .delete().eq('id', req.params.id).select('id').maybeSingle();
      if (error) throw error;
      if (!data) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      await audit(req, { actor: actor(req), action: 'catalog.vendor_product.deleted', targetType: 'vendor_product', targetId: data.id, reason });
      res.status(204).end();
    } catch (error) {
      sendError(res, error, 'Could not delete the product');
    }
  });

  router.post('/catalog/tests', canManage, async (req, res) => {
    try {
      const values = testValues(bodyOf(req), false);
      if (!await requireAuditRecord(req, res, {
        actor: actor(req), action: 'catalog.test.create.authorized', targetType: 'vendor_test',
        metadata: { vendorId: values.vendor_id, peptide: values.peptide_name, result: values.result },
      })) return;
      const { data, error } = await getServiceClient().from('vendor_tests').insert(values).select(TEST_COLUMNS).single();
      if (error || !data) throw error ?? new Error('test_insert_failed');
      await afterWrite([data.vendor_id]);
      await audit(req, { actor: actor(req), action: 'catalog.test.created', targetType: 'vendor_test', targetId: data.id });
      res.status(201).json(toTest(data));
    } catch (error) {
      sendError(res, error, 'Could not create the lab result');
    }
  });

  router.patch('/catalog/tests/:id', canManage, async (req, res) => {
    if (!isUuid(req.params.id)) {
      res.status(400).json({ error: 'Invalid lab result identifier' });
      return;
    }
    try {
      const values = testValues(bodyOf(req), true);
      if (Object.keys(values).length === 0) {
        res.status(400).json({ error: 'No lab result changes were provided' });
        return;
      }
      const db = getServiceClient();
      const { data: existing } = await db.from('vendor_tests').select('id, vendor_id').eq('id', req.params.id).maybeSingle();
      if (!existing) {
        res.status(404).json({ error: 'Lab result not found' });
        return;
      }
      if (!await requireAuditRecord(req, res, {
        actor: actor(req), action: 'catalog.test.update.authorized', targetType: 'vendor_test',
        targetId: existing.id, metadata: { fields: Object.keys(values) },
      })) return;
      const { data, error } = await db.from('vendor_tests').update(values).eq('id', existing.id).select(TEST_COLUMNS).single();
      if (error || !data) throw error ?? new Error('test_update_failed');
      await afterWrite([existing.vendor_id, data.vendor_id]);
      await audit(req, { actor: actor(req), action: 'catalog.test.updated', targetType: 'vendor_test', targetId: data.id });
      res.json(toTest(data));
    } catch (error) {
      sendError(res, error, 'Could not update the lab result');
    }
  });

  router.delete('/catalog/tests/:id', canManage, async (req, res) => {
    if (!isUuid(req.params.id)) {
      res.status(400).json({ error: 'Invalid lab result identifier' });
      return;
    }
    const reason = reasonFrom(req);
    if (!reason) {
      res.status(400).json({ error: 'A reason is required' });
      return;
    }
    try {
      if (!await requireAuditRecord(req, res, {
        actor: actor(req), action: 'catalog.test.delete.authorized', targetType: 'vendor_test',
        targetId: String(req.params.id), reason,
      })) return;
      const { data, error } = await getServiceClient().from('vendor_tests').delete()
        .eq('id', req.params.id).select('id, vendor_id').maybeSingle();
      if (error) throw error;
      if (!data) {
        res.status(404).json({ error: 'Lab result not found' });
        return;
      }
      await afterWrite([data.vendor_id]);
      await audit(req, { actor: actor(req), action: 'catalog.test.deleted', targetType: 'vendor_test', targetId: data.id, reason });
      res.status(204).end();
    } catch (error) {
      sendError(res, error, 'Could not delete the lab result');
    }
  });

  router.post('/catalog/uploads', canManage, async (req, res) => {
    const body = bodyOf(req);
    const kind = typeof body.kind === 'string' && ['coa', 'vendor-logo', 'report'].includes(body.kind) ? body.kind : null;
    if (!kind || typeof body.file !== 'string' || typeof body.contentType !== 'string') {
      res.status(400).json({ error: 'A file, content type and kind are required' });
      return;
    }
    const buffer = Buffer.from(body.file, 'base64');
    if (buffer.length === 0 || buffer.length > MAX_CATALOG_ASSET_BYTES) {
      res.status(400).json({ error: 'File must be smaller than 5 MB' });
      return;
    }
    const detected = detectUploadType(buffer);
    if (!detected || detected !== body.contentType || !CATALOG_ASSET_TYPES.includes(detected)) {
      res.status(400).json({ error: 'Only PDF, JPEG, PNG or WebP files are accepted' });
      return;
    }
    try {
      await ensureCatalogBucket();
    } catch {
      res.status(503).json({ error: 'Catalog file storage is unavailable' });
      return;
    }
    const path = `${kind}/${crypto.randomUUID()}.${extensionForUploadType(detected)}`;
    if (!await requireAuditRecord(req, res, {
      actor: actor(req), action: 'catalog.asset.upload.authorized', targetType: 'catalog_asset',
      metadata: { kind, path, sizeBytes: buffer.length },
    })) return;
    const storage = getServiceClient().storage.from(CATALOG_ASSETS_BUCKET);
    const { error } = await storage.upload(path, buffer, { contentType: detected });
    if (error) {
      res.status(500).json({ error: 'Could not upload the file' });
      return;
    }
    res.status(201).json({ path, url: storage.getPublicUrl(path).data.publicUrl });
  });
};
