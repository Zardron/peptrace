### 1. `frontend/src/components/HeaderBar/HeaderBar.tsx` and `HeaderBar.css`
- **Mobile (390px) collapse:** Ensure the primary nav list (`<ul>` or nav container holding `rankings`, `about`, `news`, `membership`) and the action button group (`vendors`, `sign up`) are hidden with `display: none` below the mobile breakpoint (≤566px). Only the logo and the hamburger toggle should remain visible. Currently these elements are leaking into the 390px view.
- **Desktop (1440px) missing link:** Restore the `rankings` link in the header navigation array/map so it renders as the first item after the logo. The current preview omits it entirely at desktop widths.

### 2. `frontend/src/components/MethodologyPage/MethodologyPage.css`
- **Methodology two-column grid ratio:**
  - Target: Asymmetric columns (Analysts narrower, Vendors wider).
  - Change the grid definition for `.methodology-section` (or its equivalent container) from a balanced split such as `grid-template-columns: 1fr 1fr` to roughly `grid-template-columns: 2fr 3fr` or `40% 60%` on tablet (`min-width: 567px`) and desktop (`min-width: 1092px`). Verify the Vendors policy cards no longer wrap prematurely.
- **Standards table header background:**
  - Target: Light gray header row.
  - Add `background-color: var(--color-gray-100, #f5f5f5)` to the table header row (`thead tr` or `th`). Currently it is transparent/white.
- **Standards table column alignment:**
  - Target: Metric columns evenly distributed under their headers.
  - Apply `text-align: center` (or matching design alignment) to the `th` and `td` cells in the `PURITY`, `QUANTITY`, `LABELING`, and `SOMETIMES` columns. Currently they appear left-aligned.
- **Formula cards padding and typography:**
  - Target: Compact cards with prominent equations.
  - Reduce `padding` inside `.formula-card` (or equivalent) from the current generous value to a tighter value (e.g., `1rem` or `1.25rem` vertical) to match the design’s compact grid.
  - Increase the equation text size: set `.formula-card .equation` (or the element wrapping the formula) to a larger `font-size` (e.g., `1.25rem`–`1.5rem`) and ensure `font-weight` is at least `500` or `600` so the math matches the visual hierarchy in the design.

### 3. `frontend/src/components/SiteFooter/SiteFooter.tsx` and `SiteFooter.css`
- **Footer column title prefix:**
  - Target: Pipe character before each column heading.
  - Either prepend `"| "` directly to the heading strings (`| Explore`, `| Testing`, `| Legal`) or add a CSS `::before` pseudo-element with `content: "|"; margin-right: 0.5em;` to `.footer-column-title`. The design consistently shows this prefix across all breakpoints; the preview does not.

### 4. `frontend/src/App.tsx` (route wiring check)
- No visual discrepancies were detected in the route shell itself, but ensure `activeRoute="/methodology"` remains wired so the header highlight state is correct once the `rankings` link is restored above.