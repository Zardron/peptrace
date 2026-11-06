-- Peptrace bootstrap for project xeomtzlpcdalebnziuta
-- Run in Supabase SQL Editor (single shot).
begin;

create extension if not exists "pgcrypto";

create table if not exists public.user_accounts (
id uuid not null default gen_random_uuid(),
email text not null,
created_at timestamptz not null default now(),
last_sign_in_at timestamptz not null,
  primary key (id)
);

create table if not exists public.user_profiles (
account_id uuid not null,
full_name text,
organization text,
role text,
phone text,
bio text,
avatar_url text,
updated_at timestamptz not null default now(),
  primary key (account_id)
);

create table if not exists public.vendors (
id uuid not null default gen_random_uuid(),
name text not null,
created_at timestamptz not null default now(),
score smallint,
cost_per_mg numeric,
location text,
tests_count integer,
products_count integer,
latest_tested_at date,
slug text,
is_demo boolean not null default false,
manager_user_id uuid,
website_url text,
avatar_url text,
about text,
contact_channels jsonb,
intelligence_report jsonb,
rating smallint,
rank integer,
ranked_vendors_count integer,
tests_passed integer,
tests_total integer,
analysis_text text,
  primary key (id)
);

create table if not exists public.peptides (
id uuid not null default gen_random_uuid(),
name text not null,
description text,
created_at timestamptz not null default now(),
testing_price numeric not null,
status text not null,
  primary key (id)
);

create table if not exists public.vendor_tests (
id uuid not null default gen_random_uuid(),
vendor_id uuid not null,
tested_at date not null,
result text not null,
peptide_name text not null,
lab_name text not null,
purity numeric,
dosage_deviation text,
tested_mg numeric,
label_mg numeric,
batch_code text,
sender text,
coa_url text,
created_at timestamptz not null default now(),
is_demo boolean not null default false,
  primary key (id)
);

create table if not exists public.vendor_products (
id uuid not null default gen_random_uuid(),
vendor_id uuid not null,
name text not null,
peptide_name text,
amount_mg numeric,
price_usd numeric,
product_url text,
description text,
in_stock boolean not null,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
peptide_id uuid,
  primary key (id)
);

create table if not exists public.admin_users (
id uuid not null default gen_random_uuid(),
email text not null,
password_hash text not null,
display_name text not null,
role text not null,
is_active boolean not null,
failed_login_count integer not null,
locked_until timestamptz,
last_login_at timestamptz,
password_changed_at timestamptz not null default now(),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
must_change_password boolean not null,
  primary key (id)
);

create table if not exists public.admin_sessions (
id uuid not null default gen_random_uuid(),
admin_user_id uuid not null,
token_hash text not null,
expires_at timestamptz not null,
revoked_at timestamptz,
last_seen_at timestamptz not null default now(),
ip_hash text,
user_agent text,
created_at timestamptz not null default now(),
  primary key (id)
);

create table if not exists public.admin_audit_log (
id uuid not null default gen_random_uuid(),
actor_id uuid,
actor_email text,
action text not null,
target_type text,
target_id text,
reason text,
metadata jsonb not null,
request_id text,
ip_hash text,
created_at timestamptz not null default now(),
  primary key (id)
);

create table if not exists public.account_admin_state (
account_id uuid not null,
status text not null,
reason text,
changed_by uuid,
suspended_at timestamptz,
restored_at timestamptz,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
  primary key (account_id)
);

create table if not exists public.subscriptions (
id uuid not null default gen_random_uuid(),
user_id uuid,
subject_hash text not null,
provider text not null,
provider_customer_id text,
provider_subscription_id text,
plan text not null,
status text not null,
trial_start timestamptz,
trial_end timestamptz,
current_period_start timestamptz,
current_period_end timestamptz,
cancel_at_period_end boolean not null,
canceled_at timestamptz,
expires_at timestamptz,
currency text,
amount_cents integer,
last_webhook_at timestamptz,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
  primary key (id)
);

create table if not exists public.billing_webhook_events (
id uuid not null default gen_random_uuid(),
provider text not null,
provider_event_id text not null,
event_type text not null,
payload_hash text not null,
status text not null,
attempts integer not null,
error_code text,
processed_at timestamptz,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
  primary key (id)
);

create table if not exists public.billing_settings (
id boolean not null,
provider text not null,
publishable_key text,
secret_key_encrypted text,
webhook_secret_encrypted text,
member_price_id text,
gold_price_id text,
updated_by uuid,
updated_at timestamptz not null default now(),
  primary key (id)
);

create table if not exists public.notification_preferences (
user_id uuid not null,
email_test_results boolean not null,
email_shipment_updates boolean not null,
email_rankings boolean not null,
email_marketing boolean not null,
push_test_results boolean not null,
push_shipment_updates boolean not null,
push_marketing boolean not null,
frequency text not null,
updated_at timestamptz not null default now(),
  primary key (user_id)
);

create table if not exists public.notification_events (
id uuid not null default gen_random_uuid(),
user_id uuid,
channel text not null,
notification_type text not null,
provider text,
provider_reference text,
status text not null,
attempt_count integer not null,
error_code text,
requested_at timestamptz not null,
delivered_at timestamptz,
updated_at timestamptz not null default now(),
  primary key (id)
);

create table if not exists public.user_consents (
id uuid not null default gen_random_uuid(),
user_id uuid,
subject_hash text not null,
consent_type text not null,
policy_version text not null,
accepted boolean not null,
recorded_at timestamptz not null,
withdrawn_at timestamptz,
source text not null,
request_id text,
  primary key (id)
);

create table if not exists public.data_export_requests (
id uuid not null default gen_random_uuid(),
user_id uuid,
subject_hash text not null,
status text not null,
storage_path text,
expires_at timestamptz,
error_code text,
requested_at timestamptz not null,
completed_at timestamptz,
updated_at timestamptz not null default now(),
  primary key (id)
);

create table if not exists public.account_deletion_requests (
id uuid not null default gen_random_uuid(),
user_id uuid,
subject_hash text not null,
status text not null,
reason text,
requested_at timestamptz not null,
scheduled_for timestamptz,
completed_at timestamptz,
canceled_at timestamptz,
failure_code text,
updated_at timestamptz not null default now(),
cleanup_manifest jsonb not null,
cleanup_attempts integer not null,
  primary key (id)
);

create table if not exists public.support_requests (
id uuid not null default gen_random_uuid(),
user_id uuid,
subject_hash text,
contact_email text,
category text not null,
subject text not null,
message text not null,
status text not null,
assigned_admin_id uuid,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
resolved_at timestamptz,
  primary key (id)
);

create table if not exists public.support_internal_notes (
id uuid not null default gen_random_uuid(),
request_id uuid not null,
admin_id uuid,
note text not null,
created_at timestamptz not null default now(),
  primary key (id)
);

create table if not exists public.system_events (
id uuid not null default gen_random_uuid(),
service text not null,
event_type text not null,
severity text not null,
status text not null,
correlation_id text,
error_code text,
metadata jsonb not null,
occurred_at timestamptz not null,
resolved_at timestamptz,
  primary key (id)
);

create table if not exists public.shipments (
id uuid not null default gen_random_uuid(),
account_id uuid not null,
tracking_id text not null,
peptide_id uuid,
vendor_id uuid,
status text not null,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
newsletter_opt_in boolean not null,
origin_city text,
origin_address text,
destination_city text,
destination_address text,
service text,
package_type text,
weight text,
dimensions text,
temperature text,
milestones jsonb not null,
timeline_events jsonb not null,
billing_items jsonb not null,
total_amount numeric,
invoice_number text,
invoice_url text,
payment_status text,
payment_method text,
amount_due numeric,
due_date text,
payment_notice_title text,
payment_notice_body text,
submission_id uuid,
  primary key (id)
);

create table if not exists public.shipment_samples (
id uuid not null default gen_random_uuid(),
shipment_id uuid not null,
peptide_id uuid not null,
vendor_id uuid,
vendor_name text,
form_factor text,
batch_id text,
batch_proof_url text,
quantity_mg numeric,
lab text,
addons jsonb not null,
vendor_provided_coa boolean,
coa_when text,
coa_other_text text,
coa_match boolean,
coa_url text,
coa_file_url text,
proof_file_url text,
order_id text,
order_date text,
num_vials integer,
price_per_vial numeric,
price_currency text,
sample_price numeric,
created_at timestamptz not null default now(),
  primary key (id)
);

