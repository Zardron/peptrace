-- Durable, retryable account-deletion preparation. Database deletion happens
-- transactionally; external auth and private storage cleanup use the retained
-- manifest and can be retried without restoring personal data.

alter table public.account_deletion_requests
  add column if not exists cleanup_manifest jsonb not null default '{}'::jsonb,
  add column if not exists cleanup_attempts integer not null default 0 check (cleanup_attempts >= 0);

create or replace function public.prepare_account_deletion(deletion_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
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
    set status = 'processing',
        cleanup_attempts = cleanup_attempts + 1,
        failure_code = null,
        updated_at = now()
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
        select provider_subject
        from public.account_identity_links
        where account_id = deletion_request.user_id and provider = 'supabase'
        union
        select id::text from auth.users where id = deletion_request.user_id
      ) auth_subjects
    ), '[]'::jsonb),
    'profilePhotos', coalesce((
      select jsonb_agg(avatar_url)
      from public.user_profiles
      where account_id = deletion_request.user_id and avatar_url is not null and avatar_url <> ''
    ), '[]'::jsonb),
    'formUploads', coalesce((
      select jsonb_agg(path)
      from (
        select batch_proof_url as path from public.shipment_samples ss
        join public.shipments s on s.id = ss.shipment_id
        where s.account_id = deletion_request.user_id and batch_proof_url is not null
        union all
        select coa_file_url from public.shipment_samples ss
        join public.shipments s on s.id = ss.shipment_id
        where s.account_id = deletion_request.user_id and coa_file_url is not null
        union all
        select proof_file_url from public.shipment_samples ss
        join public.shipments s on s.id = ss.shipment_id
        where s.account_id = deletion_request.user_id and proof_file_url is not null
      ) files
    ), '[]'::jsonb),
    'dataExports', coalesce((
      select jsonb_agg(storage_path)
      from public.data_export_requests
      where user_id = deletion_request.user_id and storage_path is not null
    ), '[]'::jsonb)
  ) into manifest;

  update public.account_deletion_requests
  set status = 'processing',
      cleanup_manifest = manifest,
      cleanup_attempts = cleanup_attempts + 1,
      failure_code = null,
      updated_at = now()
  where id = deletion_request_id;

  delete from public.user_accounts where id = deletion_request.user_id;
  return manifest;
end;
$$;

revoke all on function public.prepare_account_deletion(uuid) from public, anon, authenticated;
grant execute on function public.prepare_account_deletion(uuid) to service_role;
