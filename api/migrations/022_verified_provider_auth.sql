-- Retire the custom native-password path. Those accounts were created before
-- PepTrace required proof of email ownership. Existing account/profile data is
-- preserved and is reclaimed when the same address completes Supabase email
-- verification; only the unverified credential hashes and sessions are
-- removed.

update public.customer_sessions
set revoked_at = coalesce(revoked_at, now())
where source = 'native';

delete from public.native_credentials;

drop function if exists public.register_native_account(text, text);

alter table public.customer_sessions
  drop constraint if exists customer_sessions_source_check;
alter table public.customer_sessions
  add constraint customer_sessions_source_check check (source = 'supabase');

revoke all on table public.native_credentials from public, anon, authenticated;
revoke all on table public.customer_sessions from public, anon, authenticated;
