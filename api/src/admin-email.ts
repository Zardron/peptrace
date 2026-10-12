import type { Router } from 'express';
import {
  bodyOf,
  has,
  optionalText,
  requiredText,
  sendError,
  ValidationError,
  type AdminRouteDeps,
} from './admin-input.js';
import { isValidEmail } from './auth.js';
import { encryptSecret } from './billing.js';
import {
  EMAIL_CATEGORIES,
  loadEmailSettings,
  loadEmailSettingsRow,
  renderTemplateText,
  sendViaSendGrid,
} from './email.js';
import { isUuid } from './security.js';
import { getServiceClient } from './supabase.js';

const TEMPLATE_COLUMNS = 'id, key, name, category, subject, html_body, text_body, enabled, is_system, created_at, updated_at';

const SAMPLE_VARIABLES: Record<string, string> = {
  name: 'Alex',
  resetUrl: 'https://peptrace.co/reset-password?token=sample',
  code: '123456',
  expiresIn: '30 minutes',
  siteUrl: 'https://peptrace.co',
  trackingId: 'PT-1042',
  status: 'In transit',
  shipmentUrl: 'https://peptrace.co/shipment/sample',
};

const settingsState = (row: Awaited<ReturnType<typeof loadEmailSettingsRow>>) => ({
  provider: 'sendgrid' as const,
  apiKeySet: Boolean(row?.api_key_encrypted),
  fromEmail: row?.from_email ?? '',
  fromName: row?.from_name ?? '',
  replyToEmail: row?.reply_to_email ?? '',
  updatedAt: row?.updated_at ?? null,
});

const emailField = (value: unknown, label: string, required: boolean): string | null => {
  const text = optionalText(value, label, 254);
  if (!text) {
    if (required) throw new ValidationError(`${label} is required`);
    return null;
  }
  if (!isValidEmail(text.toLowerCase())) throw new ValidationError(`${label} must be a valid email address`);
  return text;
};

const templateValues = (body: Record<string, unknown>, partial: boolean, creating: boolean) => {
  const values: Record<string, unknown> = {};
  if (creating) {
    const key = requiredText(body.key, 'Key', 60);
    if (!/^[a-z0-9_]{2,60}$/.test(key)) throw new ValidationError('Key may only use lowercase letters, numbers and underscores');
    values.key = key;
  }
  if (!partial || has(body, 'name')) values.name = requiredText(body.name, 'Name', 120);
  if (!partial || has(body, 'category')) {
    if (!(EMAIL_CATEGORIES as readonly string[]).includes(String(body.category))) throw new ValidationError('Choose a valid category');
    values.category = body.category;
  }
  if (!partial || has(body, 'subject')) values.subject = requiredText(body.subject, 'Subject', 200);
  if (!partial || has(body, 'htmlBody')) values.html_body = requiredText(body.htmlBody, 'HTML body', 100000);
  if (!partial || has(body, 'textBody')) values.text_body = optionalText(body.textBody, 'Plain text body', 100000);
  if (!partial || has(body, 'enabled')) values.enabled = body.enabled !== false;
  return values;
};

const toTemplate = (row: Record<string, any>) => ({
  id: row.id,
  key: row.key,
  name: row.name,
  category: row.category,
  subject: row.subject,
  htmlBody: row.html_body,
  textBody: row.text_body,
  enabled: row.enabled === true,
  isSystem: row.is_system === true,
  updatedAt: row.updated_at,
});

