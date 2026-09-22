-- Diversify leaderboard vendor coverage. The "N Vendors" count on the home
-- page cards is computed live from VendorProduct (distinct vendors per
-- peptide), but migration 003 linked the same 3 vendors to every peptide, so
-- all cards read "3 Vendors". This adds 3 new vendors and links them to a
-- varying subset of peptides so each card shows a different, real count:
--   Semaglutide 5, Tirzepatide 5, Retatrutide 4, BPC-157 4, CJC-1295 4,
--   TB-500 3.
--
-- Ratings are 0-1 fractions (0.92 = 92%), matching the existing rows.
--
-- Apply with the Supabase SQL editor, then restart the API (or wait for the
-- 24 h leaderboards cache to expire) to see the new counts.

insert into public."Vendor" (id, "displayName", slug, "overallRating", "createdAt", "updatedAt")
values
  ('vendor-zenith-biolabs', 'Zenith BioLabs', 'zenith-biolabs', 0.87, now(), now()),
  ('vendor-alpine-peptides', 'Alpine Peptides', 'alpine-peptides', 0.84, now(), now()),
  ('vendor-core-synthesis', 'Core Synthesis', 'core-synthesis', 0.85, now(), now())
on conflict (id) do nothing;

insert into public."VendorProduct"
  (id, label, slug, "peptideId", "vendorId", "priceMg", rating, "doseMg", "purityPercent", "labelAccuracyDelta", "testsCount", "createdAt", "updatedAt")
values
  -- Semaglutide: 3 -> 5 vendors
  ('product-semaglutide-zb', 'Semaglutide', 'semaglutide', 'peptide-semaglutide', 'vendor-zenith-biolabs', 3.45, 0.88, 0.5, 98.8, 0.6, 64, now(), now()),
  ('product-semaglutide-ap', 'Semaglutide', 'semaglutide', 'peptide-semaglutide', 'vendor-alpine-peptides', 3.60, 0.85, 0.5, 98.1, 0.8, 52, now(), now()),
  -- Retatrutide: 3 -> 4 vendors
  ('product-retatrutide-zb', 'Retatrutide', 'retatrutide', 'peptide-retatrutide', 'vendor-zenith-biolabs', 4.85, 0.87, 0.35, 98.9, 0.4, 71, now(), now()),
  -- Tirzepatide: 3 -> 5 vendors
  ('product-tirzepatide-ap', 'Tirzepatide', 'tirzepatide', 'peptide-tirzepatide', 'vendor-alpine-peptides', 4.95, 0.83, 0.75, 97.7, 1.2, 47, now(), now()),
  ('product-tirzepatide-cs', 'Tirzepatide', 'tirzepatide', 'peptide-tirzepatide', 'vendor-core-synthesis', 4.45, 0.88, 0.75, 98.6, 0.5, 63, now(), now()),
  -- BPC-157: 3 -> 4 vendors
  ('product-bpc157-cs', 'BPC-157', 'bpc-157', 'peptide-bpc-157', 'vendor-core-synthesis', 2.10, 0.81, 0.25, 97.3, 1.1, 29, now(), now()),
  -- CJC-1295: 3 -> 4 vendors
  ('product-cjc1295-zb', 'CJC-1295', 'cjc-1295', 'peptide-cjc-1295', 'vendor-zenith-biolabs', 3.55, 0.86, 0.1, 98.7, 0.5, 44, now(), now())
on conflict (id) do nothing;
