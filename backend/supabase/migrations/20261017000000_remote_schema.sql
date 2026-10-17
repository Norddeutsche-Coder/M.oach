set check_function_bodies = off;

create table public.profiles (
  id uuid not null,
  name text not null default 'Läufer'::text,
  created_at timestamp with time zone not null default now(),
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign key (id) references auth.users (id) on delete cascade,
  constraint profiles_name_check check (char_length(name) >= 1 and char_length(name) <= 60)
);

create table public.admins (
  user_id uuid not null,
  constraint admins_pkey primary key (user_id),
  constraint admins_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
);

create table public.user_data (
  user_id uuid not null,
  state jsonb not null,
  modified bigint not null default 0,
  updated_at timestamp with time zone not null default now(),
  constraint user_data_pkey primary key (user_id),
  constraint user_data_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade,
  constraint user_data_state_check check (octet_length(state::text) <= 1500000)
);

create table public.coach_requests (
  id uuid not null default gen_random_uuid(),
  coach_id uuid not null,
  athlete_id uuid not null,
  status text not null default 'pending'::text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint coach_requests_pkey primary key (id),
  constraint coach_requests_coach_id_athlete_id_key unique (coach_id, athlete_id),
  constraint coach_requests_coach_id_fkey foreign key (coach_id) references auth.users (id) on delete cascade,
  constraint coach_requests_athlete_id_fkey foreign key (athlete_id) references auth.users (id) on delete cascade,
  constraint coach_requests_check check (coach_id <> athlete_id),
  constraint coach_requests_status_check check (
    status = any (array['pending'::text, 'accepted'::text, 'declined'::text])
  )
);

create table public.shared_data (
  athlete_id uuid not null,
  payload jsonb not null,
  updated_at timestamp with time zone not null default now(),
  constraint shared_data_pkey primary key (athlete_id),
  constraint shared_data_athlete_id_fkey foreign key (athlete_id) references auth.users (id) on delete cascade,
  constraint shared_data_payload_check check (octet_length(payload::text) <= 1000000)
);

alter table public.profiles enable row level security;
alter table public.admins enable row level security;
alter table public.user_data enable row level security;
alter table public.coach_requests enable row level security;
alter table public.shared_data enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select exists (select 1 from public.admins where user_id = auth.uid())
$function$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  insert into public.profiles (id, name)
  values (new.id, left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), 'Läufer'), 60))
  on conflict (id) do nothing;
  return new;
end
$function$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $function$
begin
  new.updated_at = now();
  return new;
end
$function$;

create or replace function public.lock_request_ids()
returns trigger
language plpgsql
as $function$
begin
  if new.coach_id <> old.coach_id or new.athlete_id <> old.athlete_id then
    raise exception 'coach_id und athlete_id sind unveränderlich';
  end if;
  return new;
end
$function$;

create or replace function public.cleanup_shared_data()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  aid uuid;
begin
  if tg_op = 'DELETE' then
    aid := old.athlete_id;
  else
    aid := new.athlete_id;
  end if;

  if not exists (
    select 1
    from public.coach_requests
    where athlete_id = aid and status = 'accepted'
  ) then
    delete from public.shared_data where athlete_id = aid;
  end if;

  return null;
end
$function$;

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path to 'public', 'auth'
as $function$
begin
  if auth.uid() is null then
    raise exception 'nicht angemeldet';
  end if;
  delete from auth.users where id = auth.uid();
end
$function$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create trigger touch_user_data
before update on public.user_data
for each row execute function public.touch_updated_at();

create trigger lock_request_ids
before update on public.coach_requests
for each row execute function public.lock_request_ids();

create trigger touch_coach_requests
before update on public.coach_requests
for each row execute function public.touch_updated_at();

create trigger cleanup_after_change
after delete or update of status on public.coach_requests
for each row execute function public.cleanup_shared_data();

create trigger touch_shared_data
before update on public.shared_data
for each row execute function public.touch_updated_at();

create policy profiles_insert
on public.profiles
as permissive
for insert
to authenticated
with check (id = auth.uid());

create policy profiles_select
on public.profiles
as permissive
for select
to authenticated
using (
  id = auth.uid()
  or public.is_admin()
  or exists (
    select 1
    from public.coach_requests r
    where (r.athlete_id = auth.uid() and r.coach_id = profiles.id)
      or (r.coach_id = auth.uid() and r.athlete_id = profiles.id)
  )
);

create policy profiles_update
on public.profiles
as permissive
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy user_data_own
on public.user_data
as permissive
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy req_delete
on public.coach_requests
as permissive
for delete
to authenticated
using (coach_id = auth.uid() or athlete_id = auth.uid());

create policy req_insert
on public.coach_requests
as permissive
for insert
to authenticated
with check (coach_id = auth.uid() and status = 'pending'::text and public.is_admin());

create policy req_select
on public.coach_requests
as permissive
for select
to authenticated
using (coach_id = auth.uid() or athlete_id = auth.uid());

create policy req_update_athlete
on public.coach_requests
as permissive
for update
to authenticated
using (athlete_id = auth.uid())
with check (
  athlete_id = auth.uid()
  and status = any (array['accepted'::text, 'declined'::text])
);

create policy req_update_coach
on public.coach_requests
as permissive
for update
to authenticated
using (coach_id = auth.uid() and public.is_admin())
with check (coach_id = auth.uid() and status = 'pending'::text);

create policy shared_delete
on public.shared_data
as permissive
for delete
to authenticated
using (athlete_id = auth.uid());

create policy shared_insert
on public.shared_data
as permissive
for insert
to authenticated
with check (
  athlete_id = auth.uid()
  and exists (
    select 1
    from public.coach_requests r
    where r.athlete_id = auth.uid() and r.status = 'accepted'::text
  )
);

create policy shared_select
on public.shared_data
as permissive
for select
to authenticated
using (
  athlete_id = auth.uid()
  or exists (
    select 1
    from public.coach_requests r
    where r.coach_id = auth.uid()
      and r.athlete_id = shared_data.athlete_id
      and r.status = 'accepted'::text
  )
);

create policy shared_update
on public.shared_data
as permissive
for update
to authenticated
using (athlete_id = auth.uid())
with check (
  athlete_id = auth.uid()
  and exists (
    select 1
    from public.coach_requests r
    where r.athlete_id = auth.uid() and r.status = 'accepted'::text
  )
);

revoke all on table public.profiles from anon, authenticated, service_role;
revoke all on table public.admins from anon, authenticated, service_role;
revoke all on table public.user_data from anon, authenticated, service_role;
revoke all on table public.coach_requests from anon, authenticated, service_role;
revoke all on table public.shared_data from anon, authenticated, service_role;

grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.user_data to authenticated;
grant select, insert, update, delete on table public.coach_requests to authenticated;
grant select, insert, update, delete on table public.shared_data to authenticated;

grant all on table public.profiles to service_role;
grant all on table public.admins to service_role;
grant all on table public.user_data to service_role;
grant all on table public.coach_requests to service_role;
grant all on table public.shared_data to service_role;

grant execute on function public.cleanup_shared_data() to anon, authenticated, service_role;
grant execute on function public.handle_new_user() to anon, authenticated, service_role;
grant execute on function public.lock_request_ids() to anon, authenticated, service_role;
grant execute on function public.touch_updated_at() to anon, authenticated, service_role;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated, service_role;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;
