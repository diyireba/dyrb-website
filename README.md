# Malam QR Guest Experience

Mobile table ordering, song requests, member balances, and a role-aware venue dashboard. The sample venue name, menu, member list, and staff accounts are demo content.

## Run the interactive prototype

```powershell
npm install
npm run dev
```

Without Supabase environment variables the app runs in local demo mode and saves changes in this browser. Open **Staff** in the header to try the sample accounts:

Guest and staff screens have direct URLs: `/menu?table=08`, `/songs?table=08`, `/member?table=08`, `/staff`, and `/staff/songs` (with the other dashboard sections under `/staff/<section>`). Table QR codes link directly to the menu for that table. The root URL remains an alias for the menu.

| Role | Phone | PIN |
| --- | --- | --- |
| Owner | `0123456789` | `111111` |
| Boss | `0123456790` | `222222` |
| Manager | `0123456791` | `333333` |
| Staff | `0123456792` | `444444` |
| Singer | `0123456793` | `555555` |

The demo member is `0128881001` with PIN `246810`. Demo credentials and local browser data are for prototyping only.

The demo menu now follows the supplied food and drinks pages. Carlsberg Smooth is RM19 for one bottle, RM90 for five, and RM388 for 24. Draught pricing is split into the listed happy-hour (before 8pm) and after-8pm choices.

## Connect a Supabase project

1. Run [supabase/schema.sql](supabase/schema.sql) in the Supabase SQL Editor.
   If you already ran the earlier prototype schema, run [supabase/menu-catalog.sql](supabase/menu-catalog.sql) to replace its sample menu with the supplied catalog.
   For an already initialized project, also run [supabase/song-artist-optional.sql](supabase/song-artist-optional.sql) to allow guest song requests without an artist name.
   Apply [supabase/usability-hardening.sql](supabase/usability-hardening.sql) after the stored-items ledger migration to restore separate happy-hour and evening menu variants, enforce Malaysia pricing periods, reject missing request values, combine repeated open service calls, and prevent concurrent points deductions from creating a negative balance. New installations already include these checks in `schema.sql`.
2. Enable **Email** password sign-in in Supabase, and disable public new-user signups. No Phone provider, SMS service or SMTP is needed. Existing installations must follow [docs/LOGIN.md](docs/LOGIN.md) and run `supabase/login-ids.sql` plus the account migration before deploying this version.
3. For a fresh installation, create the first owner in Supabase Authentication → Users → Add user with email `staff.owner@login.dyrb.invalid`, a six-digit passcode, and auto-confirm enabled. Run `supabase/login-ids.sql`, then add the profile:

   ```sql
   insert into public.staff_profiles(user_id, display_name, login_id, role, active)
   select id, 'Venue Owner', 'owner', 'owner', true
   from auth.users
   where email = 'staff.owner@login.dyrb.invalid';
   ```

   Sign in with user ID `owner` and the passcode you chose. Keep at least one active owner account.