create table if not exists public.shipping_addresses (
id uuid not null default gen_random_uuid(),
account_id uuid not null,
nickname text not null,
recipient_name text not null,
organization text,
line1 text not null,
line2 text,
city text not null,
state text not null,
postal_code text not null,
country text not null,
is_primary boolean not null,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
  primary key (id)
);

create table if not exists public.test_results (
id uuid not null default gen_random_uuid(),
shipment_id uuid not null,
batch_code text not null,
purity numeric not null,
outcome text not null,
lab text,
tested_at timestamptz not null,
result text,
dosage_deviation text,
tested_mg numeric,
label_mg numeric,
batch_info text,
sender text,
coa_url text,
lab_name text,
  primary key (id)
);

create table if not exists public.native_credentials (
account_id uuid not null,
email text not null,
password_hash text not null,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
  primary key (account_id)
);

create table if not exists public.customer_sessions (
id uuid not null default gen_random_uuid(),
user_id uuid not null,
token_hash text not null,
source text not null,
expires_at timestamptz not null,
revoked_at timestamptz,
last_seen_at timestamptz not null default now(),
ip_hash text,
user_agent text,
created_at timestamptz not null default now(),
  primary key (id)
);

create table if not exists public.site_content (
key text not null,
content jsonb not null,
updated_at timestamptz not null default now(),
updated_by uuid,
updated_by_email text,
  primary key (key)
);

create table if not exists public.email_settings (
id boolean not null,
provider text not null,
api_key_encrypted text,
from_email text,
from_name text,
reply_to_email text,
updated_by uuid,
updated_at timestamptz not null default now(),
  primary key (id)
);

create table if not exists public.email_templates (
id uuid not null default gen_random_uuid(),
key text not null,
name text not null,
category text not null,
subject text not null,
html_body text not null,
text_body text,
enabled boolean not null,
is_system boolean not null,
updated_by uuid,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
  primary key (id)
);

create table if not exists public.security_rate_limits (
scope text not null,
key_hash text not null,
window_started_at timestamptz not null,
attempt_count integer not null,
updated_at timestamptz not null default now(),
  primary key (scope, key_hash)
);

create table if not exists public.user_uploads (
id uuid not null default gen_random_uuid(),
user_id uuid not null,
bucket_id text not null,
object_path text not null,
upload_type text,
content_type text not null,
size_bytes text not null,
created_at timestamptz not null default now(),
  primary key (id)
);

create table if not exists public.vendor_applications (
id uuid not null default gen_random_uuid(),
email text not null,
vendor_name text not null,
website_url text,
distributes_commercially boolean not null,
situation text not null,
batch_identifiers text,
premium_interest boolean not null,
status text not null,
admin_note text,
vendor_id uuid,
ip_hash text,
reviewed_by uuid,
reviewed_at timestamptz,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
  primary key (id)
);

create table if not exists public.vendor_signup_application (
id uuid not null default gen_random_uuid(),
user_id uuid not null,
email text not null,
distributes_peptides boolean not null,
current_situation text not null,
vendor_name text not null,
batch_identifiers text,
premium_opt_in boolean not null,
terms_accepted boolean not null,
status text not null,
vendor_id uuid,
approved_by uuid,
approved_at timestamptz,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
  primary key (id)
);

create table if not exists public.account_identity_links (
provider text not null,
provider_subject text not null,
account_id uuid not null,
linked_at timestamptz not null,
  primary key (provider, provider_subject)
);

create table if not exists public.account_merge_archive (
id uuid not null default gen_random_uuid(),
canonical_account_id uuid not null,
merged_account_id uuid not null,
normalized_email_hash text not null,
merged_profile jsonb,
reason text not null,
merged_at timestamptz not null,
  primary key (id)
);

create table if not exists public.admin_user_directory (
id uuid  default gen_random_uuid(),
email text,
created_at timestamptz not null default now(),
last_sign_in_at timestamptz,
full_name text,
role text,
profile_updated_at timestamptz,
account_status text,
status text,
status_reason text,
state_updated_at timestamptz,
  primary key (id)
);

create unique index if not exists vendors_name_key on public.vendors (name);
create unique index if not exists vendors_slug_key on public.vendors (slug) where slug is not null;
create unique index if not exists peptides_name_key on public.peptides (name);
create unique index if not exists native_credentials_email_key on public.native_credentials (email);
create unique index if not exists user_accounts_email_key on public.user_accounts (email);

alter table public.vendors enable row level security;
drop policy if exists vendors_public_read on public.vendors;
create policy vendors_public_read on public.vendors for select using (true);
alter table public.peptides enable row level security;
drop policy if exists peptides_public_read on public.peptides;
create policy peptides_public_read on public.peptides for select using (true);
alter table public.vendor_tests enable row level security;
drop policy if exists vendor_tests_public_read on public.vendor_tests;
create policy vendor_tests_public_read on public.vendor_tests for select using (true);
alter table public.vendor_products enable row level security;
drop policy if exists vendor_products_public_read on public.vendor_products;
create policy vendor_products_public_read on public.vendor_products for select using (true);
alter table public.site_content enable row level security;
drop policy if exists site_content_public_read on public.site_content;
create policy site_content_public_read on public.site_content for select using (true);

