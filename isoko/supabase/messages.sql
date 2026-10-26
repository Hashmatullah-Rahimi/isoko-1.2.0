-- =====================================================================
--  ISOKO MESSAGES + WHATSAPP   (added in version 1.1.0)
--  Run this AFTER schema.sql and storage.sql:
--  Supabase -> SQL Editor -> New query -> paste everything -> Run.
--  Safe to run more than once.
-- =====================================================================

-- ---------- WhatsApp settings on each profile ----------
alter table public.profiles add column if not exists whatsapp text;
alter table public.profiles add column if not exists whatsapp_enabled boolean not null default false;

-- Everyone may see IF an owner accepts WhatsApp, but never the number itself.
grant select (whatsapp_enabled) on public.profiles to anon, authenticated;
grant update (whatsapp, whatsapp_enabled) on public.profiles to authenticated;

-- New sign-ups: owners who tick "contact me on WhatsApp" get their phone as WhatsApp number.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_role text := case when new.raw_user_meta_data ->> 'role' = 'owner' then 'owner' else 'customer' end;
  v_phone text := nullif(new.raw_user_meta_data ->> 'phone', '');
begin
  insert into public.profiles (id, full_name, phone, role, whatsapp, whatsapp_enabled)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    v_phone,
    v_role,
    v_phone,
    v_role = 'owner' and v_phone is not null and coalesce(new.raw_user_meta_data ->> 'whatsapp', 'false') = 'true'
  );
  return new;
end;
$$;

-- Your own WhatsApp settings (for the Edit profile screen).
create or replace function public.my_whatsapp()
returns table (whatsapp text, whatsapp_enabled boolean)
language sql
security definer set search_path = public
stable
as $$
  select whatsapp, whatsapp_enabled from public.profiles where id = auth.uid();
$$;

-- The owner's WhatsApp number for a listing.
-- Only for logged-in Buyer & Renter accounts, and only if the owner switched WhatsApp on.
create or replace function public.owner_whatsapp(p_listing_id uuid)
returns text
language sql
security definer set search_path = public
stable
as $$
  select coalesce(nullif(o.whatsapp, ''), o.phone)
  from public.listings l
  join public.profiles o on o.id = l.owner_id
  where l.id = p_listing_id
    and o.whatsapp_enabled
    and exists (select 1 from public.profiles me where me.id = auth.uid() and me.role = 'customer');
$$;

-- ---------- CONVERSATIONS (one chat per buyer/renter per listing) ----------
create table if not exists public.conversations (
  id                     uuid primary key default gen_random_uuid(),
  listing_id             uuid references public.listings (id) on delete set null,
  customer_id            uuid not null,
  owner_id               uuid not null,
  listing_title          text not null default '',
  listing_photo          text,
  listing_category       text not null default 'house',
  last_message           text not null default '',
  last_sender_id         uuid,
  last_message_at        timestamptz not null default now(),
  customer_last_read_at  timestamptz not null default now(),
  owner_last_read_at     timestamptz not null default now(),
  created_at             timestamptz not null default now(),
  constraint conversations_customer_id_fkey foreign key (customer_id) references public.profiles (id) on delete cascade,
  constraint conversations_owner_id_fkey foreign key (owner_id) references public.profiles (id) on delete cascade,
  constraint conversations_unique unique (listing_id, customer_id)
);

create index if not exists conversations_customer_idx on public.conversations (customer_id, last_message_at desc);
create index if not exists conversations_owner_idx on public.conversations (owner_id, last_message_at desc);

-- ---------- MESSAGES ----------
create table if not exists public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations (id) on delete cascade,
  sender_id        uuid not null references public.profiles (id) on delete cascade,
  body             text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at       timestamptz not null default now()
);

create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);

-- Start (or reopen) a chat about a listing. Returns the conversation id.
create or replace function public.start_conversation(p_listing_id uuid)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_listing public.listings;
  v_id uuid;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'customer') then
    raise exception 'Only Buyer & Renter accounts can start a chat';
  end if;

  select * into v_listing from public.listings where id = p_listing_id and status = 'active';
  if v_listing.id is null then
    raise exception 'Listing not available';
  end if;

  insert into public.conversations (listing_id, customer_id, owner_id, listing_title, listing_photo, listing_category)
  values (v_listing.id, auth.uid(), v_listing.owner_id, v_listing.title, v_listing.photos[1], v_listing.category)
  on conflict (listing_id, customer_id) do update set listing_title = excluded.listing_title
  returning id into v_id;

  return v_id;
end;
$$;

-- Open the chat that belongs to a buy/rent request (works for both the buyer/renter and the owner).
create or replace function public.start_conversation_from_request(p_request_id uuid)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_req public.requests;
  v_listing public.listings;
  v_id uuid;
begin
  select * into v_req from public.requests where id = p_request_id and auth.uid() in (customer_id, owner_id);
  if v_req.id is null then
    raise exception 'Request not found';
  end if;
  select * into v_listing from public.listings where id = v_req.listing_id;

  insert into public.conversations (listing_id, customer_id, owner_id, listing_title, listing_photo, listing_category)
  values (v_req.listing_id, v_req.customer_id, v_req.owner_id, coalesce(v_listing.title, ''), v_listing.photos[1], coalesce(v_listing.category, 'house'))
  on conflict (listing_id, customer_id) do update set listing_title = excluded.listing_title
  returning id into v_id;

  return v_id;
end;
$$;

-- Mark a chat as read for the person calling.
create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void
language sql
security definer set search_path = public
as $$
  update public.conversations
     set customer_last_read_at = case when customer_id = auth.uid() then now() else customer_last_read_at end,
         owner_last_read_at    = case when owner_id    = auth.uid() then now() else owner_last_read_at end
   where id = p_conversation_id
     and auth.uid() in (customer_id, owner_id);
$$;

-- Keep the inbox preview up to date after every new message.
create or replace function public.on_new_message()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.conversations
     set last_message = left(new.body, 200),
         last_sender_id = new.sender_id,
         last_message_at = new.created_at,
         customer_last_read_at = case when customer_id = new.sender_id then new.created_at else customer_last_read_at end,
         owner_last_read_at    = case when owner_id    = new.sender_id then new.created_at else owner_last_read_at end
   where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists on_message_created on public.messages;
create trigger on_message_created
  after insert on public.messages
  for each row execute function public.on_new_message();

-- ---------- SECURITY RULES ----------
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Only the two people in a chat can see it. Chats are created/updated only by the functions above.
revoke insert, update, delete on public.conversations from anon, authenticated;
drop policy if exists "see own conversations" on public.conversations;
create policy "see own conversations" on public.conversations
  for select using (auth.uid() in (customer_id, owner_id));

revoke update, delete on public.messages from anon, authenticated;
drop policy if exists "read messages in own conversations" on public.messages;
create policy "read messages in own conversations" on public.messages
  for select using (
    exists (select 1 from public.conversations c where c.id = conversation_id and auth.uid() in (c.customer_id, c.owner_id))
  );
drop policy if exists "send messages in own conversations" on public.messages;
create policy "send messages in own conversations" on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (select 1 from public.conversations c where c.id = conversation_id and auth.uid() in (c.customer_id, c.owner_id))
  );

-- ---------- LIVE UPDATES (new messages appear instantly) ----------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'messages') then
      alter publication supabase_realtime add table public.messages;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'conversations') then
      alter publication supabase_realtime add table public.conversations;
    end if;
  end if;
end;
$$;
