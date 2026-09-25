**1. Fix mobile standards table column visibility**
- **File:** `frontend/src/components/MethodologyPage/MethodologyPage.css`
- **Change:** At `max-width: 566px`, wrap `.standards-table-wrapper` with `overflow-x: auto; -webkit-overflow-scrolling: touch;`. Set the inner `<table>` to `min-width: max-content` (or `~640px`) so all five columns (STANDARD, PURITY, QUANTITY, LABELING, SOMETIMES) remain in the DOM and are horizontally scrollable.  
- **Evidence:** The 390px preview currently hides LABELING and SOMETIMES, while the design shows all five columns.

**2. Add missing light-gray background to the Labeling Score Calculated left column**
- **File:** `frontend/src/components/MethodologyPage/MethodologyPage.css`
- **Change:** Target the left subsection wrapper under “How the Labeling Score Is Calculated” (the container holding “If only a label claim is present”, the 2/1/0 points list, and the methodology note). Apply `background-color: var(--color-gray-50, #F5F5F5); padding: 1.25rem; border-radius: 0.5rem;`.  
- **Evidence:** The design shows the entire left subsection on a continuous light-gray field; the preview renders the points list on white.

**3. Remove the green left border from the Methodology note box**
- **File:** `frontend/src/components/MethodologyPage/MethodologyPage.css`
- **Change:** On `.methodology-note` (or equivalent class), remove `border-left: 3px solid var(--color-primary-green)` and set `background-color: transparent` so it blends into the light-gray parent container. If the note is not nested inside the gray column, give it the same `background-color: var(--color-gray-50, #F5F5F5)` but with `border-left: none`.  
- **Evidence:** The preview shows a visible green left border; the design shows a uniform gray box with no accent border.

**4. Correct hero heading typography**
- **File:** `frontend/src/components/MethodologyPage/MethodologyPage.css`
- **Change:** Increase `.methodology-hero h1` to `font-size: 3rem` (48px) and `font-weight: 800` (or the closest heavy token in the project). Reduce the subheading margin if it pushes the title too far down.  
- **Evidence:** The preview title is visibly smaller/lighter than the design at all breakpoints.

**5. Adjust standards table column widths on desktop**
- **File:** `frontend/src/components/MethodologyPage/MethodologyPage.css`
- **Change:** At `min-width: 1092px`, apply `table-layout: fixed` to `.standards-table` and set explicit widths on `<th>`/`<td>`: STANDARD `18%`, PURITY `15%`, QUANTITY `22%`, LABELING `28%`, SOMETIMES `17%`. This prevents even distribution and lets LABELING accommodate multi-word values.  
- **Evidence:** The 1440px design shows LABELING wider and SOMETIMES narrower than the preview’s equal-width columns.

**6. Reduce formula font size to prevent unwanted wrapping**
- **File:** `frontend/src/components/MethodologyPage/MethodologyPage.css`
- **Change:** In `.formula-card .formula` (the equation text), reduce `font-size` from `~1.1rem` to `0.95rem` (or `15px`). Ensure the card grid uses `gap: 1.5rem` so cards are wide enough on desktop and tablet.  
- **Evidence:** NATURAL RATING and POSTERIOR MEAN wrap to extra lines in the 744px and 1440px previews while they remain compact in the design.

**7. Tighten standards table cell padding**
- **File:** `frontend/src/components/MethodologyPage/MethodologyPage.css`
- **Change:** Set `.standards-table th, .standards-table td` to `padding: 0.5rem 0.75rem` across all breakpoints (slightly less on mobile if needed).  
- **Evidence:** The 744px preview table rows are taller than the design due to excessive vertical padding.

**8. Ensure table markup always contains all five columns**
- **File:** `frontend/src/components/MethodologyPage/MethodologyPage.tsx`
- **Change:** Verify the standards `<table>` JSX always renders five `<th>` elements and five `<td>` cells per row. Remove any conditional logic that omits LABELING or SOMETIMES on small viewports; rely on the CSS overflow strategy from item 1.  
- **Evidence:** The 390px preview is missing two columns entirely.