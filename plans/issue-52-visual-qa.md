**1. Add missing responsive grid layouts in `MethodologyPage.css`**

The following sections are implemented as single-column stacks but must be CSS grids at tablet (`567 px+`) and desktop (`1092 px+`) breakpoints.

- **How the Labeling Score Works** (four items):
  - Target: `display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px;` at `min-width: 567px`.
  - Current: single-column `display: block` stack.
  - Selector: `.methodology-labeling-works-grid` (or the container wrapping the four labeling cards).

- **Natural Rating vs Final Rating** (three step cards):
  - Target: `display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;` at `min-width: 567px`.
  - Current: single-column stack.
  - Selector: `.methodology-rating-steps-grid`.

- **The Formulas** (six formula cards):
  - Target: `display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;` at `min-width: 567px`.
  - Current: single-column stack.
  - Selector: `.methodology-formulas-grid`.

- **How to Read the Final Rating** (three interpretation cards):
  - Target: `display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;` at `min-width: 567px`.
  - Current: single-column stack.
  - Selector: `.methodology-reading-results-grid`.

All grids should collapse to a single column at `max-width: 566px` (mobile) with `grid-template-columns: 1fr` and `gap: 16px`.

**2. Tighten standards table density in `MethodologyPage.css`**

- Current: table cells appear to use generous `padding` (approx `16px 16px`) and/or `line-height` values that make rows too tall.
- Target: reduce to `padding: 8px 12px` (or nearest existing token) and ensure `line-height: 1.4` so row heights match the compact design. Apply to `.standards-table th, .standards-table td`.

**3. Style the “Methodology note” callout box in `MethodologyPage.css`**

- Current: plain text paragraph under the left column of “How the Labeling Score Is Calculated”.
- Target: add a light gray background container. Example:
  ```css
  .methodology-note {
    background-color: var(--color-gray-50, #f9fafb);
    border-left: 3px solid var(--color-primary, #0d9488);
    padding: 12px 16px;
    border-radius: 4px;
    font-size: 0.875rem;
  }
  ```

**4. Fix mobile header breakpoint behavior in `HeaderBar` (or verify viewport meta-tag)**

- Discrepancy: at `390px` the preview shows the desktop `vendors` / `sign up` button group instead of the hamburger menu.
- If `HeaderBar` uses a hard-coded breakpoint (e.g., `min-width: 768px`), lower it to `min-width: 567px` to align with the project’s `0–566px` mobile breakpoint so the hamburger menu appears at `390px`.
- If the component logic is correct, confirm the page includes the viewport meta tag (`<meta name="viewport" content="width=device-width, initial-scale=1">`) so media queries evaluate against the actual device width.

**5. Verify section spacing tokens in `MethodologyPage.css`**

- Ensure major sections use consistent `margin-bottom` (or `padding-bottom`) of roughly `64px` on desktop and `48px` on mobile to match the visual rhythm in the design.
- The two-column “Methodology” section should use `gap: 32px` (desktop) and `gap: 24px` (tablet) to match the design’s column separation.

**6. Keep existing correct implementations untouched**

- The two-column layouts for **Methodology** (Analysts vs Vendors) and **Labeling Score Is Calculated** are correct; do not alter their grid/flex rules except for fine-tuning gaps.
- The semantic standards table markup is correct; only adjust the CSS density as noted above.
- Footer layout and global header composition in `App.tsx` are structurally correct. Only the footer link href (already tracked in the issue) and the header breakpoint need attention.