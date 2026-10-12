-- Peptides added by vendors wait for admin approval before they are public.

alter table public.peptides
  add column if not exists status text not null default 'listed'
    check (status in ('listed', 'pending_approval'));

create index if not exists peptides_status_idx on public.peptides (status);

alter table public.vendor_products
  add column if not exists peptide_id uuid references public.peptides (id) on delete set null;

create index if not exists vendor_products_peptide_idx
  on public.vendor_products (peptide_id) where peptide_id is not null;

drop policy if exists peptides_public_read on public.peptides;
create policy peptides_public_read on public.peptides
  for select using (status = 'listed');
