-- Inventory every API-created private object. This both bounds authenticated
-- storage consumption and lets privacy deletion remove abandoned uploads that
-- were never attached to a shipment or profile record.

create table if not exists public.user_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_accounts (id) on delete cascade,
  bucket_id text not null check (bucket_id in ('profile_photos', 'form-uploads', 'data-exports')),
  object_path text not null,
  upload_type text,
  content_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 5242880),
  created_at timestamptz not null default now(),
  unique (bucket_id, object_path)
);

create index if not exists user_uploads_user_created_idx
  on public.user_uploads (user_id, created_at desc);

alter table public.user_uploads enable row level security;
revoke all on table public.user_uploads from public, anon, authenticated;

create or replace function public.enforce_user_upload_quota()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  object_count bigint;
  total_bytes bigint;
begin
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));
  select count(*), coalesce(sum(size_bytes), 0)
    into object_count, total_bytes
  from public.user_uploads
  where user_id = new.user_id;

  if object_count >= 50 or total_bytes + new.size_bytes > 104857600 then
    raise exception 'Private upload quota exceeded' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists user_upload_quota on public.user_uploads;
create trigger user_upload_quota
  before insert on public.user_uploads
  for each row execute function public.enforce_user_upload_quota();

revoke all on function public.enforce_user_upload_quota() from public, anon, authenticated;

-- Backfill existing objects whose first path component is a current account.
insert into public.user_uploads (user_id, bucket_id, object_path, upload_type, content_type, size_bytes, created_at)
select
  split_part(o.name, '/', 1)::uuid,
  o.bucket_id,
  o.name,
  case when o.bucket_id = 'form-uploads' then split_part(o.name, '/', 2) else null end,
  coalesce(o.metadata->>'mimetype', case o.bucket_id when 'data-exports' then 'application/json' else 'application/octet-stream' end),
  greatest(1, least(5242880, case
    when coalesce(o.metadata->>'size', '') ~ '^[0-9]+$' then (o.metadata->>'size')::bigint
    else 1
  end)),
  coalesce(o.created_at, now())
from storage.objects o
join public.user_accounts a on a.id::text = split_part(o.name, '/', 1)
where o.bucket_id in ('profile_photos', 'form-uploads', 'data-exports')
  and split_part(o.name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
on conflict (bucket_id, object_path) do nothing;

create or replace function public.prepare_account_deletion(deletion_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  deletion_request public.account_deletion_requests%rowtype;
  manifest jsonb;
begin
  select * into deletion_request
  from public.account_deletion_requests
  where id = deletion_request_id
  for update;

  if not found then
    raise exception 'Deletion request does not exist' using errcode = 'P0002';
  end if;

  if deletion_request.user_id is null then
    if deletion_request.cleanup_manifest = '{}'::jsonb then
      raise exception 'Deletion request has no cleanup manifest' using errcode = '22023';
    end if;
    update public.account_deletion_requests
    set status = 'processing', cleanup_attempts = cleanup_attempts + 1,
        failure_code = null, updated_at = now()
    where id = deletion_request_id;
    return deletion_request.cleanup_manifest;
  end if;

  if deletion_request.status not in ('scheduled', 'failed') then
    raise exception 'Deletion request is not executable' using errcode = '22023';
  end if;
  if deletion_request.scheduled_for is null or deletion_request.scheduled_for > now() then
    raise exception 'Deletion request is not due' using errcode = '22023';
  end if;

  select jsonb_build_object(
    'authSubjects', coalesce((
      select jsonb_agg(provider_subject)
      from (
        select provider_subject from public.account_identity_links
        where account_id = deletion_request.user_id and provider = 'supabase'
        union
        select id::text from auth.users where id = deletion_request.user_id
      ) auth_subjects
    ), '[]'::jsonb),
    'profilePhotos', coalesce((
      select jsonb_agg(name) from storage.objects
      where bucket_id = 'profile_photos'
        and name like deletion_request.user_id::text || '/%'
    ), '[]'::jsonb),
    'formUploads', coalesce((
      select jsonb_agg(name) from storage.objects
      where bucket_id = 'form-uploads'
        and name like deletion_request.user_id::text || '/%'
    ), '[]'::jsonb),
    'dataExports', coalesce((
      select jsonb_agg(name) from storage.objects
      where bucket_id = 'data-exports'
        and name like deletion_request.user_id::text || '/%'
    ), '[]'::jsonb)
  ) into manifest;

  update public.account_deletion_requests
  set status = 'processing', cleanup_manifest = manifest,
      cleanup_attempts = cleanup_attempts + 1, failure_code = null,
      updated_at = now()
  where id = deletion_request_id;

  delete from public.user_accounts where id = deletion_request.user_id;
  return manifest;
end;
$$;

revoke all on function public.prepare_account_deletion(uuid) from public, anon, authenticated;
grant execute on function public.prepare_account_deletion(uuid) to service_role;
