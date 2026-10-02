-- Keep historical demo/seed catalog rows recoverable, but exclude them from
-- every production-facing query. New operational records default to real.

alter table public.vendors
  add column if not exists is_demo boolean not null default false;

alter table public.vendor_tests
  add column if not exists is_demo boolean not null default false;

update public.vendors
set is_demo = true
where id in (
  '7b09ae05-8394-97fc-a441-2e43cf44b173',
  'f1a88bd6-4025-bcca-a8a1-d672943da6ba',
  'e81ceace-eb1e-877c-1c22-552f1862bbdf',
  '6018a9ba-2f58-9700-4634-bd0f79886117',
  '156b0d71-2558-9d27-c23d-3a081ad2cfcc',
  'c3f271f7-352d-1841-5fe0-9b651db25443',
  '4792292a-05a9-aa52-0300-09fcbc4a533e',
  '486ef9a1-ba6b-428a-4960-c0bd53e118db',
  '3aef913c-502e-2050-8cd5-1d3a3c667f84',
  'b274ed48-0719-62a2-1f39-7512aa90aeac'
);

update public.vendor_tests
set is_demo = true
where (batch_code like 'Batch-2025%' or batch_code like 'Batch-ZJ-%')
  and sender in ('Peptrace', 'Community')
  and lab_name in ('Janoshik', 'MZ Biolabs', 'LabCorp');

create index if not exists vendors_real_score_idx
  on public.vendors (score desc) where is_demo = false;

create index if not exists vendor_tests_real_peptide_idx
  on public.vendor_tests (lower(peptide_name), tested_at desc)
  where is_demo = false;
