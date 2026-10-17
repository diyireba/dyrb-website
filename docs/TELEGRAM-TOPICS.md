# DYRB Telegram group topics

The venue owner creates/renames the private staff group **DYRB**, enables Topics and creates:

| Telegram topic | Kind | Behavior |
|---|---|---|
| Customer Order | `order` | New-order alerts and authorized `/orders` summaries |
| Song | `song` | New-song alerts and authorized `/songs` summaries |
| Customer Balance Check | `balance` | Authorized lookup commands; replies sent privately to requester |

Group members can read the order/song alerts sent into their group. Keep membership to approved venue staff. Balance values never go into the shared topic. A phone typed into a group command is still visible to its members; send `/balance` in the topic to receive private instructions, then enter the phone privately if needed. Each requester must first open @dyrb_bot privately and press Start, and be linked to an active staff account with the appropriate permissions.

## Live setup

1. Run `supabase/telegram.sql` if not already applied, then run **`supabase/telegram-topics.sql`** in live Supabase SQL Editor. Run them in this order; rerunning the old base migration alone replaces the topic-aware enqueue function.
2. Add @dyrb_bot to the DYRB group with permission to send messages. You can create topics yourself; the bot does not need topic-management permissions. Address commands explicitly to `@dyrb_bot` so Telegram privacy mode can remain enabled.
3. Push `server/telegram.ts`, `supabase/telegram-topics.sql`, `tools/setup-telegram.mjs`, `tests/telegram.test.mjs`, `docs/TELEGRAM-TOPICS.md` and `docs/TELEGRAM.md` to GitHub. Wait for Netlify Published. To refresh the bot command menu set `SETUP_TELEGRAM_ON_DEPLOY=true` for this production deployment, then remove it after success. Explicit commands work even without a menu refresh.
4. Send **`/topicinfo@dyrb_bot` in each of the three topics**. It returns the Telegram user ID, group ID and actual topic ID. These IDs are not the visual list numbers 1/2/3. This discovery command never registers or authorizes a destination.
5. Link the verified owner Telegram ID to the existing owner profile in Supabase SQL Editor:

   ```sql
   insert into public.telegram_staff(telegram_user_id,staff_id)
   select 'YOUR_TELEGRAM_USER_ID',user_id
   from public.staff_profiles where login_id='owner' and role='owner' and active
   on conflict (telegram_user_id) do update set staff_id=excluded.staff_id;
   ```

6. Replace the values below with the exact IDs returned by the bot. The group ID is negative, typically starts `-100`, and is the same for all three topics:

   ```sql
   insert into public.telegram_topics(kind,chat_id,thread_id,approved_by)
   select v.kind,v.chat_id,v.thread_id,s.user_id
   from (values
     ('order','YOUR_NEGATIVE_GROUP_ID',ORDER_TOPIC_ID),
     ('song','YOUR_NEGATIVE_GROUP_ID',SONG_TOPIC_ID),
     ('balance','YOUR_NEGATIVE_GROUP_ID',BALANCE_TOPIC_ID)
   ) as v(kind,chat_id,thread_id)
   cross join public.staff_profiles s
   where s.login_id='owner' and s.role='owner' and s.active
   on conflict (kind) do update set chat_id=excluded.chat_id,
     thread_id=excluded.thread_id,approved_by=excluded.approved_by,active=true;
   ```

   There is one configured destination per kind and no public route-registration API. All topic configuration is service-role/database-admin only. A topic must remain active and approved by an active owner, checked again immediately before commands/delivery. Turning a topic off stops its queued alerts. Existing private staff alert subscriptions remain available; disable that user's `notify_orders`/`notify_songs` if the group replaces their private alerts.

7. Complete the existing outbox Database Webhook and retry Cron setup in `docs/TELEGRAM.md`. Topics share the original `telegram_outbox`, webhook URL and retry job. No second submission webhook or Cron job is needed.
8. Test on the live site: submit one order and one song; verify each lands in its own topic. Send `/orders@dyrb_bot` in Customer Order and `/songs@dyrb_bot` in Song. In Customer Balance Check send `/balance@dyrb_bot` to receive private instructions; authorized users can also include the phone for a private result. Verify an unlinked or inactive user cannot query records. No credentials are required in Telegram.

The implementation is verified with fake Telegram/database clients. Applying SQL, registering real IDs and live Telegram delivery must be verified after publication. No real messages or live database changes are performed by automated tests.
