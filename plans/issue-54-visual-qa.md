### 1. Remove duplicated/misplaced `HomeTopInfo` pill on mobile and tablet
**File:** `frontend/src/components/FullLeaderboard/FullLeaderboard.tsx` and `FullLeaderboard.css`  
**Issue:** A green *“Get your free peptide safety test →”* pill is rendered below the nav links at ≤1091px, which does not appear in the Figma designs for mobile or tablet.  
**Fix:** Conditionally hide the `HomeTopInfo` component (or the pill variant) at viewports below `1092px`. Add a CSS rule:
```css
@media (max-width: 1091px) {
  .full-leaderboard__home-top-info { display: none; }
}
```
At desktop (≥1092px), keep the pill as-is because it matches the design.

### 2. Hide breadcrumbs on tablet and mobile
**File:** `frontend/src/components/FullLeaderboard/Breadcrumbs.tsx` and `FullLeaderboard.css`  
**Issue:** Breadcrumbs (*Products / Retatrutide*) render on tablet (744px) but are absent from the design tablet frame.  
**Fix:** Render breadcrumbs only at desktop. Wrap the component in a media query:
```css
.breadcrumbs { display: none; }
@media (min-width: 1092px) {
  .breadcrumbs { display: block; }
}
```

### 3. Rebuild `MethodologyBadge` container and layout
**File:** `frontend/src/components/FullLeaderboard/MethodologyBadge.tsx` and `FullLeaderboard.css`  
**Issues:** 
- Missing bordered container with rounded corners and dropdown chevron.
- Desktop preview incorrectly floats the badge to the right of the title block instead of placing it below the stats line.
- *“View methodology”* is inside the container on desktop; design places it outside/to the right.

**Fixes:**
- Wrap the inner pills/text in a container with:
  - `background: #ffffff`
  - `border: 1px solid #e5e7eb` (or the design-system gray-200 equivalent)
  - `border-radius: 8px`
  - `padding: 8px 12px`
  - `display: inline-flex; align-items: center; gap: 8px;`
- Append a down-chevron icon (`<ChevronDown />` or SVG) as the last child of that container.
- At desktop (≥1092px), place the badge container on its own line below the stats row (`margin-top: 16px`), and place *“View methodology”* as a separate inline link to the right of the container (`margin-left: 16px`), not inside it.
- At mobile/tablet, keep the container left-aligned and place *“View methodology”* below it (`display: block; margin-top: 8px;`).

### 4. Correct page subtitle copy
**File:** `frontend/src/components/FullLeaderboard/ProductHeader.tsx`  
**Issue:** The subtitle reads *“methodology · Purity Focused”*; design specifies *“methodology · Purity focus”*.  
**Fix:** Change the hard-coded string (or the data mapping) to exactly:
```tsx
<span>methodology · Purity focus</span>
```

### 5. Fix vendor table header typography
**File:** `frontend/src/components/FullLeaderboard/VendorsPanel.tsx` and `FullLeaderboard.css`  
**Issue:** Table headers are rendered in ALL CAPS. Design uses Title Case.  
**Fix:** Update header labels:
- `#` → `#` (keep)
- `VENDOR` → `Vendor`
- `$/MG` → `$/mg`
- `CUSTOMER RATING` → `Customer Rating`
- `PURITY RATING` → `Purity Rating`
- `N` → `N` (keep)
Remove any `text-transform: uppercase` rules targeting `.vendor-table th`.

### 6. Fix TestHistorySection table header visibility and COA badge icon
**File:** `frontend/src/components/FullLeaderboard/TestHistorySection.tsx`  
**Issues:** 
- On mobile the table headers (`DATE`, `RESULT`, `TEST`) are missing when data fails to load.
- The *“COA-BACKED LAB TESTS”* badge uses a document icon instead of the green dot from the design.

**Fixes:**
- Ensure the `<thead>` row is part of the rendered markup regardless of data state (show headers even when the body shows an empty/error state).
- Replace the document icon with a simple green dot element:
  ```tsx
  <span className="coa-dot" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981', marginRight: 6 }} />
  ```
  or use the design-system equivalent.

### 7. Restore populated table layouts and loading/empty states
**File:** `frontend/src/components/FullLeaderboard/VendorsPanel.tsx`, `TestHistorySection.tsx`  
**Issue:** Both panels currently render error messages (*“Unable to load vendors…”* / *“Unable to load test history…”*) instead of the design’s populated rows.  
**Fix:** While this is partly a backend/data issue, the frontend should at minimum:
- Render row markup that matches the Figma spacing and alignment so that when data arrives the visual structure is correct.
- Verify that `VendorsPanel` row items use the expected grid/flex columns: rank (`40px`), vendor info (flex), `$/mg` (`80px`), customer rating (`120px`), purity rating (`100px`), N (`60px`).
- Verify that `TestHistorySection` desktop rows display all 8 columns: `DATE` (`100px`), `RESULT` (`80px`), `TEST` (`flex`), `LAB` (`100px`), `PURITY` (`80px`), `DOSAGE` (`100px`), `LABEL` (`140px`), `COA` (`100px`).
- Ensure the green `VIEW COA` pill buttons in the test-history table match the design’s `background-color`, `border-radius`, and `font-weight`.

### 8. Header & Footer check (no changes)
**File:** `frontend/src/components/HeaderBar/HeaderBar.tsx`, `SiteFooter/SiteFooter.tsx`  
**Verdict:** The `HeaderBar` and `SiteFooter` instances match the design across all three breakpoints. No modifications required.