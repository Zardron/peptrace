-- Reconcile the two authentication paths onto one logical PepTrace account.
--
-- The legacy implementation could create one user_accounts row for a
-- Supabase identity and another row for native credentials with the same
-- email. This migration only auto-reconciles the unambiguous case: exactly
-- two rows, one native identity and one Supabase identity. Any other shape
-- aborts for manual review instead of guessing.

create table if not exists public.account_identity_links (
  provider text not null,
  provider_subject text not null,
  account_id uuid not null references public.user_accounts (id) on delete cascade,
  linked_at timestamptz not null default now(),
  primary key (provider, provider_subject)
);

create index if not exists account_identity_links_account_idx
  on public.account_identity_links (account_id);

create table if not exists public.account_merge_archive (
  id uuid primary key default gen_random_uuid(),
  canonical_account_id uuid not null references public.user_accounts (id) on delete cascade,
  merged_account_id uuid not null,
  normalized_email_hash text not null,
  merged_profile jsonb,
  reason text not null,
  merged_at timestamptz not null default now(),
  unique (merged_account_id)
);

alter table public.account_identity_links enable row level security;
alter table public.account_merge_archive enable row level security;

drop trigger if exists account_merge_archive_immutable on public.account_merge_archive;
create trigger account_merge_archive_immutable
  before update or delete on public.account_merge_archive
  for each row execute function public.reject_immutable_record_change();

create or replace function public.merge_user_accounts(
  canonical_id uuid,
  duplicate_id uuid,
  merge_reason text
)
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  canonical_email text;
  duplicate_email text;
  duplicate_is_supabase boolean;
  canonical_has_native boolean;
  duplicate_has_native boolean;
begin
  if canonical_id = duplicate_id then
    raise exception 'Canonical and duplicate account must differ';
  end if;

  select lower(email) into canonical_email
  from public.user_accounts where id = canonical_id for update;
  select lower(email) into duplicate_email
  from public.user_accounts where id = duplicate_id for update;
  if canonical_email is null or duplicate_email is null then
    raise exception 'Both accounts must exist';
  end if;
  if canonical_email <> duplicate_email then
    raise exception 'Accounts must have the same normalized email';
  end if;

  select exists(select 1 from public.native_credentials where account_id = canonical_id)
    into canonical_has_native;
  select exists(select 1 from public.native_credentials where account_id = duplicate_id)
    into duplicate_has_native;
  if canonical_has_native and duplicate_has_native then
    raise exception 'Both accounts have native credentials; manual review required';
  end if;

  select exists(select 1 from auth.users where id = duplicate_id)
    into duplicate_is_supabase;

  insert into public.account_merge_archive (
    canonical_account_id,
    merged_account_id,
    normalized_email_hash,
    merged_profile,
    reason
  )
  select
    canonical_id,
    duplicate_id,
    encode(extensions.digest(canonical_email, 'sha256'), 'hex'),
    to_jsonb(profile),
    merge_reason
  from (select * from public.user_profiles where account_id = duplicate_id) profile
  on conflict (merged_account_id) do nothing;

  if not found then
    insert into public.account_merge_archive (
      canonical_account_id,
      merged_account_id,
      normalized_email_hash,
      merged_profile,
      reason
    ) values (
      canonical_id,
      duplicate_id,
      encode(extensions.digest(canonical_email, 'sha256'), 'hex'),
      null,
      merge_reason
    ) on conflict (merged_account_id) do nothing;
  end if;

  update public.shipments set account_id = canonical_id where account_id = duplicate_id;
  update public.shipping_addresses set account_id = canonical_id where account_id = duplicate_id;

  if duplicate_has_native then
    update public.native_credentials set account_id = canonical_id where account_id = duplicate_id;
  end if;

  if duplicate_is_supabase then
    insert into public.account_identity_links (provider, provider_subject, account_id)
    values ('supabase', duplicate_id::text, canonical_id)
    on conflict (provider, provider_subject) do update set account_id = excluded.account_id;
  end if;

  delete from public.user_accounts where id = duplicate_id;
end;
$$;

revoke all on function public.merge_user_accounts(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.merge_user_accounts(uuid, uuid, text) to service_role;

do $$
declare
  duplicate_group record;
  native_id uuid;
  supabase_id uuid;
  native_count integer;
  supabase_count integer;
begin
  for duplicate_group in
    select lower(email) as normalized_email, count(*)::integer as account_count
    from public.user_accounts
    group by lower(email)
    having count(*) > 1
  loop
    select count(*)::integer, (array_agg(ua.id order by ua.created_at))[1]
      into native_count, native_id
    from public.user_accounts ua
    join public.native_credentials nc on nc.account_id = ua.id
    where lower(ua.email) = duplicate_group.normalized_email;

    select count(*)::integer, (array_agg(ua.id order by ua.created_at))[1]
      into supabase_count, supabase_id
    from public.user_accounts ua
    join auth.users au on au.id = ua.id
    where lower(ua.email) = duplicate_group.normalized_email;

    if duplicate_group.account_count <> 2 or native_count <> 1 or supabase_count <> 1 or native_id = supabase_id then
      raise exception 'Ambiguous duplicate account group requires manual review (email hash: %)',
        encode(extensions.digest(duplicate_group.normalized_email, 'sha256'), 'hex');
    end if;

    perform public.merge_user_accounts(
      native_id,
      supabase_id,
      'Automated reconciliation of legacy native and Supabase identities'
    );
  end loop;
end $$;

create unique index if not exists user_accounts_normalized_email_key
  on public.user_accounts (lower(email));
create unique index if not exists native_credentials_normalized_email_key
  on public.native_credentials (lower(email));

create or replace function public.register_native_account(
  normalized_email text,
  credential_hash text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  account_id uuid := gen_random_uuid();
begin
  if normalized_email is null or normalized_email <> lower(btrim(normalized_email)) then
    raise exception 'Email must be normalized';
  end if;
  if exists(select 1 from public.user_accounts where lower(email) = normalized_email) then
    raise exception 'Account already exists' using errcode = '23505';
  end if;

  insert into public.user_accounts (id, email) values (account_id, normalized_email);
  insert into public.native_credentials (account_id, email, password_hash)
    values (account_id, normalized_email, credential_hash);
  insert into public.user_profiles (account_id) values (account_id);
  return account_id;
end;
$$;

revoke all on function public.register_native_account(text, text) from public, anon, authenticated;
grant execute on function public.register_native_account(text, text) to service_role;
