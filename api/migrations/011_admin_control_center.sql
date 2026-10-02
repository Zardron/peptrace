-- Secure operational control-center schema for PepTrace.
--
-- This migration is intentionally additive. Existing account, shipment,
-- catalog, and test-result tables remain the source of truth. All tables
-- below have RLS enabled with no browser-facing policies; only the server's
-- service role may access them.

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  password_hash text not null,
  display_name text not null,
  role text not null check (role in (
    'super_admin',
    'support_admin',
    'billing_admin',
    'content_admin',
    'analyst'
  )),
  is_active boolean not null default true,
  failed_login_count integer not null default 0 check (failed_login_count >= 0),
  locked_until timestamptz,
  last_login_at timestamptz,
  password_changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (email = lower(btrim(email)))
);

create unique index if not exists admin_users_email_key
  on public.admin_users (lower(email));
create index if not exists admin_users_active_role_idx
  on public.admin_users (is_active, role);

create table if not exists public.admin_sessions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.admin_users (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  last_seen_at timestamptz not null default now(),
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists admin_sessions_user_expiry_idx
  on public.admin_sessions (admin_user_id, expires_at desc);
create index if not exists admin_sessions_active_idx
  on public.admin_sessions (expires_at)
  where revoked_at is null;

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.admin_users (id) on delete set null,
  actor_email text,
  action text not null,
  target_type text,
  target_id text,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  request_id text,
  ip_hash text,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_created_idx
  on public.admin_audit_log (created_at desc);
create index if not exists admin_audit_actor_created_idx
  on public.admin_audit_log (actor_id, created_at desc);
create index if not exists admin_audit_target_created_idx
  on public.admin_audit_log (target_type, target_id, created_at desc);
create index if not exists admin_audit_action_created_idx
  on public.admin_audit_log (action, created_at desc);

create table if not exists public.account_admin_state (
  account_id uuid primary key references public.user_accounts (id) on delete cascade,
  status text not null default 'active' check (status in (
    'active', 'suspended', 'deletion_pending', 'deleted'
  )),
  reason text,
  changed_by uuid references public.admin_users (id) on delete set null,
  suspended_at timestamptz,
  restored_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists account_admin_state_status_idx
  on public.account_admin_state (status, updated_at desc);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.user_accounts (id) on delete set null,
  subject_hash text not null,
  provider text not null,
  provider_customer_id text,
  provider_subscription_id text,
  plan text not null,
  status text not null check (status in (
    'trialing', 'active', 'past_due', 'paused', 'canceled', 'expired', 'incomplete'
  )),
  trial_start timestamptz,
  trial_end timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  expires_at timestamptz,
  currency text,
  amount_cents integer check (amount_cents is null or amount_cents >= 0),
  last_webhook_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists subscriptions_provider_reference_key
  on public.subscriptions (provider, provider_subscription_id)
  where provider_subscription_id is not null;
create index if not exists subscriptions_user_status_idx
  on public.subscriptions (user_id, status, updated_at desc);
create index if not exists subscriptions_status_period_idx
  on public.subscriptions (status, current_period_end);

create table if not exists public.billing_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  payload_hash text not null,
  status text not null default 'received' check (status in (
    'received', 'processing', 'processed', 'ignored', 'failed'
  )),
  attempts integer not null default 0 check (attempts >= 0),
  error_code text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

create index if not exists billing_webhooks_status_created_idx
  on public.billing_webhook_events (status, created_at desc);

create table if not exists public.notification_preferences (
  user_id uuid primary key references public.user_accounts (id) on delete cascade,
  email_test_results boolean not null default true,
  email_shipment_updates boolean not null default true,
  email_rankings boolean not null default false,
  email_marketing boolean not null default false,
  push_test_results boolean not null default false,
  push_shipment_updates boolean not null default false,
  push_marketing boolean not null default false,
  frequency text not null default 'instant' check (frequency in ('instant', 'daily', 'weekly')),
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.user_accounts (id) on delete set null,
  channel text not null check (channel in ('email', 'push', 'in_app')),
  notification_type text not null,
  provider text,
  provider_reference text,
  status text not null check (status in (
    'requested', 'queued', 'delivered', 'failed', 'retrying', 'suppressed'
  )),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  error_code text,
  requested_at timestamptz not null default now(),
  delivered_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists notification_events_status_requested_idx
  on public.notification_events (status, requested_at desc);
create index if not exists notification_events_user_requested_idx
  on public.notification_events (user_id, requested_at desc);

create table if not exists public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.user_accounts (id) on delete set null,
  subject_hash text not null,
  consent_type text not null check (consent_type in (
    'privacy_policy', 'terms', 'ai_processing', 'marketing', 'analytics'
  )),
  policy_version text not null,
  accepted boolean not null,
  recorded_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  source text not null default 'account',
  request_id text
);

create index if not exists user_consents_user_type_recorded_idx
  on public.user_consents (user_id, consent_type, recorded_at desc);
create index if not exists user_consents_subject_type_recorded_idx
  on public.user_consents (subject_hash, consent_type, recorded_at desc);

create table if not exists public.data_export_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.user_accounts (id) on delete set null,
  subject_hash text not null,
  status text not null default 'requested' check (status in (
    'requested', 'processing', 'complete', 'failed', 'expired'
  )),
  storage_path text,
  expires_at timestamptz,
  error_code text,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists data_exports_user_requested_idx
  on public.data_export_requests (user_id, requested_at desc);
create index if not exists data_exports_status_requested_idx
  on public.data_export_requests (status, requested_at);

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.user_accounts (id) on delete set null,
  subject_hash text not null,
  status text not null default 'requested' check (status in (
    'requested', 'scheduled', 'processing', 'completed', 'canceled', 'failed'
  )),
  reason text,
  requested_at timestamptz not null default now(),
  scheduled_for timestamptz,
  completed_at timestamptz,
  canceled_at timestamptz,
  failure_code text,
  updated_at timestamptz not null default now()
);

create unique index if not exists account_deletion_one_active_request
  on public.account_deletion_requests (user_id)
  where user_id is not null and status in ('requested', 'scheduled', 'processing');
create index if not exists account_deletion_status_schedule_idx
  on public.account_deletion_requests (status, scheduled_for);

create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.user_accounts (id) on delete set null,
  subject_hash text,
  contact_email text,
  category text not null,
  subject text not null,
  message text not null,
  status text not null default 'open' check (status in ('open', 'pending', 'resolved', 'closed')),
  assigned_admin_id uuid references public.admin_users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists support_requests_status_created_idx
  on public.support_requests (status, created_at desc);
create index if not exists support_requests_assignee_status_idx
  on public.support_requests (assigned_admin_id, status, updated_at desc);

create table if not exists public.support_internal_notes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.support_requests (id) on delete cascade,
  admin_id uuid references public.admin_users (id) on delete set null,
  note text not null,
  created_at timestamptz not null default now()
);

