import { getServiceClient } from './supabase.js';
import { decryptSecret } from './billing.js';

export const EMAIL_CATEGORIES = ['transactional', 'test_results', 'shipment_updates', 'rankings', 'marketing'] as const;
export type EmailCategory = (typeof EMAIL_CATEGORIES)[number];

// Categories map to the email toggles on /account/notifications.
const PREFERENCE_COLUMN: Partial<Record<EmailCategory, string>> = {
  test_results: 'email_test_results',
  shipment_updates: 'email_shipment_updates',
  rankings: 'email_rankings',
  marketing: 'email_marketing',
};
const PREFERENCE_DEFAULT: Record<string, boolean> = {
  email_test_results: true,
  email_shipment_updates: true,
  email_rankings: false,
  email_marketing: false,
};

const SENDGRID_URL = 'https://api.sendgrid.com/v3/mail/send';

export interface EmailSettings {
  apiKey: string;
  fromEmail: string;
  fromName: string | null;
  replyTo: string | null;
}

export const loadEmailSettingsRow = async () => {
  const { data, error } = await getServiceClient().from('email_settings')
    .select('api_key_encrypted, from_email, from_name, reply_to_email, updated_at')
    .eq('id', true)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const loadEmailSettings = async (): Promise<EmailSettings | null> => {
  const row = await loadEmailSettingsRow();
  if (!row?.api_key_encrypted || !row.from_email) return null;
  return {
    apiKey: decryptSecret(row.api_key_encrypted),
    fromEmail: row.from_email,
    fromName: row.from_name,
    replyTo: row.reply_to_email,
  };
};

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);

// Replaces {{variable}} placeholders; HTML output escapes the values.
export const renderTemplateText = (template: string, variables: Record<string, string>, html: boolean): string =>
  template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, name: string) => {
    const value = variables[name] ?? '';
    return html ? escapeHtml(value) : value;
  });

interface SendRequest {
  settings: EmailSettings;
  to: string;
  subject: string;
  html: string;
  text: string | null;
}

export const sendViaSendGrid = async ({ settings, to, subject, html, text }: SendRequest): Promise<{ ok: boolean; status: number }> => {
  const content = [...(text ? [{ type: 'text/plain', value: text }] : []), { type: 'text/html', value: html }];
  const response = await fetch(SENDGRID_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${settings.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: settings.fromEmail, ...(settings.fromName ? { name: settings.fromName } : {}) },
      ...(settings.replyTo ? { reply_to: { email: settings.replyTo } } : {}),
      subject,
      content,
    }),
  });
  return { ok: response.ok, status: response.status };
};

export type SendResult = { sent: true } | { sent: false; reason: 'not_configured' | 'template_unavailable' | 'opted_out' | 'provider_error' };

// Sends a stored template. Non-transactional categories respect the user's notification preferences.
export const sendTemplatedEmail = async (input: {
  templateKey: string;
  to: string;
  variables?: Record<string, string>;
  userId?: string | null;
}): Promise<SendResult> => {
  const db = getServiceClient();
  const settings = await loadEmailSettings().catch(() => null);
  if (!settings) return { sent: false, reason: 'not_configured' };

  const { data: template } = await db.from('email_templates')
    .select('key, category, subject, html_body, text_body, enabled')
    .eq('key', input.templateKey)
    .maybeSingle();
  if (!template || !template.enabled) return { sent: false, reason: 'template_unavailable' };

  const log = (status: 'queued' | 'failed' | 'suppressed', errorCode?: string) =>
    db.from('notification_events').insert({
      user_id: input.userId ?? null,
      channel: 'email',
      notification_type: template.key,
      provider: 'sendgrid',
      status,
      attempt_count: status === 'suppressed' ? 0 : 1,
      error_code: errorCode ?? null,
    });

  const column = PREFERENCE_COLUMN[template.category as EmailCategory];
  if (column && input.userId) {
    const { data: preferences } = await db.from('notification_preferences')
      .select(column)
      .eq('user_id', input.userId)
      .maybeSingle();
    const value = (preferences as Record<string, unknown> | null)?.[column];
    const allowed = typeof value === 'boolean' ? value : PREFERENCE_DEFAULT[column];
    if (!allowed) {
      await log('suppressed');
      return { sent: false, reason: 'opted_out' };
    }
  }

  const variables = input.variables ?? {};
  try {
    const result = await sendViaSendGrid({
      settings,
      to: input.to,
      subject: renderTemplateText(template.subject, variables, false),
      html: renderTemplateText(template.html_body, variables, true),
      text: template.text_body ? renderTemplateText(template.text_body, variables, false) : null,
    });
    await log(result.ok ? 'queued' : 'failed', result.ok ? undefined : `http_${result.status}`);
    return result.ok ? { sent: true } : { sent: false, reason: 'provider_error' };
  } catch {
    await log('failed', 'network_error');
    return { sent: false, reason: 'provider_error' };
  }
};
