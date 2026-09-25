### 1. `frontend/src/App.tsx` — Add the missing announcement banner
Insert a page-level announcement bar at the top of the `/methodology` route branch, before `<HeaderBar>`.  
- **Element:** `<div className="announcement-bar">Get your free peptide safety test →</div>`  
- **CSS properties:** `background-color: #0B7A3F` (or existing token `--color-primary-green`), `color: #fff`, `text-align: center`, `padding: 10px 16px`, `font-size: 14px`, `font-weight: 500`.  
- **Evidence:** All three design screenshots show this bar; none of the previews do.

### 2. `frontend/src/components/MethodologyPage/MethodologyPage.tsx` — Fix vendors card wrapper and 0-point icon
- **Vendors policy card:** Wrap the three policy items (*Tests are not altered*, *Rankings are not for sale*, *How a vendor improves*) in a container `div` with class `vendors-policy-group`. Do **not** wrap the section heading inside this container.  
- **0-point bullet:** Change the icon/indicator for the *0 points* row under *“If only a label claim is present”* from the green modifier class to the neutral gray modifier (e.g., swap `status-icon--green` for `status-icon--gray`).  
- **Evidence:** 390px design shows the gray zero icon and the gray card background; preview shows a green zero icon and no card background.

### 3. `frontend/src/components/MethodologyPage/MethodologyPage.css` — Two-column ratio and vendors background
- **Selector:** `.methodology-section` (the Analysts + Vendors grid).  
  - **Current:** Likely `grid-template-columns: 1fr 1fr`.  
  - **Target:** `grid-template-columns: 2fr 3fr` (or `minmax(320px, 2fr) minmax(480px, 3fr)`) inside `@media (min-width: 567px)`.  
- **Selector:** `.vendors-policy-group`.  
  - **Target:** `background-color: var(--color-bg-secondary, #F6F6F6)` and `padding: 24px`.  
- **Evidence:** 744px and 1440px designs show an asymmetric split and a light gray card around the vendors policies; previews show 50/50 columns on white.

### 4. `frontend/src/components/MethodologyPage/MethodologyPage.css` — Reduce Labeling Score Works grid gap
- **Selector:** `.labeling-works-grid` (the 2×2 grid under *“How the Labeling Score Works”*).  
  - **Current:** `gap: 24px` (or larger).  
  - **Target:** `gap: 16px`.  
- **Evidence:** Design cards sit closer together; preview cards are too far apart at 744px and 1440px.

### 5. `frontend/src/components/MethodologyPage/MethodologyPage.css` — Tighten formula grid vertical spacing
- **Selector:** `.formulas-grid` (the 3×2 grid).  
  - **Current:** `row-gap: 24px`–`32px`.  
  - **Target:** `row-gap: 16px` (keep `column-gap: 16px` to match horizontal density).  
- **Evidence:** Design packs the six formula cards tightly; preview has excessive vertical whitespace.

### 6. `frontend/src/components/MethodologyPage/MethodologyPage.css` — Compact Reading Results cards
- **Selector:** `.reading-result-card` (the three cards under *“How to Read the Final Rating”*).  
  - **Current:** `padding: 24px`–`32px`.  
  - **Target:** `padding: 16px`–`20px` to reduce overall card height.  
- **Evidence:** Preview cards are taller and looser than the compact cards in the design.

### 7. `frontend/src/components/MethodologyPage/MethodologyPage.css` — Standards table density and column proportions
- **Selector:** `.standards-table th, .standards-table td`.  
  - **Target:** `padding: 12px 16px`, `font-size: 14px`, `line-height: 1.4`, `vertical-align: top`.  
- **Selector:** `.standards-table`.  
  - **Target:** `border-collapse: collapse` and explicit column widths (e.g., `STANDARD` 20 %, `PURITY` 20 %, `QUANTITY` 25 %, `LABELING` 20 %, `SOMETIMES` 15 %) so text wraps consistently with the design.  
- **Evidence:** Preview table cells are looser and column proportions differ slightly from the design’s compact grid.

### 8. `frontend/src/components/MethodologyPage/MethodologyPage.css` (or global) — Footer background override
- **Selector:** `.site-footer` (or equivalent footer class).  
  - **Target:** `background-color: var(--color-bg-secondary, #F9F9F9)`.  
- **Note:** If `SiteFooter` internals must not be edited, apply this override from the page stylesheet or `App.css`.  
- **Evidence:** All three design screenshots show a light gray footer; previews show a white footer.

### 9. `frontend/src/App.tsx` — HeaderBar composition (drift note)
- The preview renders extra chrome (*vendors* pill at 744px and *Sign in* at 744px/1440px) that the design omits. Since `HeaderBar` internals should not be edited, verify whether `HeaderBar` accepts suppression props (e.g., `hideVendorLink`, `hideSignIn`). If such props exist, pass them in the `/methodology` branch. If not, record this as a shared-component drift issue outside the scope of `MethodologyPage`.  
- **Evidence:** 744px/1440px design headers lack these elements; previews include them.