-- Seed vendors
insert into public.vendors (id, name, created_at, score, cost_per_mg, location, tests_count, products_count, latest_tested_at, slug, is_demo, manager_user_id, website_url, avatar_url, about, contact_channels, intelligence_report, rating, rank, ranked_vendors_count, tests_passed, tests_total, analysis_text) values ('b274ed48-0719-62a2-1f39-7512aa90aeac', 'AlphaPeptides', '2026-09-17T21:37:28.583441+00:00', 64, 4.45, 'China', 41, 2, '2024-09-04', 'alphapeptides', false, NULL, NULL, NULL, NULL, '[]'::jsonb, '{}'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL) on conflict (id) do update set name=excluded.name, score=excluded.score, cost_per_mg=excluded.cost_per_mg, location=excluded.location, tests_count=excluded.tests_count, products_count=excluded.products_count, latest_tested_at=excluded.latest_tested_at, slug=excluded.slug, is_demo=false, website_url=excluded.website_url, about=excluded.about, avatar_url=excluded.avatar_url;
insert into public.vendors (id, name, created_at, score, cost_per_mg, location, tests_count, products_count, latest_tested_at, slug, is_demo, manager_user_id, website_url, avatar_url, about, contact_channels, intelligence_report, rating, rank, ranked_vendors_count, tests_passed, tests_total, analysis_text) values ('6018a9ba-2f58-9700-4634-bd0f79886117', 'BioSynth Labs', '2026-09-17T21:37:28.583441+00:00', 58, 0.92, 'Canada', 46, 1, '2026-02-08', 'biosynth-labs', false, NULL, NULL, NULL, NULL, '[]'::jsonb, '{}'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL) on conflict (id) do update set name=excluded.name, score=excluded.score, cost_per_mg=excluded.cost_per_mg, location=excluded.location, tests_count=excluded.tests_count, products_count=excluded.products_count, latest_tested_at=excluded.latest_tested_at, slug=excluded.slug, is_demo=false, website_url=excluded.website_url, about=excluded.about, avatar_url=excluded.avatar_url;
insert into public.vendors (id, name, created_at, score, cost_per_mg, location, tests_count, products_count, latest_tested_at, slug, is_demo, manager_user_id, website_url, avatar_url, about, contact_channels, intelligence_report, rating, rank, ranked_vendors_count, tests_passed, tests_total, analysis_text) values ('e81ceace-eb1e-877c-1c22-552f1862bbdf', 'ChemPure Supply', '2026-09-17T21:37:28.583441+00:00', 67, 0.55, 'Australia', 38, 1, '2025-10-19', 'chempure-supply', false, NULL, NULL, NULL, NULL, '[]'::jsonb, '{}'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL) on conflict (id) do update set name=excluded.name, score=excluded.score, cost_per_mg=excluded.cost_per_mg, location=excluded.location, tests_count=excluded.tests_count, products_count=excluded.products_count, latest_tested_at=excluded.latest_tested_at, slug=excluded.slug, is_demo=false, website_url=excluded.website_url, about=excluded.about, avatar_url=excluded.avatar_url;
insert into public.vendors (id, name, created_at, score, cost_per_mg, location, tests_count, products_count, latest_tested_at, slug, is_demo, manager_user_id, website_url, avatar_url, about, contact_channels, intelligence_report, rating, rank, ranked_vendors_count, tests_passed, tests_total, analysis_text) values ('c3f271f7-352d-1841-5fe0-9b651db25443', 'Delta Peptides', '2026-09-17T21:37:28.583441+00:00', 88, 2.84, 'Australia', 28, 2, '2025-11-16', 'delta-peptides', false, NULL, NULL, NULL, NULL, '[]'::jsonb, '{}'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL) on conflict (id) do update set name=excluded.name, score=excluded.score, cost_per_mg=excluded.cost_per_mg, location=excluded.location, tests_count=excluded.tests_count, products_count=excluded.products_count, latest_tested_at=excluded.latest_tested_at, slug=excluded.slug, is_demo=false, website_url=excluded.website_url, about=excluded.about, avatar_url=excluded.avatar_url;
insert into public.vendors (id, name, created_at, score, cost_per_mg, location, tests_count, products_count, latest_tested_at, slug, is_demo, manager_user_id, website_url, avatar_url, about, contact_channels, intelligence_report, rating, rank, ranked_vendors_count, tests_passed, tests_total, analysis_text) values ('156b0d71-2558-9d27-c23d-3a081ad2cfcc', 'Elite Research Chems', '2026-09-17T21:37:28.583441+00:00', 87, 2.54, 'Hong Kong', 40, 4, '2026-06-11', 'elite-research-chems', false, NULL, NULL, NULL, NULL, '[]'::jsonb, '{}'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL) on conflict (id) do update set name=excluded.name, score=excluded.score, cost_per_mg=excluded.cost_per_mg, location=excluded.location, tests_count=excluded.tests_count, products_count=excluded.products_count, latest_tested_at=excluded.latest_tested_at, slug=excluded.slug, is_demo=false, website_url=excluded.website_url, about=excluded.about, avatar_url=excluded.avatar_url;
insert into public.vendors (id, name, created_at, score, cost_per_mg, location, tests_count, products_count, latest_tested_at, slug, is_demo, manager_user_id, website_url, avatar_url, about, contact_channels, intelligence_report, rating, rank, ranked_vendors_count, tests_passed, tests_total, analysis_text) values ('4792292a-05a9-aa52-0300-09fcbc4a533e', 'Fusion Biologics', '2026-09-17T21:37:28.583441+00:00', 61, 4.01, 'Hong Kong', 45, 5, '2025-05-19', 'fusion-biologics', false, NULL, NULL, NULL, NULL, '[]'::jsonb, '{}'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL) on conflict (id) do update set name=excluded.name, score=excluded.score, cost_per_mg=excluded.cost_per_mg, location=excluded.location, tests_count=excluded.tests_count, products_count=excluded.products_count, latest_tested_at=excluded.latest_tested_at, slug=excluded.slug, is_demo=false, website_url=excluded.website_url, about=excluded.about, avatar_url=excluded.avatar_url;
insert into public.vendors (id, name, created_at, score, cost_per_mg, location, tests_count, products_count, latest_tested_at, slug, is_demo, manager_user_id, website_url, avatar_url, about, contact_channels, intelligence_report, rating, rank, ranked_vendors_count, tests_passed, tests_total, analysis_text) values ('3aef913c-502e-2050-8cd5-1d3a3c667f84', 'GenX Peptides', '2026-09-17T21:37:28.583441+00:00', 58, 2.88, 'Germany', 8, 2, '2026-03-26', 'genx-peptides', false, NULL, NULL, NULL, NULL, '[]'::jsonb, '{}'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL) on conflict (id) do update set name=excluded.name, score=excluded.score, cost_per_mg=excluded.cost_per_mg, location=excluded.location, tests_count=excluded.tests_count, products_count=excluded.products_count, latest_tested_at=excluded.latest_tested_at, slug=excluded.slug, is_demo=false, website_url=excluded.website_url, about=excluded.about, avatar_url=excluded.avatar_url;
insert into public.vendors (id, name, created_at, score, cost_per_mg, location, tests_count, products_count, latest_tested_at, slug, is_demo, manager_user_id, website_url, avatar_url, about, contact_channels, intelligence_report, rating, rank, ranked_vendors_count, tests_passed, tests_total, analysis_text) values ('486ef9a1-ba6b-428a-4960-c0bd53e118db', 'Helix BioTech', '2026-09-17T21:37:28.583441+00:00', 81, 0.8, 'Japan', 43, 1, '2026-02-25', 'helix-biotech', false, NULL, NULL, NULL, NULL, '[]'::jsonb, '{}'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL) on conflict (id) do update set name=excluded.name, score=excluded.score, cost_per_mg=excluded.cost_per_mg, location=excluded.location, tests_count=excluded.tests_count, products_count=excluded.products_count, latest_tested_at=excluded.latest_tested_at, slug=excluded.slug, is_demo=false, website_url=excluded.website_url, about=excluded.about, avatar_url=excluded.avatar_url;
insert into public.vendors (id, name, created_at, score, cost_per_mg, location, tests_count, products_count, latest_tested_at, slug, is_demo, manager_user_id, website_url, avatar_url, about, contact_channels, intelligence_report, rating, rank, ranked_vendors_count, tests_passed, tests_total, analysis_text) values ('5f7dd7ca-ce00-4bad-a88f-d4cc9c72834d', 'Peptide Partners', '2026-09-16T16:03:14.742551+00:00', 90, 4.27, 'Germany', 31, 5, '2025-03-02', 'peptide-partners', false, NULL, NULL, NULL, NULL, '[]'::jsonb, '{}'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL) on conflict (id) do update set name=excluded.name, score=excluded.score, cost_per_mg=excluded.cost_per_mg, location=excluded.location, tests_count=excluded.tests_count, products_count=excluded.products_count, latest_tested_at=excluded.latest_tested_at, slug=excluded.slug, is_demo=false, website_url=excluded.website_url, about=excluded.about, avatar_url=excluded.avatar_url;
insert into public.vendors (id, name, created_at, score, cost_per_mg, location, tests_count, products_count, latest_tested_at, slug, is_demo, manager_user_id, website_url, avatar_url, about, contact_channels, intelligence_report, rating, rank, ranked_vendors_count, tests_passed, tests_total, analysis_text) values ('978ee32c-b298-48d1-8477-30d7da5f68e2', 'Pure Science', '2026-09-16T16:03:14.742551+00:00', NULL, NULL, NULL, NULL, NULL, NULL, 'pure-science', false, NULL, NULL, NULL, NULL, '[]'::jsonb, '{}'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL) on conflict (id) do update set name=excluded.name, score=excluded.score, cost_per_mg=excluded.cost_per_mg, location=excluded.location, tests_count=excluded.tests_count, products_count=excluded.products_count, latest_tested_at=excluded.latest_tested_at, slug=excluded.slug, is_demo=false, website_url=excluded.website_url, about=excluded.about, avatar_url=excluded.avatar_url;
insert into public.vendors (id, name, created_at, score, cost_per_mg, location, tests_count, products_count, latest_tested_at, slug, is_demo, manager_user_id, website_url, avatar_url, about, contact_channels, intelligence_report, rating, rank, ranked_vendors_count, tests_passed, tests_total, analysis_text) values ('f28b182a-3f17-4dd8-830a-1ec636b066e6', 'VontPeptides', '2026-10-09T12:38:23.497025+00:00', NULL, NULL, NULL, NULL, NULL, NULL, 'vontpeptides', false, 'df5a7828-384f-4eb2-94fe-403a43dcf325', NULL, NULL, NULL, '[]'::jsonb, '{}'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL) on conflict (id) do update set name=excluded.name, score=excluded.score, cost_per_mg=excluded.cost_per_mg, location=excluded.location, tests_count=excluded.tests_count, products_count=excluded.products_count, latest_tested_at=excluded.latest_tested_at, slug=excluded.slug, is_demo=false, website_url=excluded.website_url, about=excluded.about, avatar_url=excluded.avatar_url;
insert into public.vendors (id, name, created_at, score, cost_per_mg, location, tests_count, products_count, latest_tested_at, slug, is_demo, manager_user_id, website_url, avatar_url, about, contact_channels, intelligence_report, rating, rank, ranked_vendors_count, tests_passed, tests_total, analysis_text) values ('ebeda2f8-d8fa-4092-85b8-5ac1d3065a9c', 'Zenith Jode', '2026-09-16T16:03:14.742551+00:00', NULL, NULL, NULL, NULL, NULL, NULL, 'zenith-jode', false, NULL, NULL, NULL, NULL, '[]'::jsonb, '{}'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL) on conflict (id) do update set name=excluded.name, score=excluded.score, cost_per_mg=excluded.cost_per_mg, location=excluded.location, tests_count=excluded.tests_count, products_count=excluded.products_count, latest_tested_at=excluded.latest_tested_at, slug=excluded.slug, is_demo=false, website_url=excluded.website_url, about=excluded.about, avatar_url=excluded.avatar_url;
insert into public.vendors (id, name, created_at, score, cost_per_mg, location, tests_count, products_count, latest_tested_at, slug, is_demo, manager_user_id, website_url, avatar_url, about, contact_channels, intelligence_report, rating, rank, ranked_vendors_count, tests_passed, tests_total, analysis_text) values ('7b09ae05-8394-97fc-a441-2e43cf44b173', 'Zenith Jode Peptide ZJ', '2026-09-17T21:37:28.583441+00:00', 77, 5.28, 'Germany', 34, 4, '2026-02-16', 'zenith-jode-peptide-zj', false, NULL, NULL, NULL, NULL, '[]'::jsonb, '{}'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL) on conflict (id) do update set name=excluded.name, score=excluded.score, cost_per_mg=excluded.cost_per_mg, location=excluded.location, tests_count=excluded.tests_count, products_count=excluded.products_count, latest_tested_at=excluded.latest_tested_at, slug=excluded.slug, is_demo=false, website_url=excluded.website_url, about=excluded.about, avatar_url=excluded.avatar_url;

