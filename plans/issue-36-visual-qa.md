**1. HeaderBar — Composite Logo (`frontend/src/components/HeaderBar/HeaderBar.tsx`)**
- **Discrepancy:** Single monolithic logo image across all breakpoints instead of the Figma `Logo` frame.
- **Action:** Inside the `.header-brand` anchor, replace `<img src={logoSvg} alt="Peptrace" className="header-logo" />` with composite markup: an inline `<svg>` (or pre-existing vector markup from `frontend/src/assets/`) for the icon portion, followed by `<span className="logo-wordmark">PEPTRACE</span>` and `<span className="logo-tagline">What's actually in the vial</span>`.
- **CSS target vs. current:** Target `.header-brand { display: inline-flex; align-items: center; gap: [Figma value] }` and set the wordmark/tagline `font-family`, `font-size`, `font-weight`, `line-height`, and `color` to match the Figma text nodes. Current: no text nodes exist (replaced by one image).

**2. HeaderBar — Desktop NavBar Alignment (`frontend/src/components/HeaderBar/HeaderBar.tsx`)**
- **Discrepancy:** Extraneous "vendors" pill visible at 1440 px (and any breakpoint where `desktop-only` is active).
- **Action:** Remove `<a href="/vendors" className="pill-button outline">vendors</a>` from the `desktop-only` nav group when `accountMode === true`.
- **Target sequence:** About → News → Membership → `<span className="header-divider" />` → Pill Button ("sign up") → ProfileIcon. Current sequence includes the extra vendors pill between the divider and the sign-up area.

**3. Dashboard Footer Deduplication (`frontend/src/components/AccountPages/AccountPages.tsx`)**
- **Discrepancy:** Inline `AccountFooter` rendered on all breakpoints instead of `SiteFooterContainer`.
- **Action:** Delete the inline `AccountFooter` component definition. Add `import SiteFooter from '../SiteFooter/SiteFooter';` and render `<SiteFooter />` as the last element in the dashboard view.
- **Target vs. current:** Target is the existing `SiteFooter` component producing three `FooterLinkColumn`s, a divider, and "©2026 Peptrace". Current is a duplicated, simplified inline footer.

**4. Dashboard Grid Responsiveness (`frontend/src/components/AccountPages/AccountPages.tsx` + associated dashboard CSS)**
- **Discrepancy / verification need:** Ensure the grid matches the Figma breakpoint behavior (especially mobile stacking).
- **Action:** Verify and tighten the `.dashboard-grid` rules:
  - **0–591 px:** `grid-template-columns: 1fr;` (single full-width column). `SidebarArea` widgets (`QuickActions`, `TestCalendarWidget`) must stack below `MainArea` by natural document/grid flow.
  - **592–1091 px:** Compressed stacked or two-column layout (e.g., `grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))` or a narrowed fixed sidebar depending on the exact Figma tablet spacing).
  - **1092 px+:** Side-by-side layout, e.g., `grid-template-columns: 1fr 320px;` (or the exact sidebar width from the Figma Desktop-User-dashboard frame) so `MainArea` and `SidebarArea` sit horizontally.

**5. Table Mobile Responsiveness (dashboard CSS)**
- **Discrepancy:** Tables do not appear to switch to the iPhone-variant density/card style at 440 px.
- **Action:** For the `MyShipments`, `RecentTestResults`, and `MySupply` table wrappers, apply one of the following at `@media (max-width: 591px)`:
  - `overflow-x: auto; display: block;` on a wrapper div to enable horizontal scrolling, or
  - A card-style layout where each row becomes a flex column with bordered containers.
- **Target:** Mobile density matching the iPhone-User-dashboard screenshot. Current: standard desktop table density bleeding into the mobile viewport.

**6. HeaderBar Responsive Behavior (Preservation)**
- **File:** `frontend/src/components/HeaderBar/HeaderBar.tsx`
- **Action:** Keep the existing `desktop-only`, `tablet-only`, and `mobile-only` visibility classes. Do **not** create separate `MobileNavBar` / `DesktopNavBar` components. No new breakpoint logic is required; only the logo markup and nav item inventory change.

**7. Asset Verification**
- **File:** `frontend/src/assets/` (logo SVG sources)
- **Action:** Locate the existing SVG path data or export the vector groups from Figma node `929:784` to populate the inline SVG portion of the new composite logo. Ensure the `viewBox`, `fill`, and stroke attributes match the Figma Logo frame exactly.