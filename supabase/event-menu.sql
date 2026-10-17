-- Apply after schema.sql and existing migrations. Event remains disabled initially.
begin;
create table if not exists public.menu_events (
 id text primary key,
 name text not null,
 enabled boolean not null default false,
 starts_at timestamptz,
 ends_at timestamptz,
 include_cocktails boolean not null default false,
 include_soft boolean not null default false,
 check (ends_at is null or starts_at is null or ends_at > starts_at)
);
insert into public.menu_events(id,name) values ('halloween','Halloween Night') on conflict (id) do nothing;
alter table public.menu_items add column if not exists event_id text references public.menu_events(id);
create index if not exists menu_items_event_idx on public.menu_items(event_id);
alter table public.menu_events enable row level security;
drop policy if exists menu_events_read on public.menu_events;
create policy menu_events_read on public.menu_events for select to authenticated using (public.has_permission('menu.view'));
drop policy if exists menu_events_manage on public.menu_events;
create policy menu_events_manage on public.menu_events for update to authenticated using (public.has_permission('menu.manage')) with check (public.has_permission('menu.manage'));
grant select, update on public.menu_events to authenticated;

create or replace function public.menu_item_visible(p_category text, p_event text)
returns boolean language plpgsql stable security definer set search_path = public, pg_temp as $$
declare e public.menu_events%rowtype;
begin
 select * into e from public.menu_events where id='halloween' and enabled
   and (starts_at is null or now() >= starts_at) and (ends_at is null or now() < ends_at);
 if not found then return p_event is null; end if;
 if p_event is not null then return p_event=e.id; end if;
 if p_category in ('mains','bites') then return false; end if;
 if p_category='cocktails' then return e.include_cocktails; end if;
 if p_category='soft' then return e.include_soft; end if;
 return true;
end;
$$;
revoke all on function public.menu_item_visible(text,text) from public;
grant execute on function public.menu_item_visible(text,text) to anon, authenticated;
drop policy if exists menu_public_read on public.menu_items;
create policy menu_public_read on public.menu_items for select to anon, authenticated
 using ((active and available and public.menu_item_visible(category,event_id)) or public.has_permission('menu.view'));

create or replace function public.get_guest_menu()
returns setof public.menu_items language sql stable security definer set search_path = public, pg_temp as $$
 select * from public.menu_items where active and public.menu_item_visible(category,event_id) order by sort_order, id;
$$;
revoke all on function public.get_guest_menu() from public;
grant execute on function public.get_guest_menu() to anon, authenticated;

-- Enforce event availability even for stale clients calling submit_order directly.
create or replace function public.check_order_menu_event()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare item public.menu_items%rowtype;
begin
 perform 1 from public.menu_events where id='halloween' for share;
 select * into item from public.menu_items where id=new.menu_item_id;
 if not found or not item.active or not item.available or not public.menu_item_visible(item.category,item.event_id) then
   raise exception 'The menu has changed. Refresh and review your basket.';
 end if;
 return new;
end;
$$;
revoke all on function public.check_order_menu_event() from public;
drop trigger if exists order_menu_event_check on public.order_items;
create trigger order_menu_event_check before insert on public.order_items for each row execute function public.check_order_menu_event();
insert into public.menu_items(category,name_en,name_bm,description_en,price,event_id,sort_order) values ('mains','Signature Black Pepper Grilled Chicken Chop','Signature Black Pepper Grilled Chicken Chop','Halloween Night',19,'halloween',1000) on conflict (category,name_en,description_en) do update set event_id=excluded.event_id;
insert into public.menu_items(category,name_en,name_bm,description_en,price,event_id,sort_order) values ('mains','Signature Fried Rice with Fried Chicken Chop','Signature Fried Rice with Fried Chicken Chop','Halloween Night',21,'halloween',1001) on conflict (category,name_en,description_en) do update set event_id=excluded.event_id;
insert into public.menu_items(category,name_en,name_bm,description_en,price,event_id,sort_order) values ('mains','Signature Mala Spicy Spaghetti with Chicken Chop','Signature Mala Spicy Spaghetti with Chicken Chop','Halloween Night',21,'halloween',1002) on conflict (category,name_en,description_en) do update set event_id=excluded.event_id;
insert into public.menu_items(category,name_en,name_bm,description_en,price,event_id,sort_order) values ('mains','Spaghetti Aglio Olio','Spaghetti Aglio Olio','Halloween Night',21,'halloween',1003) on conflict (category,name_en,description_en) do update set event_id=excluded.event_id;
insert into public.menu_items(category,name_en,name_bm,description_en,price,event_id,sort_order) values ('mains','Seafood Tomyum Fried Rice','Seafood Tomyum Fried Rice','Halloween Night',21,'halloween',1004) on conflict (category,name_en,description_en) do update set event_id=excluded.event_id;
insert into public.menu_items(category,name_en,name_bm,description_en,price,event_id,sort_order) values ('bites','French Fries','French Fries','Halloween Night',10,'halloween',1005) on conflict (category,name_en,description_en) do update set event_id=excluded.event_id;
insert into public.menu_items(category,name_en,name_bm,description_en,price,event_id,sort_order) values ('bites','Taiwan Sausage','Taiwan Sausage','Halloween Night',17,'halloween',1006) on conflict (category,name_en,description_en) do update set event_id=excluded.event_id;
insert into public.menu_items(category,name_en,name_bm,description_en,price,event_id,sort_order) values ('bites','Chicken Popcorn','Chicken Popcorn','Halloween Night',17,'halloween',1007) on conflict (category,name_en,description_en) do update set event_id=excluded.event_id;
insert into public.menu_items(category,name_en,name_bm,description_en,price,event_id,sort_order) values ('bites','Chicken Nugget','Chicken Nugget','Halloween Night',17,'halloween',1008) on conflict (category,name_en,description_en) do update set event_id=excluded.event_id;
insert into public.menu_items(category,name_en,name_bm,description_en,price,event_id,sort_order) values ('bites','Chicken Wing','Chicken Wing','Halloween Night',17,'halloween',1009) on conflict (category,name_en,description_en) do update set event_id=excluded.event_id;
insert into public.menu_items(category,name_en,name_bm,description_en,price,event_id,sort_order) values ('bites','Chicken Skewer (3 pcs)','Chicken Skewer (3 pcs)','Halloween Night',16,'halloween',1010) on conflict (category,name_en,description_en) do update set event_id=excluded.event_id;
insert into public.menu_items(category,name_en,name_bm,description_en,price,event_id,sort_order) values ('bites','Luncheon Meat','Luncheon Meat','Halloween Night',17,'halloween',1011) on conflict (category,name_en,description_en) do update set event_id=excluded.event_id;
insert into public.menu_items(category,name_en,name_bm,description_en,price,event_id,sort_order) values ('bites','Edamame','Edamame','Halloween Night',17,'halloween',1012) on conflict (category,name_en,description_en) do update set event_id=excluded.event_id;
commit;
