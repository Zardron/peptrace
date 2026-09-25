1. **HeaderBar – add missing `rankings` link and fix mobile collapse**  
   - **File:** `frontend/src/components/HeaderBar/HeaderBar.tsx` (or its internal nav config array).  
   - **Change:** Insert a `rankings` nav item before `about` so it renders at tablet and desktop widths.  
   - **Change:** Fix the responsive condition that toggles the mobile hamburger menu. The preview at `390px` still renders the desktop `vendors` and `sign up` pills, indicating the mobile breakpoint (`max-width: 566px`) is not correctly hiding the pill buttons and showing the hamburger icon. Update the JSX condition or CSS media query so viewports `≤566px` use the collapsed mobile header.

2. **MethodologyPage – two-column section balance**  
   - **File:** `frontend/src/components/MethodologyPage/MethodologyPage.css`.  
   - **Evidence:** Left column (`Analysts`) overflows below the right column (`Vendors`) on tablet and desktop.  
   - **Change:** Reduce `line-height` on the Analysts column body paragraphs (e.g., from `1.6` to `1.5`) to match the design’s compact text density.  
   - **Change:** Verify the Vendors column policy cards use consistent vertical padding (e.g., `16px`–`20px`) so they provide enough height to balance the grid row.  
   - **Change:** Ensure the desktop grid uses `align-items: start` and an appropriate column ratio (e.g., `grid-template-columns: 45% 55%` or `1fr 1fr`) so the columns top-align and avoid unintended height stretching.

3. **MethodologyPage – "How the Labeling Score Works" grid gap**  
   - **File:** `MethodologyPage.css`.  
   - **Evidence:** Preview gaps between the four cards are larger than the design.  
   - **Change:** Reduce `gap` on the grid container from the current value (e.g., `24px`) to `16px` on mobile and `20px` on desktop.

4. **MethodologyPage – Formula cards density**  
   - **File:** `MethodologyPage.css`.  
   - **Evidence:** The six formula cards are much taller in the preview due to excess internal spacing.  
   - **Change:** Target the formula card class and reduce `padding` to `16px`–`20px`. Remove any explicit `min-height` so the cards shrink to fit their content, matching the compact design.

5. **MethodologyPage – Final Rating cards density**  
   - **File:** `MethodologyPage.css`.  
   - **Evidence:** The three rating interpretation cards have too much internal whitespace.  
   - **Change:** Reduce `padding` inside the rating cards to `16px` (or the equivalent design token) to match the compact card height shown in the design.

6. **MethodologyPage – Standards table row density**  
   - **File:** `MethodologyPage.css`.  
   - **Evidence:** Table rows are taller in the preview than in the design.  
   - **Change:** Reduce vertical `padding` on `.standards-table th` and `.standards-table td` to `8px`–`12px`, matching the compact row height in the design.

7. **MethodologyPage – Hero top spacing (mobile)**  
   - **File:** `MethodologyPage.css`.  
   - **Evidence:** At `390px`, the space between the secondary nav and the `TEST DATA LAST UPDATED…` label is too tight.  
   - **Change:** Inside the `max-width: 566px` media query, add `padding-top: 16px`–`24px` to the hero container to restore the design’s vertical rhythm.

8. **SiteFooter – link vertical spacing**  
   - **File:** `frontend/src/components/SiteFooter/SiteFooter.css`.  
   - **Evidence:** Footer column links are too tightly packed on the desktop preview.  
   - **Change:** Increase `margin-bottom` on footer list items/anchors from the current value (e.g., `4px`) to `6px`–`8px` to match the looser spacing shown in the design.