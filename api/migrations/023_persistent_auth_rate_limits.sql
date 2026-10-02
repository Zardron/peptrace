-- Authentication throttles must survive process restarts and work across API
-- replicas. Browser roles have no access; the API service role consumes this
-- atomic function before credential verification.

create table if not exists public.security_rate_limits (
  scope text not null check (scope ~ '^[a-z0-9:_-]{1,80}$'),
  key_hash text not null check (char_length(key_hash) between 32 and 128),
  window_started_at timestamptz not null default clock_timestamp(),
  attempt_count integer not null default 1 check (attempt_count >= 1),
  updated_at timestamptz not null default clock_timestamp(),
  primary key (scope, key_hash)
);

create index if not exists security_rate_limits_updated_idx
  on public.security_rate_limits (updated_at);

alter table public.security_rate_limits enable row level security;
revoke all on table public.security_rate_limits from public, anon, authenticated;

create or replace function public.consume_security_rate_limit(
  p_scope text,
  p_key_hash text,
  p_window_seconds integer,
  p_max_attempts integer
)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  observed_count integer;
  observed_start timestamptz;
  observed_now timestamptz := clock_timestamp();
begin
  if p_scope is null or p_scope !~ '^[a-z0-9:_-]{1,80}$'
     or p_key_hash is null or char_length(p_key_hash) not between 32 and 128
     or p_window_seconds not between 1 and 86400
     or p_max_attempts not between 1 and 10000 then
    raise exception 'Invalid rate-limit parameters' using errcode = '22023';
  end if;

  -- Bounded opportunistic retention keeps attacker-created keys from growing
  -- forever without turning an authentication request into an unbounded scan.
  delete from public.security_rate_limits
  where (scope, key_hash) in (
    select scope, key_hash
    from public.security_rate_limits
    where updated_at < observed_now - interval '1 day'
    order by updated_at
    limit 100
  );

  insert into public.security_rate_limits (
    scope, key_hash, window_started_at, attempt_count, updated_at
  ) values (
    p_scope, p_key_hash, observed_now, 1, observed_now
  )
  on conflict (scope, key_hash) do update set
    window_started_at = case
      when security_rate_limits.window_started_at + make_interval(secs => p_window_seconds) <= observed_now
        then observed_now
      else security_rate_limits.window_started_at
    end,
    attempt_count = case
      when security_rate_limits.window_started_at + make_interval(secs => p_window_seconds) <= observed_now
        then 1
      else least(security_rate_limits.attempt_count + 1, p_max_attempts + 1)
    end,
    updated_at = observed_now
  returning attempt_count, window_started_at
    into observed_count, observed_start;

  allowed := observed_count <= p_max_attempts;
  retry_after_seconds := case
    when allowed then 0
    else greatest(1, ceil(extract(epoch from (
      observed_start + make_interval(secs => p_window_seconds) - observed_now
    )))::integer)
  end;
  return next;
end;
$$;

revoke all on function public.consume_security_rate_limit(text, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_security_rate_limit(text, text, integer, integer)
  to service_role;
