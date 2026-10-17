# Customer ordering update

Approved direction: keep the existing dark/orange identity and compact food photography. Do not enlarge photos or introduce photo detail views, because the venue says those photos are not accurate enough for that use.

Changes: compact header/navigation; sticky menu filters; search across available beverage categories and localized names; staff access in the footer; immediate add confirmation; visible quantity controls capped at 20 per variant; shared basket lines with explicit removal and line totals; mobile basket hidden when empty and showing quantity/total/table otherwise; hosting-badge clearance; and a server-confirmed order receipt with table, items and Back to menu. Concurrent submit activations are guarded, while failures retain the basket. This is not a new server idempotency implementation.

## Verification performed

An isolated Vite demo preview was used for browser verification, with Supabase credentials disabled for that preview only. No live order, Telegram message or database write was made. The temporary preview environment file was removed afterward.

- Phone layouts at 320 and 390 CSS pixels; the narrow layout has no horizontal overflow.
- Food photos measured at the existing 46px mobile size.
- Tablet at 820px: basket bar available, desktop basket hidden.
- Desktop at 1280px: desktop basket available, mobile bar hidden.
- Adding two items showed the correct count and RM42 total; explicit removal recalculated to RM21.
- Quantity stopped at 20 and disabled the increment action.
- Empty basket bar disappeared; successful submission cleared the cart and showed the table/item receipt.
- Beverage search found Singleton across categories; an unmatched query showed the recovery message and clear control.
- Chinese navigation/search labels, Escape dismissal and focus restoration checked.
- Browser console showed no errors or warnings during the checked workflow.
- Existing 60 automated tests, production build and strict UI contract audit passed.

Preview images: `output/ux/customer-menu-mobile.png` and `output/ux/customer-order-confirmation.png`. The badge itself is injected only on Netlify; the preview verified a 76px bottom clearance reserved for it. Verify that clearance on the published site as the final live check. No SQL migration or new environment variable is required for this update.
