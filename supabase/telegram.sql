-- Apply after schema.sql and the stored-items migrations. No secrets live in this file.
begin;
create table if not exists public.telegram_staff (
 telegram_user_id text primary key check (telegram_user_id ~ '^[1-9][0-9]{0,15}$'),
 staff_id uuid not null unique references public.staff_profiles(user_id) on delete cascade,
 notify_songs boolean not null default true,
 notify_orders boolean not null default true,
 created_at timestamptz not null default now()
);
create table if not exists public.telegram_outbox (
 id uuid primary key default gen_random_uuid(),
 kind text not null check (kind in ('song','order')),
 entity_id uuid not null,
 telegram_user_id text not null references public.telegram_staff(telegram_user_id) on delete cascade,
 status text not null default 'pending' check (status in ('pending','processing','sent','skipped','failed')),
 attempts integer not null default 0,
 next_attempt_at timestamptz not null default now(),
 lease_id uuid,
 locked_until timestamptz,
 last_error_code text,
 created_at timestamptz not null default now(),
 sent_at timestamptz,
 unique(kind,entity_id,telegram_user_id)
);
create index if not exists telegram_outbox_due on public.telegram_outbox(next_attempt_at,created_at)
 where status in ('pending','processing');
create table if not exists public.telegram_updates (
 update_id bigint primary key,
 telegram_user_id text not null,
 status text not null default 'processing' check (status in ('processing','done')),
 lease_id uuid not null default gen_random_uuid(),
 locked_until timestamptz not null default now()+interval '2 minutes',
 created_at timestamptz not null default now()
);
create index if not exists telegram_updates_user_time on public.telegram_updates(telegram_user_id,created_at);
alter table public.telegram_staff enable row level security;
alter table public.telegram_outbox enable row level security;
alter table public.telegram_updates enable row level security;
revoke all on public.telegram_staff,public.telegram_outbox,public.telegram_updates from public,anon,authenticated;
grant all on public.telegram_staff,public.telegram_outbox,public.telegram_updates to service_role;

create or replace function public.enqueue_telegram_submission()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare v_kind text; v_permission text;
begin
 v_kind := case when tg_table_name='orders' then 'order' else 'song' end;
 v_permission := case when v_kind='order' then 'orders.view' else 'songs.view' end;
 insert into public.telegram_outbox(kind,entity_id,telegram_user_id)
 select v_kind,new.id,t.telegram_user_id from public.telegram_staff t
 join public.staff_profiles s on s.user_id=t.staff_id and s.active
 where (case when v_kind='order' then t.notify_orders else t.notify_songs end)
 and (s.role='owner' or exists(select 1 from public.role_permissions r where r.role=s.role and r.permission_key=v_permission and r.enabled))
 on conflict do nothing;
 return new;
end;
$$;
drop trigger if exists telegram_new_song on public.song_requests;
create trigger telegram_new_song after insert on public.song_requests for each row execute function public.enqueue_telegram_submission();
drop trigger if exists telegram_new_order on public.orders;
create trigger telegram_new_order after insert on public.orders for each row execute function public.enqueue_telegram_submission();

create or replace function public.claim_telegram_deliveries(p_limit integer default 3)
returns setof public.telegram_outbox language plpgsql security definer set search_path=public,pg_temp as $$
begin
 update public.telegram_outbox set status='failed',last_error_code='retry_exhausted',locked_until=null
 where status in ('pending','processing') and attempts>=20 and (locked_until is null or locked_until<now());
 return query
 update public.telegram_outbox o set status='processing',lease_id=gen_random_uuid(),locked_until=now()+interval '2 minutes',attempts=o.attempts+1
 where o.id in (
  select id from public.telegram_outbox where status in ('pending','processing') and attempts<20
  and next_attempt_at<=now() and (locked_until is null or locked_until<now())
  order by created_at for update skip locked limit greatest(1,least(p_limit,3))
 ) returning o.*;
end;
$$;

create or replace function public.claim_telegram_update(p_update_id bigint,p_user_id text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.telegram_updates%rowtype;
begin
 insert into public.telegram_updates(update_id,telegram_user_id) values(p_update_id,p_user_id)
 on conflict do nothing returning * into r;
 if found then return jsonb_build_object('state','claimed','lease_id',r.lease_id); end if;
 select * into r from public.telegram_updates where update_id=p_update_id for update;
 if r.status='done' then return jsonb_build_object('state','done'); end if;
 if r.locked_until>now() then return jsonb_build_object('state','busy'); end if;
 update public.telegram_updates set lease_id=gen_random_uuid(),locked_until=now()+interval '2 minutes'
 where update_id=p_update_id returning * into r;
 return jsonb_build_object('state','claimed','lease_id',r.lease_id);
end;
$$;
revoke all on function public.enqueue_telegram_submission() from public,anon,authenticated;
revoke all on function public.claim_telegram_deliveries(integer) from public,anon,authenticated;
revoke all on function public.claim_telegram_update(bigint,text) from public,anon,authenticated;
grant execute on function public.claim_telegram_deliveries(integer),public.claim_telegram_update(bigint,text) to service_role;
commit;
