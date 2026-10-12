-- SendGrid settings and editable email templates managed from the admin portal.
-- The API key is encrypted by the API before it is stored. Service role only.

create table if not exists public.email_settings (
  id boolean primary key default true check (id),
  provider text not null default 'sendgrid',
  api_key_encrypted text,
  from_email text,
  from_name text,
  reply_to_email text,
  updated_by uuid references public.admin_users (id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z0-9_]{2,60}$'),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  category text not null default 'transactional'
    check (category in ('transactional', 'test_results', 'shipment_updates', 'rankings', 'marketing')),
  subject text not null check (char_length(btrim(subject)) between 1 and 200),
  html_body text not null check (char_length(html_body) <= 100000),
  text_body text check (text_body is null or char_length(text_body) <= 100000),
  enabled boolean not null default true,
  is_system boolean not null default false,
  updated_by uuid references public.admin_users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.email_settings enable row level security;
alter table public.email_templates enable row level security;
revoke all on public.email_settings from public, anon, authenticated;
revoke all on public.email_templates from public, anon, authenticated;

insert into public.email_templates (key, name, category, subject, html_body, text_body, is_system) values
  ('password_reset', 'Password reset', 'transactional', 'Reset your PepTrace password',
   '<p>Hi {{name}},</p><p>We received a request to reset your password. <a href="{{resetUrl}}">Choose a new password</a>. The link expires in {{expiresIn}}.</p><p>If you did not request this, you can ignore this email.</p>',
   E'Hi {{name}},\n\nReset your password: {{resetUrl}}\nThe link expires in {{expiresIn}}.\n\nIf you did not request this, ignore this email.', true),
  ('email_verification', 'Email verification code', 'transactional', 'Your PepTrace verification code',
   '<p>Hi {{name}},</p><p>Your verification code is <strong style="font-size:20px">{{code}}</strong>. It expires in {{expiresIn}}.</p>',
   E'Hi {{name}},\n\nYour verification code is {{code}}. It expires in {{expiresIn}}.', true),
  ('welcome', 'Welcome', 'transactional', 'Welcome to PepTrace',
   '<p>Hi {{name}},</p><p>Welcome to PepTrace. Your account is ready.</p><p><a href="{{siteUrl}}">Open PepTrace</a></p>',
   E'Hi {{name}},\n\nWelcome to PepTrace. Your account is ready: {{siteUrl}}', true),
  ('test_results_ready', 'Test results ready', 'test_results', 'Your PepTrace test results are ready',
   '<p>Hi {{name}},</p><p>Results for shipment {{trackingId}} are ready. <a href="{{shipmentUrl}}">View results</a>.</p>',
   E'Hi {{name}},\n\nResults for shipment {{trackingId}} are ready: {{shipmentUrl}}', true),
  ('shipment_update', 'Shipment status update', 'shipment_updates', 'Update on shipment {{trackingId}}',
   '<p>Hi {{name}},</p><p>Shipment {{trackingId}} is now <strong>{{status}}</strong>. <a href="{{shipmentUrl}}">Track it</a>.</p>',
   E'Hi {{name}},\n\nShipment {{trackingId}} is now {{status}}: {{shipmentUrl}}', true)
on conflict (key) do nothing;
