-- Defense-in-depth for server-owned operational data. RLS already denies
-- browser roles, but explicit grants are removed so an accidental policy
-- cannot expose credentials, sessions, audit data, privacy records, or PHI.

revoke all on table public.native_credentials from anon, authenticated;
revoke all on table public.customer_sessions from anon, authenticated;
revoke all on table public.account_identity_links from anon, authenticated;
revoke all on table public.account_merge_archive from anon, authenticated;
revoke all on table public.admin_users from anon, authenticated;
revoke all on table public.admin_sessions from anon, authenticated;
revoke all on table public.admin_audit_log from anon, authenticated;
revoke all on table public.account_admin_state from anon, authenticated;
revoke all on table public.subscriptions from anon, authenticated;
revoke all on table public.billing_webhook_events from anon, authenticated;
revoke all on table public.notification_preferences from anon, authenticated;
revoke all on table public.notification_events from anon, authenticated;
revoke all on table public.user_consents from anon, authenticated;
revoke all on table public.data_export_requests from anon, authenticated;
revoke all on table public.account_deletion_requests from anon, authenticated;
revoke all on table public.support_requests from anon, authenticated;
revoke all on table public.support_internal_notes from anon, authenticated;
revoke all on table public.system_events from anon, authenticated;

-- Keep all user-generated objects private and constrain storage-level MIME
-- handling as a second line of defense behind API magic-byte validation.
update storage.buckets
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']::text[]
where id = 'profile_photos';

update storage.buckets
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[]
where id = 'form-uploads';

update storage.buckets
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['application/json']::text[]
where id = 'data-exports';
