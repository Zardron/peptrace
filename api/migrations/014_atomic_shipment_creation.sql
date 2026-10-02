-- Create a shipment and all of its samples in one database transaction.
-- This prevents an API interruption from leaving an empty shipment behind,
-- while the UUID-derived tracking ID and unique constraint make duplicate IDs
-- practically and structurally impossible.

create or replace function public.create_shipment_with_samples(
  owner_id uuid,
  newsletter boolean,
  samples jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  shipment_id uuid;
  tracking_code text;
  sample_ids jsonb;
begin
  if not exists(select 1 from public.user_accounts where id = owner_id) then
    raise exception 'Account does not exist' using errcode = '23503';
  end if;
  if jsonb_typeof(samples) <> 'array' or jsonb_array_length(samples) < 1 or jsonb_array_length(samples) > 20 then
    raise exception 'Samples must contain 1-20 items' using errcode = '22023';
  end if;

  loop
    tracking_code := 'PT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
    begin
      insert into public.shipments (account_id, tracking_id, status, newsletter_opt_in)
      values (owner_id, tracking_code, 'submitted', coalesce(newsletter, false))
      returning id into shipment_id;
      exit;
    exception when unique_violation then
      -- Generate a new code. This is bounded in practice by 48 random bits.
    end;
  end loop;

  with inserted as (
    insert into public.shipment_samples (
      shipment_id,
      peptide_id,
      vendor_id,
      vendor_name,
      form_factor,
      batch_id,
      batch_proof_url,
      quantity_mg,
      lab,
      addons,
      vendor_provided_coa,
      coa_when,
      coa_other_text,
      coa_match,
      coa_url,
      coa_file_url,
      proof_file_url,
      order_id,
      order_date,
      num_vials,
      price_per_vial,
      price_currency,
      sample_price
    )
    select
      shipment_id,
      record.peptide_id,
      record.vendor_id,
      record.vendor_name,
      record.form_factor,
      record.batch_id,
      record.batch_proof_url,
      record.quantity_mg,
      record.lab,
      coalesce(record.addons, '[]'::jsonb),
      record.vendor_provided_coa,
      record.coa_when,
      record.coa_other_text,
      record.coa_match,
      record.coa_url,
      record.coa_file_url,
      record.proof_file_url,
      record.order_id,
      record.order_date,
      record.num_vials,
      record.price_per_vial,
      record.price_currency,
      record.sample_price
    from jsonb_to_recordset(samples) as record(
      peptide_id uuid,
      vendor_id uuid,
      vendor_name text,
      form_factor text,
      batch_id text,
      batch_proof_url text,
      quantity_mg numeric,
      lab text,
      addons jsonb,
      vendor_provided_coa boolean,
      coa_when text,
      coa_other_text text,
      coa_match boolean,
      coa_url text,
      coa_file_url text,
      proof_file_url text,
      order_id text,
      order_date text,
      num_vials integer,
      price_per_vial numeric,
      price_currency text,
      sample_price numeric
    )
    returning id
  )
  select coalesce(jsonb_agg(id), '[]'::jsonb) into sample_ids from inserted;

  return jsonb_build_object(
    'id', shipment_id,
    'trackingId', tracking_code,
    'sampleIds', sample_ids
  );
end;
$$;

revoke all on function public.create_shipment_with_samples(uuid, boolean, jsonb) from public, anon, authenticated;
grant execute on function public.create_shipment_with_samples(uuid, boolean, jsonb) to service_role;

