-- Production-readiness safeguards for replayed shipment requests and scalable
-- Admin directory queries.

alter table public.shipments
  add column if not exists submission_id uuid;

create unique index if not exists shipments_account_submission_key
  on public.shipments (account_id, submission_id)
  where submission_id is not null;

create index if not exists shipments_created_idx on public.shipments (created_at desc);
create index if not exists shipments_status_created_idx on public.shipments (status, created_at desc);
create index if not exists user_accounts_created_idx on public.user_accounts (created_at desc);
create index if not exists subscriptions_updated_idx on public.subscriptions (updated_at desc);
create index if not exists user_consents_recorded_idx on public.user_consents (recorded_at desc);
create index if not exists data_exports_requested_idx on public.data_export_requests (requested_at desc);
create index if not exists account_deletions_requested_idx on public.account_deletion_requests (requested_at desc);
create index if not exists support_requests_created_idx on public.support_requests (created_at desc);

create extension if not exists pg_trgm with schema extensions;
create index if not exists user_accounts_email_trgm_idx
  on public.user_accounts using gin (email extensions.gin_trgm_ops);
create index if not exists shipments_tracking_trgm_idx
  on public.shipments using gin (tracking_id extensions.gin_trgm_ops);

create or replace view public.admin_user_directory
with (security_invoker = true)
as
select
  accounts.id,
  accounts.email,
  accounts.created_at,
  accounts.last_sign_in_at,
  profiles.full_name,
  profiles.role,
  profiles.updated_at as profile_updated_at,
  coalesce(states.status, 'active') as account_status,
  case when coalesce(states.status, 'active') = 'active' then 'active' else 'inactive' end as status,
  states.reason as status_reason,
  states.updated_at as state_updated_at
from public.user_accounts accounts
left join public.user_profiles profiles on profiles.account_id = accounts.id
left join public.account_admin_state states on states.account_id = accounts.id;

revoke all on public.admin_user_directory from public, anon, authenticated;
grant select on public.admin_user_directory to service_role;

create or replace function public.create_shipment_with_samples(
  owner_id uuid,
  newsletter boolean,
  samples jsonb,
  request_key uuid,
  consent_policy_version text,
  consent_subject_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  created_shipment_id uuid;
  tracking_code text;
  created_sample_ids jsonb;
  was_replayed boolean := false;
begin
  if not exists(select 1 from public.user_accounts where id = owner_id) then
    raise exception 'Account does not exist' using errcode = '23503';
  end if;
  if request_key is null then
    raise exception 'Request key is required' using errcode = '22023';
  end if;
  if nullif(trim(consent_policy_version), '') is null
     or nullif(trim(consent_subject_hash), '') is null then
    raise exception 'Consent metadata is required' using errcode = '22023';
  end if;
  if jsonb_typeof(samples) <> 'array'
     or jsonb_array_length(samples) < 1
     or jsonb_array_length(samples) > 20 then
    raise exception 'Samples must contain 1-20 items' using errcode = '22023';
  end if;

  loop
    tracking_code := 'PT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
    begin
      insert into public.shipments (
        account_id, tracking_id, status, newsletter_opt_in, submission_id
      ) values (
        owner_id, tracking_code, 'submitted', coalesce(newsletter, false), request_key
      )
      on conflict (account_id, submission_id) where submission_id is not null do nothing
      returning id into created_shipment_id;
      exit;
    exception when unique_violation then
      -- Retry an extraordinarily unlikely tracking-code collision.
    end;
  end loop;

  if created_shipment_id is null then
    was_replayed := true;
    select existing.id, existing.tracking_id
      into created_shipment_id, tracking_code
    from public.shipments existing
    where existing.account_id = owner_id and existing.submission_id = request_key;

    select coalesce(jsonb_agg(existing.id order by existing.created_at), '[]'::jsonb)
      into created_sample_ids
    from public.shipment_samples existing
    where existing.shipment_id = created_shipment_id;
  else
    with inserted as (
      insert into public.shipment_samples (
        shipment_id, peptide_id, vendor_id, vendor_name, form_factor, batch_id,
        batch_proof_url, quantity_mg, lab, addons, vendor_provided_coa, coa_when,
        coa_other_text, coa_match, coa_url, coa_file_url, proof_file_url, order_id,
        order_date, num_vials, price_per_vial, price_currency, sample_price
      )
      select
        created_shipment_id, record.peptide_id, record.vendor_id, record.vendor_name,
        record.form_factor, record.batch_id, record.batch_proof_url,
        record.quantity_mg, record.lab, coalesce(record.addons, '[]'::jsonb),
        record.vendor_provided_coa, record.coa_when, record.coa_other_text,
        record.coa_match, record.coa_url, record.coa_file_url,
        record.proof_file_url, record.order_id, record.order_date,
        record.num_vials, record.price_per_vial, record.price_currency,
        record.sample_price
      from jsonb_to_recordset(samples) as record(
        peptide_id uuid, vendor_id uuid, vendor_name text, form_factor text,
        batch_id text, batch_proof_url text, quantity_mg numeric, lab text,
        addons jsonb, vendor_provided_coa boolean, coa_when text,
        coa_other_text text, coa_match boolean, coa_url text,
        coa_file_url text, proof_file_url text, order_id text, order_date text,
        num_vials integer, price_per_vial numeric, price_currency text,
        sample_price numeric
      )
      returning id, created_at
    )
    select coalesce(jsonb_agg(id order by created_at), '[]'::jsonb)
      into created_sample_ids from inserted;

    insert into public.user_consents (
      user_id, subject_hash, consent_type, policy_version, accepted, source, request_id
    ) values (
      owner_id, consent_subject_hash, 'terms', consent_policy_version, true,
      'shipment_registration', request_key::text
    );
    if newsletter then
      insert into public.user_consents (
        user_id, subject_hash, consent_type, policy_version, accepted, source, request_id
      ) values (
        owner_id, consent_subject_hash, 'marketing', consent_policy_version, true,
        'shipment_registration', request_key::text
      );
    end if;
  end if;

  return jsonb_build_object(
    'id', created_shipment_id,
    'trackingId', tracking_code,
    'sampleIds', created_sample_ids,
    'replayed', was_replayed
  );
end;
$$;

revoke all on function public.create_shipment_with_samples(uuid, boolean, jsonb, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.create_shipment_with_samples(uuid, boolean, jsonb, uuid, text, text)
  to service_role;
