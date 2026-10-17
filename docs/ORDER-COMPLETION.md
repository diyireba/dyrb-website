# Simple orders for POS entry

Customers send an order; staff enter it into their venue POS and mark it completed. There are no preparation, readiness or payment actions in the customer-order dashboard. Payment stays in the POS. Existing internal `served` status is displayed as Completed for compatibility; `preparing` and `ready` records appear as New until completed. Cancelled orders remain cancelled and cannot be completed.

Telegram order alerts and completion edits show quantities and item names without prices or totals. Date/time uses Asia/Kuala_Lumpur in DD/MM/YYYY, h:mmam/pm format. New alerts show:

```text
New order · Table A3
17/10/2026, 3:49pm

1 x Sausage
```

The **✓ Mark as completed** button edits the original shared message to Completed, records who completed it and when, and removes the button. It requires an active linked staff account with `orders.manage`, and validates the exact registered chat/topic/message both in the handler and database. Each staff member must be individually linked in `telegram_staff`; group membership alone does not grant permission to complete orders. Other group members can see the shared completed status.

## Deploy and test live

1. Run `supabase/order-completion.sql` in the live Supabase SQL Editor, after the existing `telegram.sql` and `telegram-topics.sql` migrations. It adds completion metadata, notification message IDs and narrowly granted completion RPCs. It does not change payment fields or mark existing pending orders complete.
2. In Netlify set **`SETUP_TELEGRAM_ON_DEPLOY=true`**, Production, with Builds scope. Keep the existing Telegram token/webhook secret/APP_URL available to Builds and Functions. The setup script now requests `callback_query` updates as well as messages; without re-registering this setting, the buttons will not reach your server.
3. Push the implementation and wait for Published, with `Connected @dyrb_bot` in the deploy log. Remove `SETUP_TELEGRAM_ON_DEPLOY` afterward. No local secrets or local migration commands are required.
4. Submit a **new** order on the live website. Previously delivered Telegram messages are unchanged: their message IDs were not recorded by the old implementation, so they cannot gain buttons retroactively.
5. Use the Telegram button from your linked owner account. Verify the original group message becomes Completed with your name/time, the button disappears and the staff dashboard reflects it. A repeated click does not overwrite the first completion.
6. Submit another new order and complete it from the website instead. The shared Telegram message is edited through the existing delivery webhook and retry queue. Test unauthorized/unlinked users: they must not be able to complete an order. Website submissions and existing song/balance commands continue as before.

The first completion is atomic and audited. Completion-message edits are durable outbox deliveries; the existing `telegram_alerts` INSERT webhook processes them and the retry Cron should remain enabled. If Telegram temporarily fails after a completion is saved, the order remains completed and its edit is retried. Repeating an identical Telegram edit is treated as success. A row-locking trigger covers an order completing while its original alert is still being sent. As with all existing notifications, a crash after Telegram accepts a send but before its ID is saved can cause a duplicate delivery.

Automated tests use fake Telegram/database clients. Database execution and the complete live Telegram/browser flow still need the steps above; no test sends real orders or messages.
