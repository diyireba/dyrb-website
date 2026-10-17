# DYRB Guest and Staff UI

## Visual direction

Make the guest menu feel like DYRB's night-time bar: charcoal surfaces, bright orange-red actions, crisp white text, and clear food photography. Keep it direct, warm, and easy to use during a busy service. Staff work surfaces stay light for legibility. Avoid decorative stage imagery, invented schedules, marketing slogans, dense gold ornament, and technical language in customer-facing copy.

## Interface rules

- Tables & QR owns table creation, label/display-order edits, active status and QR downloads. Printed table codes are immutable; activation uses the existing confirmation dialog. The preview and list must reflect the stored active flag, and an empty live catalog must never show a fake active QR.

- Orders are a staff handoff into the venue POS: show New or Completed, order date/time in Malaysia, items and total. A single Mark as completed action replaces preparation/payment controls. Completion records the staff member and time; payment is handled in the POS.

- Staff credentials are labelled User ID and Passcode; member credentials remain phone and PIN. Reuse ValidatedForm, existing notifications and role-based account management. Neither login sends SMS.

- Guest pages start with the table number and the next useful action.
- Customer menu navigation is compact with a sticky food/drink/category strip and beverage search across categories. Food photo sizes stay unchanged by user request. Staff access belongs in the guest footer.
- Mobile basket bars appear only with items and show item count, total, table and View order. Reserve 76px plus safe area below the basket and dialogs for the hosting badge. Basket review has explicit removal, unit/line prices and quantity controls. A server-confirmed receipt shows table/items and a Back to menu action; failed submissions preserve the basket.
- Food and drinks remain separate, with short category labels and readable prices.
- Menu items are compact, touch friendly rows. Keep add and quantity controls obvious.
- On desktop, the basket can sit beside the menu. On tablet and phone, keep it in a persistent bottom bar with an easy to open basket sheet.
- Staff pages use a compact dark navigation rail on larger screens and clear bottom navigation on phones. Keep work surfaces light for legibility.
- Use the logo's orange-red as the only strong accent. Reserve green for successful actions and status.
- Use plain language and short labels. Never expose internal service or implementation names to guests.
- Mobile staff navigation scrolls horizontally so every permitted section is reachable. Keep sign-out visible in the header and use readable action labels rather than shrinking the navigation to fit.
- Mobile staff navigation reserves a 76px hosting-badge area below the bar, plus the device safe area. Content bottom padding includes both the navigation and badge space; navigation items keep an 88px minimum width and scroll horizontally.
- Service requests stay visible beneath the guest menu on phones and tablets. The basket remains in its persistent bottom bar.
- Global scrollbars, focus outlines, reduced motion, form errors, and modal geometry are owned by the shared baseline at the end of `src/responsive-fixes.css`.

## Tokens

The staff workspace tokens live in `src/modern.css`: warm canvas `#f6f4ef`, white surfaces, charcoal text, and DYRB orange-red `#e64d2e`. The guest menu overrides those tokens in `src/responsive-fixes.css` with charcoal `#171717`, raised charcoal surfaces, white text, and orange-red `#f04e32` to match the approved mobile concept. Existing component styles are local to `src/App.jsx`, `src/styles.css`, `src/modern.css`, and `src/responsive-fixes.css`.
