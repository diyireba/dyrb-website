-- Malam QR ordering and operations prototype
-- Run in Supabase SQL Editor. Keep service-role keys out of the browser.

create extension if not exists pgcrypto;

create table if not exists public.venue_tables (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  name_en text not null,
  name_bm text not null,
  description_en text not null default '',
  description_bm text not null default '',
  price numeric(9,2) not null check (price >= 0),
  image_url text,
  tag text,
  available boolean not null default true,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(category,name_en,description_en)
);

alter table public.menu_items drop constraint if exists menu_items_name_en_key;
create unique index if not exists menu_items_variant_key on public.menu_items(category,name_en,description_en);

alter table public.menu_items drop constraint if exists menu_items_category_check;
alter table public.menu_items add constraint menu_items_category_check
  check (category in ('mains','bites','draught','bottle','cocktails','mocktails','soft','spirits'));

create table if not exists public.staff_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  phone text not null unique,
  role text not null check (role in ('owner','boss','manager','staff','singer')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.members (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  phone text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  role text not null check (role in ('owner','boss','manager','staff','singer')),
  permission_key text not null,
  enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (role, permission_key)
);

insert into public.role_permissions(role,permission_key,enabled) values
('owner','orders.view',true),('owner','orders.manage',true),('owner','songs.view',true),('owner','songs.manage',true),('owner','service.view',true),('owner','service.manage',true),('owner','menu.view',true),('owner','menu.manage',true),('owner','members.lookup',true),('owner','members.enroll',true),('owner','members.adjust',true),('owner','staff.manage',true),('owner','permissions.manage',true),('owner','tables.manage',true),
('boss','orders.view',true),('boss','orders.manage',true),('boss','songs.view',true),('boss','songs.manage',true),('boss','service.view',true),('boss','service.manage',true),('boss','menu.view',true),('boss','menu.manage',true),('boss','members.lookup',true),('boss','members.enroll',true),('boss','members.adjust',true),('boss','staff.manage',true),('boss','permissions.manage',false),('boss','tables.manage',true),
('manager','orders.view',true),('manager','orders.manage',true),('manager','songs.view',true),('manager','songs.manage',true),('manager','service.view',true),('manager','service.manage',true),('manager','menu.view',true),('manager','menu.manage',true),('manager','members.lookup',true),('manager','members.enroll',true),('manager','members.adjust',true),('manager','staff.manage',false),('manager','permissions.manage',false),('manager','tables.manage',false),
('staff','orders.view',true),('staff','orders.manage',true),('staff','songs.view',false),('staff','songs.manage',false),('staff','service.view',true),('staff','service.manage',true),('staff','menu.view',false),('staff','menu.manage',false),('staff','members.lookup',true),('staff','members.enroll',true),('staff','members.adjust',false),('staff','staff.manage',false),('staff','permissions.manage',false),('staff','tables.manage',false),
('singer','orders.view',false),('singer','orders.manage',false),('singer','songs.view',true),('singer','songs.manage',true),('singer','service.view',false),('singer','service.manage',false),('singer','menu.view',false),('singer','menu.manage',false),('singer','members.lookup',false),('singer','members.enroll',false),('singer','members.adjust',false),('singer','staff.manage',false),('singer','permissions.manage',false),('singer','tables.manage',false)
on conflict (role, permission_key) do nothing;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  table_code text not null,
  status text not null default 'new' check (status in ('new','preparing','ready','served','cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','paid')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  item_name text not null,
  quantity integer not null check (quantity between 1 and 20),
  unit_price numeric(9,2) not null check (unit_price >= 0)
);

create table if not exists public.song_requests (
  id uuid primary key default gen_random_uuid(),
  table_code text not null,
  title text not null check (char_length(title) between 1 and 100),
  artist text check (artist is null or char_length(artist) between 1 and 100),
  dedication text check (dedication is null or char_length(dedication) <= 280),
  source text not null default 'guest' check (source in ('guest','staff')),
  status text not null default 'pending' check (status in ('pending','approved','singing','sung','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  table_code text not null,
  request_type text not null check (request_type in ('Call staff','Request water','Request the bill')),
  status text not null default 'open' check (status in ('open','done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.point_ledger (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  delta integer not null check (delta <> 0),
  reason text not null check (char_length(reason) between 1 and 180),
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.beer_ledger (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  delta integer not null check (delta <> 0),
  reason text not null check (char_length(reason) between 1 and 180),
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.member_stored_batches (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  item_type text not null check (item_type in ('draught','bottle','whisky','spirit','other')),
  item_name text not null check (char_length(trim(item_name)) between 1 and 100),
  quantity_initial integer not null check (quantity_initial > 0),
  quantity_remaining integer not null check (quantity_remaining >= 0 and quantity_remaining <= quantity_initial),
  stored_at timestamptz not null default now(),
  expires_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  check ((item_type = 'draught' and expires_at is not null) or (item_type <> 'draught' and expires_at is null))
);

create table if not exists public.member_stored_transactions (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.member_stored_batches(id) on delete restrict,
  member_id uuid not null references public.members(id) on delete cascade,
  item_type text not null check (item_type in ('draught','bottle','whisky','spirit','other')),
  item_name text not null check (char_length(trim(item_name)) between 1 and 100),
  transaction_type text not null check (transaction_type in ('in','out')),
  quantity integer not null check (quantity > 0),
  reason text not null check (char_length(trim(reason)) between 1 and 180),
  expires_at timestamptz,
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists member_stored_batches_member_idx on public.member_stored_batches(member_id, stored_at desc);
create index if not exists member_stored_transactions_member_idx on public.member_stored_transactions(member_id, created_at desc);

create table if not exists public.member_login_attempts (
  phone_hash text primary key,
  attempts integer not null default 0,
  window_started_at timestamptz not null default now(),
  locked_until timestamptz
);

create or replace function public.member_login_allowed(p_phone_hash text)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((select locked_until is null or locked_until <= now() from public.member_login_attempts where phone_hash=p_phone_hash), true);
$$;

create or replace function public.record_member_login_failure(p_phone_hash text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.member_login_attempts(phone_hash,attempts,window_started_at,locked_until)
  values(p_phone_hash,1,now(),null)
  on conflict(phone_hash) do update set
    attempts = case when public.member_login_attempts.window_started_at < now() - interval '15 minutes' then 1 else public.member_login_attempts.attempts + 1 end,
    window_started_at = case when public.member_login_attempts.window_started_at < now() - interval '15 minutes' then now() else public.member_login_attempts.window_started_at end,
    locked_until = case
      when public.member_login_attempts.window_started_at < now() - interval '15 minutes' then null
      when public.member_login_attempts.attempts + 1 >= 8 then now() + interval '15 minutes'
      else public.member_login_attempts.locked_until
    end;
end;
$$;

create or replace function public.clear_member_login_attempts(p_phone_hash text)
returns void language sql security definer set search_path = public, pg_temp as $$
  delete from public.member_login_attempts where phone_hash=p_phone_hash;
$$;

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists songs_created_at_idx on public.song_requests(created_at desc);
create index if not exists services_created_at_idx on public.service_requests(created_at desc);
create index if not exists members_phone_idx on public.members(phone);
create index if not exists point_ledger_member_idx on public.point_ledger(member_id, created_at desc);
create index if not exists beer_ledger_member_idx on public.beer_ledger(member_id, created_at desc);

create or replace function public.has_permission(p_key text)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select case
    when exists(select 1 from public.staff_profiles where user_id=auth.uid() and active and role='owner') then true
    when p_key = 'permissions.manage' then false
    else exists (
    select 1 from public.staff_profiles sp
    join public.role_permissions rp on rp.role = sp.role
    where sp.user_id = auth.uid() and sp.active and rp.permission_key = p_key and rp.enabled
    )
  end;
$$;

create or replace function public.current_staff_role()
returns text language sql stable security definer set search_path = public, pg_temp as $$
  select role from public.staff_profiles where user_id = auth.uid() and active limit 1;
$$;

create or replace function public.submit_song_request(p_table_code text, p_title text, p_artist text, p_dedication text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid;
begin
  if not exists (select 1 from public.venue_tables where code = p_table_code and active) then raise exception 'This table QR is not active.'; end if;
  if p_title is null or length(trim(p_title)) not between 1 and 100 then raise exception 'Enter a song title.'; end if;
  if p_artist is not null and length(trim(p_artist)) > 100 then raise exception 'Artist name is too long.'; end if;
  if p_dedication is not null and length(p_dedication) > 280 then raise exception 'Dedication is too long.'; end if;
  insert into public.song_requests(table_code,title,artist,dedication)
  values (p_table_code,trim(p_title),nullif(trim(p_artist),''),nullif(trim(p_dedication),'')) returning id into v_id;
  return jsonb_build_object('id',v_id,'status','pending');
end;
$$;

create or replace function public.submit_service_request(p_table_code text, p_request_type text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
begin
  raise exception 'Service requests are no longer available. Please speak to staff.';
end;
$$;

create or replace function public.submit_order(p_table_code text, p_items jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_order uuid; v_row jsonb; v_item public.menu_items%rowtype; v_qty integer;
begin
  if not exists (select 1 from public.venue_tables where code = p_table_code and active) then raise exception 'This table QR is not active.'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then raise exception 'Add at least one menu item.'; end if;
  if jsonb_array_length(p_items) not between 1 and 30 then raise exception 'Add at least one menu item.'; end if;
  insert into public.orders(table_code) values (p_table_code) returning id into v_order;
  for v_row in select value from jsonb_array_elements(p_items) loop
    v_qty := (v_row->>'quantity')::integer;
    if v_qty is null or v_qty not between 1 and 20 then raise exception 'Quantity is outside the allowed range.'; end if;
    select * into v_item from public.menu_items where id = (v_row->>'menu_item_id')::uuid and active and available;
    if not found then raise exception 'One of these items is no longer available.'; end if;
    if v_item.category='draught' and ((v_item.description_en='Before 8pm' and extract(hour from now() at time zone 'Asia/Kuala_Lumpur') >= 20) or (v_item.description_en='After 8pm' and extract(hour from now() at time zone 'Asia/Kuala_Lumpur') < 20)) then
      raise exception 'Drink pricing has changed. Refresh the menu and review your basket.';
    end if;
    insert into public.order_items(order_id,menu_item_id,item_name,quantity,unit_price)
    values (v_order,v_item.id,v_item.name_en,v_qty,v_item.price);
  end loop;
  return jsonb_build_object('id',v_order,'status','new','payment_status','unpaid');
end;
$$;

create or replace function public.adjust_member_balance(p_member_id uuid, p_kind text, p_delta integer, p_reason text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_balance bigint;
begin
  if not public.has_permission('members.adjust') then raise exception 'Not allowed to adjust member balances.' using errcode = '42501'; end if;
  if p_kind is null or p_kind not in ('points','beer') or p_delta is null or p_delta = 0 or p_reason is null or length(trim(p_reason)) not between 1 and 180 then raise exception 'Enter a valid adjustment and reason.'; end if;
  perform 1 from public.members where id = p_member_id and active for update;
  if not found then raise exception 'Active member not found.'; end if;
  if p_kind = 'points' then
    select coalesce(sum(delta),0) into v_balance from public.point_ledger where member_id = p_member_id;
    if v_balance + p_delta < 0 then raise exception 'Points balance cannot be negative.'; end if;
    insert into public.point_ledger(member_id,delta,reason,actor_id) values (p_member_id,p_delta,trim(p_reason),auth.uid());
  else
    select coalesce(sum(delta),0) into v_balance from public.beer_ledger where member_id = p_member_id;
    if v_balance + p_delta < 0 then raise exception 'Beer balance cannot be negative.'; end if;
    insert into public.beer_ledger(member_id,delta,reason,actor_id) values (p_member_id,p_delta,trim(p_reason),auth.uid());
  end if;
  insert into public.audit_log(actor_id,action,entity,entity_id,details)
  values(auth.uid(),'balance.adjust',p_kind,p_member_id::text,jsonb_build_object('delta',p_delta,'reason',trim(p_reason)));
end;
$$;

create or replace function public.adjust_member_stored_item(
  p_member_id uuid, p_item_type text, p_item_name text, p_quantity integer, p_direction text, p_reason text
)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_name text := trim(p_item_name);
  v_available integer;
  v_remaining integer;
  v_take integer;
  v_batch public.member_stored_batches%rowtype;
  v_batch_id uuid;
  v_expires_at timestamptz;
begin
  if not public.has_permission('members.adjust') then raise exception 'Not allowed to adjust member stored items.' using errcode = '42501'; end if;
  if p_item_type is null or p_item_name is null or p_direction is null or p_reason is null or p_item_type not in ('draught','bottle','whisky','spirit','other') or char_length(v_name) not between 1 and 100 or p_quantity is null or p_quantity <= 0 or p_direction not in ('in','out') or char_length(trim(p_reason)) not between 1 and 180 then
    raise exception 'Enter a valid item, quantity, action and note.';
  end if;
  if p_direction = 'in' then
    v_expires_at := case when p_item_type = 'draught' then now() + interval '1 month' else null end;
    insert into public.member_stored_batches(member_id,item_type,item_name,quantity_initial,quantity_remaining,expires_at,created_by)
    values(p_member_id,p_item_type,v_name,p_quantity,p_quantity,v_expires_at,auth.uid()) returning id into v_batch_id;
    insert into public.member_stored_transactions(batch_id,member_id,item_type,item_name,transaction_type,quantity,reason,expires_at,actor_id)
    values(v_batch_id,p_member_id,p_item_type,v_name,'in',p_quantity,trim(p_reason),v_expires_at,auth.uid());
  else
    perform 1 from public.member_stored_batches
    where member_id=p_member_id and item_type=p_item_type and lower(item_name)=lower(v_name) and quantity_remaining>0 and (expires_at is null or expires_at>now())
    order by stored_at,id for update;
    select coalesce(sum(quantity_remaining),0)::integer into v_available from public.member_stored_batches
    where member_id=p_member_id and item_type=p_item_type and lower(item_name)=lower(v_name) and quantity_remaining>0 and (expires_at is null or expires_at>now());
    if v_available < p_quantity then raise exception 'Only % available for %.',v_available,v_name; end if;
    v_remaining := p_quantity;
    for v_batch in select * from public.member_stored_batches
      where member_id=p_member_id and item_type=p_item_type and lower(item_name)=lower(v_name) and quantity_remaining>0 and (expires_at is null or expires_at>now())
      order by stored_at,id for update
    loop
      v_take := least(v_remaining,v_batch.quantity_remaining);
      update public.member_stored_batches set quantity_remaining=quantity_remaining-v_take where id=v_batch.id;
      insert into public.member_stored_transactions(batch_id,member_id,item_type,item_name,transaction_type,quantity,reason,expires_at,actor_id)
      values(v_batch.id,p_member_id,p_item_type,v_name,'out',v_take,trim(p_reason),v_batch.expires_at,auth.uid());
      v_remaining := v_remaining-v_take;
      exit when v_remaining=0;
    end loop;
  end if;
  insert into public.audit_log(actor_id,action,entity,entity_id,details)
  values(auth.uid(),'stored-item.'||p_direction,p_item_type,p_member_id::text,jsonb_build_object('item_name',v_name,'quantity',p_quantity,'reason',trim(p_reason),'expires_at',v_expires_at));
end;
$$;

create or replace view public.member_balance_summary with (security_invoker = true) as
select m.id as member_id,
       coalesce((select sum(p.delta) from public.point_ledger p where p.member_id=m.id),0)::bigint as points,
       coalesce((select sum(b.delta) from public.beer_ledger b where b.member_id=m.id),0)::bigint as beer_servings
from public.members m;

alter table public.venue_tables enable row level security;
alter table public.menu_items enable row level security;
alter table public.staff_profiles enable row level security;
alter table public.members enable row level security;
alter table public.role_permissions enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.song_requests enable row level security;
alter table public.service_requests enable row level security;
alter table public.point_ledger enable row level security;
alter table public.beer_ledger enable row level security;
alter table public.member_stored_batches enable row level security;
alter table public.member_stored_transactions enable row level security;
alter table public.member_login_attempts enable row level security;
alter table public.audit_log enable row level security;

revoke all on function public.adjust_member_stored_item(uuid,text,text,integer,text,text) from public, anon;
grant execute on function public.adjust_member_stored_item(uuid,text,text,integer,text,text) to authenticated;

drop policy if exists tables_public_read on public.venue_tables;
create policy tables_public_read on public.venue_tables for select to anon, authenticated using (active or public.has_permission('tables.manage'));
drop policy if exists tables_manage on public.venue_tables;
create policy tables_manage on public.venue_tables for all to authenticated using (public.has_permission('tables.manage')) with check (public.has_permission('tables.manage'));

drop policy if exists menu_public_read on public.menu_items;
create policy menu_public_read on public.menu_items for select to anon, authenticated using (active and available or public.has_permission('menu.view'));
drop policy if exists menu_manage on public.menu_items;
create policy menu_manage on public.menu_items for all to authenticated using (public.has_permission('menu.manage')) with check (public.has_permission('menu.manage'));

drop policy if exists staff_profile_read on public.staff_profiles;
create policy staff_profile_read on public.staff_profiles for select to authenticated using (user_id = auth.uid() or public.has_permission('staff.manage'));
drop policy if exists member_self_read on public.members;
create policy member_self_read on public.members for select to authenticated using (id = auth.uid() or public.has_permission('members.lookup'));

drop policy if exists role_permissions_read on public.role_permissions;
create policy role_permissions_read on public.role_permissions for select to authenticated using (role = public.current_staff_role() or public.has_permission('permissions.manage'));
drop policy if exists role_permissions_owner_insert on public.role_permissions;
create policy role_permissions_owner_insert on public.role_permissions for insert to authenticated with check (public.current_staff_role() = 'owner');
drop policy if exists role_permissions_owner_update on public.role_permissions;
create policy role_permissions_owner_update on public.role_permissions for update to authenticated using (public.current_staff_role() = 'owner') with check (public.current_staff_role() = 'owner');
drop policy if exists role_permissions_owner_delete on public.role_permissions;
create policy role_permissions_owner_delete on public.role_permissions for delete to authenticated using (public.current_staff_role() = 'owner');

drop policy if exists songs_read on public.song_requests;
create policy songs_read on public.song_requests for select to authenticated using (public.has_permission('songs.view'));
drop policy if exists songs_manage_insert on public.song_requests;
create policy songs_manage_insert on public.song_requests for insert to authenticated with check (public.has_permission('songs.manage'));
drop policy if exists songs_manage_update on public.song_requests;
create policy songs_manage_update on public.song_requests for update to authenticated using (public.has_permission('songs.manage')) with check (public.has_permission('songs.manage'));
drop policy if exists songs_manage_delete on public.song_requests;
create policy songs_manage_delete on public.song_requests for delete to authenticated using (public.has_permission('songs.manage'));

drop policy if exists orders_read on public.orders;
create policy orders_read on public.orders for select to authenticated using (public.has_permission('orders.view'));
drop policy if exists orders_update on public.orders;
create policy orders_update on public.orders for update to authenticated using (public.has_permission('orders.manage')) with check (public.has_permission('orders.manage'));
drop policy if exists order_items_read on public.order_items;
create policy order_items_read on public.order_items for select to authenticated using (exists(select 1 from public.orders o where o.id=order_id and public.has_permission('orders.view')));

drop policy if exists service_read on public.service_requests;
create policy service_read on public.service_requests for select to authenticated using (public.has_permission('service.view'));
drop policy if exists service_update on public.service_requests;
create policy service_update on public.service_requests for update to authenticated using (public.has_permission('service.manage')) with check (public.has_permission('service.manage'));

drop policy if exists point_ledger_read on public.point_ledger;
create policy point_ledger_read on public.point_ledger for select to authenticated using (member_id = auth.uid() or public.has_permission('members.adjust'));
drop policy if exists beer_ledger_read on public.beer_ledger;
create policy beer_ledger_read on public.beer_ledger for select to authenticated using (member_id = auth.uid() or public.has_permission('members.adjust'));
drop policy if exists stored_batches_read on public.member_stored_batches;
create policy stored_batches_read on public.member_stored_batches for select to authenticated using (member_id = auth.uid() or public.has_permission('members.adjust'));
drop policy if exists stored_transactions_read on public.member_stored_transactions;
create policy stored_transactions_read on public.member_stored_transactions for select to authenticated using (member_id = auth.uid() or public.has_permission('members.adjust'));

drop policy if exists audit_owner_read on public.audit_log;
create policy audit_owner_read on public.audit_log for select to authenticated using (public.has_permission('permissions.manage'));

revoke all on public.member_login_attempts from anon, authenticated;
revoke all on public.audit_log from anon, authenticated;
revoke all on function public.member_login_allowed(text), public.record_member_login_failure(text), public.clear_member_login_attempts(text) from public, anon, authenticated;
grant execute on function public.member_login_allowed(text), public.record_member_login_failure(text), public.clear_member_login_attempts(text) to service_role;
grant select on public.venue_tables, public.menu_items to anon, authenticated;
grant select on public.role_permissions, public.staff_profiles, public.members, public.song_requests, public.orders, public.order_items, public.service_requests, public.point_ledger, public.beer_ledger, public.member_stored_batches, public.member_stored_transactions, public.member_balance_summary to authenticated;
grant insert, update, delete on public.menu_items, public.venue_tables, public.song_requests, public.orders, public.service_requests, public.role_permissions to authenticated;
grant execute on function public.submit_song_request(text,text,text,text) to anon, authenticated;
grant execute on function public.submit_service_request(text,text) to anon, authenticated;
grant execute on function public.submit_order(text,jsonb) to anon, authenticated;
grant execute on function public.adjust_member_balance(uuid,text,integer,text) to authenticated;
grant execute on function public.has_permission(text) to anon, authenticated;
grant execute on function public.current_staff_role() to authenticated;

-- Seed a small menu and table set for a first local integration pass.
insert into public.venue_tables(code,label,sort_order) values
('02','Table 02',2),('03','Table 03',3),('05','Table 05',5),('07','Table 07',7),('08','Table 08',8),('09','Table 09',9),('10','Table 10',10),('11','Table 11',11),('12','Table 12',12)
on conflict (code) do nothing;

-- Re-run this seed block to replace the prototype sample menu with the supplied menu.
alter table public.menu_items drop constraint if exists menu_items_category_check;
alter table public.menu_items add constraint menu_items_category_check check (category in ('mains','bites','draught','bottle','cocktails','mocktails','soft','spirits'));
delete from public.menu_items where name_en in ('Nasi Lemak Ayam Berempah','Fish & Chips','Truffle Fries','Tiger Draught (Pint)','Guinness Stout (Bottle)');
insert into public.menu_items(category,name_en,name_bm,description_en,description_bm,price,image_url,available,active,sort_order,tag) values
('mains','Signature Fried Rice with Grilled Chicken Chop','Nasi Goreng Istimewa dengan Ayam Panggang','','','21','/images/food-f01.jpg','true','true','1','F01'),
('mains','Signature Fried Rice with Fried Chicken Chop','Nasi Goreng Istimewa dengan Ayam Goreng','','','21','/images/food-f02.jpg','true','true','2','F02'),
('mains','Teriyaki Grilled Chicken Chop with Fried Rice','Ayam Panggang Teriyaki dengan Nasi Goreng','','','21','/images/food-f03.jpg','true','true','3','F03'),
('mains','Tomyam Fried Rice','Nasi Goreng Tomyam','','','21','/images/food-f04.jpg','true','true','4','F04'),
('mains','Signature Black Pepper Chicken Chop','Ayam Panggang Lada Hitam Istimewa','','','19','/images/food-f05.jpg','true','true','5','F05'),
('mains','Salted Egg Chicken Fried Rice','Nasi Goreng Ayam Telur Masin','','','19','/images/food-f06.jpg','true','true','6','F06'),
('mains','Signature Mala Spicy Spaghetti with Chicken Chop','Spageti Mala Pedas Istimewa dengan Ayam Panggang','','','21','/images/food-f07.jpg','true','true','7','F07'),
('mains','Signature Fried Rice with Fried Egg','Nasi Goreng Istimewa dengan Telur Goreng','','','12','/images/food-f08.jpg','true','true','8','F08'),
('bites','Enoki Mushroom','Cendawan Enoki','','','11','/images/food-s01.jpg','true','true','9','F01'),
('bites','Oyster Mushroom','Cendawan Tiram','','','11','/images/food-s02.jpg','true','true','10','F02'),
('bites','Broccoli','Brokoli','','','11','/images/food-s03.jpg','true','true','11','F03'),
('bites','Lotus Root','Akar Teratai','','','11','/images/food-s04.jpg','true','true','12','F04'),
('bites','Taiwan Sausage (8 pcs)','Sosej Taiwan (8 ketul)','','','17','/images/food-s05.jpg','true','true','13','F05'),
('bites','Luncheon Meat','Daging Makan Tengah Hari','','','17','/images/food-s06.jpg','true','true','14','F06'),
('bites','Sausage','Sosej','','','18','/images/food-s07.jpg','true','true','15','F07'),
('bites','Crispy Fucuk','Fucuk Rangup','','','14','/images/food-s08.jpg','true','true','16','F08'),
('bites','Chicken Popcorn','Ayam Popcorn','','','17','/images/food-s09.jpg','true','true','17','F09'),
('bites','Shoestring Potato Fries','Kentang Goreng Halus','','','10','/images/food-s10.jpg','true','true','18','F10'),
('bites','Crispy Mixed Seafood Ball (8 pcs)','Bebola Campuran Makanan Laut Rangup (8 ketul)','','','14','/images/food-s11.jpg','true','true','19','F11'),
('bites','Smoked Duck Skewer (3 pcs)','Sate Itik Salai (3 cucuk)','','','16','/images/food-s12.jpg','true','true','20','F12'),
('bites','Chicken Skewer (3 pcs)','Sate Ayam (3 cucuk)','','','16','/images/food-s13.jpg','true','true','21','F13'),
('bites','Pork Skewer (3 pcs)','Sate Babi (3 cucuk)','','','16','/images/food-s14.jpg','true','true','22','F14'),
('draught','Carlsberg Extra Cold · 1 mug','Carlsberg Extra Cold · 1 mug','Before 8pm','Sebelum 8 malam','15.8','','true','true','23','DC01'),
('draught','Carlsberg Extra Cold · 10 mugs','Carlsberg Extra Cold · 10 mug','Before 8pm','Sebelum 8 malam','148','','true','true','24','DC01'),
('draught','Connor’s · 1 mug','Connor’s · 1 mug','Before 8pm','Sebelum 8 malam','16.8','','true','true','25','DC02'),
('draught','Connor’s · 10 mugs','Connor’s · 10 mug','Before 8pm','Sebelum 8 malam','158','','true','true','26','DC02'),
('draught','Sapporo Premium Beer · 1 mug','Sapporo Premium Beer · 1 mug','Before 8pm','Sebelum 8 malam','17.8','','true','true','27','DC03'),
('draught','Sapporo Premium Beer · 10 mugs','Sapporo Premium Beer · 10 mug','Before 8pm','Sebelum 8 malam','168','','true','true','28','DC03'),
('draught','Carlsberg Extra Cold · 1 mug','Carlsberg Extra Cold · 1 mug','After 8pm','Selepas 8 malam','18.8','','true','true','29','AC01'),
('draught','Carlsberg Extra Cold · 10 mugs','Carlsberg Extra Cold · 10 mug','After 8pm','Selepas 8 malam','178','','true','true','30','AC01'),
('draught','Connor’s · 1 mug','Connor’s · 1 mug','After 8pm','Selepas 8 malam','19.8','','true','true','31','AC02'),
('draught','Connor’s · 10 mugs','Connor’s · 10 mug','After 8pm','Selepas 8 malam','188','','true','true','32','AC02'),
('draught','Sapporo Premium Beer · 1 mug','Sapporo Premium Beer · 1 mug','After 8pm','Selepas 8 malam','20.8','','true','true','33','AC03'),
('draught','Sapporo Premium Beer · 10 mugs','Sapporo Premium Beer · 10 mug','After 8pm','Selepas 8 malam','198','','true','true','34','AC03'),
('bottle','Carlsberg Smooth · 1 bottle','Carlsberg Smooth · 1 botol','','','19','','true','true','35','BB01'),
('bottle','Carlsberg Smooth · 5 bottles','Carlsberg Smooth · 5 botol','','','90','','true','true','36','BB01'),
('bottle','Carlsberg Smooth · 24 bottles','Carlsberg Smooth · 24 botol','','','388','','true','true','37','BB01'),
('cocktails','DYRB Special (Haaland)','Koktel Istimewa DYRB (Haaland)','','','20','','true','true','38','CT01'),
('cocktails','Blue Lagoon','Blue Lagoon','','','25','','true','true','39','CT02'),
('cocktails','Daiquiri','Daiquiri','','','18','','true','true','40','CT03'),
('cocktails','Dry Martini','Dry Martini','','','20','','true','true','41','CT04'),
('cocktails','Long Island Ice Tea','Long Island Ice Tea','','','20','','true','true','42','CT05'),
('cocktails','Margarita','Margarita','','','20','','true','true','43','CT06'),
('cocktails','Negroni','Negroni','','','25','','true','true','44','CT07'),
('cocktails','Screwdriver','Screwdriver','','','18','','true','true','45','CT08'),
('cocktails','Shandy','Shandy','','','15','','true','true','46','CT09'),
('cocktails','Tequila Sunrise','Tequila Sunrise','','','18','','true','true','47','CT10'),
('cocktails','See You Tomorrow','Jumpa Lagi Esok','','','30','','true','true','48','CT11'),
('cocktails','Grave Yard','Grave Yard','','','48','','true','true','49','CT12'),
('mocktails','DYRB Special Virgin Haaland','Mocktail Istimewa DYRB Haaland','','','18','','true','true','50','MT01'),
('mocktails','Virgin Blue Lagoon','Virgin Blue Lagoon','','','18','','true','true','51','MT02'),
('mocktails','Virgin Sunrise','Virgin Sunrise','','','18','','true','true','52','MT03'),
('soft','Orange Juice','Jus Oren','','','10','','true','true','53','NA01'),
('soft','Mango Juice','Jus Mangga','','','10','','true','true','54','NA02'),
('soft','Lemonade','Air Lemon','','','10','','true','true','55','NA03'),
('soft','Fresh Lemon Juice','Jus Lemon Segar','','','12','','true','true','56','NA04'),
('soft','Fresh Lime Juice','Jus Limau Nipis Segar','','','12','','true','true','57','NA05'),
('soft','Fresh Lemon Tea','Teh Lemon Segar','','','12','','true','true','58','NA06'),
('soft','Fresh Honey Lemon','Lemon Madu Segar','','','12','','true','true','59','NA07'),
('soft','Cranberry Juice','Jus Kranberi','','','12','','true','true','60','NA08'),
('soft','Ayataka Green Tea','Teh Hijau Ayataka','','','10','','true','true','61','NA09'),
('soft','Coke','Coca-Cola','','','10','','true','true','62','NA10'),
('soft','Sprite','Sprite','','','10','','true','true','63','NA11'),
('soft','Ginger Ale','Air Halia Berkarbonat','','','10','','true','true','64','NA12'),
('soft','Soda Water','Air Soda','','','10','','true','true','65','NA13'),
('soft','Tonic Water','Air Tonik','','','10','','true','true','66','NA14'),
('soft','Mineral Water · 500ml','Air Mineral · 500ml','','','3','','true','true','67','NA15'),
('spirits','Singleton of Glen Ord 12 Yrs · Single','Singleton of Glen Ord 12 Tahun · Single','Whisky','Wiski','480','','true','true','68','S04'),
('spirits','Singleton of Glen Ord 12 Yrs · Twin','Singleton of Glen Ord 12 Tahun · Twin','Whisky','Wiski','880','','true','true','69','S04'),
('spirits','Macallan 12 Yrs Double Cask · Single','Macallan 12 Tahun Double Cask · Single','Whisky','Wiski','580','','true','true','70','S05'),
('spirits','Macallan 12 Yrs Double Cask · Twin','Macallan 12 Tahun Double Cask · Twin','Whisky','Wiski','990','','true','true','71','S05'),
('spirits','Hennessy VSOP · Single','Hennessy VSOP · Single','Brandy','Brendi','480','','true','true','72','S10'),
('spirits','Hennessy VSOP · Twin','Hennessy VSOP · Twin','Brandy','Brendi','880','','true','true','73','S10'),
('spirits','Martell VSOP · Single','Martell VSOP · Single','Brandy','Brendi','680','','true','true','74','S11'),
('spirits','Martell VSOP · Twin','Martell VSOP · Twin','Brandy','Brendi','1180','','true','true','75','S11'),
('spirits','Martell Cordon Bleu · Single','Martell Cordon Bleu · Single','Brandy','Brendi','1180','','true','true','76','S12'),
('spirits','Martell Cordon Bleu · Twin','Martell Cordon Bleu · Twin','Brandy','Brendi','2280','','true','true','77','S12'),
('spirits','Roku Suntory Japanese Gin · Single','Roku Suntory Gin Jepun · Single','Gin','Gin','468','','true','true','78','S14'),
('spirits','Roku Suntory Japanese Gin · Twin','Roku Suntory Gin Jepun · Twin','Gin','Gin','760','','true','true','79','S14')
on conflict (category,name_en,description_en) do update set category=excluded.category,name_bm=excluded.name_bm,description_en=excluded.description_en,description_bm=excluded.description_bm,price=excluded.price,image_url=excluded.image_url,available=excluded.available,active=excluded.active,sort_order=excluded.sort_order,tag=excluded.tag;
