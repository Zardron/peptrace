-- Stripe connection settings managed from the admin portal. Secrets are
-- encrypted by the API before they are stored. Service role access only.

create table if not exists public.billing_settings (
  id boolean primary key default true check (id),
  provider text not null default 'stripe',
  publishable_key text,
  secret_key_encrypted text,
  webhook_secret_encrypted text,
  member_price_id text,
  gold_price_id text,
  updated_by uuid references public.admin_users (id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.billing_settings enable row level security;
revoke all on public.billing_settings from public, anon, authenticated;
