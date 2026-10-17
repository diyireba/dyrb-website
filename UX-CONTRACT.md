# DYRB QR Guest and Staff Experience

## Product context

DYRB is a Malaysian bar and bistro with table QR codes, a live singer, food and beverage menus, table orders paid at the venue, song requests, service requests, and membership balances. Guests can use English, Bahasa Malaysia, or Chinese. Staff pages are permission based. The product and workflow requirements come from the user's conversation and the current `src/App.jsx`, `src/data.js`, and `supabase/schema.sql` implementation.

## Guest flow

Guest service controls offer Request water and Ask for the bill. Call staff was removed by user request; `submitService` and the database RPC accept only the remaining two request types. Apply `supabase/disable-call-staff.sql` to existing live installations. Historical service requests remain available to staff.

1. A guest scans the code at their table and sees that table number.
2. They browse food or beverages and add items without leaving the menu.
3. They can open the basket, review the total, and send the order to staff for payment at the venue.
4. They can submit a song request from the same page.
5. A member can sign in with phone number and PIN to view their own balances.

Customer ordering improvements preserve the compact food photography. Menu filter controls stay accessible while scrolling; beverage search covers all visible beverage categories and respects current draught pricing periods. Category selection clears search. Mobile basket bars are hidden when empty and show item count, total and table when populated; they sit above a reserved hosting-badge area. Desktop and mobile reuse `renderCartLine` for removal and quantity edits, with a limit of 20 per menu variant. Add confirmation uses the shared notification owner. `orderSendLock` blocks simultaneous submit activations; it does not promise network-level idempotency if a response is lost. Basket clearing and the table/item receipt happen only after successful server acknowledgement; failures preserve the basket. Confirmation and basket use the existing modal focus/keyboard owner, and staff access is moved into the guest footer. New copy is maintained in English, Bahasa Malaysia and Chinese.

## Staff flow

Staff with `tables.manage` manage tables from Tables & QR. `createTable`/`updateTable` in `src/data.js` use existing venue_tables RLS. Codes are exact, unique and immutable after creation; editing changes only label/display order. Activate/deactivate uses ActionDialog confirmation; adding/editing uses ValidatedForm and preserves entries on failed saves. No delete action is exposed. QR previews show real active status and downloads use the current origin and exact saved code. The empty state has no invented table or QR. Turning a table off blocks new guest submissions through existing server RPC checks, while preserving its previous orders and printed QR identity.

Orders are received here and entered into the venue POS by staff. Mark as completed means POS entry is finished, not payment or food preparation. `complete_order` and the service-only `complete_telegram_order` RPC lock each order and preserve the first completion actor/time. Existing internal `served` maps to Completed; payment fields are not used or changed. Telegram buttons require an active linked staff identity with `orders.manage` and the exact approved chat/topic/message. Completion edits the shared alert and removes the button. Durable outbox edits synchronize completion from either Telegram or the website, including notification/completion races.

Staff use a unique assigned user ID and six-digit passcode; member phone/PIN credentials cannot enter the staff dashboard. `api/member-auth.ts` owns rate-limited credential verification for both flows, with separate internal identities and profile checks. `api/admin.ts` owns account creation. See `docs/LOGIN.md` for existing-account migration. No SMS or email verification is sent.

Staff use individually assigned accounts. The dashboard shows only the sections their role can access. The singer works with song requests. Other service, order, menu, member, staff, table, and permission controls remain behind their corresponding permissions.

## Responsive behavior

- Phone: one-column guest menu, fixed basket bar, modal basket sheet, stacked request forms, and compact staff bottom navigation.
- Tablet: use available width for menu rows and staff content; keep the basket reachable without narrowing the menu into a second column.
- Desktop: allow the guest basket rail and full staff navigation where there is room.
- All controls must have visible focus and comfortable touch targets.

## Shared behavior owners

- Forms: `ValidatedForm` validates required fields and formats before submission, focuses the first invalid field, and announces its error. Failed saves preserve entries in the open dialog.
- Select/Listbox: native HTML selects own keyboard behavior and platform popup geometry.
- Modal focus: `useModalFocus` owns Escape, keyboard containment, scroll locking, and focus restoration for basket, action, and member dialogs.
- Notifications: the App notification system announces saved changes and failures. Dashboard loading failures include a retry action.
- Dashboard freshness: Supabase Realtime triggers refreshes; a 10-second visible-page poll provides a fallback. Returning to the tab, regaining focus or reconnecting also refreshes. Concurrent reads share one in-flight request; timers/listeners are removed on unmount.
- Scrollbars: the global baseline in `src/responsive-fixes.css` applies to all application scroll regions.
- Staff navigation: all permitted sections remain reachable by horizontally scrolling the mobile navigation; sign-out remains in the header.
- Prices: all MYR prices and totals show two decimal places. Order quantity is limited to 20 per item to match the server contract.
- Guest menu availability refreshes after local changes and live menu events. Basket submission remains server validated.

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Select/Listbox | Native select | UX-CONTRACT.md | Staff role, drink, transaction | Browser keyboard and selection |
| Date | Native datetime-local | UX-CONTRACT.md | Optional Malaysia-time event bounds | Keyboard and boundary tests |
| Form | ValidatedForm | src/App.jsx | Sign-in, request, staff action | Required-field and failed-save browser checks |
| Scrollbar | Global CSS baseline | src/responsive-fixes.css | Horizontal navigation, tables, dialogs | Narrow-screen inspection |
| Toast | App notify | src/App.jsx | Save, submission, error | Browser status messages |
| CRUD | Dashboard run and data services | src/App.jsx and src/data.js | Save in place; close on success | Order lifecycle and form recovery |

## Event menu

Source: user request, 17 October 2026; `supabase/event-menu.sql` owns permissions and visibility. Menu managers can enable Halloween Night manually with optional start/end bounds. Active event food replaces regular food. The end bound is exclusive. Drinks stay unchanged except cocktails and soft drinks, which require explicit inclusion. Event status defaults off. Date controls use native datetime-local inputs (platform calendar accepted), with explicit Malaysia timezone conversion; shared ValidatedForm and Dashboard run own validation and feedback. Drafts survive failed saves. Guest menu polls every 30 seconds and is revalidated on submission; database trigger rejects hidden items even for stale clients.

Event names are editable in the existing event-settings form (user request, 17 October 2026). Save validates a trimmed 1–80 character name, preserves the catalog and schedule, and supplies the saved name to staff labels and the guest banner. `supabase/event-menu-name.sql` adds database validation and a public RPC that reveals only the active event name.

Service requests are retired: no customer water/bill/help panel, staff Service navigation, overview card, or service permission controls. The submission endpoint rejects requests from older clients once disable-service-requests.sql is applied.
