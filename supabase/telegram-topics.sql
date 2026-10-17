-- Run after telegram.sql. Topics are configured by the owner in SQL Editor, never by public commands.
begin;
create table if not exists public.telegram_topics (
 id uuid primary key default gen_random_uuid(),
 kind text not null unique check (kind in ('order','song','balance')),
 chat_id text not null check (chat_id ~ '^-[1-9][0-9]{0,15}$'),
 thread_id integer not null check (thread_id > 0),
 approved_by uuid not null references public.staff_profiles(user_id) on delete cascade,
 active boolean not null default true,
 created_at timestamptz not null default now(),
 unique(chat_id,thread_id)
);
alter table public.telegram_topics enable row level security;
revoke all on public.telegram_topics from public,anon,authenticated;
grant all on public.telegram_topics to service_role;

alter table public.telegram_outbox alter column telegram_user_id drop not null;
alter table public.telegram_outbox add column if not exists topic_id uuid references public.telegram_topics(id) on delete cascade;
alter table public.telegram_outbox drop constraint if exists telegram_outbox_one_destination;
alter table public.telegram_outbox add constraint telegram_outbox_one_destination
 check ((telegram_user_id is not null and topic_id is null) or (telegram_user_id is null and topic_id is not null));
create unique index if not exists telegram_outbox_topic_event_unique
 on public.telegram_outbox(kind,entity_id,topic_id) where topic_id is not null;
create index if not exists telegram_outbox_topic_id on public.telegram_outbox(topic_id) where topic_id is not null;
create index if not exists telegram_topics_approved_by on public.telegram_topics(approved_by);

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
 insert into public.telegram_outbox(kind,entity_id,topic_id)
 select v_kind,new.id,t.id from public.telegram_topics t
 join public.staff_profiles s on s.user_id=t.approved_by and s.active and s.role='owner'
 where t.active and t.kind=v_kind
 on conflict do nothing;
 return new;
end;
$$;
revoke all on function public.enqueue_telegram_submission() from public,anon,authenticated;
commit;
