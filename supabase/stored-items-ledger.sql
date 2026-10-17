-- Apply this migration to existing Supabase projects to enable itemized member storage.
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

alter table public.member_stored_batches enable row level security;
alter table public.member_stored_transactions enable row level security;
drop policy if exists stored_batches_read on public.member_stored_batches;
create policy stored_batches_read on public.member_stored_batches for select to authenticated using (member_id = auth.uid() or public.has_permission('members.adjust'));
drop policy if exists stored_transactions_read on public.member_stored_transactions;
create policy stored_transactions_read on public.member_stored_transactions for select to authenticated using (member_id = auth.uid() or public.has_permission('members.adjust'));
grant select on public.member_stored_batches, public.member_stored_transactions to authenticated;

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
  if p_item_type not in ('draught','bottle','whisky','spirit','other') or char_length(v_name) not between 1 and 100 or p_quantity is null or p_quantity <= 0 or p_direction not in ('in','out') or char_length(trim(p_reason)) not between 1 and 180 then
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
revoke all on function public.adjust_member_stored_item(uuid,text,text,integer,text,text) from public, anon;
grant execute on function public.adjust_member_stored_item(uuid,text,text,integer,text,text) to authenticated;