4. Copy `.env.example` to `.env.local` and fill the Supabase URL and publishable/anon key. For server actions, also configure `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in Netlify or Vercel. The service-role key is server-only and must never use a `VITE_` prefix.
5. Use `vercel dev` to run the Vercel API routes locally with the environment variables. Vite's normal dev server is intended for the local demo mode.

Member phone numbers are normalized to Malaysia's `+60` format; staff use unique user IDs. PINs/passcodes are stored and verified by Supabase Auth as passwords; the app never stores them in its live database. Both logins use `/api/member-auth`, which rate-limits repeated failures with separate staff/member identifiers. Internal email identities allow password verification without SMS or email delivery. Staff should enroll members in person and let the member choose the initial PIN with staff present.

## Roles

Orders use a simple New → Completed handoff for staff to enter into their POS. Apply [supabase/order-completion.sql](supabase/order-completion.sql) and follow [docs/ORDER-COMPLETION.md](docs/ORDER-COMPLETION.md) to enable the Telegram completion button and shared message updates. Payment is handled in the POS.

- **Owner:** Full access; manages the role permission matrix and staff roles.
- **Boss:** Venue operations and staff account administration; cannot grant roles or permissions.
- **Manager:** Orders, songs, service requests, menu, and member balances.
- **Staff:** Orders, service requests, member lookup, and in-person enrollment; cannot view or adjust member balances.
- **Singer:** Song queue only, including adding, choosing, rejecting, deleting, and updating requests.

Role checks are enforced by Supabase row-level security and server-side admin actions. The frontend only uses the Supabase publishable/anon key. Anonymous guest submissions call validated SQL RPCs; they cannot read orders, requests, or member data.

## Prototype / production boundary

Keep the initial deployment private for testing. Vercel Hobby is limited to non-commercial use; switch to a commercial-eligible hosting plan before using this for live venue operations. Review Supabase Free inactivity, backup, and quota limits before relying on it for production data. V1 keeps online orders separate from Zeoniq; confirm API access and scope with Zeoniq before planning POS synchronization.

## Special event menu

Apply `supabase/event-menu.sql` in the Supabase SQL Editor after existing migrations. This adds the Halloween catalog and server-enforced visibility. Then open Staff → Menu to enable Halloween Night manually, or set an optional Malaysia-time start/end range. It starts disabled. Turning it off or reaching the end restores regular food. Cocktails and non-alcoholic drinks are excluded during the event until staff enable their existing menus. Existing draught, bottle, spirits and mocktail menus/prices remain unchanged. The migration is required before using this frontend against Supabase. Local demo mode supports the same controls without a database. Guests refresh visibility within 30 seconds, and every order is validated again by the database.

Event names are reusable: apply `supabase/event-menu-name.sql` after `event-menu.sql`, then type the current event name in Staff → Menu. This updates staff labels and the guest banner without replacing the catalog or schedule. Names must contain 1–80 characters. Internal legacy IDs remain unchanged to preserve saved items. The migration also adds the five event food images. The A4 main-course menu is in `output/pdf/event-main-course-a4.pdf`; regenerate it with `tools/create_event_menu_pdf.py` using ReportLab and Pillow.

### Event food photos

All 13 event dishes have local photos. Corrected black pepper chicken includes one sausage, cabbage salad and fries, without mashed potato; luncheon meat and edamame show smaller portions. New images use 800px WebP files. `menuPhoto` upgrades known bundled or missing database images while keeping custom image URLs. Apply `supabase/event-menu-photos.sql` after the event migrations to persist the image URLs in Supabase; it does not change event visibility, prices or custom uploads. Local demo catalogs refresh photo references automatically.

### Beverage photos

All 40 distinct beverages have individual optimized WebP images (about 3.5 MB combined). Pack sizes and happy-hour/evening variants share the correct drink image. Photos load in guest and staff menus, including older saved demo entries. Missing database images receive the same fallback, while custom image URLs are retained. `supabase/beverage-photos.sql` optionally persists those paths. House drinks use common highball glasses and representative colours approved by the user. Assets and source information are recorded under `output/web-photos/`.

## Staff Telegram bot

The optional Telegram integration sends new-song/new-order alerts to linked staff in private chats and supports `/songs`, `/orders`, and permission-checked `/balance <phone>`. It is not active in Vite demo mode. Follow [docs/TELEGRAM.md](docs/TELEGRAM.md) to create the bot, deploy the endpoints, apply `supabase/telegram.sql`, link staff, and configure the database webhook plus retry Cron. Secrets stay server-side. No live Telegram bot or deployment was configured during development.

## Deploy on Netlify

Netlify is also supported, including the member/admin APIs and Telegram endpoints. Follow [docs/NETLIFY.md](docs/NETLIFY.md). The deployment uses `netlify.toml` and the wrappers in `netlify/functions`; Supabase and all existing `/api` paths stay the same. Verify the wrappers locally with `node tools/verify-netlify.mjs`.
