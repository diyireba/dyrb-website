# Staff IDs and member phone login, without SMS

Staff sign in with their assigned user ID and six-digit passcode. Members use their phone number and existing six-digit password/PIN. Neither flow sends SMS or email. Staff issue accounts and reset member passwords in person. No SMS provider is needed.

Supabase still stores password hashes and verifies passwords. Server-only internal email identifiers use the reserved `login.dyrb.invalid` domain; these are not mailboxes. Staff and member identifiers are separated. Existing role checks, active-account checks, rate limiting, session tokens and RLS remain enforced. Public email signups should be disabled: accounts are provisioned by the authorized admin API.

## One-time setup for existing accounts

### Run in Netlify (live setup)

No local environment file or local migration command is required:

1. Run `supabase/login-ids.sql` in the live Supabase SQL Editor. Enable Email password sign-in and disable public new-user signups. Phone sign-in can stay disabled.
2. In Netlify environment variables add `MIGRATE_LOGIN_ON_DEPLOY` with value `true`, for **Production**. The existing `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` must be available to Builds. Keep their values private.
3. Push this implementation to GitHub. The committed `netlify.toml` runs `npm run build:netlify`: build the website, then migrate existing accounts against the live database before publishing. Migration is allowed only when Netlify sets `NETLIFY=true` and `CONTEXT=production`. No public migration API exists.
4. In the deploy log look for `Ready: … — user ID: owner` and `Migrated … staff and … members`. Use the exact printed staff ID and existing passcode at `/staff` once Published. If a migration fails, publication stops; inspect its message without sharing secrets. A partial migration can be safely rerun.
5. Delete `MIGRATE_LOGIN_ON_DEPLOY` after the successful deployment. Later deployments do not need to run the migration. Test member phone/PIN login in the published website too.

### Optional terminal setup

The following alternative is only for someone who prefers running the migration from their own terminal.

1. In Supabase SQL Editor run `supabase/login-ids.sql`. This adds staff `login_id` and makes staff phone optional. It preserves every existing profile.
2. In Supabase Authentication → Sign In / Providers enable Email sign-in. The admin API explicitly confirms its internal identities, so email confirmation is never sent. Disable public new-user signups in Authentication settings. Phone sign-in may remain disabled. Do not configure SMTP or SMS for these internal identities.
3. Ensure your local `.env.local` contains `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, in addition to the existing VITE variables. Copy values from Supabase privately; never commit this file or share its contents.
4. In the project terminal preview the migration:

   ```powershell
   node --env-file=.env.local tools/migrate-login.mjs
   ```

   Review the printed staff IDs. The first existing owner without an ID receives `owner`; other accounts receive their role plus a unique suffix. You may set your preferred unique lowercase `login_id` in the Supabase staff_profiles table before running the preview. IDs have 3–32 characters, start with a letter, and use letters, numbers, dots, underscores or hyphens.

5. Apply once:

   ```powershell
   node --env-file=.env.local tools/migrate-login.mjs --apply
   ```

   This adds confirmed internal email identities, preserving account UUIDs and passwords, and fills staff login IDs. It refuses to overwrite a different existing email or merge staff/member accounts. It is safe to rerun after a partial failure. It does not change balances, roles or phone records. It does not create a missing first owner; provision that account before migration.

6. Push the implementation to GitHub and wait for Netlify to publish. Sign in at `/staff` using the printed user ID and existing passcode. Enroll one member and verify their phone/PIN works at the member form. Test wrong credentials and inactive accounts too.

Do not send password-reset emails to these internal identifiers. Staff perform in-person member PIN resets through the dashboard. Keep the local service key private and outside Git. The live site is not updated until the database setup, account migration and deployment are complete.