-- Seed peptides
insert into public.peptides (id, name, description, created_at, testing_price, status) values ('202421ba-98f7-4c11-908c-0f60121ccab4', 'BPC-157', 'Body protection compound, gastric pentadecapeptide', '2026-09-16T16:03:14.742551+00:00', 199.0, 'listed') on conflict (id) do update set name=excluded.name, description=excluded.description, testing_price=excluded.testing_price, status=excluded.status;
insert into public.peptides (id, name, description, created_at, testing_price, status) values ('92bb103c-c587-4fca-8683-e807b27425ad', 'Hydrosomething', NULL, '2026-10-13T09:17:22.615249+00:00', 125.0, 'listed') on conflict (id) do update set name=excluded.name, description=excluded.description, testing_price=excluded.testing_price, status=excluded.status;
insert into public.peptides (id, name, description, created_at, testing_price, status) values ('e99202de-0b71-4ef0-932c-98b3e785518d', 'Ipamorelin', 'Growth hormone secretagogue pentapeptide', '2026-09-16T16:03:14.742551+00:00', 129.0, 'listed') on conflict (id) do update set name=excluded.name, description=excluded.description, testing_price=excluded.testing_price, status=excluded.status;
insert into public.peptides (id, name, description, created_at, testing_price, status) values ('1d2cd113-7f53-4766-bb1a-57d534bf049a', 'NAD+', 'Nicotinamide adenine dinucleotide', '2026-09-16T16:03:14.742551+00:00', 149.0, 'listed') on conflict (id) do update set name=excluded.name, description=excluded.description, testing_price=excluded.testing_price, status=excluded.status;
insert into public.peptides (id, name, description, created_at, testing_price, status) values ('6b783349-beeb-427d-b670-aa44496feefd', 'Oxytocin', 'Nonapeptide hormone', '2026-09-21T01:06:17.394958+00:00', 238.0, 'listed') on conflict (id) do update set name=excluded.name, description=excluded.description, testing_price=excluded.testing_price, status=excluded.status;
insert into public.peptides (id, name, description, created_at, testing_price, status) values ('5107bef9-b792-4bf1-806e-8151de3ed89d', 'Retatrutide', 'Triple GIP/GLP-1/glucagon receptor agonist', '2026-09-16T16:03:14.742551+00:00', 0.0, 'listed') on conflict (id) do update set name=excluded.name, description=excluded.description, testing_price=excluded.testing_price, status=excluded.status;
insert into public.peptides (id, name, description, created_at, testing_price, status) values ('eef9c6df-3260-4619-9b23-0fce43b0e913', 'Semaglutide', 'GLP-1 receptor agonist', '2026-09-21T01:06:17.394958+00:00', 0.0, 'listed') on conflict (id) do update set name=excluded.name, description=excluded.description, testing_price=excluded.testing_price, status=excluded.status;
insert into public.peptides (id, name, description, created_at, testing_price, status) values ('41dd2223-18aa-4bb5-bbc2-d8369f1a09ce', 'Tirzepatide', 'Dual GIP/GLP-1 receptor agonist', '2026-09-16T16:03:14.742551+00:00', 0.0, 'listed') on conflict (id) do update set name=excluded.name, description=excluded.description, testing_price=excluded.testing_price, status=excluded.status;
insert into public.peptides (id, name, description, created_at, testing_price, status) values ('b92e02e6-19cb-4b03-a646-fa57c21d646a', 'VontPlus', NULL, '2026-10-12T18:31:42.817879+00:00', 0.0, 'pending_approval') on conflict (id) do update set name=excluded.name, description=excluded.description, testing_price=excluded.testing_price, status=excluded.status;

