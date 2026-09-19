-- Test history rows for the vendor detail page (replaces the mock items that
-- GET /vendors/:id used to synthesize in code).
--
-- Creates public.vendor_tests and seeds 18 rows for "Peptide Partners" plus 6
-- for "Zenith Jode Peptide ZJ". Seeds are deleted and re-inserted by vendor
-- name, so re-running is safe.
--
-- Apply with the Supabase SQL editor.

-- Pretty URLs for vendor pages (/vendors/<slug>); the /vendors/:id endpoint
-- already falls back to slug lookup.
alter table public.vendors add column if not exists slug text;

update public.vendors
set slug = trim(both '-' from lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')))
where slug is null;

create unique index if not exists vendors_slug_key on public.vendors (slug);

create table if not exists public.vendor_tests (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  tested_at date not null,
  result text not null check (result in ('pass', 'fail')),
  peptide_name text not null,
  lab_name text not null,
  purity numeric(5, 2),
  dosage_deviation text,
  tested_mg numeric(8, 2),
  label_mg numeric(8, 2),
  batch_code text,
  sender text,
  coa_url text,
  created_at timestamptz not null default now()
);

create index if not exists vendor_tests_vendor_id_idx
  on public.vendor_tests (vendor_id, tested_at desc);

alter table public.vendor_tests enable row level security;

-- Test history is public catalog data (vendor pages are visitor-browsable).
drop policy if exists vendor_tests_public_read on public.vendor_tests;
create policy vendor_tests_public_read on public.vendor_tests
  for select using (true);

-- ---- Seed: Peptide Partners (18 tests: 14 pass, 4 fail) ----

delete from public.vendor_tests
where vendor_id in (select id from public.vendors where name = 'Peptide Partners');

insert into public.vendor_tests
  (vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url)
select v.id,
       t.tested_at::date,
       t.result,
       t.peptide_name,
       t.lab_name,
       t.purity::numeric,
       t.dosage_deviation,
       t.tested_mg::numeric,
       t.label_mg::numeric,
       t.batch_code,
       t.sender,
       t.coa_url
from public.vendors v
join (
  values
    ('2026-08-03', 'pass', 'Retatrutide', 'Janoshik',   99.4, null,   10.00, 10.0, 'Batch-202517', 'Peptrace',  '#'),
    ('2026-06-29', 'pass', 'GHK-Cu',      'MZ Biolabs', 99.1, null,    5.00,  5.0, 'Batch-202516', 'Community', '#'),
    ('2026-05-25', 'pass', 'Retatrutide', 'Janoshik',   99.2, null,   10.00, 10.0, 'Batch-202515', 'Peptrace',  '#'),
    ('2026-04-20', 'fail', 'Semaglutide', 'LabCorp',    94.5, '-12%',  8.80, 10.0, 'Batch-202514', 'Community', null),
    ('2026-03-16', 'pass', 'Retatrutide', 'Janoshik',   99.5, null,   10.00, 10.0, 'Batch-202513', 'Peptrace',  '#'),
    ('2026-02-09', 'pass', 'GHK-Cu',      'MZ Biolabs', 98.9, null,    5.00,  5.0, 'Batch-202512', 'Community', '#'),
    ('2026-01-05', 'pass', 'Retatrutide', 'Janoshik',   99.3, null,   10.00, 10.0, 'Batch-202511', 'Peptrace',  '#'),
    ('2025-12-01', 'fail', 'Retatrutide', 'LabCorp',    93.8, '-15%',  8.50, 10.0, 'Batch-202510', 'Community', null),
    ('2025-10-27', 'pass', 'Semaglutide', 'Janoshik',   99.0, null,   10.00, 10.0, 'Batch-202509', 'Peptrace',  '#'),
    ('2025-09-22', 'pass', 'GHK-Cu',      'MZ Biolabs', 99.2, null,    5.00,  5.0, 'Batch-202508', 'Community', '#'),
    ('2025-08-18', 'pass', 'Retatrutide', 'Janoshik',   98.7, null,   10.00, 10.0, 'Batch-202507', 'Peptrace',  '#'),
    ('2025-07-14', 'pass', 'Retatrutide', 'MZ Biolabs', 99.1, null,   10.00, 10.0, 'Batch-202506', 'Community', '#'),
    ('2025-06-09', 'fail', 'GHK-Cu',      'LabCorp',    95.2, '-9%',   4.55,  5.0, 'Batch-202505', 'Peptrace',  null),
    ('2025-05-05', 'pass', 'Semaglutide', 'Janoshik',   99.4, null,   10.00, 10.0, 'Batch-202504', 'Community', '#'),
    ('2025-03-31', 'pass', 'Retatrutide', 'Janoshik',   99.6, null,   10.00, 10.0, 'Batch-202503', 'Peptrace',  '#'),
    ('2025-02-24', 'pass', 'GHK-Cu',      'MZ Biolabs', 98.8, null,    5.00,  5.0, 'Batch-202502', 'Community', '#'),
    ('2025-01-20', 'fail', 'Retatrutide', 'LabCorp',    94.1, '-11%',  8.90, 10.0, 'Batch-202501', 'Community', null),
    ('2024-12-16', 'pass', 'Retatrutide', 'Janoshik',   99.3, null,   10.00, 10.0, 'Batch-202500', 'Peptrace',  '#')
) as t(tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url) on true
where v.name = 'Peptide Partners';

-- ---- Seed: Zenith Jode Peptide ZJ (6 tests: 5 pass, 1 fail) ----

delete from public.vendor_tests
where vendor_id in (select id from public.vendors where name = 'Zenith Jode Peptide ZJ');

insert into public.vendor_tests
  (vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url)
select v.id,
       t.tested_at::date,
       t.result,
       t.peptide_name,
       t.lab_name,
       t.purity::numeric,
       t.dosage_deviation,
       t.tested_mg::numeric,
       t.label_mg::numeric,
       t.batch_code,
       t.sender,
       t.coa_url
from public.vendors v
join (
  values
    ('2026-07-22', 'pass', 'Retatrutide', 'Janoshik',   99.2, null,  10.00, 10.0, 'Batch-ZJ-106', 'Peptrace',  '#'),
    ('2026-05-14', 'pass', 'GHK-Cu',      'MZ Biolabs', 98.6, null,   5.00,  5.0, 'Batch-ZJ-105', 'Community', '#'),
    ('2026-03-08', 'fail', 'Retatrutide', 'LabCorp',    94.9, '-10%', 9.00, 10.0, 'Batch-ZJ-104', 'Community', null),
    ('2025-12-30', 'pass', 'Retatrutide', 'Janoshik',   99.0, null,  10.00, 10.0, 'Batch-ZJ-103', 'Peptrace',  '#'),
    ('2025-10-11', 'pass', 'Semaglutide', 'MZ Biolabs', 98.4, null,  10.00, 10.0, 'Batch-ZJ-102', 'Community', '#'),
    ('2025-08-02', 'pass', 'GHK-Cu',      'Janoshik',   99.1, null,   5.00,  5.0, 'Batch-ZJ-101', 'Peptrace',  '#')
) as t(tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url) on true
where v.name = 'Zenith Jode Peptide ZJ';
