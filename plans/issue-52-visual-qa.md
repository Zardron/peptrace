### `frontend/src/components/MethodologyPage/MethodologyPage.css`

**Global page spacing & container**
- Add `.methodology-page { max-width: var(--content-max-width, 1200px); margin: 0 auto; padding: 0 24px; }`. Increase to `padding: 0 48px` at `min-width: 1092px` to match desktop side margins.
- Add `.methodology-section { margin-bottom: 80px; }` on desktop, `48px` on tablet, and `40px` on mobile. Current gaps are too tight.

**Hero**
- Set `.methodology-hero h1 { font-size: var(--font-size-hero, 3.5rem); font-weight: 700; line-height: 1.1; }` on desktop. Reduce to `2.5rem` on tablet and `2rem` on mobile.
- Set `.methodology-hero .meta-label { font-size: var(--font-size-xs); letter-spacing: 0.08em; text-transform: uppercase; color: var(--color-text-muted); margin-bottom: 16px; }` to match the “TEST DATA LAST UPDATED…” treatment.

**Two-column Methodology section**
- Change the grid from `grid-template-columns: 1fr 1fr` to `grid-template-columns: 2fr 3fr` (or `minmax(300px, 2fr) minmax(400px, 3fr)`) so the Vendors column is wider, matching the design ratio.
- Add `align-items: start` to the grid container so both columns top-align.
- Give each policy card `.policy-card { background: var(--color-surface-subtle, #F9FAFB); border-radius: 8px; padding: 24px; }`. Remove the current border-only styling.

**Standards table**
- Increase cell padding: `.standards-table th, .standards-table td { padding: 16px 12px; }`.
- Add `.standards-table thead { border-bottom: 2px solid var(--color-border); }` and `.standards-table tbody tr { border-bottom: 1px solid var(--color-border); }`.
- On mobile (`max-width: 566px`), wrap the table in `.table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }` so the SOMETIMES column is reachable. Set `.standards-table { min-width: 640px; }` inside the wrapper to force scroll rather than squash.

**Labeling Score Works grid**
- Ensure the fourth item badge uses the same green class as items 1–3 (e.g., `.badge-green` instead of `.badge-gray`).
- Use `display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px;` on desktop/tablet, and `1fr` on mobile.
- Each card needs `.labeling-card { background: var(--color-surface-subtle); border-radius: 8px; padding: 24px; }`.
- Use `align-items: stretch` on the grid so cards in the same row share equal heights.

**Labeling Score Calculated**
- Layout the two sub-sections with `display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: start;`.
- Left pane: wrap the “If only a label claim is present” content in `.calc-pane { background: var(--color-surface-subtle); border-radius: 8px; padding: 24px; }`.
- Right pane: apply the same `.calc-pane` styling to the “Batch identifier” and “Batch claim communication” blocks.
- Numbered rules: use green circle badges for the 2/1/0 point items.
- Methodology note: `.methodology-note { border-left: 4px solid var(--color-primary); padding: 16px; margin-top: 16px; background: rgba(var(--color-primary-rgb), 0.05); }`.

**Natural Rating vs Final Rating**
- Use `display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; align-items: stretch;` on desktop, `repeat(2, 1fr)` on tablet, and `1fr` on mobile.
- Each card needs `.rating-card { background: var(--color-surface-subtle); border-radius: 8px; padding: 24px; }`.

**Formulas grid**
- Desktop: `grid-template-columns: repeat(3, 1fr);`. Tablet: `repeat(2, 1fr);`. Mobile: `1fr;`.
- `.formula-card { background: var(--color-surface-subtle); border-radius: 8px; padding: 24px; text-align: center; }`.
- Formula text: `.formula-math { font-size: var(--font-size-lg, 1.125rem); font-family: var(--font-mono, monospace); margin: 12px 0; }`.
- Description: `.formula-desc { font-size: var(--font-size-sm); line-height: 1.6; color: var(--color-text-secondary); }`.

**How to Read the Final Rating**
- Same grid/card pattern as above: `background`, `border-radius: 8px`, `padding: 24px`.
- Badge circles: `.pct-badge { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0; }`. Use green for 90%, gray for 50%, red for 20%.

**Leaderboard**
- `.leaderboard-note { background: var(--color-surface-subtle); border-left: 4px solid var(--color-primary); border-radius: 0 8px 8px 0; padding: 24px; }`.

### `frontend/src/components/MethodologyPage/MethodologyPage.tsx`

- Wrap the four “How the Labeling Score Works” items in the grid container and apply `.labeling-card`.
- Change the fourth item’s badge class from gray to green.
- Wrap the “Batch identifier” and “Batch claim communication” blocks in the right-side pane container so they receive the `.calc-pane` background.
- Ensure the Standards table is wrapped in `<div className="table-wrapper">` so mobile scrolling works.

### `frontend/src/components/HeaderBar/HeaderBar.tsx` (or its CSS module)

- **Mobile breakpoint:** The header must render the hamburger menu at widths ≤ 566px. Currently it exposes the “vendors” input and “sign up” pill at 390px. Reduce the mobile breakpoint threshold (or adjust the media query) so the collapsed state appears at `max-width: 566px`.
- **Tablet breakpoint:** At 744px the header must hide the “vendors” button and show only nav links + “sign up” pill. Ensure the “vendors” button only appears at `min-width: 1092px` (desktop).

### `frontend/src/components/SiteFooter/SiteFooter.tsx`

- Update the footer link array so “Testing Methodology” points to `/methodology` instead of `/testing-methodology`. Ensure the label text remains “Testing Methodology” (already planned, verify no visual regression).