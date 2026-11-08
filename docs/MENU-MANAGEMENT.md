# Update the menu without a deployment

One-time setup: apply `supabase/menu-photos.sql` in the Supabase SQL Editor after the existing schema/event-menu migrations, then deploy this frontend once. No new environment variables or Netlify functions are required.

Open **Staff → Menu → Add menu item**, or choose **Edit** beside an existing item. Enter the category, name, price and optional serving description. Choose Regular menu or the current special-event menu. Select a JPG, PNG or WebP from your phone/computer to add or replace its photo, then choose **Save menu item**. Uploads accept up to 10 MB and resize to a maximum 1200px before storage. Optional Bahasa Malaysia text is under the expandable section.

Changes save directly to Supabase, using the existing menu.manage permission (Owner, Boss and Manager by default). Guests receive updates within 30 seconds or on refresh. Sold-out items use the existing availability switch. Event items follow the event schedule and visibility controls. Keep distinct serving descriptions for pack sizes and happy-hour/evening variants; the existing pricing rules still apply.

Menu and price changes do not trigger a Netlify build. Photos are served directly from Supabase Storage. Hosting traffic and Supabase storage/database usage still follow the respective service quotas. New website features still need a deployment.

Demo mode saves changes only in the current browser. Use the configured live Supabase project for updates shared with customers. In demo mode, browser storage can fill up when many photos are added; failed saves keep the editor open.

Replaced or cancelled uploads are retained to avoid breaking existing image links. They can be reviewed and removed manually in the menu-photos bucket when no menu item references them.
