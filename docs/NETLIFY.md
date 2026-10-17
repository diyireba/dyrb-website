# Deploy DYRB to Netlify

The existing Supabase project and GitHub repository remain the same. Four Netlify functions wrap the existing APIs, preserving staff authentication, member sign-in, Telegram secrets and permissions. `netlify.toml` routes `/api/*` to those functions before the SPA page fallback.

## Upload the compatibility files

From the project folder in PowerShell:

```powershell
git add netlify.toml netlify server/netlify-adapter.ts tsconfig.json tests/netlify.test.mjs tools/verify-netlify.mjs docs/NETLIFY.md docs/TELEGRAM.md README.md
git commit -m "Add Netlify deployment support"
git push
```

Do not upload `.env.local` or any private key. Supabase data does not need to be recreated or reset.

## Import the website

1. In Netlify, choose **Add new project → Import an existing project** (some dashboards say Add new site).
2. Choose **GitHub**, authorize access to the repository, and select `diyireba/dyrb-website`.
3. Production branch: `main`. Leave the base directory blank/root.
4. Build command: `npm run build`. Publish directory: `dist`. Functions directory: `netlify/functions`. The TOML file supplies these values and Node.js 22.
5. Before the first production build, add the environment variables below using Netlify's UI. If the import flow doesn't offer them, finish creating the project, open its environment settings, add them, and trigger a new production deploy before testing.

| Name | Value | Scope if available |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL | Builds |
| `VITE_SUPABASE_ANON_KEY` | Publishable/anon key | Builds |
| `SUPABASE_URL` | Same Supabase project URL | Functions |
| `SUPABASE_ANON_KEY` | Same publishable/anon key | Functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Private Supabase secret/service-role key | Functions |

If your plan does not expose scope choices, use the default/all scopes. Use the Production context for the live site. Do not connect deploy previews to live member data; configure a separate test project for previews. Private keys must never have a `VITE_` prefix. Do not put them into `netlify.toml`.

6. Deploy and wait for **Published**. You receive an HTTPS `*.netlify.app` URL.
7. In Supabase Authentication URL Configuration, set Site URL to that exact production origin.

## Verify the live deployment

- `/menu?table=08`: food and drinks load.
- `/staff`: your real owner account signs in.
- Refresh `/staff/menu` directly: it should remain a working page.
- Open `/api/admin` in the browser: it should return JSON `Method not allowed.`, not the website HTML. This verifies the API route exists.
- Enroll a test member from the staff website, sign in as that member, and compare the balance.
- Submit a test song/order and check the live dashboard on a second device.
- The production dashboard should not show local demo sign-in accounts.

## Telegram

The Telegram URLs keep the same paths on your new domain:

- `https://YOUR_SITE.netlify.app/api/telegram`
- `https://YOUR_SITE.netlify.app/api/telegram-events`

Follow `docs/TELEGRAM.md`. Set bot token, webhook secret and dispatch secret through Netlify's environment settings with Functions scope. Set `APP_URL` to the Netlify site origin, redeploy, then run the existing webhook setup script with matching private local values. Update the Supabase database webhook URL and retry Vault URL to the Netlify origin. No new bot is needed if you already created one.

## Updates and checks

Push commits to `main` for automatic deployments. Changes to database SQL must still be applied separately in Supabase. Environment variable changes require a new deployment.

Local checks: `npm test`, `npm run build`, `node tools/verify-netlify.mjs`. The last command bundles and invokes all four real wrappers without making external API calls. It does not replace checking a published deployment with your real Supabase settings.

References: [Netlify Functions](https://docs.netlify.com/build/functions/get-started/), [rewrites](https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/), [function environment variables](https://docs.netlify.com/build/functions/environment-variables/).
