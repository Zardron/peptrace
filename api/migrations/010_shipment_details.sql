-- Add shipment detail fields for the ShipmentDetails screen.
-- Apply with the Supabase SQL editor.

alter table public.shipments
  add column if not exists origin_city text,
  add column if not exists origin_address text,
  add column if not exists destination_city text,
  add column if not exists destination_address text,
  add column if not exists service text,
  add column if not exists package_type text,
  add column if not exists weight text,
  add column if not exists dimensions text,
  add column if not exists temperature text,
  add column if not exists milestones jsonb not null default '[]'::jsonb,
  add column if not exists timeline_events jsonb not null default '[]'::jsonb,
  add column if not exists billing_items jsonb not null default '[]'::jsonb,
  add column if not exists total_amount numeric(12, 2),
  add column if not exists invoice_number text,
  add column if not exists invoice_url text,
  add column if not exists payment_status text,
  add column if not exists payment_method text,
  add column if not exists amount_due numeric(12, 2),
  add column if not exists due_date text,
  add column if not exists payment_notice_title text,
  add column if not exists payment_notice_body text;
