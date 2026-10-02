-- Consent evidence remains immutable, but deleting an account must be able to
-- clear its direct foreign key. The subject hash and every evidentiary field
-- remain unchanged, preserving the audit record without retaining the user ID.

create or replace function public.protect_consent_evidence()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE'
     and old.user_id is not null
     and new.user_id is null
     and (to_jsonb(new) - 'user_id') = (to_jsonb(old) - 'user_id') then
    return new;
  end if;

  raise exception '% is immutable', tg_table_name using errcode = '55000';
end;
$$;

drop trigger if exists user_consents_immutable on public.user_consents;
create trigger user_consents_immutable
  before update or delete on public.user_consents
  for each row execute function public.protect_consent_evidence();
