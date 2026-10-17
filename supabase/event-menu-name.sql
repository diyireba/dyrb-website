-- Apply after event-menu.sql. Keeps existing IDs and schedules for compatibility.
begin;
alter table public.menu_events drop constraint if exists menu_events_name_length;
alter table public.menu_events add constraint menu_events_name_length check (length(btrim(name)) between 1 and 80);
create or replace function public.get_guest_event_name()
returns text language sql stable security definer set search_path = public, pg_temp as $$
 select name from public.menu_events where id='halloween' and enabled
 and (starts_at is null or now() >= starts_at) and (ends_at is null or now() < ends_at);
$$;
revoke all on function public.get_guest_event_name() from public;
grant execute on function public.get_guest_event_name() to anon, authenticated;
update public.menu_items set image_url=case sort_order
 when 1000 then '/images/food-f05.jpg' when 1001 then '/images/food-f02.jpg'
 when 1002 then '/images/food-f07.jpg' when 1003 then '/images/event-aglio-olio.png'
 when 1004 then '/images/food-f04.jpg' end
 where event_id='halloween' and category='mains' and sort_order between 1000 and 1004 and coalesce(image_url,'')='';
commit;