export const registerEmailAdminRoutes = (router: Router, deps: AdminRouteDeps): void => {
  const { actor, audit, requireAuditRecord, requirePermission } = deps;
  const canManage = requirePermission('email:manage');

  router.get('/email/settings', canManage, async (_req, res) => {
    try {
      res.json(settingsState(await loadEmailSettingsRow()));
    } catch {
      res.status(500).json({ error: 'Could not load email settings' });
    }
  });

  router.put('/email/settings', canManage, async (req, res) => {
    try {
      const body = bodyOf(req);
      const values: Record<string, unknown> = {
        from_email: emailField(body.fromEmail, 'From email', true),
        from_name: optionalText(body.fromName, 'From name', 120),
        reply_to_email: emailField(body.replyToEmail, 'Reply-to email', false),
      };
      // A blank key keeps the stored one.
      const apiKey = optionalText(body.apiKey, 'API key', 300);
      if (apiKey) {
        if (!apiKey.startsWith('SG.') || /\s/.test(apiKey)) throw new ValidationError('SendGrid API keys start with SG.');
        values.api_key_encrypted = encryptSecret(apiKey);
      }
      if (!await requireAuditRecord(req, res, {
        actor: actor(req), action: 'email.settings.update.authorized', targetType: 'email_settings',
        metadata: { fields: Object.keys(values).map((key) => key.replace('_encrypted', '')) },
      })) return;
      const { data, error } = await getServiceClient().from('email_settings')
        .upsert({ id: true, ...values, updated_by: actor(req).id, updated_at: new Date().toISOString() }, { onConflict: 'id' })
        .select('api_key_encrypted, from_email, from_name, reply_to_email, updated_at')
        .single();
      if (error || !data) throw error ?? new Error('email_settings_save_failed');
      await audit(req, { actor: actor(req), action: 'email.settings.updated', targetType: 'email_settings' });
      res.json(settingsState(data));
    } catch (error) {
      sendError(res, error, 'Could not save email settings');
    }
  });

  router.post('/email/settings/test', canManage, async (req, res) => {
    try {
      const to = emailField(bodyOf(req).to, 'Recipient', true)!;
      const settings = await loadEmailSettings();
      if (!settings) {
        res.status(400).json({ error: 'Save an API key and from address first' });
        return;
      }
      const result = await sendViaSendGrid({
        settings,
        to,
        subject: 'PepTrace email test',
        html: '<p>This is a test email from the PepTrace admin portal. SendGrid is connected.</p>',
        text: 'This is a test email from the PepTrace admin portal. SendGrid is connected.',
      });
      await audit(req, { actor: actor(req), action: 'email.settings.tested', targetType: 'email_settings' });
      if (!result.ok) {
        res.status(400).json({ error: `SendGrid rejected the request (${result.status}). Check the API key and verified sender.` });
        return;
      }
      res.json({ ok: true });
    } catch (error) {
      sendError(res, error, 'Could not send the test email');
    }
  });

  router.get('/email/templates', canManage, async (_req, res) => {
    const { data, error } = await getServiceClient().from('email_templates').select(TEMPLATE_COLUMNS).order('name');
    if (error) {
      res.status(500).json({ error: 'Could not load email templates' });
      return;
    }
    res.json({ items: (data ?? []).map(toTemplate) });
  });

  router.post('/email/templates', canManage, async (req, res) => {
    try {
      const values = templateValues(bodyOf(req), false, true);
      if (!await requireAuditRecord(req, res, {
        actor: actor(req), action: 'email.template.create.authorized', targetType: 'email_template', metadata: { key: values.key },
      })) return;
      const { data, error } = await getServiceClient().from('email_templates')
        .insert({ ...values, updated_by: actor(req).id }).select(TEMPLATE_COLUMNS).single();
      if (error || !data) throw error ?? new Error('email_template_insert_failed');
      await audit(req, { actor: actor(req), action: 'email.template.created', targetType: 'email_template', targetId: data.id });
      res.status(201).json(toTemplate(data));
    } catch (error) {
      sendError(res, error, 'Could not create the template', 'A template with that key already exists');
    }
  });

  router.patch('/email/templates/:id', canManage, async (req, res) => {
    if (!isUuid(req.params.id)) {
      res.status(400).json({ error: 'Invalid template identifier' });
      return;
    }
    try {
      const values = templateValues(bodyOf(req), true, false);
      if (Object.keys(values).length === 0) throw new ValidationError('No template changes were provided');
      if (!await requireAuditRecord(req, res, {
        actor: actor(req), action: 'email.template.update.authorized', targetType: 'email_template',
        targetId: String(req.params.id), metadata: { fields: Object.keys(values) },
      })) return;
      const { data, error } = await getServiceClient().from('email_templates')
        .update({ ...values, updated_by: actor(req).id, updated_at: new Date().toISOString() })
        .eq('id', req.params.id).select(TEMPLATE_COLUMNS).maybeSingle();
      if (error) throw error;
      if (!data) {
        res.status(404).json({ error: 'Template not found' });
        return;
      }
      await audit(req, { actor: actor(req), action: 'email.template.updated', targetType: 'email_template', targetId: data.id });
      res.json(toTemplate(data));
    } catch (error) {
      sendError(res, error, 'Could not update the template');
    }
  });

  router.delete('/email/templates/:id', canManage, async (req, res) => {
    if (!isUuid(req.params.id)) {
      res.status(400).json({ error: 'Invalid template identifier' });
      return;
    }
    try {
      if (!await requireAuditRecord(req, res, {
        actor: actor(req), action: 'email.template.delete.authorized', targetType: 'email_template', targetId: String(req.params.id),
      })) return;
      const { data, error } = await getServiceClient().from('email_templates')
        .delete().eq('id', req.params.id).eq('is_system', false).select('id').maybeSingle();
      if (error) throw error;
      if (!data) {
        res.status(404).json({ error: 'Template not found, or it is a built-in template' });
        return;
      }
      await audit(req, { actor: actor(req), action: 'email.template.deleted', targetType: 'email_template', targetId: data.id });
      res.status(204).end();
    } catch (error) {
      sendError(res, error, 'Could not delete the template');
    }
  });

  router.post('/email/templates/:id/test', canManage, async (req, res) => {
    if (!isUuid(req.params.id)) {
      res.status(400).json({ error: 'Invalid template identifier' });
      return;
    }
    try {
      const to = emailField(bodyOf(req).to, 'Recipient', true)!;
      const settings = await loadEmailSettings();
      if (!settings) {
        res.status(400).json({ error: 'Connect SendGrid before sending a test' });
        return;
      }
      const { data: template } = await getServiceClient().from('email_templates')
        .select('subject, html_body, text_body').eq('id', req.params.id).maybeSingle();
      if (!template) {
        res.status(404).json({ error: 'Template not found' });
        return;
      }
      const result = await sendViaSendGrid({
        settings,
        to,
        subject: `[Test] ${renderTemplateText(template.subject, SAMPLE_VARIABLES, false)}`,
        html: renderTemplateText(template.html_body, SAMPLE_VARIABLES, true),
        text: template.text_body ? renderTemplateText(template.text_body, SAMPLE_VARIABLES, false) : null,
      });
      await audit(req, { actor: actor(req), action: 'email.template.tested', targetType: 'email_template', targetId: String(req.params.id) });
      if (!result.ok) {
        res.status(400).json({ error: `SendGrid rejected the request (${result.status}).` });
        return;
      }
      res.json({ ok: true });
    } catch (error) {
      sendError(res, error, 'Could not send the test email');
    }
  });
};
