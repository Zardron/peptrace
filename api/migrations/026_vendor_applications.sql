-- Vendor registration requests submitted from the public /vendor-signup page
-- and reviewed by catalog administrators.

create table if not exists public.vendor_applications (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email = lower(btrim(email)) and length(email) <= 254),
  vendor_name text not null check (length(btrim(vendor_name)) between 1 and 120),
  website_url text check (website_url is null or length(website_url) <= 500),
  distributes_commercially boolean not null,
  situation text not null check (situation in ('new', 'selling-unlisted', 'selling-listed')),
  batch_identifiers text check (batch_identifiers in ('all', 'some', 'no')),
  premium_interest boolean not null default false,
  status text not null default 'new' check (status in ('new', 'contacted', 'approved', 'rejected')),
  admin_note text check (admin_note is null or length(admin_note) <= 2000),
  vendor_id uuid references public.vendors (id) on delete set null,
  ip_hash text,
  reviewed_by uuid references public.admin_users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vendor_applications_status_created_idx
  on public.vendor_applications (status, created_at desc);

alter table public.vendor_applications enable row level security;
revoke all on public.vendor_applications from anon, authenticated;
