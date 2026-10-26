-- =====================================================================
--  ISOKO DATABASE
--  Paste this whole file into Supabase -> SQL Editor -> New query -> Run.
--  Safe to run once on a new project. Then run storage.sql.
-- =====================================================================

-- ---------- PROFILES (one per account) ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '',
  phone       text,
  role        text not null default 'customer' check (role in ('customer', 'owner')),
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- Create a profile automatically when someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    case when new.raw_user_meta_data ->> 'role' = 'owner' then 'owner' else 'customer' end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- LISTINGS (houses, cars and accessories) ----------
create table if not exists public.listings (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null,
  category      text not null check (category in ('house', 'car')),
  section       text not null check (section in ('sale', 'rent', 'accessory')),
  title         text not null check (char_length(title) between 3 and 120),
  description   text not null default '',
  price         numeric(14, 2) not null check (price >= 0),
  currency      text not null default 'USD',
  price_period  text not null default 'total' check (price_period in ('total', 'month', 'week', 'day')),
  location      text not null default '',
  details       jsonb not null default '{}'::jsonb,
  photos        text[] not null default '{}',
  status        text not null default 'active' check (status in ('active', 'sold', 'rented', 'hidden')),
  created_at    timestamptz not null default now(),
  constraint listings_owner_id_fkey foreign key (owner_id) references public.profiles (id) on delete cascade
);

create index if not exists listings_browse_idx on public.listings (category, section, status, created_at desc);
create index if not exists listings_owner_idx on public.listings (owner_id);

-- ---------- FAVORITES (saved listings) ----------
create table if not exists public.favorites (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  listing_id  uuid not null references public.listings (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, listing_id)
);

-- ---------- REQUESTS (buy / rent requests from customers to owners) ----------
create table if not exists public.requests (
  id             uuid primary key default gen_random_uuid(),
  listing_id     uuid not null references public.listings (id) on delete cascade,
  customer_id    uuid not null,
  owner_id       uuid not null references public.profiles (id) on delete cascade,
  type           text not null check (type in ('buy', 'rent')),
  message        text not null default '',
  contact_phone  text,
  start_date     date,
  end_date       date,
  status         text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at     timestamptz not null default now(),
  constraint requests_customer_id_fkey foreign key (customer_id) references public.profiles (id) on delete cascade
);

create index if not exists requests_owner_idx on public.requests (owner_id, created_at desc);
create index if not exists requests_customer_idx on public.requests (customer_id, created_at desc);

-- ---------- COUNTS for the home screen ----------
create or replace view public.listing_counts
with (security_invoker = true) as
  select category, section, count(*)::int as total
  from public.listings
  where status = 'active'
  group by category, section;

-- ---------- OWNER PHONE (only after a request is accepted) ----------
create or replace function public.owner_phone_for_request(request_id uuid)
returns text
language sql
security definer set search_path = public
stable
as $$
  select p.phone
  from public.requests r
  join public.profiles p on p.id = r.owner_id
  where r.id = request_id
    and r.customer_id = auth.uid()
    and r.status = 'accepted';
$$;

-- =====================================================================
--  SECURITY RULES (Row Level Security)
-- =====================================================================
alter table public.profiles  enable row level security;
alter table public.listings  enable row level security;
alter table public.favorites enable row level security;
alter table public.requests  enable row level security;

-- Profiles: everyone can see names (to show "Listed by"), only you can edit yours.
drop policy if exists "profiles are readable" on public.profiles;
create policy "profiles are readable" on public.profiles for select using (true);
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Phone numbers are private: nobody can read the phone column directly.
-- You read your own phone through my_phone(); customers get the owner's phone
-- only after the owner accepts their request (owner_phone_for_request()).
revoke select on public.profiles from anon, authenticated;
grant select (id, full_name, role, avatar_url, created_at) on public.profiles to anon, authenticated;
-- Nobody can change their own role after sign-up.
revoke update on public.profiles from anon, authenticated;
grant update (full_name, phone, avatar_url) on public.profiles to authenticated;

create or replace function public.my_phone()
returns text
language sql
security definer set search_path = public
stable
as $$
  select phone from public.profiles where id = auth.uid();
$$;

-- Listings: anyone (even guests) sees active ones; owners see and manage their own.
drop policy if exists "active listings are public" on public.listings;
create policy "active listings are public" on public.listings for select using (status = 'active' or owner_id = auth.uid());
drop policy if exists "owners create listings" on public.listings;
create policy "owners create listings" on public.listings for insert
  with check (owner_id = auth.uid() and exists (select 1 from public.profiles where id = auth.uid() and role = 'owner'));
drop policy if exists "owners update own listings" on public.listings;
create policy "owners update own listings" on public.listings for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists "owners delete own listings" on public.listings;
create policy "owners delete own listings" on public.listings for delete using (owner_id = auth.uid());

-- Favorites: private to each user.
drop policy if exists "own favorites" on public.favorites;
create policy "own favorites" on public.favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Requests: the customer who sent it and the owner who received it can see it.
drop policy if exists "see own requests" on public.requests;
create policy "see own requests" on public.requests for select using (customer_id = auth.uid() or owner_id = auth.uid());
drop policy if exists "customers send requests" on public.requests;
create policy "customers send requests" on public.requests for insert
  with check (
    customer_id = auth.uid()
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'customer')
    and exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = requests.owner_id and l.status = 'active')
  );
drop policy if exists "owners answer requests" on public.requests;
create policy "owners answer requests" on public.requests for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
