The VendorsList screen is entirely unimplemented across all breakpoints. The Code Builder must create the route, component, stylesheet, and mock data from scratch to match the visual structure observed in the Figma screenshots.

1. **Route wiring — `frontend/src/App.tsx`**
   - Add `'/vendors'` to the `routedPaths` array (around line 24).
   - Add a conditional branch: when `pagePath === '/vendors'`, render `<VendorsList />` inside the existing `<main className="main">` wrapper, placed before the default home-page fallback branch. This ensures the page is no longer blank and the existing header link becomes functional.

2. **New screen component — `frontend/src/components/VendorsList/VendorsList.tsx`**
   - Return a React fragment (`<>...</>`); do **not** wrap in `<main>` because `App.tsx` already provides `.main`.
   - **Title area**: Render an `<h1>` with exact text "Vendors" (`font-weight: 700`, `font-size: ~32px` on desktop scaling down to `~28px` on mobile). Render a `<p>` subtitle directly beneath it with exact text "1,729 vendors · total score by Purity focus" (`color: var(--text-gray)` or `#6B7280`, `font-size: ~14–16px`, `margin-top: 4px`).
   - **Toolbar**:
     - Search input: placeholder text "Search vendor, drug, or location", with a magnifying-glass icon frame positioned at the left padding. On mobile it must be `width: 100%`; on tablet/desktop it sits on the left side of the toolbar with a fixed max-width (~280–320px).
     - Dropdown button: text "Purity focus · purity 99.0%+, cbar ≥55%" (per the 744px design) with a chevron-down icon. On desktop this is centered in the toolbar; on mobile it sits below the search input.
     - Text link: exact text "methodology →" (`color: var(--primary)` or the brand green, `font-weight: 500`, no underline).
     - **Layout rule**: Desktop/tablet (`≥569px`): `display: flex; justify-content: space-between; align-items: center; gap: 16px;`. Mobile (`≤568px`): `flex-direction: column;` so search is full-width and dropdown + methodology link form a second row.
   - **Data table**:
     - Wrap the `<table>` in a block-level container with `overflow-x: auto; -webkit-overflow-scrolling: touch;` so the table scrolls horizontally on narrow viewports.
     - Header row columns (exact labels): `#`, `VENDOR`, `SCORE`, `COST`, `TESTS`, `PRODUCTS`, `LATEST`, `LOCATION`.
     - Header styling: `text-transform: uppercase`, `font-size: 11px–12px`, `letter-spacing: 0.05em`, `color: var(--text-gray)` (muted gray), `font-weight: 600`, `padding: 12px 8px`, `border-bottom: 1px solid var(--border)`.
     - **Row content**: Map over the imported 100-item array. Each cell must contain:
       - `#`: row index.
       - `VENDOR`: a gray placeholder avatar (`width: 24px; height: 24px; background: #E5E7EB; border-radius: 4px; display: inline-block; vertical-align: middle; margin-right: 8px;`) followed by the company name string.
       - `SCORE`: a percentage value rendered inside a pill/badge. The badge needs `display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 13px;`. Based on the design, high scores use a bright green background fill (e.g., `#D1FAE5` text `#065F46`) while lower scores (e.g., 62%, 58%) use a secondary tint (blue-gray or yellow). Implement a threshold class (e.g., `.score-high` vs `.score-mid`) to match the screenshot color coding.
       - `COST`: right-aligned string like "$1.00/mg".
       - `TESTS` / `PRODUCTS`: right-aligned integers.
       - `LATEST`: date string, left-aligned.
       - `LOCATION`: text string (e.g., "China", "US", "-"), left-aligned.
     - Row styling: `border-bottom: 1px solid #F3F4F6` (or `var(--border)`), `padding: 14px 8px` on desktop, `12px 8px` on mobile. `font-size: 14px` desktop, `13px` mobile.
     - **Responsive column visibility**: At 393px the design shows at minimum `#`, `VENDOR`, `SCORE`, `COST`, `LATEST` without wrapping; the remaining columns must remain accessible inside the horizontal scroll container rather than being hidden by breakpoint.

3. **Mock data — `frontend/src/data/vendorData.ts`**
   - Export a typed array `VendorRow[]` with exactly 100 objects.
   - Shape: `{ id: string; name: string; score: number; cost: string; tests: number; products: number; latest: string; location: string; }`.
   - Populate with values matching the design screenshots (e.g., first row: Zenith Jode Pep, 88–92%, $1.00/mg, etc.) so the rendered preview matches the visual order and content.

4. **Styles — `frontend/src/components/VendorsList/VendorsList.css`**
   - Scope all selectors under `.vendors-list`.
   - **Page container**: `max-width: 1120px; margin: 0 auto;` on desktop (matching `SiteFooter.css`). Add responsive horizontal padding: `16px` mobile, `24px` tablet, `32px` desktop.
   - **Title area**: `margin-bottom: 24px` desktop, `16px` mobile.
   - **Toolbar**: `margin-bottom: 24px; display: flex; align-items: center;`. Mobile override (`@media (max-width: 568px)`): `flex-direction: column; align-items: stretch;`.
   - **Table**:
     - `width: 100%; border-collapse: collapse;`
     - `th` / `td` alignment: `#` and `VENDOR` left-aligned; `SCORE` centered; `COST`, `TESTS`, `PRODUCTS` right-aligned; `LATEST` and `LOCATION` left-aligned.
     - Subtle alternating or uniform row separators (`border-bottom: 1px solid #F3F4F6`).
   - **Responsive breakpoints**:
     - `0px – 568px`: table wrapper `overflow-x: auto`. Toolbar stacked. Title `font-size` reduced. Footer uses existing mobile stacking from `SiteFooter`.
     - `569px – 1091px`: toolbar single row. Table may scroll horizontally if needed. Padding increased.
     - `1092px – ∞`: full 8-column table visible without horizontal scrolling. Max-width container centered. Score column badges fully visible with emphasis.

5. **Barrel export — `frontend/src/components/index.ts`**
   - Append: `export { default as VendorsList } from './VendorsList/VendorsList'`

6. **Color & typography tokens**
   - Map colors to existing CSS custom properties in `frontend/src/index.css` where available (`--text`, `--text-gray`, `--primary`, `--border`, `--bg-white`).
   - For elements not covered by existing tokens (e.g., the specific bright green score badge background, the gray avatar placeholder `#E5E7EB`, the row separator `#F3F4F6`), either add new variables to `index.css` or define them locally in `VendorsList.css`. The exact hex values for the score badge thresholds must be extracted from the Figma inspect panel and applied to `.score-high`, `.score-mid`, and `.score-low` classes.