Implement the following corrections in the `FullLeaderboard` feature directory and parent shell:

1. **Hide `HomeTopInfo` on mobile and tablet**  
   - **File:** `frontend/src/components/FullLeaderboard/FullLeaderboard.tsx`  
   - **Change:** Wrap `<HomeTopInfo />` in a `<div className="home-top-info-wrapper">` and hide it via CSS at viewports `≤1091px`.  
   - **CSS:** In `FullLeaderboard.css` add:  
     ```css
     @media (max-width: 1091px) {
       .home-top-info-wrapper { display: none; }
     }
     ```  
   - **Evidence:** DESIGN at 390px and 744px omits the second banner; PREVIEW renders it.

2. **Fix `ProductHeader` subtitle casing**  
   - **File:** `frontend/src/components/FullLeaderboard/ProductHeader.tsx`  
   - **Change:** Update the hardcoded subtitle string from `"methodology · Purity Focused"` to `"methodology · Purity focus"`.  
   - **Evidence:** DESIGN uses lowercase "focus"; PREVIEW uses "Focused".

3. **Restructure `MethodologyBadge` layout at desktop**  
   - **File:** `frontend/src/components/FullLeaderboard/FullLeaderboard.css`  
   - **Change:** Remove any `float: right`, `position: absolute`, or `justify-content: flex-end` rules that pin the badge beside the title block. Instead, give `.methodology-badge-wrapper` `display: flex; flex-direction: column; align-items: flex-start;` (or `display: block`) so it sits below the stats text in normal flow. At `≥1092px` set `margin-top: 16px` and `margin-bottom: 24px`.  
   - **Evidence:** DESIGN at 1440px shows the badge left-aligned under the stats; PREVIEW shows it floated right of the title.

4. **Fix `MethodologyBadge` pill styling and chevron**  
   - **File:** `frontend/src/components/FullLeaderboard/MethodologyBadge.tsx` and `.css`  
   - **Changes:**  
     a. Wrap the `dose ±35%` text in the same pill element used for `purity 99.5%+` (green background `#047857`, white text, `border-radius: 9999px`, `padding: 4px 12px`, `font-size: 12px`, `font-weight: 500`).  
     b. Append a downward chevron icon (SVG, `width: 16px`, `color: #6B7280`) inside the bordered badge container, spaced `8px` from the last pill.  
     c. Move the `View methodology` link **outside** the bordered container. At `≥567px` place it to the right of the container with `gap: 16px`. At `≤566px` keep it below the container.  
     d. Style the badge container with `border: 1px solid #E5E7EB`, `border-radius: 8px`, `padding: 8px 12px`, and remove any box-shadow or white card background so it matches the design's outlined box.  
   - **Evidence:** DESIGN shows three pills, a chevron, and an external link; PREVIEW omits the chevron, omits the dose pill, and embeds the link inside a white card.

5. **Fix vendor table header typography**  
   - **File:** `frontend/src/components/FullLeaderboard/VendorsPanel.tsx`  
   - **Change:** Replace header labels with sentence-case text: `#`, `Vendor`, `$/mg`, `Customer Rating`, `Purity Rating`, `N`. Remove any CSS `text-transform: uppercase`. Set `font-weight: 500` and `color: #6B7280` (or the project's gray-500 token).  
   - **Evidence:** DESIGN uses sentence case; PREVIEW uses all-caps.

6. **Add star icon to `Customer` filter button**  
   - **File:** `frontend/src/components/FullLeaderboard/VendorsPanel.tsx`  
   - **Change:** Inside the `filter-stars` trigger button, insert a star icon (SVG or character, colored `#F59E0B`, `width: 14px`) between the text `"Customer"` and the dropdown chevron.  
   - **Evidence:** DESIGN shows a yellow star inside the Customer filter; PREVIEW does not.

7. **Fix `TestHistorySection` COA badge icon**  
   - **File:** `frontend/src/components/FullLeaderboard/TestHistorySection.tsx`  
   - **Change:** Replace the document icon with a simple green circle (`width: 8px; height: 8px; border-radius: 50%; background-color: #10B981`) placed before the `COA-BACKED LAB TESTS` text.  
   - **Evidence:** DESIGN uses a green dot; PREVIEW uses a document icon.

8. **Ensure responsive test-history table columns**  
   - **File:** `frontend/src/components/FullLeaderboard/FullLeaderboard.css`  
   - **Changes:**  
     - At `≥1092px`: Show all columns DATE, RESULT, TEST, LAB, PURITY, DOSAGE, LABEL, COA.  
     - At `567px–1091px`: Hide LABEL and COA columns (`display: none`) or enable horizontal scroll.  
     - At `≤566px`: Convert the vendor table to a card list (hide `<thead>`) and allow the test-history table to scroll horizontally.  
   - **Evidence:** DESIGN at 744px displays 6 test-history columns; at 1440px displays 8.

9. **Tighten vertical spacing between sections**  
   - **File:** `frontend/src/components/FullLeaderboard/FullLeaderboard.css`  
   - **Changes:**  
     - Set `.product-header { margin-bottom: 16px; }` at `≥1092px` (currently appears ~32px).  
     - Set `.methodology-badge-wrapper { margin-bottom: 24px; }`.  
     - Ensure `.vendors-panel { margin-bottom: 24px; }` to match the design's denser stacking.  
   - **Evidence:** PREVIEW at 1440px has noticeably looser gaps between the title, badge, and panels than the design.

10. **HeaderBar tablet layout note**  
    - **File:** `frontend/src/components/HeaderBar/HeaderBar.tsx` (reference only; do not modify per requirements)  
    - **Note:** The PREVIEW at 744px wraps nav links to a second row while the DESIGN keeps them on one row. Because `HeaderBar` is reused as-is, this discrepancy will persist unless the shared component is updated in a separate issue. No changes to `FullLeaderboard` can resolve this.