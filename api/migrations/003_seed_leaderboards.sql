-- Seed the leaderboard data set: two more peptides (so the home grid shows 6
-- cards) and VendorProduct rows covering every peptide x vendor combination
-- for the 3 existing vendors (Peptide Partners, AminoForge, Northstar
-- Peptides). 4 of the 18 combinations already exist and are skipped via
-- ON CONFLICT (id) DO NOTHING.
--
-- Ratings are 0-1 fractions (0.92 = 92%), matching the existing rows.
--
-- Apply with the Supabase SQL editor.

insert into public."Peptide" (id, label, slug, "createdAt", "updatedAt")
values
  ('peptide-cjc-1295', 'CJC-1295', 'cjc-1295', now(), now()),
  ('peptide-tb-500', 'TB-500', 'tb-500', now(), now())
on conflict (id) do nothing;

insert into public."VendorProduct"
  (id, label, slug, "peptideId", "vendorId", "priceMg", rating, "doseMg", "purityPercent", "labelAccuracyDelta", "testsCount", "createdAt", "updatedAt")
values
  -- Retatrutide (pp row already exists)
  ('product-retatrutide-af', 'Retatrutide', 'retatrutide', 'peptide-retatrutide', 'vendor-amino-forge', 4.10, 0.89, 0.35, 99.1, 0.3, 118, now(), now()),
  ('product-retatrutide-ns', 'Retatrutide', 'retatrutide', 'peptide-retatrutide', 'vendor-northstar-peptides', 5.60, 0.84, 0.35, 98.4, 0.9, 96, now(), now()),
  -- Semaglutide (af row already exists)
  ('product-semaglutide-pp', 'Semaglutide', 'semaglutide', 'peptide-semaglutide', 'vendor-peptide-partners', 3.10, 0.93, 0.5, 99.6, 0.2, 203, now(), now()),
  ('product-semaglutide-ns', 'Semaglutide', 'semaglutide', 'peptide-semaglutide', 'vendor-northstar-peptides', 3.95, 0.82, 0.5, 97.9, 1.1, 77, now(), now()),
  -- Tirzepatide (ns row already exists)
  ('product-tirzepatide-pp', 'Tirzepatide', 'tirzepatide', 'peptide-tirzepatide', 'vendor-peptide-partners', 4.65, 0.90, 0.75, 99.2, 0.5, 151, now(), now()),
  ('product-tirzepatide-af', 'Tirzepatide', 'tirzepatide', 'peptide-tirzepatide', 'vendor-amino-forge', 4.30, 0.86, 0.75, 98.5, 0.6, 88, now(), now()),
  -- BPC-157 (pp row already exists)
  ('product-bpc157-af', 'BPC-157', 'bpc-157', 'peptide-bpc-157', 'vendor-amino-forge', 1.85, 0.78, 0.25, 96.1, 1.5, 39, now(), now()),
  ('product-bpc157-ns', 'BPC-157', 'bpc-157', 'peptide-bpc-157', 'vendor-northstar-peptides', 2.45, 0.74, 0.25, 95.7, 1.8, 33, now(), now()),
  -- CJC-1295 (new peptide)
  ('product-cjc1295-pp', 'CJC-1295', 'cjc-1295', 'peptide-cjc-1295', 'vendor-peptide-partners', 3.75, 0.91, 0.1, 99.3, 0.3, 92, now(), now()),
  ('product-cjc1295-af', 'CJC-1295', 'cjc-1295', 'peptide-cjc-1295', 'vendor-amino-forge', 3.30, 0.85, 0.1, 98.2, 0.7, 54, now(), now()),
  ('product-cjc1295-ns', 'CJC-1295', 'cjc-1295', 'peptide-cjc-1295', 'vendor-northstar-peptides', 4.10, 0.80, 0.1, 97.6, 1.0, 41, now(), now()),
  -- TB-500 (new peptide)
  ('product-tb500-pp', 'TB-500', 'tb-500', 'peptide-tb-500', 'vendor-peptide-partners', 2.95, 0.89, 0.2, 99.0, 0.4, 73, now(), now()),
  ('product-tb500-af', 'TB-500', 'tb-500', 'peptide-tb-500', 'vendor-amino-forge', 2.60, 0.83, 0.2, 97.8, 0.9, 48, now(), now()),
  ('product-tb500-ns', 'TB-500', 'tb-500', 'peptide-tb-500', 'vendor-northstar-peptides', 3.25, 0.77, 0.2, 96.9, 1.4, 36, now(), now())
on conflict (id) do nothing;
