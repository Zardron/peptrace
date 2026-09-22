-- Let logged-in users read test results attached to their own shipments, so
-- the dashboard's "Recent Test Results" section works for Supabase Auth users
-- (native-auth users read through the service role and bypass RLS anyway).
--
-- Apply with the Supabase SQL editor.

drop policy if exists "Users can read own test results" on public.test_results;
create policy "Users can read own test results"
  on public.test_results for select
  using (
    exists (
      select 1 from public.shipments
      where shipments.id = test_results.shipment_id
        and shipments.account_id = auth.uid()
    )
  );
