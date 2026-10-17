# DYRB Guest and Staff UI

## Visual direction

Make the guest menu feel like DYRB's night-time bar: charcoal surfaces, bright orange-red actions, crisp white text, and clear food photography. Keep it direct, warm, and easy to use during a busy service. Staff work surfaces stay light for legibility. Avoid decorative stage imagery, invented schedules, marketing slogans, dense gold ornament, and technical language in customer-facing copy.

## Interface rules

- Guest pages start with the table number and the next useful action.
- Food and drinks remain separate, with short category labels and readable prices.
- Menu items are compact, touch friendly rows. Keep add and quantity controls obvious.
- On desktop, the basket can sit beside the menu. On tablet and phone, keep it in a persistent bottom bar with an easy to open basket sheet.
- Staff pages use a compact dark navigation rail on larger screens and clear bottom navigation on phones. Keep work surfaces light for legibility.
- Use the logo's orange-red as the only strong accent. Reserve green for successful actions and status.
- Use plain language and short labels. Never expose internal service or implementation names to guests.
- Mobile staff navigation scrolls horizontally so every permitted section is reachable. Keep sign-out visible in the header and use readable action labels rather than shrinking the navigation to fit.
- Service requests stay visible beneath the guest menu on phones and tablets. The basket remains in its persistent bottom bar.
- Global scrollbars, focus outlines, reduced motion, form errors, and modal geometry are owned by the shared baseline at the end of `src/responsive-fixes.css`.

## Tokens

The staff workspace tokens live in `src/modern.css`: warm canvas `#f6f4ef`, white surfaces, charcoal text, and DYRB orange-red `#e64d2e`. The guest menu overrides those tokens in `src/responsive-fixes.css` with charcoal `#171717`, raised charcoal surfaces, white text, and orange-red `#f04e32` to match the approved mobile concept. Existing component styles are local to `src/App.jsx`, `src/styles.css`, `src/modern.css`, and `src/responsive-fixes.css`.
