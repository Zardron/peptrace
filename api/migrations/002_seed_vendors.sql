-- Seed public.vendors with the example vendor set that GET /vendors used
-- to generate in memory (api/src/index.ts). The mock repeated 10 vendor names
-- across 100 table rows; since vendors.name is unique, the seed keeps the
-- first occurrence of each name (10 rows).
--
-- Adds the columns the table was missing (score, cost, location, test/product
-- counts, latest test date) and upserts keyed on name (vendors_name_key), so
-- existing vendors keep their ids and re-running just refreshes the stats.
--
-- Apply with the Supabase SQL editor.

alter table public.vendors
  add column if not exists score smallint,
  add column if not exists cost_per_mg numeric(10, 2),
  add column if not exists location text,
  add column if not exists tests_count integer,
  add column if not exists products_count integer,
  add column if not exists latest_tested_at date;

insert into public.vendors
  (id, name, score, cost_per_mg, location, tests_count, products_count, latest_tested_at)
values
  ('7b09ae05-8394-97fc-a441-2e43cf44b173', 'Zenith Jode Peptide ZJ', 77, 5.28, 'Germany', 34, 4, '2026-02-16'),
  ('f1a88bd6-4025-bcca-a8a1-d672943da6ba', 'Peptide Partners', 90, 4.27, 'Germany', 31, 5, '2025-03-02'),
  ('e81ceace-eb1e-877c-1c22-552f1862bbdf', 'ChemPure Supply', 67, 0.55, 'Australia', 38, 1, '2025-10-19'),
  ('6018a9ba-2f58-9700-4634-bd0f79886117', 'BioSynth Labs', 58, 0.92, 'Canada', 46, 1, '2026-02-08'),
  ('156b0d71-2558-9d27-c23d-3a081ad2cfcc', 'Elite Research Chems', 87, 2.54, 'Hong Kong', 40, 4, '2026-06-11'),
  ('c3f271f7-352d-1841-5fe0-9b651db25443', 'Delta Peptides', 88, 2.84, 'Australia', 28, 2, '2025-11-16'),
  ('4792292a-05a9-aa52-0300-09fcbc4a533e', 'Fusion Biologics', 61, 4.01, 'Hong Kong', 45, 5, '2025-05-19'),
  ('486ef9a1-ba6b-428a-4960-c0bd53e118db', 'Helix BioTech', 81, 0.8, 'Japan', 43, 1, '2026-02-25'),
  ('3aef913c-502e-2050-8cd5-1d3a3c667f84', 'GenX Peptides', 58, 2.88, 'Germany', 8, 2, '2026-03-26'),
  ('b274ed48-0719-62a2-1f39-7512aa90aeac', 'AlphaPeptides', 64, 4.45, 'China', 41, 2, '2024-09-04')
on conflict (name) do update set
  score = excluded.score,
  cost_per_mg = excluded.cost_per_mg,
  location = excluded.location,
  tests_count = excluded.tests_count,
  products_count = excluded.products_count,
  latest_tested_at = excluded.latest_tested_at;

-- Vendors are public data (visitors browse rankings without an account), so
-- allow reads for every role. Inert if RLS is not enabled on the table.
drop policy if exists vendors_public_read on public.vendors;
create policy vendors_public_read on public.vendors
  for select using (true);
