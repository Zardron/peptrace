-- Testing prices for the FormWizard "Choose Product" step: adds
-- testing_price to public.peptides (0.00 = free testing, shown as "FREE"),
-- sets prices for the existing catalog and adds Semaglutide (a wizard quick
-- pick that was missing) and Oxytocin (a paid example from the design).
--
-- Apply with the Supabase SQL editor.

alter table public.peptides
  add column if not exists testing_price numeric(10, 2) not null default 0;

update public.peptides set testing_price = 0.00 where name in ('Tirzepatide', 'Retatrutide', 'Semaglutide');
update public.peptides set testing_price = 199.00 where name = 'BPC-157';
update public.peptides set testing_price = 149.00 where name = 'NAD+';
update public.peptides set testing_price = 129.00 where name = 'Ipamorelin';

insert into public.peptides (name, description, testing_price)
select 'Semaglutide', 'GLP-1 receptor agonist', 0.00
where not exists (select 1 from public.peptides where name = 'Semaglutide');

insert into public.peptides (name, description, testing_price)
select 'Oxytocin', 'Nonapeptide hormone', 238.00
where not exists (select 1 from public.peptides where name = 'Oxytocin');

-- Peptides are public catalog data (the testing form is visitor-browsable).
-- Inert if RLS is not enabled on the table.
drop policy if exists peptides_public_read on public.peptides;
create policy peptides_public_read on public.peptides
  for select using (true);
