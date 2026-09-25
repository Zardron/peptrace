### 1. Conditionally hide `HomeTopInfo` on mobile and tablet
**File:** `frontend/src/components/FullLeaderboard/FullLeaderboard.tsx` and `FullLeaderboard.css`  
The green pill banner must only render on desktop (≥1092px).  
- In the JSX, ensure `<HomeTopInfo />` is wrapped with a class (e.g. `home-top-info`).  
- **Add to `FullLeaderboard.css`:**  
  ```css
  @media (max-width: 1091px) {
    .home-top-info { display: none; }
  }
  ```  
**Current:** Banner renders at 390px and 744px. **Target:** Visible only at 1092px+.

### 2. Hide breadcrumbs on mobile
**File:** `frontend/src/components/FullLeaderboard/FullLeaderboard.css`  
- **Add:**  
  ```css
  @media (max-width: 566px) {
    .breadcrumbs { display: none; }
  }
  ```  
**Current:** Breadcrumbs visible at 390px. **Target:** Hidden at ≤566px.

### 3. Correct ProductHeader subtitle copy
**File:** `frontend/src/components/FullLeaderboard/ProductHeader.tsx`  
- Change the subtitle string from `"methodology · Purity Focused"` to `"methodology · Purity focus"`.  
**Current:** Capital “F” and trailing “ed”. **Target:** Lowercase “focus” exactly as in the Figma.

### 4. Fix MethodologyBadge container styling and layout
**Files:** `frontend/src/components/FullLeaderboard/MethodologyBadge.tsx`, `FullLeaderboard.css`  
- Remove the gray background (`background: #F3F4F6` or similar).  
- **Set:** `background: transparent; border: 1px solid #E5E7EB; border-radius: 8px; padding: 8px 12px;` to match the design’s outlined box.  
- Add a dropdown chevron/arrow icon at the right end of the badge group.  
- **Layout correction:**  
  - At ≤566px: `.view-methodology { display: block; margin-top: 8px; }` so the link sits below the container.  
  - At ≥567px: `.view-methodology { display: inline-flex; margin-left: 16px; vertical-align: middle; }` so it sits inline to the right of the container.  
**Current:** Gray box, no arrow, link mis-placed on mobile. **Target:** Bordered box with arrow and correct link placement.

### 5. Add star icon to the “Customer” filter dropdown
**File:** `frontend/src/components/FullLeaderboard/VendorsPanel.tsx`  
- Inside the trigger for the `Customer` filter, render a star icon (e.g. `<StarIcon size={12} fill="currentColor" />` or `★`) between the label text and the chevron.  
**Current:** Text-only “Customer ▼”. **Target:** “Customer ★ ▼”.

### 6. Remove uppercase transform from vendor table headers
**File:** `frontend/src/components/FullLeaderboard/VendorsPanel.css` (or `FullLeaderboard.css`)  
- **Set:** `.vendor-table th { text-transform: none; }`  
**Current:** Uppercase yields “VENDOR”, “$/MG”, “CUSTOMER RATING”, “PURITY RATING”. **Target:** “Vendor”, “$/mg”, “Customer Rating”, “Purity Rating”.

### 7. Replace COA-backed badge icon with a green dot
**File:** `frontend/src/components/FullLeaderboard/TestHistorySection.tsx`  
- Remove the document/page icon.  
- Render `<span className="coa-dot" />` before the text “COA-BACKED LAB TESTS”.  
- **Add CSS:** `.coa-dot { width: 8px; height: 8px; background-color: #10B981; border-radius: 50%; display: inline-block; margin-right: 6px; }`  
**Current:** Document icon. **Target:** Green dot matching the design.

### 8. Center footer copyright on tablet and desktop
**File:** `frontend/src/components/SiteFooter/SiteFooter.css` (or an override in `FullLeaderboard.css`)  
- **Add:**  
  ```css
  @media (min-width: 567px) {
    .site-footer .copyright { text-align: center; }
  }
  ```  
**Current:** Left-aligned at 744px and 1440px. **Target:** Centered as in the design.

### 9. Wire API endpoints to eliminate error fallbacks
**Files:** `frontend/src/components/FullLeaderboard/FullLeaderboard.tsx`, `VendorsPanel.tsx`, `TestHistorySection.tsx`  
- Connect `GET /products/:slug/leaderboard` to populate the vendor table instead of the “Unable to load vendors…” placeholder.  
- Connect `GET /products/:slug/tests` to populate the test-history table instead of the “Unable to load test history…” placeholder.  
- Ensure the row components (vendor cards for mobile, table rows for tablet/desktop; test-history rows for all breakpoints) render when data is present.  
**Current:** Error placeholders visible on all breakpoints. **Target:** Populated rows as shown in the Figma.

### 10. Ensure mobile vendor list uses card layout
**File:** `frontend/src/components/FullLeaderboard/VendorsPanel.css`  
- When data is available, the 390px view must hide the table header row and render each vendor as a stacked card row matching the design (rank + initials circle + vendor name + verified badge + “Get report” link on the left; price and purity badge on the right).  
- **Add:**  
  ```css
  @media (max-width: 566px) {
    .vendor-table thead { display: none; }
    .vendor-table tr { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 12px 0; border-bottom: 1px solid #E5E7EB; }
  }
  ```  
**Current:** Not verifiable because of error state; implementation must match the Figma card pattern once data is wired.