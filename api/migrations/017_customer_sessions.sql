-- Opaque, revocable customer sessions. Browser clients receive only an
-- HttpOnly cookie; provider/native credentials never live in localStorage.

create table if not exists public.customer_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_accounts (id) on delete cascade,
  token_hash text not null unique,
  source text not null check (source in ('native', 'supabase')),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  last_seen_at timestamptz not null default now(),
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists customer_sessions_user_active_idx
  on public.customer_sessions (user_id, expires_at desc)
  where revoked_at is null;

create index if not exists customer_sessions_expiry_idx
  on public.customer_sessions (expires_at)
  where revoked_at is null;

alter table public.customer_sessions enable row level security;

revoke all on table public.customer_sessions from public, anon, authenticated;
