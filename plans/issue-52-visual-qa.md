1. **`frontend/src/components/MethodologyPage/MethodologyPage.css`**
   - **Constrain page width on desktop:** Add a centered max-width container to the root page wrapper (e.g., `.methodology-page`). Target `max-width: 980px` (or match the existing `.page-content` / `.free-peptide-testing` container token) and `margin: 0 auto` so the content column matches the narrower, centered design at 1440 px. Use responsive padding: `16px` mobile, `24px` tablet, `48px` desktop.
   - **Fix mobile standards table:** Wrap the standards `<table>` in a scrollable container (`.standards-table-wrapper`) with `overflow-x: auto`, `-webkit-overflow-scrolling: touch`, and `width: 100%`. Give the table `min-width: 620px` (or `width: max-content`) so all five columns (`STANDARD`, `PURITY`, `QUANTITY`, `LABELING`, `SOMETIMES`) remain in a single horizontal row and scroll on 390 px instead of collapsing the fifth column.
   - **Center formula equations:** Inside `.formula-card` (or equivalent), set `text-align: center` on the equation wrapper. Use `display: flex; flex-direction: column; align-items: center;` with `gap: 12px` between the formula title, math block, and description so the vertical rhythm matches the design.
   - **Increase section spacing:** Raise the bottom margin between major page sections. Use `margin-bottom: 64px` on mobile, `72px` on desktop, to match the looser vertical rhythm in the Figma frames.

2. **`frontend/src/components/MethodologyPage/MethodologyPage.tsx`**
   - **Preserve table column:** Ensure the standards table markup includes the fifth `<th>SOMETIMES</th>` and corresponding `<td>` cells. Do not conditionally hide this column at any breakpoint.
   - **Formula markup:** Wrap each equation in a dedicated `<div className="formula-equation">` so the CSS `text-align: center` rule targets the math independently of left-aligned descriptive paragraphs.

3. **`frontend/src/components/SiteFooter/SiteFooter.tsx`**
   - **Remove pipe prefixes:** Strip the leading `|` character from the footer column headings. If the JSX hardcodes it (e.g., `<span>| {title}</span>`), render only `{title}`. If the pipe comes from a string in a links array, update the array values to `"Explore"`, `"Testing"`, and `"Legal"`.

4. **`frontend/src/components/HeaderBar/HeaderBar.tsx` (or the navigation config consumed by it)**
   - **Remove `vendors` pill:** Delete the `vendors` button/pill from the header markup across all breakpoints; it does not appear in any Methodology design frame.
   - **Restore `rankings` link on desktop:** Ensure the primary nav row at 1440 px includes `rankings` before `about`, `news`, and `membership`, matching the design link set.
   - **Hide pills on mobile:** At 390 px, do not render the `vendors` and `sign up` pills next to the logo; rely on the hamburger menu as shown in the mobile design.

5. **`frontend/src/App.tsx`**
   - **Verify route wrapper consistency:** Confirm the `/methodology` branch renders `<MethodologyPage />` inside `<main className={`main ${authOpen ? 'auth-page-preview' : ''}`}>`. No extra wrapper classes that would alter page background or padding should be applied.