create index if not exists support_notes_request_created_idx
  on public.support_internal_notes (request_id, created_at);

create table if not exists public.system_events (
  id uuid primary key default gen_random_uuid(),
  service text not null,
  event_type text not null,
  severity text not null check (severity in ('info', 'warning', 'error', 'critical')),
  status text not null default 'open' check (status in ('open', 'resolved')),
  correlation_id text,
  error_code text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists system_events_status_severity_occurred_idx
  on public.system_events (status, severity, occurred_at desc);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'admin_users',
    'admin_sessions',
    'admin_audit_log',
    'account_admin_state',
    'subscriptions',
    'billing_webhook_events',
    'notification_preferences',
    'notification_events',
    'user_consents',
    'data_export_requests',
    'account_deletion_requests',
    'support_requests',
    'support_internal_notes',
    'system_events'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end $$;

create or replace function public.reject_immutable_record_change()
returns trigger
language plpgsql
as $$
begin
  raise exception '% is immutable', tg_table_name using errcode = '55000';
end;
$$;

drop trigger if exists admin_audit_log_immutable on public.admin_audit_log;
create trigger admin_audit_log_immutable
  before update or delete on public.admin_audit_log
  for each row execute function public.reject_immutable_record_change();

drop trigger if exists user_consents_immutable on public.user_consents;
create trigger user_consents_immutable
  before update or delete on public.user_consents
  for each row execute function public.reject_immutable_record_change();

