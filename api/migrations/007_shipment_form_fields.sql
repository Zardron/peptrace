-- Extend shipments with every field collected by the testing FormWizard.
-- One row per sample; samples submitted together share a submission_id.
-- vendor_id becomes nullable: the wizard's vendor list is free text, so
-- unmatched vendors are stored in vendor_name with vendor_id NULL.
--
-- Apply with the Supabase SQL editor.

alter table public.shipments
  alter column vendor_id drop not null,
  add column if not exists submission_id uuid,
  add column if not exists vendor_name text,
  add column if not exists form_factor text,
  add column if not exists batch_id text,
  add column if not exists batch_proof_url text,
  add column if not exists quantity_mg numeric,
  add column if not exists lab text,
  add column if not exists addons jsonb not null default '[]'::jsonb,
  add column if not exists vendor_provided_coa boolean,
  add column if not exists coa_when text,
  add column if not exists coa_other_text text,
  add column if not exists coa_match boolean,
  add column if not exists coa_url text,
  add column if not exists coa_file_url text,
  add column if not exists proof_file_url text,
  add column if not exists order_id text,
  add column if not exists order_date text,
  add column if not exists num_vials integer,
  add column if not exists price_per_vial numeric,
  add column if not exists price_currency text,
  add column if not exists sample_price numeric,
  add column if not exists newsletter_opt_in boolean not null default false;

create index if not exists shipments_submission_id_idx on public.shipments (submission_id);
