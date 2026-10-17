-- Read-only checks. Does not display bot tokens, webhook headers or member data.
select 'queued deliveries (all)' as check_name,
       count(*)::text as result
from public.telegram_outbox
union all
select 'queue: ' || kind || ' / ' || status,
       'count=' || count(*) || ', max attempts=' || max(attempts) ||
       ', error=' || coalesce(string_agg(distinct last_error_code, ', '), 'none')
from public.telegram_outbox group by kind,status
union all
select 'enabled group destinations', count(*)::text
from public.telegram_topics where active
union all
select 'outbox webhook triggers', coalesce(string_agg(t.tgname, ', '), 'NONE')
from pg_trigger t where t.tgrelid='public.telegram_outbox'::regclass and not t.tgisinternal
union all
select 'topic-aware enqueue installed',
       (strpos(pg_get_functiondef('public.enqueue_telegram_submission()'::regprocedure), 'telegram_topics') > 0)::text
union all
select 'Realtime tables', coalesce(string_agg(tablename, ', '), 'NONE')
from pg_publication_tables
where pubname='supabase_realtime' and schemaname='public'
and tablename in ('orders','order_items','song_requests','service_requests');
