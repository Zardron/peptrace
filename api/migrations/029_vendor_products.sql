-- Products listed by approved vendors (vendors.manager_user_id). The API uses
-- the service role; anon/authenticated clients have no access.

create table if not exists public.vendor_products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  peptide_name text check (peptide_name is null or char_length(peptide_name) <= 120),
  amount_mg numeric(10, 2) check (amount_mg is null or amount_mg > 0),
  price_usd numeric(10, 2) check (price_usd is null or price_usd >= 0),
  product_url text check (product_url is null or char_length(product_url) <= 2000),
  description text check (description is null or char_length(description) <= 2000),
  in_stock boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vendor_products_vendor_idx
  on public.vendor_products (vendor_id, created_at desc);

alter table public.vendor_products enable row level security;
revoke all on public.vendor_products from public, anon, authenticated;
