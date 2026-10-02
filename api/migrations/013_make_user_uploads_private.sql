-- Remove permanent public access to user-uploaded photos, COAs, and proofs.
-- The API now stores object paths and issues short-lived signed URLs only
-- after authenticating the owner.

update storage.buckets
set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']::text[]
where id = 'profile_photos';

update storage.buckets
set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[]
where id = 'form-uploads';

update public.user_profiles
set avatar_url = split_part(
  split_part(avatar_url, '/object/public/profile_photos/', 2),
  '?',
  1
)
where avatar_url like '%/object/public/profile_photos/%';

update public.shipment_samples
set batch_proof_url = split_part(
  split_part(batch_proof_url, '/object/public/form-uploads/', 2),
  '?',
  1
)
where batch_proof_url like '%/object/public/form-uploads/%';

update public.shipment_samples
set coa_file_url = split_part(
  split_part(coa_file_url, '/object/public/form-uploads/', 2),
  '?',
  1
)
where coa_file_url like '%/object/public/form-uploads/%';

update public.shipment_samples
set proof_file_url = split_part(
  split_part(proof_file_url, '/object/public/form-uploads/', 2),
  '?',
  1
)
where proof_file_url like '%/object/public/form-uploads/%';

update public.shipment_samples
set coa_url = split_part(
  split_part(coa_url, '/object/public/form-uploads/', 2),
  '?',
  1
)
where coa_url like '%/object/public/form-uploads/%';

