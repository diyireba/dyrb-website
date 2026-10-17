-- Apply after telegram.sql and telegram-topics.sql. No payment fields are changed.
begin;
alter table public.orders add column if not exists completed_at timestamptz;
alter table public.orders add column if not exists completed_by uuid references public.staff_profiles(user_id) on delete set null;
alter table public.orders add column if not exists completed_by_name text;
alter table public.telegram_outbox add column if not exists telegram_message_id bigint;
alter table public.telegram_outbox drop constraint if exists telegram_outbox_kind_check;
alter table public.telegram_outbox add constraint telegram_outbox_kind_check check (kind in ('song','order','order_completed'));

create or replace function public.finish_pos_order(p_order_id uuid,p_actor uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_order public.orders%rowtype; v_staff public.staff_profiles%rowtype;
begin
 select * into v_staff from public.staff_profiles where user_id=p_actor and active;
 if not found or not (v_staff.role='owner' or exists(select 1 from public.role_permissions where role=v_staff.role and permission_key='orders.manage' and enabled)) then
  raise exception 'Order-management permission required.' using errcode='42501';
 end if;
 select * into v_order from public.orders where id=p_order_id for update;
 if not found then raise exception 'Order not found.'; end if;
 if v_order.status='cancelled' then raise exception 'Cancelled orders cannot be completed.'; end if;
 if v_order.status='served' then return jsonb_build_object('already_completed',true); end if;
 -- Keep the existing internal status for compatibility. The UI calls it Completed.
 update public.orders set status='served',completed_at=now(),completed_by=p_actor,completed_by_name=v_staff.display_name where id=p_order_id;
 insert into public.audit_log(actor_id,action,entity,entity_id) values(p_actor,'order.pos.completed','orders',p_order_id);
 insert into public.telegram_outbox(kind,entity_id,telegram_user_id,topic_id)
 select 'order_completed',entity_id,telegram_user_id,topic_id from public.telegram_outbox
 where kind='order' and entity_id=p_order_id and status='sent' and telegram_message_id is not null
 on conflict do nothing;
 return jsonb_build_object('already_completed',false);
end;
$$;
revoke all on function public.finish_pos_order(uuid,uuid) from public,anon,authenticated,service_role;

create or replace function public.complete_order(p_order_id uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null then raise exception 'Sign in first.' using errcode='42501'; end if;
 return public.finish_pos_order(p_order_id,auth.uid());
end;
$$;
revoke all on function public.complete_order(uuid) from public,anon;
grant execute on function public.complete_order(uuid) to authenticated;

create or replace function public.complete_telegram_order(p_delivery_id uuid,p_telegram_user_id text,p_chat_id text,p_thread_id integer,p_message_id bigint)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_delivery public.telegram_outbox%rowtype; v_actor uuid; v_topic public.telegram_topics%rowtype;
begin
 select staff_id into v_actor from public.telegram_staff where telegram_user_id=p_telegram_user_id;
 if v_actor is null then raise exception 'Staff link required.' using errcode='42501'; end if;
 select * into v_delivery from public.telegram_outbox where id=p_delivery_id and kind='order' and status='sent' and telegram_message_id=p_message_id;
 if not found then raise exception 'Invalid order message.' using errcode='42501'; end if;
 if v_delivery.topic_id is not null then
  select t.* into v_topic from public.telegram_topics t join public.staff_profiles s on s.user_id=t.approved_by and s.active and s.role='owner'
  where t.id=v_delivery.topic_id and t.kind='order' and t.active and t.chat_id=p_chat_id and t.thread_id=p_thread_id;
  if not found then raise exception 'Invalid order topic.' using errcode='42501'; end if;
 elsif v_delivery.telegram_user_id is distinct from p_telegram_user_id or p_chat_id is distinct from p_telegram_user_id or p_thread_id is not null then
  raise exception 'Invalid private order message.' using errcode='42501';
 end if;
 return public.finish_pos_order(v_delivery.entity_id,v_actor);
end;
$$;
revoke all on function public.complete_telegram_order(uuid,text,text,integer,bigint) from public,anon,authenticated;
grant execute on function public.complete_telegram_order(uuid,text,text,integer,bigint) to service_role;

-- If an order is completed while Telegram is sending its original alert, queue its edit too.
-- Locking the same order row as finish_pos_order serializes both sides of that race.
create or replace function public.queue_completed_order_message()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare v_status text;
begin
 select status into v_status from public.orders where id=new.entity_id for update;
 if v_status='served' then
  insert into public.telegram_outbox(kind,entity_id,telegram_user_id,topic_id)
  values('order_completed',new.entity_id,new.telegram_user_id,new.topic_id) on conflict do nothing;
 end if;
 return new;
end;
$$;
revoke all on function public.queue_completed_order_message() from public,anon,authenticated;
drop trigger if exists telegram_order_message_completed on public.telegram_outbox;
create trigger telegram_order_message_completed after update of telegram_message_id on public.telegram_outbox
for each row when (new.kind='order' and new.telegram_message_id is not null and old.telegram_message_id is null)
execute function public.queue_completed_order_message();
commit;
