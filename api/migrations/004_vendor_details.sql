-- Extend vendors and tests tables for the Vendor Details screen.
-- Apply with the Supabase SQL editor or via `supabase db push`.

alter table public.vendors
  add column if not exists slug text unique,
  add column if not exists website_url text,
  add column if not exists avatar_url text,
  add column if not exists about text,
  add column if not exists contact_channels jsonb default '[]',
  add column if not exists intelligence_report jsonb default '{}',
  add column if not exists rating smallint,
  add column if not exists rank integer,
  add column if not exists ranked_vendors_count integer,
  add column if not exists tests_passed integer,
  add column if not exists tests_total integer,
  add column if not exists analysis_text text;

-- Backfill slugs from names (URL-safe)
update public.vendors
  set slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'), '-+', '-', 'g'))
  where slug is null or slug = '';

-- Ensure unique slugs going forward
create unique index if not exists vendors_slug_key on public.vendors (slug);

-- Extend tests / test_results with the fields needed for the history table.
-- The application code uses test_results for purity; we add the other columns
-- on the tests table if it exists, otherwise on test_results.
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'tests') then
    alter table public.tests
      add column if not exists result text check (result in ('pass','fail')),
      add column if not exists purity numeric,
      add column if not exists dosage_deviation text,
      add column if not exists tested_mg numeric,
      add column if not exists label_mg numeric,
      add column if not exists batch_info text,
      add column if not exists sender text,
      add column if not exists coa_url text,
      add column if not exists lab_name text;
  end if;
end $$;

-- If the app instead uses test_results (shipment-linked), add the same columns there.
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'test_results') then
    alter table public.test_results
      add column if not exists result text check (result in ('pass','fail')),
      add column if not exists purity numeric,
      add column if not exists dosage_deviation text,
      add column if not exists tested_mg numeric,
      add column if not exists label_mg numeric,
      add column if not exists batch_info text,
      add column if not exists sender text,
      add column if not exists coa_url text,
      add column if not exists lab_name text;
  end if;
end $$;
