1. **`frontend/src/components/MethodologyPage/MethodologyPage.css` — Mobile breakpoint (`max-width: 566px`)**
   - `.methodology-hero`: Increase `padding-top` to ~32–40 px to match the design’s hero spacing.
   - `.labeling-works-grid`: Change `grid-template-columns` from the current `1fr 1fr` (preview) to `1fr` (design) so the four items stack vertically.
   - `.labeling-calculated-grid`: Change `grid-template-columns` from `1fr 1fr` to `1fr` so the two sub-sections stack vertically.
   - `.standards-table-wrapper`: Add `overflow-x: auto` and set the table `min-width` to at least `600–700 px` so all five columns (STANDARD, PURITY, QUANTITY, LABELING, SOMETIMES) remain accessible without clipping.

2. **`frontend/src/components/MethodologyPage/MethodologyPage.css` — Tablet breakpoint (`567px – 1091px`)**
   - `.standards-table th, .standards-table td`: Reduce vertical padding (e.g., to `8–10 px`) to tighten row heights and match the design’s compact table density.
   - `.formula-card`: Reduce internal `padding` to ~16–20 px and/or slightly reduce formula font size so equations stay on two lines.
   - `.site-footer .footer-grid`: Increase `column-gap` to ~40–48 px to match the design’s wider footer distribution.

3. **`frontend/src/components/MethodologyPage/MethodologyPage.css` — Desktop breakpoint (`min-width: 1092px`)**
   - `.methodology-hero`: Increase `padding-top` by ~24–40 px to match the design.
   - `.analysts-vendors-grid`: Change `grid-template-columns` from `1fr 1fr` (preview) to roughly `2fr 3fr` (or `40% 60%`) and increase `gap` to `48–64 px` to match the asymmetric design.
   - `.standards-table`: Apply explicit column width ratios—e.g., `STANDARD` ~25 %, `PURITY` ~15 %, `QUANTITY` ~20 %, `LABELING` ~20 %, `SOMETIMES` ~20 %—instead of auto-sizing evenly.
   - `.labeling-works-grid`: Reduce `row-gap` to ~16–24 px to match the tighter vertical spacing in the design.
   - `.methodology-note`: Add a left border accent (`border-left: 3px solid var(--color-accent, #0d8a58)`) and any missing subtle background tint.
   - `.formula-card`: Reduce `padding` and ensure the formula `<code>`/monospace element uses a size that keeps multi-line formulas on two lines (target `font-size` ~13–14 px if currently larger).
   - `.page-section + .page-section`: Increase `margin-top` for major content blocks (especially before Reading Results and Leaderboard) to restore the design’s vertical rhythm.
   - `.site-footer .footer-grid`: Increase `column-gap` to ~48–64 px so columns spread wider, matching the design.

4. **`frontend/src/components/MethodologyPage/MethodologyPage.tsx`**
   - Verify the “Methodology note” markup uses the correct CSS class (e.g., `methodology-note`) so the left border accent renders.
   - Ensure the standards table includes the `<th>SOMETIMES</th>` header and corresponding data cells so the fifth column is present at all breakpoints.

5. **`frontend/src/components/HeaderBar/HeaderBar.css` (or equivalent responsive stylesheet)**
   - **Mobile**: Hide `.header-auth-buttons` (vendors / sign-in pills) below `566px`; the design shows only the hamburger menu.
   - **Tablet (`744px`)**: Hide the `.vendors-button` at widths below `1092px` if the design intent is to show only the “sign up” pill at tablet size.
   - **All widths**: Update the green CTA button label text from “sign in” to “sign up” to match the design.

6. **`frontend/src/components/SiteFooter/SiteFooter.tsx`**
   - Replace the plain string `'Testing Methodology'` in the footer links array with `{ label: 'Testing Methodology', href: '/methodology' }` (and update the rendering loop if it only handles strings) so the footer link routes to `/methodology` instead of `/testing-methodology`.

7. **`frontend/src/App.tsx`**
   - Confirm `'/methodology'` is present in `routedPaths`.
   - Ensure the `isMethodologyPage` branch renders `<HeaderBar onSignUpClick={openAuthModal} activeRoute="/methodology" />` so the active navigation state is styled correctly.