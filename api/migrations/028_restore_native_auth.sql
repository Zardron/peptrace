-- Restore native email/password auth alongside Supabase (Google) sessions.

alter table public.customer_sessions
  drop constraint if exists customer_sessions_source_check;
alter table public.customer_sessions
  add constraint customer_sessions_source_check check (source in ('native', 'supabase'));

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
