# Staff Telegram bot

This integration is prepared locally. It becomes live only after the bot, database migration, public HTTPS deployment, webhooks and staff links are configured. Vite demo mode does not send Telegram messages. Standard Telegram bot messaging is free within Telegram's rate limits; hosting and database usage remain subject to their own plans. Paid broadcasts are never enabled by this code.

## What it does

For the DYRB staff group with **Customer Order**, **Song**, and **Customer Balance Check** topics, follow `docs/TELEGRAM-TOPICS.md` and apply `supabase/telegram-topics.sql` after the base migration below. Order/song alerts can be routed to the approved group topics. Balance replies remain private to the authorized requester.

- Sends new-song and new-order alerts to each linked staff member's **private** chat, only when their current role can view that data.
- `/songs` and `/orders` show the latest 10 open requests/active orders.
- `/balance 0123456789` shows points, unexpired stored drinks and any separately labelled legacy beer balance. Both `members.lookup` and `members.adjust` are required, matching website balance access. Balance lookup is audited. Staff without balance access cannot use it.
- `/whoami` shows only the sender's Telegram ID, for owner-approved linking. Unlinked people cannot read venue data.
- Commands work privately, or in approved topics after the topic migration. This version does not approve songs, change order statuses or adjust balances; those actions remain in the staff website.

## 1. Create the bot

Open the verified **@BotFather** in Telegram, send `/newbot`, and choose a name and username. Save the bot token directly into your private deployment environment; do not put it in this chat, Git, screenshots or any `VITE_` variable. Staff must open the bot and press Start before it can message them.

## 2. Deploy the backend

Apply `supabase/telegram.sql` after the existing schema/stored-items migrations. Deploy this repository to your HTTPS website host with its backend API routes (Vercel, or the Netlify wrappers described in `docs/NETLIFY.md`). Continue using your existing server-only Supabase credentials.

Add these **server-only** environment variables and redeploy:

| Variable | Value |
|---|---|
| `SUPABASE_URL` | Existing Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Existing private service-role key |
| `TELEGRAM_BOT_TOKEN` | Token from BotFather |
| `TELEGRAM_WEBHOOK_SECRET` | A long random secret, 32–256 letters/numbers/underscore/hyphen |
| `TELEGRAM_DISPATCH_SECRET` | A different long random secret |
| `APP_URL` | Public HTTPS website origin, without a path |

Generate each secret locally, for example `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Keep the values private. Configure secrets in your deployment dashboard and local ignored `.env.local` as needed. The bot token never reaches the browser.

## 3. Connect Telegram's webhook

For live Netlify setup without a local secrets file, set `SETUP_TELEGRAM_ON_DEPLOY=true` in Netlify environment variables, for Production with Builds access. The bot token, webhook secret and APP_URL also need Builds access. Push the updated `tools/netlify-migrate.mjs`; the existing `build:netlify` command runs registration after a successful build, only in Netlify production. Watch for `Connected @your_bot` and then wait for Published. Remove `SETUP_TELEGRAM_ON_DEPLOY` after success. Runtime bot secrets must also remain available to Functions. Complete the database migration before messaging the bot. This step registers the webhook and command menu; staff linking, submission webhook and retry Cron still need the steps below.

With the same private values available locally, run:

```powershell
node --env-file=.env.local tools/setup-telegram.mjs
```

This explicitly registers `https://YOUR_SITE/api/telegram`, installs the command menu and preserves pending updates. It does not send venue notifications or enroll staff. The endpoint checks Telegram's secret-token header. Ensure deployment protection/firewall rules allow Telegram and the Supabase webhook to reach the two endpoints; these endpoints still require their own distinct secrets.

## 4. Link approved staff

Each staff member opens a **private** chat with the bot and sends `/whoami`. The venue owner verifies the person and their existing staff account, then runs the following in Supabase SQL Editor. Replace the placeholders with that person's exact Telegram ID and existing `staff_profiles.user_id`:

```sql
insert into public.telegram_staff(telegram_user_id,staff_id)
values ('VERIFIED_TELEGRAM_USER_ID','EXISTING_STAFF_USER_UUID');
```

Only a database administrator/service role can manage these bindings. Telegram usernames and phone numbers are not used for authorization. A Telegram ID and staff account can each have only one binding. Review links with:

```sql
select t.telegram_user_id,s.display_name,s.role,s.active,t.notify_songs,t.notify_orders
from public.telegram_staff t join public.staff_profiles s on s.user_id=t.staff_id;
```

Stop alerts for a staff member by setting `notify_songs=false` and/or `notify_orders=false`. Removing their binding revokes all bot access and removes their pending deliveries. Deactivating their existing staff account also denies commands and future delivery. Notifications are not backfilled for events submitted before someone was linked.

## 5. Connect submission notifications

In Supabase **Database → Webhooks**, create one webhook:

- Table: `public.telegram_outbox`
- Event: **INSERT only**
- Method: **POST**
- URL: `https://YOUR_SITE/api/telegram-events`
- Headers: `Content-Type: application/json` and `x-telegram-dispatch-secret: YOUR_PRIVATE_TELEGRAM_DISPATCH_SECRET`
- Set the webhook HTTP timeout to 30000ms if available.

The outbox is filled transactionally by inserts into `song_requests` and `orders`; alerts work even if a guest closes the browser. Supabase's database webhook runs asynchronously after commit, so order items are available when fetched. The API ignores the webhook body and reads genuine pending queue records from the database. No service key or bot token belongs in the database webhook headers.

Enable Supabase Cron and pg_net, create the two Vault secrets described in `supabase/telegram-retry-cron.sql`, then run that file once. This retries due notifications every minute and recovers abandoned delivery leases. Keep this job enabled; database webhooks alone do not guarantee retries. The endpoint drains up to three pending deliveries per call. Failures back off, obey Telegram retry-after responses, and stop after 20 attempts (or a blocked-bot 403). Monitor pending/failed rows:

```sql
select kind,status,count(*) from public.telegram_outbox group by kind,status;
select id,kind,attempts,last_error_code from public.telegram_outbox where status='failed';
```

After correcting a delivery problem, requeue failed rows with `status='pending', attempts=0, locked_until=null, next_attempt_at=now()`. Delivery is **at least once**: a rare crash after Telegram accepts a message but before the database records success can produce a duplicate. The source order/request ID is included so staff can recognize it. Website submissions continue to work while Telegram is unavailable; queued delivery does not roll them back.

## 6. Verify before venue use

1. Send `/whoami`, link your owner account and confirm `/help` works.
2. Submit a real test song and order through the deployed QR menu; confirm their table, items, totals and IDs arrive once normally.
3. Check `/songs`, `/orders` and `/balance` against the website.
4. Test a singer account: songs work, orders and balances are denied. Test a staff account: orders work, balances are denied unless explicitly granted.
5. Try an unlinked Telegram account and a group chat; neither can retrieve balances.
6. Temporarily make delivery unavailable, then restore it and verify Cron retries the pending queue. Remove test venue records through your normal staff workflow.

No bot token, deployment URL or hosted database was supplied in this chat, so live Telegram delivery and SQL execution have **not** been verified. Automated tests use fake database/Telegram clients and never send real messages.

## Official references

- [Telegram Bot API](https://core.telegram.org/bots/api#setwebhook)
- [Telegram bot creation and free messaging limits](https://core.telegram.org/bots/faq)
- [Supabase Database Webhooks](https://supabase.com/docs/guides/database/webhooks)
- [Supabase Cron](https://supabase.com/docs/guides/cron)
