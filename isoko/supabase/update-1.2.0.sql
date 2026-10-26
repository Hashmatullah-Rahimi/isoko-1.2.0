-- =====================================================================
--  ISOKO 1.2.0 — Brokers, Premium listings, Google Maps, better filters
--  Run this AFTER schema.sql, storage.sql and messages.sql:
--  Supabase -> SQL Editor -> New query -> paste everything -> Run.
--  Safe to run more than once.
-- =====================================================================

-- ---------- 1. BROKER accounts ----------
-- A broker posts and manages listings for other people, just like an owner.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('customer', 'owner', 'broker'));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_role text := case new.raw_user_meta_data ->> 'role'
                   when 'owner' then 'owner'
                   when 'broker' then 'broker'
                   else 'customer'
                 end;
  v_phone text := nullif(new.raw_user_meta_data ->> 'phone', '');
begin
  insert into public.profiles (id, full_name, phone, role, whatsapp, whatsapp_enabled)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    v_phone,
    v_role,
    v_phone,
    v_role in ('owner', 'broker') and v_phone is not null and coalesce(new.raw_user_meta_data ->> 'whatsapp', 'false') = 'true'
  );
  return new;
end;
$$;

-- Owners AND brokers can post listings.
drop policy if exists "owners create listings" on public.listings;
create policy "owners create listings" on public.listings for insert
  with check (owner_id = auth.uid() and exists (select 1 from public.profiles where id = auth.uid() and role in ('owner', 'broker')));

-- ---------- 2. GOOGLE MAPS ----------
-- Optional exact pin (from "Use my current location") and/or a Google Maps link.
alter table public.listings add column if not exists latitude  double precision check (latitude between -90 and 90);
alter table public.listings add column if not exists longitude double precision check (longitude between -180 and 180);
alter table public.listings add column if not exists map_url   text check (map_url is null or char_length(map_url) <= 500);

-- ---------- 3. FILTERS (price, location, bedrooms, bathrooms, year) ----------
-- Number columns copied from the details, so filters like "3+ bedrooms" are fast and correct.
alter table public.listings add column if not exists bedrooms int
  generated always as (case when details ->> 'bedrooms' ~ '^[0-9]{1,4}$' then (details ->> 'bedrooms')::int end) stored;
alter table public.listings add column if not exists bathrooms int
  generated always as (case when details ->> 'bathrooms' ~ '^[0-9]{1,4}$' then (details ->> 'bathrooms')::int end) stored;
alter table public.listings add column if not exists car_year int
  generated always as (case when details ->> 'year' ~ '^[0-9]{4}$' then (details ->> 'year')::int end) stored;

create index if not exists listings_price_idx on public.listings (category, section, price) where status = 'active';

-- ---------- 4. PREMIUM listings ----------
-- A Premium listing is shown first, in the "Premium" row on Home, with a gold badge.
-- Only the Isoko team can turn it on (see activate_premium below), never the owner.
alter table public.listings add column if not exists featured_until timestamptz;
create index if not exists listings_featured_idx on public.listings (featured_until desc) where status = 'active';

create or replace function public.protect_featured_until()
returns trigger
language plpgsql
as $$
begin
  -- App users (anon / authenticated) can never set or change Premium themselves.
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.featured_until := null;
    else
      new.featured_until := old.featured_until;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists listings_protect_featured on public.listings;
create trigger listings_protect_featured
  before insert or update on public.listings
  for each row execute function public.protect_featured_until();

-- Requests from owners/brokers who want their listing to be Premium.
create table if not exists public.premium_requests (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references public.listings (id) on delete cascade,
  owner_id    uuid not null references public.profiles (id) on delete cascade,
  plan        text not null check (plan in ('week', 'month')),
  status      text not null default 'pending' check (status in ('pending', 'active', 'declined')),
  created_at  timestamptz not null default now()
);
create index if not exists premium_requests_owner_idx on public.premium_requests (owner_id, created_at desc);
create unique index if not exists premium_requests_one_pending on public.premium_requests (listing_id) where status = 'pending';

alter table public.premium_requests enable row level security;

drop policy if exists "see own premium requests" on public.premium_requests;
create policy "see own premium requests" on public.premium_requests for select using (owner_id = auth.uid());

drop policy if exists "ask for premium" on public.premium_requests;
create policy "ask for premium" on public.premium_requests for insert
  with check (
    owner_id = auth.uid()
    and status = 'pending'
    and exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = auth.uid() and l.status = 'active')
  );

-- Owners can't change requests (only the team can, from the dashboard).
revoke update, delete on public.premium_requests from anon, authenticated;

-- FOR THE ISOKO TEAM — run in the SQL Editor after the owner has paid:
--   select public.activate_premium('<request id>');
-- It makes the listing Premium for 7 days ('week') or 30 days ('month'),
-- adding the time on top if it is already Premium.
create or replace function public.activate_premium(p_request_id uuid)
returns timestamptz
language plpgsql
security definer set search_path = public
as $$
declare
  v_req public.premium_requests;
  v_until timestamptz;
begin
  select * into v_req from public.premium_requests where id = p_request_id;
  if not found then
    raise exception 'Premium request not found';
  end if;

  update public.listings
     set featured_until = greatest(coalesce(featured_until, now()), now())
                          + case v_req.plan when 'week' then interval '7 days' else interval '30 days' end
   where id = v_req.listing_id
  returning featured_until into v_until;

  update public.premium_requests set status = 'active' where id = p_request_id;
  return v_until;
end;
$$;

-- Only the team (dashboard / service key) may run it — not app users.
revoke execute on function public.activate_premium(uuid) from public, anon, authenticated;

-- Handy view for the team: every request still waiting.
create or replace view public.premium_waiting
with (security_invoker = true) as
  select r.id as request_id, r.plan, r.created_at, l.title as listing, p.full_name as owner, p.phone
  from public.premium_requests r
  join public.listings l on l.id = r.listing_id
  join public.profiles p on p.id = r.owner_id
  where r.status = 'pending'
  order by r.created_at;
revoke all on public.premium_waiting from anon, authenticated;
