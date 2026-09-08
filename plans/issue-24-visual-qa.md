### 1. HeaderBar — Logo, Nav, and Profile Pill
**Files:** `frontend/src/components/HeaderBar/HeaderBar.tsx`, `frontend/src/components/HeaderBar/HeaderBar.css`

- **Logo alignment:** Replace the monolithic `<img src={logo.svg} />` with either (a) an inline SVG exported directly from Figma that preserves the vector-group decomposition, or (b) split markup containing the vector paths and separate `<span>`/text nodes for "PEPTRACE" and "What’s actually in the vial". This ensures the preview matches the Figma text anti-aliasing and baseline spacing.
- **Active-route underline:** In `HeaderBar.tsx`, extend the active-route check to include `/dashboard` so the NavLink underline logic covers the dashboard route.
- **Profile avatar ellipse:** In `HeaderBar.css`, update `.account-button` (or create `.profile-pill`) to:
  - `border-radius: 50%` for the inner image mask (ellipse)
  - `width: 32px` and `height: 32px` (or exact Figma inspect value)
  - `border: 1px solid <figma-stroke-token>` if the Figma inspect panel shows a stroke on the ellipse
  - Wrap the image in an outer pill frame with `display: inline-flex`, `align-items: center`, `padding: 4px 12px` (or Figma values), `border-radius: 9999px`, and `background-color: <figma-fill>` to match the `Pill Button` instance `I924:3636;15:49`.
- **Pill button tokens:** Verify `.pill-button` / `.account-pill` against the Figma inspect panel for `padding`, `border-radius`, `font-size`, `font-weight`, `line-height`, `background-color`, and `color`. Adjust to match exact values.

### 2. DashboardPage — WelcomeProfile Structure
**File:** `frontend/src/components/AccountPages/AccountPages.tsx`

- **Refactor welcome section:** Change the existing `dashboard-welcome` container to a `WelcomeProfile` wrapper (`<section className="welcome-profile">`) containing two siblings:
  - `UserProfile` (`<div className="user-profile">`) with `ProfilePhoto` (`<img>` or `<div className="profile-photo">`) and `ProfileDetails` (`<div className="profile-details">`) for name, email, membership tier, and member-since date.
  - `UserMetrics` (`<div className="user-metrics">`) containing the three stat blocks.
- **Metric separators:** Replace the CSS `border-left` approach with explicit separator elements inside `UserMetrics`:
  ```jsx
  <div className="metric-block">…</div>
  <div className="metric-separator" />
  <div className="metric-block">…</div>
  ```
  This matches the Figma `Line` nodes between metric frames.

### 3. DashboardPage — Tables and StatusPills
**Files:** `frontend/src/components/AccountPages/AccountPages.tsx`, `frontend/src/components/AccountPages/AccountPages.css`

- **StatusPill nesting:** Update the `StatusPill` component (or its usage in `AccountPages.tsx`) to render two nested wrappers:
  ```jsx
  <span className="status-pill-outer">
    <span className="status-pill-inner">
      {text}
    </span>
  </span>
  ```
  Apply Figma-derived `padding`, `border-radius`, and `background-color` to `.status-pill-outer` and `.status-pill-inner` so tokens map 1:1 to the nested `Frame` nodes.
- **Table grid proportions:** In `AccountPages.css`, update:
  - `.shipments-table` → `grid-template-columns` to match Figma inspect values for `Tracking ID`, `Peptide Name`, `Date Submitted`, `Status` proportions.
  - `.results-table` → `grid-template-columns` to match `Peptide Name`, `Batch Code`, `Purity`, `Test Date`, `Outcome` proportions.
  - `.supply-table` → `grid-template-columns` to match `Peptide Name`, `Quantity (mg)`, `Vendor`, `Purity`, `Status` proportions.
- **Mobile table scroll:** Add `.table-wrapper { overflow-x: auto; }` and ensure it activates at `max-width: 591px` so tables scroll horizontally instead of compressing.

### 4. DashboardPage — Sidebar and QuickActions
**File:** `frontend/src/components/AccountPages/AccountPages.tsx`

- **QuickActions icon nesting:** Wrap each quick-action icon in two frames:
  ```jsx
  <div className="quick-action-icon-outer">
    <div className="quick-action-icon-inner">
      <img src={icon} alt="…" />
    </div>
  </div>
  ```
  Size these wrappers with `width`/`height` and `background-color` from the Figma inspect panel to reproduce the frame-based backgrounds.
- **TestCalendarWidget container:** Ensure the widget has a defined `min-height`, `padding`, and `border-radius` matching the Figma card container so it is ready for future calendar grid expansion without reflow.

### 5. AccountFooter — Grid, Divider, and Copyright
**Files:** `frontend/src/components/AccountPages/AccountPages.tsx`, `frontend/src/components/AccountPages/AccountPages.css`

- **Footer grid:** In `AccountPages.css`, set `.account-footer-grid` to:
  - Desktop (`min-width: 1092px`): `grid-template-columns: repeat(3, 1fr)` with `gap` matching Figma `SiteFooterGrid` spacing.
  - Tablet/Mobile (`max-width: 1091px`): `grid-template-columns: 1fr` so columns stack.
- **Horizontal rule:** Insert an explicit `<hr className="footer-divider" />` (or `<div className="footer-line">`) between the footer link grid and the copyright text in `AccountPages.tsx`. Style it with:
  - `width: 100%`
  - `height: 1px`
  - `background-color: <figma-line-color>`
  - `border: none`
  - `margin-top` and `margin-bottom` matching Figma `Line 3` spacing.
- **Copyright spacing:** Ensure the `©2026 Peptrace` text has `margin-top` and `text-align` values matching the Figma frame.

### 6. Responsive Breakpoints and Layout Collapse
**File:** `frontend/src/components/AccountPages/AccountPages.css`

- **Unify breakpoints to Figma thresholds:**
  - Mobile: change `max-width: 430px` queries to `max-width: 591px`.
  - Tablet: add `(min-width: 592px) and (max-width: 1091px)` queries for any tablet-specific sizing.
  - Desktop: use `min-width: 1092px`.
- **Dashboard grid collapse:**
  - Desktop: `.dashboard-grid { display: grid; grid-template-columns: 1fr 320px; gap: <figma-gap>; }` (replace `320px` with exact Figma sidebar width).
  - Tablet/Mobile: `.dashboard-grid { grid-template-columns: 1fr; }` so the sidebar (`QuickActions`, `TestCalendarWidget`) stacks beneath the main tables.
- **Welcome metrics mobile:** Under `max-width: 591px`, set `.user-metrics { flex-direction: column; }` and `.metric-separator { width: 100%; height: 1px; }` to match the Figma vertical stack.

### 7. HeaderBar Responsive Behavior
**File:** `frontend/src/components/HeaderBar/HeaderBar.css`

- **Mobile toggle threshold:** Ensure the mobile menu toggle activates at `max-width: 591px` rather than `430px`. If the existing query is `max-width: 1091px` for tablet, keep it, but verify that between 592px–1091px the tablet header composition matches Figma nav spacing and pill sizing.
- **Header container padding:** Verify `padding-left` and `padding-right` on the header bar against the Figma inspect panel at all three breakpoints. Adjust if the preview shows incorrect side margins.