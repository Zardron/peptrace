### 1. `frontend/src/components/MethodologyPage/MethodologyPage.css`
**Methodology two-column layout (tablet & desktop)**
- **Evidence:** At 744px and 1440px the right “Vendors” column is too narrow, causing extra text wraps.
- **Fix:** Ensure the `.methodology-section` container uses `display: grid` with `grid-template-columns: 1fr 1fr` and a `gap` of `32px` (desktop) / `24px` (tablet). If it currently uses Flexbox, switch to Grid so both columns share equal width. Remove any `max-width` or `flex-basis` constraints that shrink the right column.

**Labeling Score Calculated two-column layout (tablet & desktop)**
- **Evidence:** The right column (`If both...`) is compressed at 744px and 1440px.
- **Fix:** Apply `display: grid; grid-template-columns: 1fr 1fr; gap: 32px;` to the `.labeling-score-calculated` wrapper (or `45% 55%` if the design shows an asymmetric split). Ensure child boxes fill their column width (`width: 100%`).

**Standards table (mobile)**
- **Evidence:** At 390px the `SOMETIMES` column is missing from the preview.
- **Fix:** Add `overflow-x: auto` to the table wrapper and set the table `min-width` to roughly `600px` so all five columns render horizontally scrollable. Alternatively, to match the design’s non-scrolling 5-column fit, reduce cell `font-size` to `12px` (or the project’s `--text-xs` token) and cell `padding` to `8px 12px`, with `table-layout: fixed` and `width: 100%`.

**Standards table (all breakpoints)**
- **Evidence:** Column proportions and row padding differ from the design.
- **Fix:** Define explicit column widths via `:is(th, td):nth-child(n)` selectors (e.g., col 1 = 20 %, col 2 = 15 %, col 3 = 25 %, col 4 = 20 %, col 5 = 20 %) using `table-layout: fixed`. Set uniform row `padding: 12px 16px` to match the design’s compact density.

**Formulas grid**
- **Evidence:** Formula cards have unequal heights within each row at all breakpoints.
- **Fix:** Set the formulas grid container to `display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;` on desktop (`min-width: 1092px`), `repeat(2, 1fr)` on tablet (`567px–1091px`), and `1fr` on mobile. Add `align-items: stretch;`. Ensure each `.formula-card` uses `height: 100%; display: flex; flex-direction: column;` so cards in the same row stretch to the tallest item.

**Section vertical spacing**
- **Evidence:** Extra whitespace appears between the Methodology section and the Standards section in the preview.
- **Fix:** Reduce `margin-bottom` on the Methodology section from the current value (e.g., `64px`) to `48px` (or the design-equivalent spacing token). Audit `padding-top` on the Standards heading to ensure it matches the design.

### 2. `frontend/src/components/HeaderBar/HeaderBar.css` (or responsive breakpoint logic)
**Nav link breakpoint behavior**
- **Evidence:** At 390px and 744px the preview renders a secondary nav row (`rankings about news membership`) that the design does not show at those widths.
- **Fix:** Adjust the responsive breakpoint that controls nav-link visibility. Links should remain inline in the top header bar down to `566px` (tablet), and collapse into the hamburger menu at `566px` and below (mobile). Ensure the nav list does not fallback to a wrapped/second-row layout at `744px`. If the component uses a `max-width: 767px` media query for collapse, tighten it to `max-width: 566px` to align with the project’s stated mobile breakpoint.

### 3. `frontend/src/components/SiteFooter/SiteFooter.tsx`
- **Evidence (non-visual but functional):** The footer link array auto-generates `/testing-methodology`, but the canonical route is `/methodology`.
- **Fix:** Replace the string entry `'Testing Methodology'` with an explicit object `{ label: 'Testing Methodology', href: '/methodology' }` (or add an override map) so the footer link routes correctly. This is a minimal one-line change in the links array and does not affect visual layout.

### 4. `frontend/src/components/MethodologyPage/MethodologyPage.tsx`
- **Fix:** Verify that the standards table uses a `<table>` element with explicit `<colgroup>` or CSS `nth-child` widths so the column proportions above can be applied. Ensure the “How the Labeling Score Is Calculated” right-column boxes use the same card class as the left column so grid sizing applies uniformly. No text content changes are required.