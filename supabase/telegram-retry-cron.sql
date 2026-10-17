-- Optional but recommended: enable pg_cron (Cron) and pg_net in Supabase first.
-- In Supabase Vault, create these two secrets without putting their values in this file:
-- telegram_dispatch_url    = https://YOUR_DEPLOYED_SITE/api/telegram-events
-- telegram_dispatch_secret = the same private value as TELEGRAM_DISPATCH_SECRET
-- Run once. To change the schedule, use the Supabase Cron dashboard.
select cron.schedule('telegram-retry-pending', '* * * * *', $$
 select net.http_post(
  url := (select decrypted_secret from vault.decrypted_secrets where name='telegram_dispatch_url'),
  headers := jsonb_build_object('Content-Type','application/json','x-telegram-dispatch-secret',
   (select decrypted_secret from vault.decrypted_secrets where name='telegram_dispatch_secret')),
  body := '{}'::jsonb,
  timeout_milliseconds := 30000
 );
$$);
