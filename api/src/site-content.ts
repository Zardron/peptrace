import type { Express, Router } from 'express';
import { bodyOf, reasonFrom, sendError, type AdminRouteDeps } from './admin-input.js';
import { defaultSiteContent } from './site-content-defaults.js';
import { CONTENT_BLOCKS, contentBlock, validateBlockContent } from './site-content-schema.js';
import { getServiceClient } from './supabase.js';

const CACHE_MS = 60 * 1000;

interface OverrideRow {
  key: string;
  content: Record<string, unknown>;
  updated_at: string;
  updated_by_email: string | null;
}

let overrideCache: { rows: Map<string, OverrideRow>; expiresAt: number } | null = null;

const loadOverrides = async (): Promise<Map<string, OverrideRow>> => {
  if (overrideCache && overrideCache.expiresAt > Date.now()) return overrideCache.rows;
  const { data, error } = await getServiceClient()
    .from('site_content')
    .select('key, content, updated_at, updated_by_email');
  if (error) throw error;
  const rows = new Map((data ?? []).map((row) => [row.key as string, row as OverrideRow]));
  overrideCache = { rows, expiresAt: Date.now() + CACHE_MS };
  return rows;
};

const defaultsFor = (key: string): Record<string, unknown> =>
  (defaultSiteContent as unknown as Record<string, Record<string, unknown>>)[key] ?? {};

const mergedContent = (key: string, override: OverrideRow | undefined): Record<string, unknown> =>
  override ? { ...defaultsFor(key), ...override.content } : defaultsFor(key);

export const registerPublicContentRoutes = (app: Express): void => {
  app.get('/content', async (_req, res) => {
    let overrides = new Map<string, OverrideRow>();
    try {
      overrides = await loadOverrides();
    } catch {
      // Serve the defaults rather than break public pages if the table is unavailable.
    }
    res.set('Cache-Control', 'public, max-age=60');
    res.json({
      items: Object.fromEntries(CONTENT_BLOCKS.map((block) => [block.key, mergedContent(block.key, overrides.get(block.key))])),
    });
  });
};

export const registerContentAdminRoutes = (router: Router, deps: AdminRouteDeps): void => {
  const { actor, audit, requireAuditRecord, requirePermission } = deps;
  const canManage = requirePermission('content:manage');

  router.get('/content', canManage, async (_req, res) => {
    overrideCache = null;
    let overrides: Map<string, OverrideRow>;
    try {
      overrides = await loadOverrides();
    } catch {
      res.status(503).json({ error: 'Site content storage is unavailable. Apply migration 025_site_content.sql.' });
      return;
    }
    res.json({
      items: CONTENT_BLOCKS.map((block) => {
        const override = overrides.get(block.key);
        return {
          key: block.key,
          title: block.title,
          description: block.description,
          path: block.path,
          spec: block.spec,
          content: mergedContent(block.key, override),
          isDefault: !override,
          updatedAt: override?.updated_at ?? null,
          updatedBy: override?.updated_by_email ?? null,
        };
      }),
    });
  });

  router.put('/content/:key', canManage, async (req, res) => {
    const block = contentBlock(String(req.params.key));
    if (!block) {
      res.status(404).json({ error: 'Unknown content block' });
      return;
    }
    const reason = reasonFrom(req);
    if (!reason) {
      res.status(400).json({ error: 'A reason is required' });
      return;
    }
    try {
      const content = validateBlockContent(block, bodyOf(req).content);
      const admin = actor(req);
      if (!await requireAuditRecord(req, res, {
        actor: admin, action: 'content.update.authorized', targetType: 'site_content', targetId: block.key, reason,
      })) return;
      const updatedAt = new Date().toISOString();
      const { error } = await getServiceClient().from('site_content').upsert({
        key: block.key,
        content,
        updated_at: updatedAt,
        updated_by: admin.id,
        updated_by_email: admin.email,
      });
      if (error) throw error;
      overrideCache = null;
      await audit(req, { actor: admin, action: 'content.updated', targetType: 'site_content', targetId: block.key, reason });
      res.json({ key: block.key, content, isDefault: false, updatedAt, updatedBy: admin.email });
    } catch (error) {
      sendError(res, error, 'Could not save the content');
    }
  });

  router.delete('/content/:key', canManage, async (req, res) => {
    const block = contentBlock(String(req.params.key));
    if (!block) {
      res.status(404).json({ error: 'Unknown content block' });
      return;
    }
    const reason = reasonFrom(req);
    if (!reason) {
      res.status(400).json({ error: 'A reason is required' });
      return;
    }
    try {
      if (!await requireAuditRecord(req, res, {
        actor: actor(req), action: 'content.reset.authorized', targetType: 'site_content', targetId: block.key, reason,
      })) return;
      const { error } = await getServiceClient().from('site_content').delete().eq('key', block.key);
      if (error) throw error;
      overrideCache = null;
      await audit(req, { actor: actor(req), action: 'content.reset', targetType: 'site_content', targetId: block.key, reason });
      res.json({ key: block.key, content: defaultsFor(block.key), isDefault: true, updatedAt: null, updatedBy: null });
    } catch (error) {
      sendError(res, error, 'Could not reset the content');
    }
  });
};
