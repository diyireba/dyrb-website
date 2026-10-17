begin;
alter table public.menu_items drop constraint if exists menu_items_name_en_key;
create unique index if not exists menu_items_variant_key on public.menu_items(category,name_en,description_en);
-- Restore distinct happy-hour and evening variants without changing existing availability.
insert into public.menu_items(category,name_en,name_bm,description_en,description_bm,price,image_url,available,active,sort_order,tag) values
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
('draught','Sapporo Premium Beer · 10 mugs','Sapporo Premium Beer · 10 mug','After 8pm','Selepas 8 malam','198','','true','true','34','AC03')
on conflict (category,name_en,description_en) do nothing;

-- Apply to existing projects after schema.sql and stored-items-ledger.sql.
-- Reject missing values and serialize balance changes for the same member.
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
declare v_id uuid;
begin
  if not exists (select 1 from public.venue_tables where code = p_table_code and active) then raise exception 'This table QR is not active.'; end if;
  if p_request_type is null or p_request_type not in ('Call staff','Request water','Request the bill') then raise exception 'Unknown service request.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_table_code || ':' || p_request_type, 0));
  select id into v_id from public.service_requests
  where table_code=p_table_code and request_type=p_request_type and status='open'
  order by created_at desc limit 1;
  if v_id is null then
    insert into public.service_requests(table_code,request_type) values (p_table_code,p_request_type) returning id into v_id;
  end if;
  return jsonb_build_object('id',v_id,'status','open');
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


commit;
