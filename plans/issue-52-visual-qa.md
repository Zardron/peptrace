1. **`frontend/src/components/MethodologyPage/MethodologyPage.css`**
   - **Two-column methodology section:** Add a class (e.g., `.methodology-intro-grid`) and set `display: grid; grid-template-columns: 1fr 1.25fr; gap: 64px;` at `min-width: 1092px`. At `567px–1091px` use `grid-template-columns: 1fr 1fr; gap: 48px;`. Below `566px` stack to a single column. This fixes the narrow column gap and gives the Vendors column slightly more room, matching the design.
   - **Standards table:** Target `.standards-table th, .standards-table td` and set `padding: 16px 24px` at desktop and `padding: 12px 16px` at tablet. Ensure `th` uses `text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.75rem;` to match the design label style.
   - **Card grids (Labeling Works, Natural Rating, Formulas, Reading Results):** Set `gap: 32px` on desktop and `gap: 24px` on tablet for each grid container (e.g., `.labeling-works-grid`, `.natural-rating-grid`, `.formulas-grid`, `.reading-results-grid`). The current preview gaps are ~16 px.
   - **Formula cards:** Set `.formula-card { padding: 24px; min-height: 180px; }` on desktop. For the equation text (e.g., `.formula-math`), set `font-size: 0.875rem; white-space: nowrap;` to prevent the awkward multi-line breaks seen in `POSTERIOR MEAN` and `PRODUCT EVIDENCE SCALE`. If an individual formula still overflows, allow `overflow-x: auto` on the equation block.
   - **Labeling Score Calculated layout:** The container wrapping the two sub-sections should be a grid with `gap: 48px` at desktop and `gap: 32px` at tablet.
   - **Page container:** Confirm `.methodology-page-content` uses `max-width: 1200px; margin: 0 auto; padding: 0 24px;` (adjust padding to match existing page conventions).

2. **`frontend/src/components/MethodologyPage/MethodologyPage.tsx`**
   - Ensure the root page wrapper has a dedicated class name (e.g., `methodology-page-content`) for scoped styling.
   - Add distinct class names to each grid container so the CSS above can target them without brittle element selectors:
     - Methodology two-column: `methodology-intro-grid`
     - Labeling Score Works: `labeling-works-grid`
     - Labeling Score Calculated: `labeling-calc-grid`
     - Natural Rating steps: `natural-rating-grid`
     - Formulas: `formulas-grid`
     - Reading Results: `reading-results-grid`
   - Verify the standards table is semantic `<table>` with `<thead>` and `<tbody>`.

3. **`frontend/src/components/HeaderBar/HeaderBar.tsx` and associated HeaderBar CSS**
   - **Mobile (`max-width: 566px`):** Hide the desktop action buttons (`.header-actions` / `.header-desktop-actions`) and ensure the hamburger menu icon (`.menu-toggle`) is visible. The preview currently shows the `vendors` pill and `sign up` button at 390 px; they must be hidden below the `567px` breakpoint.
   - **Tablet/Desktop nav links:** The 744 px design omits the “rankings” link. If the links are hardcoded in `HeaderBar`, remove “rankings” from the rendered array or add a breakpoint-specific rule (e.g., `.nav-link.rankings { display: none; }` between `567px` and `1091px` if the design intends it only on mobile). If links are passed via props from `App.tsx`, ensure the prop array excludes “rankings” where required.
   - **Tablet header layout (`567px–1091px`):** Prevent the header from wrapping to two rows. Set `flex-wrap: nowrap` on the header root and ensure nav links sit in a single horizontal row with the logo and actions, matching the 744 px design.

4. **`frontend/src/components/SiteFooter/SiteFooter.tsx`**
   - Apply the minimal link fix from the issue requirements: change the `Testing Methodology` entry to an explicit object `{ label: 'Testing Methodology', href: '/methodology' }` (or add an override map) so the footer link routes to `/methodology` rather than the auto-generated `/testing-methodology`. This is not visible in the screenshots but is required for route consistency.

5. **`frontend/src/App.tsx`**
   - Verify the `/methodology` branch is present as specified in the issue, rendering `<HeaderBar onSignUpClick={openAuthModal} activeRoute="/methodology" />`, `<main>`, `<MethodologyPage />`, and `<SiteFooter />`. Confirm `'/methodology'` is in `routedPaths`.