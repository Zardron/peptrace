-- Admin-editable site copy (legal pages, membership plans, FAQ, methodology,
-- banners, footer). Rows only exist for blocks an admin has customised; the
-- API falls back to the built-in defaults for everything else.

create table if not exists public.site_content (
  key text primary key check (key ~ '^[a-z0-9][a-z0-9.-]{0,63}$'),
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.admin_users (id) on delete set null,
  updated_by_email text
);

alter table public.site_content enable row level security;
revoke all on public.site_content from anon, authenticated;
