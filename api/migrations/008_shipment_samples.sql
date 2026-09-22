-- Multi-sample shipments: "shipments" is the parent row (one tracking ID per
-- Register Shipment submission) and "shipment_samples" holds each sample the
-- user added in the FormWizard. The per-sample form columns added to
-- shipments in 007 move to shipment_samples; peptide_id on shipments becomes
-- nullable because a multi-sample shipment has no single peptide.
--
-- Note: any rows written between 007 and this migration lose their per-sample
-- field values (the shipments row itself is kept).
--
-- Apply with the Supabase SQL editor.

alter table public.shipments
  alter column peptide_id drop not null,
  drop column if exists submission_id,
  drop column if exists vendor_name,
  drop column if exists form_factor,
  drop column if exists batch_id,
  drop column if exists batch_proof_url,
  drop column if exists quantity_mg,
  drop column if exists lab,
  drop column if exists addons,
  drop column if exists vendor_provided_coa,
  drop column if exists coa_when,
  drop column if exists coa_other_text,
  drop column if exists coa_match,
  drop column if exists coa_url,
  drop column if exists coa_file_url,
  drop column if exists proof_file_url,
  drop column if exists order_id,
  drop column if exists order_date,
  drop column if exists num_vials,
  drop column if exists price_per_vial,
  drop column if exists price_currency,
  drop column if exists sample_price;

create table if not exists public.shipment_samples (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  peptide_id uuid not null references public.peptides (id),
  vendor_id uuid references public.vendors (id),
  vendor_name text,
  form_factor text,
  batch_id text,
  batch_proof_url text,
  quantity_mg numeric,
  lab text,
  addons jsonb not null default '[]'::jsonb,
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
  sample_price numeric,
  created_at timestamptz not null default now()
);

create index if not exists shipment_samples_shipment_id_idx
  on public.shipment_samples (shipment_id);

alter table public.shipment_samples enable row level security;

drop policy if exists "Users can read own shipment samples" on public.shipment_samples;
create policy "Users can read own shipment samples"
  on public.shipment_samples for select
  using (
    exists (
      select 1 from public.shipments
      where shipments.id = shipment_samples.shipment_id
        and shipments.account_id = auth.uid()
    )
  );
