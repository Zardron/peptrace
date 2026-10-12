-- Remove the synthetic rows inserted by 004_vendor_tests.sql. The exact
-- prefixes, senders, and labs are the fixture markers quarantined in 015.
delete from public.vendor_tests
where is_demo = true
  and (batch_code like 'Batch-2025%' or batch_code like 'Batch-ZJ-%')
  and sender in ('Peptrace', 'Community')
  and lab_name in ('Janoshik', 'MZ Biolabs', 'LabCorp');

drop index if exists public.vendor_tests_real_peptide_idx;

alter table public.vendor_tests
  drop column if exists is_demo;