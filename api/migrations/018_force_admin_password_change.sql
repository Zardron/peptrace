alter table public.admin_users
  add column if not exists must_change_password boolean not null default false;

-- A never-used bootstrap credential must be rotated by its first operator.
update public.admin_users
set must_change_password = true
where password_changed_at is null and last_login_at is null;
