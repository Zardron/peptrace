-- Vendor applications are submitted through the authenticated Peptrace API.
-- The service role is the only database role allowed to access applications.

alter table public.vendors
  add column if not exists manager_user_id uuid
    references public.user_accounts (id) on delete set null;

create index if not exists vendors_manager_user_id_idx
  on public.vendors (manager_user_id) where manager_user_id is not null;

create table if not exists public.vendor_signup_application (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_accounts (id) on delete cascade,
  email text not null,
  distributes_peptides boolean not null,
  current_situation text not null
    check (current_situation in ('new', 'selling-unlisted', 'selling-listed')),
  vendor_name text not null check (char_length(vendor_name) between 2 and 120),
  batch_identifiers text
    check (batch_identifiers is null or batch_identifiers in ('all', 'some', 'no')),
  premium_opt_in boolean not null default false,
  terms_accepted boolean not null check (terms_accepted),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  vendor_id uuid references public.vendors (id) on delete set null,
  approved_by uuid references public.admin_users (id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vendor_signup_application_user_created_idx
  on public.vendor_signup_application (user_id, created_at desc);

create index if not exists vendor_signup_application_status_created_idx
  on public.vendor_signup_application (status, created_at desc);

alter table public.vendor_signup_application enable row level security;

create or replace function public.approve_vendor_signup_application(
  p_application_id uuid,
  p_admin_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  application_row public.vendor_signup_application%rowtype;
  created_vendor_id uuid;
  base_slug text;
  candidate_slug text;
  suffix integer := 2;
begin
  select * into application_row
  from public.vendor_signup_application
  where id = p_application_id
  for update;

  if not found then
    raise exception 'Vendor application not found' using errcode = 'P0002';
  end if;
  if application_row.status <> 'pending' then
    raise exception 'Vendor application is not pending' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.vendors
    where lower(name) = lower(application_row.vendor_name)
  ) then
    raise exception 'A vendor with this name already exists' using errcode = '23505';
  end if;

  base_slug := trim(both '-' from regexp_replace(lower(application_row.vendor_name), '[^a-z0-9]+', '-', 'g'));
  if base_slug = '' then
    base_slug := replace(gen_random_uuid()::text, '-', '');
  end if;
  candidate_slug := left(base_slug, 180);
  while exists (select 1 from public.vendors where slug = candidate_slug) loop
    candidate_slug := left(base_slug, 170) || '-' || suffix::text;
    suffix := suffix + 1;
  end loop;

  insert into public.vendors (id, name, slug, manager_user_id, is_demo)
  values (gen_random_uuid(), application_row.vendor_name, candidate_slug, application_row.user_id, false)
  returning id into created_vendor_id;

  update public.vendor_signup_application
  set status = 'approved',
      vendor_id = created_vendor_id,
      approved_by = p_admin_id,
      approved_at = now(),
      updated_at = now()
  where id = p_application_id;

  return created_vendor_id;
end;
$$;

revoke all on function public.approve_vendor_signup_application(uuid, uuid) from public, anon, authenticated;
grant execute on function public.approve_vendor_signup_application(uuid, uuid) to service_role;