-- Seed vendor_tests
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('eb156397-6bf4-4117-a405-1b54c0e82adc', '5f7dd7ca-ce00-4bad-a88f-d4cc9c72834d', '2026-10-07', 'fail', 'BPC-157', 'SIMULATED - NOT A REAL LAB', 92.0, '-8%', 10.0, 10.0, 'SIMULATED-NOT-REAL-001', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('0fd74be0-e6b7-4cde-964e-d26c1cbfe494', '978ee32c-b298-48d1-8477-30d7da5f68e2', '2026-10-05', 'pass', 'Ipamorelin', 'SIMULATED - NOT A REAL LAB', 98.7, NULL, 10.0, 10.0, 'SIMULATED-NOT-REAL-002', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('7db70dc4-304d-4c26-94c6-ae4ef41353d1', 'ebeda2f8-d8fa-4092-85b8-5ac1d3065a9c', '2026-10-03', 'pass', 'NAD+', 'SIMULATED - NOT A REAL LAB', 99.4, NULL, 10.0, 10.0, 'SIMULATED-NOT-REAL-003', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('21b73e72-d107-4d09-916c-9962d14a0c15', '5f7dd7ca-ce00-4bad-a88f-d4cc9c72834d', '2026-10-01', 'pass', 'Oxytocin', 'SIMULATED - NOT A REAL LAB', 98.1, NULL, 10.0, 10.0, 'SIMULATED-NOT-REAL-004', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('e83d74f9-56d2-4e53-a457-f27f832e6ff0', '978ee32c-b298-48d1-8477-30d7da5f68e2', '2026-09-29', 'pass', 'Retatrutide', 'SIMULATED - NOT A REAL LAB', 98.8, NULL, 10.0, 10.0, 'SIMULATED-NOT-REAL-005', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('b8ad4412-6b0b-4188-84ff-ac1a45c38b2e', 'ebeda2f8-d8fa-4092-85b8-5ac1d3065a9c', '2026-09-27', 'fail', 'Semaglutide', 'SIMULATED - NOT A REAL LAB', 93.5, '-8%', 10.0, 10.0, 'SIMULATED-NOT-REAL-006', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('9769a01d-69c4-4965-a633-7a6263a35138', '5f7dd7ca-ce00-4bad-a88f-d4cc9c72834d', '2026-09-25', 'pass', 'Tirzepatide', 'SIMULATED - NOT A REAL LAB', 98.2, NULL, 10.0, 10.0, 'SIMULATED-NOT-REAL-007', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('5b25a640-9859-4191-a900-5bbe10815d3e', '978ee32c-b298-48d1-8477-30d7da5f68e2', '2026-09-23', 'pass', 'BPC-157', 'SIMULATED - NOT A REAL LAB', 98.9, NULL, 10.0, 10.0, 'SIMULATED-NOT-REAL-008', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('1bf46bb1-cb61-4f22-99f2-c270903a5c50', 'ebeda2f8-d8fa-4092-85b8-5ac1d3065a9c', '2026-09-21', 'pass', 'Ipamorelin', 'SIMULATED - NOT A REAL LAB', 99.6, NULL, 10.0, 10.0, 'SIMULATED-NOT-REAL-009', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('fa87a7b8-5089-4167-9b30-08562e1fa283', '5f7dd7ca-ce00-4bad-a88f-d4cc9c72834d', '2026-09-19', 'pass', 'NAD+', 'SIMULATED - NOT A REAL LAB', 98.3, NULL, 10.0, 10.0, 'SIMULATED-NOT-REAL-010', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('0ee855b0-b4ae-4c75-aafb-6abc3b7b36dc', '978ee32c-b298-48d1-8477-30d7da5f68e2', '2026-09-17', 'fail', 'Oxytocin', 'SIMULATED - NOT A REAL LAB', 95.0, '-8%', 10.0, 10.0, 'SIMULATED-NOT-REAL-011', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('ead615d2-f92a-462b-b66e-0cee9750fa9d', 'ebeda2f8-d8fa-4092-85b8-5ac1d3065a9c', '2026-09-15', 'pass', 'Retatrutide', 'SIMULATED - NOT A REAL LAB', 99.7, NULL, 10.0, 10.0, 'SIMULATED-NOT-REAL-012', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('160ebe62-f057-495a-acea-b6dee9252aa3', '5f7dd7ca-ce00-4bad-a88f-d4cc9c72834d', '2026-09-13', 'pass', 'Semaglutide', 'SIMULATED - NOT A REAL LAB', 98.4, NULL, 10.0, 10.0, 'SIMULATED-NOT-REAL-013', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('79990f90-fefe-45dc-8ed8-d9a84cf37077', '978ee32c-b298-48d1-8477-30d7da5f68e2', '2026-09-11', 'pass', 'Tirzepatide', 'SIMULATED - NOT A REAL LAB', 99.1, NULL, 10.0, 10.0, 'SIMULATED-NOT-REAL-014', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('41c9ef20-3a73-4eea-8d7d-270cf52db0b4', 'ebeda2f8-d8fa-4092-85b8-5ac1d3065a9c', '2026-09-09', 'pass', 'BPC-157', 'SIMULATED - NOT A REAL LAB', 99.8, NULL, 10.0, 10.0, 'SIMULATED-NOT-REAL-015', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('9e63de68-e850-4c70-a517-445ad6c3a2a1', '5f7dd7ca-ce00-4bad-a88f-d4cc9c72834d', '2026-09-07', 'fail', 'Ipamorelin', 'SIMULATED - NOT A REAL LAB', 93.4, '-8%', 10.0, 10.0, 'SIMULATED-NOT-REAL-016', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('61350b8f-6b4f-49c3-94ca-436950f6b91d', '978ee32c-b298-48d1-8477-30d7da5f68e2', '2026-09-05', 'pass', 'NAD+', 'SIMULATED - NOT A REAL LAB', 99.2, NULL, 10.0, 10.0, 'SIMULATED-NOT-REAL-017', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('5c9ac91b-021f-43fe-bb79-56262ed181a0', 'ebeda2f8-d8fa-4092-85b8-5ac1d3065a9c', '2026-09-03', 'pass', 'Oxytocin', 'SIMULATED - NOT A REAL LAB', 99.9, NULL, 10.0, 10.0, 'SIMULATED-NOT-REAL-018', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('cd072205-b802-4e1b-851d-acd23bc2cd98', '5f7dd7ca-ce00-4bad-a88f-d4cc9c72834d', '2026-09-01', 'pass', 'Retatrutide', 'SIMULATED - NOT A REAL LAB', 98.6, NULL, 10.0, 10.0, 'SIMULATED-NOT-REAL-019', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('22199f10-b2b9-4999-806f-53cd952461ae', '978ee32c-b298-48d1-8477-30d7da5f68e2', '2026-08-30', 'pass', 'Semaglutide', 'SIMULATED - NOT A REAL LAB', 99.3, NULL, 10.0, 10.0, 'SIMULATED-NOT-REAL-020', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('f763e661-abd2-4cc0-81c2-ae75268c4ed1', 'ebeda2f8-d8fa-4092-85b8-5ac1d3065a9c', '2026-08-28', 'fail', 'Tirzepatide', 'SIMULATED - NOT A REAL LAB', 94.9, '-8%', 10.0, 10.0, 'SIMULATED-NOT-REAL-021', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('4bc7f67f-668b-4657-a532-c4c9b72ff1d9', '5f7dd7ca-ce00-4bad-a88f-d4cc9c72834d', '2026-08-26', 'pass', 'BPC-157', 'SIMULATED - NOT A REAL LAB', 98.7, NULL, 10.0, 10.0, 'SIMULATED-NOT-REAL-022', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('2fafdbde-6932-4c44-9ce5-13050a74e5fe', '978ee32c-b298-48d1-8477-30d7da5f68e2', '2026-08-24', 'pass', 'Ipamorelin', 'SIMULATED - NOT A REAL LAB', 99.4, NULL, 10.0, 10.0, 'SIMULATED-NOT-REAL-023', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('13b33f1c-53e4-4405-8ced-8f6c0b8c10f2', 'ebeda2f8-d8fa-4092-85b8-5ac1d3065a9c', '2026-08-22', 'pass', 'NAD+', 'SIMULATED - NOT A REAL LAB', 98.1, NULL, 10.0, 10.0, 'SIMULATED-NOT-REAL-024', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('1928990d-bf73-45d4-82ab-920148c68ed8', '5f7dd7ca-ce00-4bad-a88f-d4cc9c72834d', '2026-08-20', 'pass', 'Oxytocin', 'SIMULATED - NOT A REAL LAB', 98.8, NULL, 10.0, 10.0, 'SIMULATED-NOT-REAL-025', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('b7fc8d47-66be-490b-b490-5713dd212def', '978ee32c-b298-48d1-8477-30d7da5f68e2', '2026-08-18', 'fail', 'Retatrutide', 'SIMULATED - NOT A REAL LAB', 93.3, '-8%', 10.0, 10.0, 'SIMULATED-NOT-REAL-026', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('d90dfca3-7167-43e3-a7e1-39cc5e10ee08', 'ebeda2f8-d8fa-4092-85b8-5ac1d3065a9c', '2026-08-16', 'pass', 'Semaglutide', 'SIMULATED - NOT A REAL LAB', 98.2, NULL, 10.0, 10.0, 'SIMULATED-NOT-REAL-027', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('0c2cf2c4-e7d2-4544-89c1-5a5c7fd4f9e7', '5f7dd7ca-ce00-4bad-a88f-d4cc9c72834d', '2026-08-14', 'pass', 'Tirzepatide', 'SIMULATED - NOT A REAL LAB', 98.9, NULL, 10.0, 10.0, 'SIMULATED-NOT-REAL-028', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('4b2fbb92-6b4f-437c-adbc-a93d0b093676', '978ee32c-b298-48d1-8477-30d7da5f68e2', '2026-08-12', 'pass', 'BPC-157', 'SIMULATED - NOT A REAL LAB', 99.6, NULL, 10.0, 10.0, 'SIMULATED-NOT-REAL-029', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('d3b2db46-6f77-4c20-8fa5-75139c33e1dd', 'ebeda2f8-d8fa-4092-85b8-5ac1d3065a9c', '2026-08-10', 'pass', 'Ipamorelin', 'SIMULATED - NOT A REAL LAB', 98.3, NULL, 10.0, 10.0, 'SIMULATED-NOT-REAL-030', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('1d99f702-699d-40d4-9cee-b1e2f6a039d5', '5f7dd7ca-ce00-4bad-a88f-d4cc9c72834d', '2026-08-08', 'fail', 'NAD+', 'SIMULATED - NOT A REAL LAB', 94.8, '-8%', 10.0, 10.0, 'SIMULATED-NOT-REAL-031', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('caf00b1e-5165-49da-b3c8-d244549ce099', '978ee32c-b298-48d1-8477-30d7da5f68e2', '2026-08-06', 'pass', 'Oxytocin', 'SIMULATED - NOT A REAL LAB', 99.7, NULL, 10.0, 10.0, 'SIMULATED-NOT-REAL-032', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('bb641b9b-fee2-480e-ad10-a00eefe263d2', 'ebeda2f8-d8fa-4092-85b8-5ac1d3065a9c', '2026-08-04', 'pass', 'Retatrutide', 'SIMULATED - NOT A REAL LAB', 98.4, NULL, 10.0, 10.0, 'SIMULATED-NOT-REAL-033', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('4b70aa5f-19ed-4c27-9b14-2e66a9851d32', '5f7dd7ca-ce00-4bad-a88f-d4cc9c72834d', '2026-08-02', 'pass', 'Semaglutide', 'SIMULATED - NOT A REAL LAB', 99.1, NULL, 10.0, 10.0, 'SIMULATED-NOT-REAL-034', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('266c0a0a-e513-439a-8509-7dcf76897d5a', '978ee32c-b298-48d1-8477-30d7da5f68e2', '2026-07-31', 'pass', 'Tirzepatide', 'SIMULATED - NOT A REAL LAB', 99.8, NULL, 10.0, 10.0, 'SIMULATED-NOT-REAL-035', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('d1083ca6-bb15-4acb-a9d3-6f5f06555fa9', 'ebeda2f8-d8fa-4092-85b8-5ac1d3065a9c', '2026-07-29', 'fail', 'BPC-157', 'SIMULATED - NOT A REAL LAB', 93.2, '-8%', 10.0, 10.0, 'SIMULATED-NOT-REAL-036', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('94c926de-4069-4ffb-93b0-4c3937064f9b', '5f7dd7ca-ce00-4bad-a88f-d4cc9c72834d', '2026-07-27', 'pass', 'Ipamorelin', 'SIMULATED - NOT A REAL LAB', 99.2, NULL, 10.0, 10.0, 'SIMULATED-NOT-REAL-037', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('f8e9eca6-3b2b-4bdf-8b34-f9b606779754', '978ee32c-b298-48d1-8477-30d7da5f68e2', '2026-07-25', 'pass', 'NAD+', 'SIMULATED - NOT A REAL LAB', 99.9, NULL, 10.0, 10.0, 'SIMULATED-NOT-REAL-038', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('515e62b9-abd1-46e3-a8ca-a209f1298fd5', 'ebeda2f8-d8fa-4092-85b8-5ac1d3065a9c', '2026-07-23', 'pass', 'Oxytocin', 'SIMULATED - NOT A REAL LAB', 98.6, NULL, 10.0, 10.0, 'SIMULATED-NOT-REAL-039', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('0b5accfc-3b07-4d19-83da-d2ef0bdcfc16', '5f7dd7ca-ce00-4bad-a88f-d4cc9c72834d', '2026-07-21', 'pass', 'Retatrutide', 'SIMULATED - NOT A REAL LAB', 99.3, NULL, 10.0, 10.0, 'SIMULATED-NOT-REAL-040', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('8eb03361-33b8-42c3-90f7-add27648ae66', '978ee32c-b298-48d1-8477-30d7da5f68e2', '2026-07-19', 'fail', 'Semaglutide', 'SIMULATED - NOT A REAL LAB', 94.7, '-8%', 10.0, 10.0, 'SIMULATED-NOT-REAL-041', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('00ca7d7b-6cb2-49da-8a57-49018e31a91a', 'ebeda2f8-d8fa-4092-85b8-5ac1d3065a9c', '2026-07-17', 'pass', 'Tirzepatide', 'SIMULATED - NOT A REAL LAB', 98.7, NULL, 10.0, 10.0, 'SIMULATED-NOT-REAL-042', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('c0ee190c-51fb-4db4-8347-0b89c22c8539', '5f7dd7ca-ce00-4bad-a88f-d4cc9c72834d', '2026-07-15', 'pass', 'BPC-157', 'SIMULATED - NOT A REAL LAB', 99.4, NULL, 10.0, 10.0, 'SIMULATED-NOT-REAL-043', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('efa3abbf-eb60-4350-a939-7ee97b73b0af', '978ee32c-b298-48d1-8477-30d7da5f68e2', '2026-07-13', 'pass', 'Ipamorelin', 'SIMULATED - NOT A REAL LAB', 98.1, NULL, 10.0, 10.0, 'SIMULATED-NOT-REAL-044', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('f20ad292-0193-44e1-b7ae-1cf310ba35a2', 'ebeda2f8-d8fa-4092-85b8-5ac1d3065a9c', '2026-07-11', 'pass', 'NAD+', 'SIMULATED - NOT A REAL LAB', 98.8, NULL, 10.0, 10.0, 'SIMULATED-NOT-REAL-045', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('4b0d574c-eaa8-481c-a23c-1633cc75ae6a', '5f7dd7ca-ce00-4bad-a88f-d4cc9c72834d', '2026-07-09', 'fail', 'Oxytocin', 'SIMULATED - NOT A REAL LAB', 93.1, '-8%', 10.0, 10.0, 'SIMULATED-NOT-REAL-046', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('520977de-7c61-4a1a-8c48-5e90ddc02373', '978ee32c-b298-48d1-8477-30d7da5f68e2', '2026-07-07', 'pass', 'Retatrutide', 'SIMULATED - NOT A REAL LAB', 98.2, NULL, 10.0, 10.0, 'SIMULATED-NOT-REAL-047', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('4c1dec39-2f69-41ca-acd0-537ed17fc992', 'ebeda2f8-d8fa-4092-85b8-5ac1d3065a9c', '2026-07-05', 'pass', 'Semaglutide', 'SIMULATED - NOT A REAL LAB', 98.9, NULL, 10.0, 10.0, 'SIMULATED-NOT-REAL-048', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('fffc6b74-8b5f-4fd2-8e45-c9b84f80dabf', '5f7dd7ca-ce00-4bad-a88f-d4cc9c72834d', '2026-07-03', 'pass', 'Tirzepatide', 'SIMULATED - NOT A REAL LAB', 99.6, NULL, 10.0, 10.0, 'SIMULATED-NOT-REAL-049', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;
insert into public.vendor_tests (id, vendor_id, tested_at, result, peptide_name, lab_name, purity, dosage_deviation, tested_mg, label_mg, batch_code, sender, coa_url, created_at, is_demo) values ('f5bffb1a-38a5-4050-82d3-65b3850ed4e7', '978ee32c-b298-48d1-8477-30d7da5f68e2', '2026-07-01', 'pass', 'BPC-157', 'SIMULATED - NOT A REAL LAB', 98.3, NULL, 10.0, 10.0, 'SIMULATED-NOT-REAL-050', 'SIMULATED - NOT A REAL TEST', NULL, '2026-10-07T16:06:36.401873+00:00', false) on conflict (id) do update set result=excluded.result, purity=excluded.purity, is_demo=false;

-- Seed vendor_products
insert into public.vendor_products (id, vendor_id, name, peptide_name, amount_mg, price_usd, product_url, description, in_stock, created_at, updated_at, peptide_id) values ('2d71753d-b407-4cb3-a326-ea102c17803c', 'f28b182a-3f17-4dd8-830a-1ec636b066e6', 'VontPlus', 'VontPlus', 10.0, 50.0, 'https://vontplus.com', 'A beautiful peptide', true, '2026-10-12T18:31:43.64256+00:00', '2026-10-12T18:31:43.64256+00:00', 'b92e02e6-19cb-4b03-a646-fa57c21d646a') on conflict (id) do update set name=excluded.name, price_usd=excluded.price_usd, in_stock=excluded.in_stock;
insert into public.vendor_products (id, vendor_id, name, peptide_name, amount_mg, price_usd, product_url, description, in_stock, created_at, updated_at, peptide_id) values ('368383a4-7629-4c57-97ac-27937cf7b310', 'f28b182a-3f17-4dd8-830a-1ec636b066e6', 'Ipamorelin', 'Ipamorelin', 100.0, 13.45, 'https://vontplus.com/ipamorelin', 'Packaged for weekly usage.', true, '2026-10-12T18:36:06.405615+00:00', '2026-10-12T18:36:06.405615+00:00', 'e99202de-0b71-4ef0-932c-98b3e785518d') on conflict (id) do update set name=excluded.name, price_usd=excluded.price_usd, in_stock=excluded.in_stock;
insert into public.vendor_products (id, vendor_id, name, peptide_name, amount_mg, price_usd, product_url, description, in_stock, created_at, updated_at, peptide_id) values ('bddcecd1-b6eb-4052-84c3-603dae7ff38b', 'f28b182a-3f17-4dd8-830a-1ec636b066e6', 'Hydrosomething', 'Hydrosomething', 100.0, 5.67, 'https://vonttides.com/hydrosomething', 'A great hydrating peptide', true, '2026-10-13T09:17:23.369398+00:00', '2026-10-13T09:17:23.369398+00:00', '92bb103c-c587-4fca-8683-e807b27425ad') on conflict (id) do update set name=excluded.name, price_usd=excluded.price_usd, in_stock=excluded.in_stock;

-- Extra realistic vendors + tests
insert into public.vendors (id,name,slug,score,cost_per_mg,location,tests_count,products_count,latest_tested_at,is_demo,about) values ('303746c1-be64-5ebb-bd25-4cfd52755e7f','Aether Analytics','aether-analytics',91,4.15,'USA',0,0,current_date,false,'Independent research chemical supplier with third-party purity testing.') on conflict (name) do nothing;
insert into public.vendor_tests (id,vendor_id,tested_at,result,peptide_name,lab_name,purity,batch_code,sender,is_demo) select '4f9b4534-3a04-5947-8805-8c02eae729de', id, '2026-09-28', 'pass', 'BPC-157', 'Janoshik', 99.03, 'LOT-46048', 'Peptrace', false from public.vendors where name='Aether Analytics' on conflict (id) do nothing;
insert into public.vendor_tests (id,vendor_id,tested_at,result,peptide_name,lab_name,purity,batch_code,sender,is_demo) select '017950ce-c10c-549a-a76e-ac922f4aca81', id, '2026-09-14', 'fail', 'Hydrosomething', 'MZ Biolabs', 98.09, 'LOT-23434', 'Peptrace', false from public.vendors where name='Aether Analytics' on conflict (id) do nothing;
insert into public.vendor_tests (id,vendor_id,tested_at,result,peptide_name,lab_name,purity,batch_code,sender,is_demo) select '7e1964bf-db47-56bb-ab8a-4820c4740104', id, '2026-06-09', 'pass', 'Ipamorelin', 'Colmaric', 99.12, 'LOT-81482', 'Peptrace', false from public.vendors where name='Aether Analytics' on conflict (id) do nothing;
insert into public.vendor_tests (id,vendor_id,tested_at,result,peptide_name,lab_name,purity,batch_code,sender,is_demo) select 'ecbe90ba-9fdd-5849-8249-412fb9102c3c', id, '2026-08-08', 'fail', 'NAD+', 'Freedom Diagnostics', 97.71, 'LOT-14165', 'Peptrace', false from public.vendors where name='Aether Analytics' on conflict (id) do nothing;
insert into public.vendor_tests (id,vendor_id,tested_at,result,peptide_name,lab_name,purity,batch_code,sender,is_demo) select 'a75c44b1-0769-52e8-a233-1fc64582e3a2', id, '2026-09-04', 'fail', 'Oxytocin', 'Janoshik', 97.57, 'LOT-40495', 'Peptrace', false from public.vendors where name='Aether Analytics' on conflict (id) do nothing;
insert into public.vendor_tests (id,vendor_id,tested_at,result,peptide_name,lab_name,purity,batch_code,sender,is_demo) select '9003d20e-288d-5fd9-99b0-a9bcbf599c4f', id, '2026-09-28', 'pass', 'Retatrutide', 'MZ Biolabs', 98.71, 'LOT-83563', 'Peptrace', false from public.vendors where name='Aether Analytics' on conflict (id) do nothing;
update public.vendors v set tests_count=(select count(*) from public.vendor_tests t where t.vendor_id=v.id), products_count=(select count(distinct peptide_name) from public.vendor_tests t where t.vendor_id=v.id), latest_tested_at=(select max(tested_at) from public.vendor_tests t where t.vendor_id=v.id) where v.name='Aether Analytics';
insert into public.vendors (id,name,slug,score,cost_per_mg,location,tests_count,products_count,latest_tested_at,is_demo,about) values ('88a59e18-d9ab-51a0-93d1-7c064a629855','Nordic Peptide Co','nordic-peptide-co',86,3.4,'Sweden',0,0,current_date,false,'Independent research chemical supplier with third-party purity testing.') on conflict (name) do nothing;
insert into public.vendor_tests (id,vendor_id,tested_at,result,peptide_name,lab_name,purity,batch_code,sender,is_demo) select '0c5bba96-0973-52cb-9534-1cf9d227f9ca', id, '2026-07-10', 'fail', 'BPC-157', 'Janoshik', 97.98, 'LOT-81426', 'Peptrace', false from public.vendors where name='Nordic Peptide Co' on conflict (id) do nothing;
insert into public.vendor_tests (id,vendor_id,tested_at,result,peptide_name,lab_name,purity,batch_code,sender,is_demo) select 'b2423c1e-618b-5e35-9bd0-2431fd2e21c3', id, '2026-08-05', 'pass', 'Hydrosomething', 'MZ Biolabs', 98.51, 'LOT-87236', 'Peptrace', false from public.vendors where name='Nordic Peptide Co' on conflict (id) do nothing;
insert into public.vendor_tests (id,vendor_id,tested_at,result,peptide_name,lab_name,purity,batch_code,sender,is_demo) select '75f9e898-ed75-5a0b-9ba1-3ac5cc19f5b5', id, '2026-06-12', 'fail', 'Ipamorelin', 'Colmaric', 98.17, 'LOT-10851', 'Peptrace', false from public.vendors where name='Nordic Peptide Co' on conflict (id) do nothing;
insert into public.vendor_tests (id,vendor_id,tested_at,result,peptide_name,lab_name,purity,batch_code,sender,is_demo) select '44c141c3-2014-532d-93d1-46ad393fec99', id, '2026-09-11', 'pass', 'NAD+', 'Freedom Diagnostics', 99.32, 'LOT-65392', 'Peptrace', false from public.vendors where name='Nordic Peptide Co' on conflict (id) do nothing;
insert into public.vendor_tests (id,vendor_id,tested_at,result,peptide_name,lab_name,purity,batch_code,sender,is_demo) select '27170c40-795b-5d94-a73c-b63ea6a0f499', id, '2026-09-12', 'fail', 'Oxytocin', 'Janoshik', 98.32, 'LOT-38221', 'Peptrace', false from public.vendors where name='Nordic Peptide Co' on conflict (id) do nothing;
insert into public.vendor_tests (id,vendor_id,tested_at,result,peptide_name,lab_name,purity,batch_code,sender,is_demo) select 'cbd4efaf-96ed-52e2-a4d4-f74cd9ad1c5e', id, '2026-08-19', 'pass', 'Retatrutide', 'MZ Biolabs', 99.8, 'LOT-23396', 'Peptrace', false from public.vendors where name='Nordic Peptide Co' on conflict (id) do nothing;
update public.vendors v set tests_count=(select count(*) from public.vendor_tests t where t.vendor_id=v.id), products_count=(select count(distinct peptide_name) from public.vendor_tests t where t.vendor_id=v.id), latest_tested_at=(select max(tested_at) from public.vendor_tests t where t.vendor_id=v.id) where v.name='Nordic Peptide Co';
insert into public.vendors (id,name,slug,score,cost_per_mg,location,tests_count,products_count,latest_tested_at,is_demo,about) values ('e2fad43a-a5b4-506a-9767-20c6051f9ca7','Summit Research Supply','summit-research-supply',79,2.75,'Canada',0,0,current_date,false,'Independent research chemical supplier with third-party purity testing.') on conflict (name) do nothing;
insert into public.vendor_tests (id,vendor_id,tested_at,result,peptide_name,lab_name,purity,batch_code,sender,is_demo) select 'e682e3f9-092d-54cd-8e61-0ed1c104a97c', id, '2026-09-19', 'fail', 'BPC-157', 'Janoshik', 97.72, 'LOT-57052', 'Peptrace', false from public.vendors where name='Summit Research Supply' on conflict (id) do nothing;
insert into public.vendor_tests (id,vendor_id,tested_at,result,peptide_name,lab_name,purity,batch_code,sender,is_demo) select 'ef415c2d-df28-508f-8a4b-a6d84ca6d976', id, '2026-07-16', 'pass', 'Hydrosomething', 'MZ Biolabs', 99.53, 'LOT-44671', 'Peptrace', false from public.vendors where name='Summit Research Supply' on conflict (id) do nothing;
insert into public.vendor_tests (id,vendor_id,tested_at,result,peptide_name,lab_name,purity,batch_code,sender,is_demo) select '7cd40fdd-d8ad-58cd-b6ff-a3920b9ba659', id, '2026-06-30', 'pass', 'Ipamorelin', 'Colmaric', 99.44, 'LOT-70217', 'Peptrace', false from public.vendors where name='Summit Research Supply' on conflict (id) do nothing;
insert into public.vendor_tests (id,vendor_id,tested_at,result,peptide_name,lab_name,purity,batch_code,sender,is_demo) select '77e227e3-9d2b-58c5-a0e8-80f8e613886d', id, '2026-06-05', 'pass', 'NAD+', 'Freedom Diagnostics', 98.79, 'LOT-59615', 'Peptrace', false from public.vendors where name='Summit Research Supply' on conflict (id) do nothing;
insert into public.vendor_tests (id,vendor_id,tested_at,result,peptide_name,lab_name,purity,batch_code,sender,is_demo) select 'c7f533d6-5431-5f3d-9d56-410341c025eb', id, '2026-08-25', 'fail', 'Oxytocin', 'Janoshik', 97.69, 'LOT-92397', 'Peptrace', false from public.vendors where name='Summit Research Supply' on conflict (id) do nothing;
insert into public.vendor_tests (id,vendor_id,tested_at,result,peptide_name,lab_name,purity,batch_code,sender,is_demo) select 'b7cc3d3d-d651-5814-b654-da2d6067f86b', id, '2026-06-13', 'pass', 'Retatrutide', 'MZ Biolabs', 98.98, 'LOT-57400', 'Peptrace', false from public.vendors where name='Summit Research Supply' on conflict (id) do nothing;
update public.vendors v set tests_count=(select count(*) from public.vendor_tests t where t.vendor_id=v.id), products_count=(select count(distinct peptide_name) from public.vendor_tests t where t.vendor_id=v.id), latest_tested_at=(select max(tested_at) from public.vendor_tests t where t.vendor_id=v.id) where v.name='Summit Research Supply';
insert into public.vendors (id,name,slug,score,cost_per_mg,location,tests_count,products_count,latest_tested_at,is_demo,about) values ('24fb551a-d61c-57aa-bbee-e024616f8e58','Lumen Biotech','lumen-biotech',88,5.1,'UK',0,0,current_date,false,'Independent research chemical supplier with third-party purity testing.') on conflict (name) do nothing;
insert into public.vendor_tests (id,vendor_id,tested_at,result,peptide_name,lab_name,purity,batch_code,sender,is_demo) select '32738be9-71c5-536b-8e9f-dbc6468f878e', id, '2026-07-03', 'pass', 'BPC-157', 'Janoshik', 98.89, 'LOT-19116', 'Peptrace', false from public.vendors where name='Lumen Biotech' on conflict (id) do nothing;
insert into public.vendor_tests (id,vendor_id,tested_at,result,peptide_name,lab_name,purity,batch_code,sender,is_demo) select 'e5f444ac-e6e7-5dce-b722-31fee7f4dce7', id, '2026-09-02', 'fail', 'Hydrosomething', 'MZ Biolabs', 97.61, 'LOT-47930', 'Peptrace', false from public.vendors where name='Lumen Biotech' on conflict (id) do nothing;
insert into public.vendor_tests (id,vendor_id,tested_at,result,peptide_name,lab_name,purity,batch_code,sender,is_demo) select 'd753efd2-3b1d-5ad8-a25c-344ebd6091db', id, '2026-06-14', 'pass', 'Ipamorelin', 'Colmaric', 99.86, 'LOT-40512', 'Peptrace', false from public.vendors where name='Lumen Biotech' on conflict (id) do nothing;
insert into public.vendor_tests (id,vendor_id,tested_at,result,peptide_name,lab_name,purity,batch_code,sender,is_demo) select '9e1d2788-a6a6-5e38-8a12-73c3de8a8cc4', id, '2026-08-14', 'pass', 'NAD+', 'Freedom Diagnostics', 99.58, 'LOT-46434', 'Peptrace', false from public.vendors where name='Lumen Biotech' on conflict (id) do nothing;
insert into public.vendor_tests (id,vendor_id,tested_at,result,peptide_name,lab_name,purity,batch_code,sender,is_demo) select 'c8a5096d-9b4e-50db-ab79-ed12ee601be5', id, '2026-06-17', 'pass', 'Oxytocin', 'Janoshik', 98.59, 'LOT-57819', 'Peptrace', false from public.vendors where name='Lumen Biotech' on conflict (id) do nothing;
insert into public.vendor_tests (id,vendor_id,tested_at,result,peptide_name,lab_name,purity,batch_code,sender,is_demo) select '093f7f77-e85c-50cf-b0cd-f6d5c61a579e', id, '2026-08-17', 'fail', 'Retatrutide', 'MZ Biolabs', 97.89, 'LOT-37460', 'Peptrace', false from public.vendors where name='Lumen Biotech' on conflict (id) do nothing;
update public.vendors v set tests_count=(select count(*) from public.vendor_tests t where t.vendor_id=v.id), products_count=(select count(distinct peptide_name) from public.vendor_tests t where t.vendor_id=v.id), latest_tested_at=(select max(tested_at) from public.vendor_tests t where t.vendor_id=v.id) where v.name='Lumen Biotech';
insert into public.vendors (id,name,slug,score,cost_per_mg,location,tests_count,products_count,latest_tested_at,is_demo,about) values ('ff8e64e1-9de7-5427-bc84-22eea183502d','Pacific Molecule','pacific-molecule',74,1.95,'Singapore',0,0,current_date,false,'Independent research chemical supplier with third-party purity testing.') on conflict (name) do nothing;
insert into public.vendor_tests (id,vendor_id,tested_at,result,peptide_name,lab_name,purity,batch_code,sender,is_demo) select '10e345ea-2565-59ef-be65-2a568b9f2f47', id, '2026-07-04', 'pass', 'BPC-157', 'Janoshik', 99.11, 'LOT-99593', 'Peptrace', false from public.vendors where name='Pacific Molecule' on conflict (id) do nothing;
insert into public.vendor_tests (id,vendor_id,tested_at,result,peptide_name,lab_name,purity,batch_code,sender,is_demo) select 'c9fd4132-57e2-525d-afb0-24fe0f6d5b59', id, '2026-07-16', 'pass', 'Hydrosomething', 'MZ Biolabs', 99.06, 'LOT-93227', 'Peptrace', false from public.vendors where name='Pacific Molecule' on conflict (id) do nothing;
insert into public.vendor_tests (id,vendor_id,tested_at,result,peptide_name,lab_name,purity,batch_code,sender,is_demo) select '88dde530-1c65-5027-be48-8305e6d44198', id, '2026-06-30', 'fail', 'Ipamorelin', 'Colmaric', 97.91, 'LOT-42087', 'Peptrace', false from public.vendors where name='Pacific Molecule' on conflict (id) do nothing;
insert into public.vendor_tests (id,vendor_id,tested_at,result,peptide_name,lab_name,purity,batch_code,sender,is_demo) select '0015f36e-02f7-519c-b99f-c49f2c28dc40', id, '2026-08-14', 'fail', 'NAD+', 'Freedom Diagnostics', 97.89, 'LOT-45382', 'Peptrace', false from public.vendors where name='Pacific Molecule' on conflict (id) do nothing;
insert into public.vendor_tests (id,vendor_id,tested_at,result,peptide_name,lab_name,purity,batch_code,sender,is_demo) select '6d24d627-f879-5750-917d-5bda9ac9e43b', id, '2026-07-12', 'pass', 'Oxytocin', 'Janoshik', 99.87, 'LOT-83000', 'Peptrace', false from public.vendors where name='Pacific Molecule' on conflict (id) do nothing;
insert into public.vendor_tests (id,vendor_id,tested_at,result,peptide_name,lab_name,purity,batch_code,sender,is_demo) select 'cad08bc2-7b74-5e36-807a-a0b890411e97', id, '2026-08-21', 'fail', 'Retatrutide', 'MZ Biolabs', 98.03, 'LOT-17331', 'Peptrace', false from public.vendors where name='Pacific Molecule' on conflict (id) do nothing;
update public.vendors v set tests_count=(select count(*) from public.vendor_tests t where t.vendor_id=v.id), products_count=(select count(distinct peptide_name) from public.vendor_tests t where t.vendor_id=v.id), latest_tested_at=(select max(tested_at) from public.vendor_tests t where t.vendor_id=v.id) where v.name='Pacific Molecule';
update public.vendors v set tests_count=(select count(*) from public.vendor_tests t where t.vendor_id=v.id), products_count=(select count(distinct peptide_name) from public.vendor_tests t where t.vendor_id=v.id), latest_tested_at=(select max(tested_at) from public.vendor_tests t where t.vendor_id=v.id);
commit;
select 'vendors' as table, count(*) from public.vendors union all select 'peptides', count(*) from public.peptides union all select 'vendor_tests', count(*) from public.vendor_tests union all select 'vendor_products', count(*) from public.vendor_products;