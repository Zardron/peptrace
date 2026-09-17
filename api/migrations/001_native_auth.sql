-- Native email/password auth (no Supabase Auth).
--
-- Apply with the Supabase SQL editor on the Peptrace project, or via
-- `supabase db push` if migrations are wired up later.
--
-- Password hashes live in `native_credentials`, which has RLS enabled and no
-- policies, so anon/authenticated clients cannot read it. The API accesses it
-- with the service-role key (SUPABASE_SECRET_KEY) only.

-- user_accounts.id mirrors auth.users.id for Supabase Auth users. Native
-- accounts generate their own UUIDs, so the FK to auth.users must go.
alter table public.user_accounts
  drop constraint if exists user_accounts_id_fkey;

create table if not exists public.native_credentials (
  account_id uuid not null references public.user_accounts (id) on delete cascade,
  email text not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (account_id)
);

-- Emails are stored lowercased; this enforces case-insensitive uniqueness.
create unique index if not exists native_credentials_email_key
  on public.native_credentials (email);

alter table public.native_credentials enable row level security;
-- Intentionally no policies: only the service role (the API) may read/write.
