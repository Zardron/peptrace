import { bodyOf, has, optionalText, ValidationError, sendError, type AdminRouteDeps } from './admin-input.js';
import {
  encryptSecret,
  loadBillingSettings,
  loadBillingSettingsRow,
  stripeFor,
} from './billing.js';
import { getServiceClient } from './supabase.js';
import type { Router } from 'express';

const toState = (row: Awaited<ReturnType<typeof loadBillingSettingsRow>>) => ({
  provider: 'stripe',
  publishableKey: row?.publishable_key ?? '',
  secretKeySet: Boolean(row?.secret_key_encrypted),
  webhookSecretSet: Boolean(row?.webhook_secret_encrypted),
  memberPriceId: row?.member_price_id ?? '',
  goldPriceId: row?.gold_price_id ?? '',
  updatedAt: row?.updated_at ?? null,
});

const keyField = (value: unknown, label: string, prefixes: string[]): string | null => {
  const text = optionalText(value, label, 300);
  if (!text) return null;
  if (!prefixes.some((prefix) => text.startsWith(prefix))) {
    throw new ValidationError(`${label} must start with ${prefixes.join(' or ')}`);
  }
  if (/\s/.test(text)) throw new ValidationError(`${label} must not contain spaces`);
  return text;
};

export const registerBillingSettingsRoutes = (router: Router, deps: AdminRouteDeps): void => {
  const { actor, audit, requireAuditRecord, requirePermission } = deps;
  const canManage = requirePermission('billing:manage');

  router.get('/billing/settings', canManage, async (_req, res) => {
    try {
      res.json(toState(await loadBillingSettingsRow()));
    } catch {
      res.status(500).json({ error: 'Could not load billing settings' });
    }
  });

  router.put('/billing/settings', canManage, async (req, res) => {
    try {
      const body = bodyOf(req);
      const values: Record<string, unknown> = {};
      if (has(body, 'publishableKey')) values.publishable_key = keyField(body.publishableKey, 'Publishable key', ['pk_']);
      // Blank secrets keep the stored value so they never have to be re-entered.
      const secretKey = keyField(body.secretKey, 'Secret key', ['sk_', 'rk_']);
      if (secretKey) values.secret_key_encrypted = encryptSecret(secretKey);
      const webhookSecret = keyField(body.webhookSecret, 'Webhook signing secret', ['whsec_']);
      if (webhookSecret) values.webhook_secret_encrypted = encryptSecret(webhookSecret);
      if (has(body, 'memberPriceId')) values.member_price_id = keyField(body.memberPriceId, 'Member price ID', ['price_']);
      if (has(body, 'goldPriceId')) values.gold_price_id = keyField(body.goldPriceId, 'Gold price ID', ['price_']);
      if (Object.keys(values).length === 0) throw new ValidationError('No billing changes were provided');

      if (!await requireAuditRecord(req, res, {
        actor: actor(req), action: 'billing.settings.update.authorized', targetType: 'billing_settings',
        metadata: { fields: Object.keys(values).map((key) => key.replace('_encrypted', '')) },
      })) return;
      const { data, error } = await getServiceClient().from('billing_settings')
        .upsert({ id: true, ...values, updated_by: actor(req).id, updated_at: new Date().toISOString() }, { onConflict: 'id' })
        .select('publishable_key, secret_key_encrypted, webhook_secret_encrypted, member_price_id, gold_price_id, updated_at')
        .single();
      if (error || !data) throw error ?? new Error('billing_settings_save_failed');
      await audit(req, { actor: actor(req), action: 'billing.settings.updated', targetType: 'billing_settings' });
      res.json(toState(data));
    } catch (error) {
      sendError(res, error, 'Could not save billing settings');
    }
  });

  router.post('/billing/settings/test', canManage, async (req, res) => {
    try {
      const settings = await loadBillingSettings();
      if (!settings) {
        res.status(400).json({ error: 'Save a publishable key and secret key first' });
        return;
      }
      const balance = await stripeFor(settings).balance.retrieve();
      await audit(req, { actor: actor(req), action: 'billing.settings.tested', targetType: 'billing_settings' });
      res.json({ ok: true, livemode: balance.livemode });
    } catch {
      res.status(400).json({ error: 'Stripe rejected these credentials' });
    }
  });
};
