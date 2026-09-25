### 1. Fix mobile header collapse (`HeaderBar` responsive behaviour)
**File:** Likely `frontend/src/components/HeaderBar/HeaderBar.css` (or global responsive styles)  
The 390 px preview shows the full desktop nav row and CTA buttons. Ensure the header hides the text link row and the “vendors / sign up” pills below the correct mobile breakpoint (`max-width: 566px`) and displays only the logo + hamburger icon as specified in the design. Verify the breakpoint logic in `HeaderBar` does not accidentally activate desktop layout at 390 px.

### 2. Adjust Methodology section grid ratio
**File:** `frontend/src/components/MethodologyPage/MethodologyPage.css`  
**Target:** `.methodology-section` (Analysts / Vendors two-column wrapper).  
- **Desktop (`min-width: 1092px`):** Change `grid-template-columns` from the current roughly `1fr 2fr` (or `35% 65%`) to roughly `1fr 1fr` or `45% 55%` so the Analysts column matches the design width and text wrapping is reduced.  
- **Tablet (`567px – 1091px`):** Ensure the split stays closer to `1fr 1fr` rather than collapsing the left column prematurely.

### 3. Add vertical borders to the standards table
**File:** `frontend/src/components/MethodologyPage/MethodologyPage.css`  
**Target:** `.standards-table th, .standards-table td`.  
- Add `border-right: 1px solid var(--color-border, #E5E5E5)` to all cells except the last child (`:last-child` gets `border-right: none`).  
- Ensure the header row retains its darker background fill so vertical rules are visible against it.  
- On mobile (`max-width: 566px`), if the table is intended to scroll horizontally, wrap it in an `overflow-x: auto` container so the “SOMETIMES” column remains accessible and its header is not clipped.

### 4. Fix “Labeling Score Calculated” right-column list styling
**File:** `frontend/src/components/MethodologyPage/MethodologyPage.css`  
**Target:** `.batch-identifier-item`, `.batch-claim-item` (or equivalent selectors for the right-hand list under “If both a label claim and batch claim are present”).  
- **Current:** `border: 1px solid ...` (full card border).  
- **Design:** Remove `border` (or set to `none`). Add only a left accent: `border-left: 2px dashed var(--color-teal, #0D9488)` (or solid if the design is solid) and rely on vertical spacing (`gap` or `margin-bottom`) to separate the two items.  
- Ensure padding is reduced to a compact list item feel (`padding: 0.75rem 1rem`) rather than a large card padding.

### 5. Fix “How the Labeling Score Works” card aesthetics
**File:** `frontend/src/components/MethodologyPage/MethodologyPage.css`  
**Target:** `.labeling-works-card` (the 2×2 grid items).  
- **Current:** White background + visible `border: 1px solid ...`.  
- **Design:** Remove the border. Use a flat background fill: `background-color: var(--color-surface-muted, #F6F6F3)` (or nearest existing token). Ensure no `box-shadow` is applied.

### 6. Increase vertical spacing between major sections
**File:** `frontend/src/components/MethodologyPage/MethodologyPage.css`  
**Target:** `section` or `.methodology-section` wrappers.  
- **Current:** Appears to use roughly `margin-bottom: 3rem` (48 px).  
- **Design:** Increase to roughly `margin-bottom: 5rem` (80 px) or `6rem` (96 px) on desktop (`min-width: 1092px`) to match the airy layout. Keep tablet/mobile spacing slightly tighter if needed, but desktop should be notably more generous.

### 7. Ensure footer link points to `/methodology`
**File:** `frontend/src/components/SiteFooter/SiteFooter.tsx`  
Update the footer link array so “Testing Methodology” resolves to `/methodology` instead of `/testing-methodology`, per the issue spec. The minimal change is replacing the string entry with `{ label: 'Testing Methodology', href: '/methodology' }` and ensuring the rendering loop handles object-style links.

### 8. Audit shared header nav links at all breakpoints
**File:** `frontend/src/components/HeaderBar/HeaderBar.tsx` / `.css`  
While composing the page, confirm that the `activeRoute="/methodology"` prop highlights correctly and that the “rankings” link (if present in the design’s 744 px and 390 px variants) is rendered consistently across breakpoints. The 1440 px preview omitted “rankings”; verify whether this is intentional or a breakpoint-specific rendering bug.