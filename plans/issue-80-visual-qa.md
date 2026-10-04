### 1. `frontend/src/components/VendorSignupForm/VendorSignupForm.tsx` — responsive copy corrections
The component currently shows desktop copy at all breakpoints. Add breakpoint-specific copy (or paired elements toggled via CSS) so mobile matches the 390px Figma and desktop matches the 1440px Figma.

| Element | Mobile target (`0–566 px`) | Desktop target (`1092 px+`) |
|---|---|---|
| Subtitle | `Register with Peptrace to build client trust.` | `Register your business with Peptrace and build customer trust.` |
| Distribution label | `DO YOU DISTRIBUTE COMMERCIALLY?` | `DO YOU DISTRIBUTE PEPTIDES COMMERCIALLY?` |
| Situation pill 2 | `Selling, but not listed` | `Selling, but not listed by Peptrace` |
| Situation pill 3 | `Selling, already listed` | `Selling, already listed by Peptrace` |
| Vendor-name helper | `Identified on the Finnrick website` | `How your business will be identified on the Finnrick web site` |
| Batch label | `BATCH IDENTIFIERS?` | `ARE YOUR PRODUCTS DISTRIBUTED WITH BATCH IDENTIFIERS?` |
| Batch pill 1 | `Yes, all` | `Yes, all products` |
| Batch pill 2 | `Some` | `Yes, some products` |
| Checkbox 2 label | `Agree to the Partner Service Terms *` | `I confirm I am authorized to represent this vendor and agree to the Partner Service Terms *` |
| CTA text | `Continue — $279/mo` | `Continue to Payment — $279/mo` |

Implementation approach: render both mobile and desktop text nodes in JSX and toggle visibility with utility classes (e.g., `.mobile-only` / `.desktop-only`) tied to the existing breakpoint media queries, or use the component’s existing responsive CSS classes.

### 2. `frontend/src/components/VendorSignupForm/VendorSignupForm.css` — restore selected states at desktop breakpoint
At `min-width: 944px` the preview loses selected-state styling that is present on mobile:
- **Distribution toggle**: Ensure the selected *"Yes"* pill uses the brand green fill (`background-color`) and white text. Currently it renders as an unselected outline at 1440px.
- **Current-situation pills**: Ensure the selected pill (e.g., *"New vendor, not selling yet"*) receives the green fill and white text at desktop widths. Inspect the desktop media query for overrides that reset `background` to `transparent` or remove the active class rules.
- **Batch-identifiers pills**: Confirm the selected state (e.g., *"Yes, some products"*) retains its green fill at desktop; the preview shows all pills as unselected/outline.

### 3. `frontend/src/components/VendorSignupForm/VendorSignupForm.tsx` — default checkbox state
If the design’s checked presentation is the intended default for this screen, set the two Premium checkboxes to default to `checked={true}`. If they are intentionally unchecked by default, update the Figma snapshot instead; otherwise align the preview to the design.

### 4. `frontend/src/components/HeaderBar/HeaderBar.tsx` — remove extraneous desktop nav item
The desktop header renders a *"vendors"* outline pill that does not appear in the 1440px Figma. Remove or conditionally suppress this button so the nav cluster matches the design: `about`, `news`, `membership`, divider, `sign up`.

### 5. `frontend/src/components/SiteFooter/SiteFooter.tsx` — correct link lists
Update the static link arrays/maps to match the Figma exactly at all breakpoints:

- **Explore**: Products, Vendors, Vendor Support, **Blog**, **Partner Testing Labs**, Testing Methodology, **Corrections**, **Company**, Customer Support. Remove *Leaderboards*.
- **Testing**: Submit your sample, Test Retatrutide, Test Tirzipatide, Test Melatonin, Test BPC-157, Test Ipamoreline, Test NAD+, **Test another product**.
- **Legal**: **Verify COA**, **Testing Status**, Terms of Service, Privacy Policy, Refund Policy, **Partner Service Terms**, Data Deletion.

### 6. `frontend/src/components/SiteFooter/SiteFooter.css` — desktop footer layout and copyright alignment
- Increase the footer column container’s width distribution so the three columns spread evenly across the full width (e.g., use `justify-content: space-between` or increase `gap` to match the 1440px design’s generous gutters). The preview currently clusters columns on the left.
- Change copyright text alignment from `left` to `center` at desktop breakpoints.

### 7. iPad breakpoint validation (744px)
Once assets are available, verify that the copy switches, selected states, and footer link lists above render correctly in the tablet media query (`min-width: 579px`). No new per-breakpoint component splits are required.