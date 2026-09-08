### 1. HeaderBar — active route, avatar, and pill styling
**Files:** `frontend/src/components/HeaderBar/HeaderBar.tsx`, `frontend/src/components/HeaderBar/HeaderBar.css`
- **Active route underline:** In `HeaderBar.tsx`, extend the active-route predicate so `/dashboard` receives the same underline treatment as existing routes. *Current:* `/dashboard` is excluded from active underline logic. *Target:* `/dashboard` renders the active underline.
- **Avatar wrapper:** In `HeaderBar.css`, update `.account-button` (or the profile image wrapper inside `.account-pill`). *Current:* generic rectangular or lightly rounded profile image wrapper. *Target:* `border-radius: 50%`, explicit `width` and `height` equal to the Figma `ProfileIcon` ellipse dimensions, and add a `border` property matching the Figma ellipse stroke.
- **Pill Button:** Verify `.pill-button` / `.account-pill` classes in `HeaderBar.css` against Figma instance `I924:3636;15:49`. Adjust `padding`, `border-radius`, `font-weight`, `font-size`, and `background-color` to match the Figma `Pill Button` spec.

### 2. Logo asset verification
**File:** `frontend/src/assets/logo.svg`
- **Vector decomposition:** *Current:* single monolithic `logo.svg`. *Target:* If the SVG paths or embedded text outlines diverge from the Figma `Vector` groups and text nodes, re-export the logo from Figma file `kb9w5rn6RfBO6maPaa5gWg` and replace the asset so logo typography and alignment match the design exactly.

### 3. WelcomeProfile DOM nesting
**File:** `frontend/src/components/AccountPages/AccountPages.tsx`
- **DashboardPage welcome section:** *Current:* `dashboard-welcome` contains `dashboard-user` and `dashboard-metrics` without a unifying `WelcomeProfile` wrapper. *Target:* Wrap the `UserProfile` block (photo + name/email/tier/since) and the `UserMetrics` block (three stats) in a parent container (e.g., `<section className="welcome-profile">`) so the DOM hierarchy matches the Figma `WelcomeProfile` node tree.

### 4. Metric separators
**File:** `frontend/src/components/AccountPages/AccountPages.css`
- **Separator implementation:** *Current:* `.dashboard-metrics > div + div { border-left: 1px solid ... }`. *Target:* Replace with explicit separator elements (e.g., `<div className="metric-separator">`) or pseudo-elements styled to match the Figma `Line` nodes between metric frames. Set `width`, `background-color`, and `margin` to the Figma line weight and spacing values.

### 5. DashboardGrid and table column proportions
**File:** `frontend/src/components/AccountPages/AccountPages.css`
- **Grid definition:** *Current:* `.dashboard-grid` uses existing desktop grid proportions. *Target:* On desktop (`min-width: 1092px`), update `grid-template-columns` to match the Figma `929:784` main-area / sidebar ratio (e.g., a proportional split such as `1fr 320px` or the exact Figma frame dimensions).
- **Table grids:** *Current:* `.shipments-table`, `.results-table`, `.supply-table` use existing `grid-template-columns`. *Target:* Redefine each table’s `grid-template-columns` to match the Figma column widths for headers (Tracking ID, Peptide Name, Date Submitted, Status, Batch Code, Purity, Test Date, Outcome, Quantity, Vendor).

### 6. StatusPill wrapper nesting
**File:** `frontend/src/components/AccountPages/AccountPages.tsx`
- **Component output:** *Current:* `StatusPill` likely renders a single element. *Target:* Wrap the status text in two nested frames (e.g., `<div className="status-pill-outer"><div className="status-pill-inner">{text}</div></div>`) so that Figma-derived `padding`, `border-radius`, `background-color`, and `border` tokens can be applied at the correct nesting level.

### 7. QuickActions icon wrappers
**File:** `frontend/src/components/AccountPages/AccountPages.tsx` and `.css`
- **Icon nesting:** *Current:* icons (`plusIcon`, `fileIcon`, `settingsIcon`) rendered directly inside link/button elements. *Target:* Wrap each icon in two nested frames (`<div className="qa-icon-frame"><div className="qa-icon-inner">{icon}</div></div>`) to reproduce the Figma `Frame > Frame > icon` backgrounds, sizing, and gap spacing.

### 8. TestCalendarWidget container
**File:** `frontend/src/components/AccountPages/AccountPages.tsx` and `.css`
- Ensure the widget container has a defined `min-height` and `display`/`flex-direction` layout capable of accepting a future calendar grid without causing reflow or overflow issues.

### 9. AccountFooter responsive grid
**File:** `frontend/src/components/AccountPages/AccountPages.css`
- **Desktop:** *Current:* `.account-footer-grid` may not enforce a strict three-column layout. *Target:* `grid-template-columns: repeat(3, 1fr)` (or Figma-proportional columns) with a horizontal rule (`<hr className="footer-divider">` or `border-top`) matching Figma `Line 3` placement above the copyright row.
- **Tablet/Mobile (<1091px):** *Current:* collapse behavior unverified. *Target:* `grid-template-columns: 1fr` with stacked columns and `gap` matching the Figma footer spacing on smaller breakpoints.

### 10. Responsive breakpoint realignment
**Files:** `frontend/src/components/AccountPages/AccountPages.css`, `frontend/src/components/HeaderBar/HeaderBar.css`
- **Mobile breakpoint:** *Current:* media queries at `max-width: 430px` and `max-width: 700px`. *Target:* use `max-width: 591px` as the canonical mobile breakpoint to align with Figma `iPhone-user-dashboard` (`988:4776`). At this breakpoint:
  - `.dashboard-metrics` must stack vertically (`flex-direction: column` or `grid-template-columns: 1fr`).
  - Table wrappers must become horizontally scrollable (`overflow-x: auto` or `display: block` with `white-space: nowrap` on rows).
- **Tablet breakpoint:** *Current:* `max-width: 1091px` exists in `HeaderBar.css`. *Target:* ensure `.dashboard-grid` and `.settings-layout` collapse to single column (`grid-template-columns: 1fr`) so sidebar cards (`QuickActions`, `TestCalendarWidget`) stack beneath the main table cards. Header must switch to the existing tablet/mobile navigation pattern.