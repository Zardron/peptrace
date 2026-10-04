1. **HeaderBar / top banner component** — Add missing arrow icon  
   - File: `frontend/src/components/HeaderBar/HeaderBar.tsx` (or dedicated announcement banner component).  
   - Change: Append a right-pointing chevron/arrow icon (e.g., an inline SVG or `▶`) to the banner text "Get your free peptide safety test". Ensure it renders at the `390px` breakpoint and is hidden or replaced appropriately on larger breakpoints if required by the design system.

2. **VendorSignupForm responsive subtitle** — Correct mobile subtitle string  
   - File: `frontend/src/components/VendorSignupForm/VendorSignupForm.tsx`.  
   - Change: Make the subtitle text responsive. At mobile (`max-width: 566px`), render `"Register with Peptrace to build client trust."`. At `567px` and above, render `"Register your business with Peptrace and build customer trust."`. Currently the desktop string is bleeding into the mobile view.

3. **VendorSignupForm Premium panel** — Add missing sparkle icon  
   - File: `frontend/src/components/VendorSignupForm/VendorSignupForm.tsx`.  
   - Change: Insert the small sparkle/star icon (reuse the existing SVG/icon component from the design system) immediately before the text node "Upgrade to Premium for 10% off on Launch with Peptrace" inside the premium upgrade panel. Apply `margin-right: 8px` (or equivalent spacing token) to separate the icon from the text, matching the `1440px` design alignment.

4. **VendorSignupForm checkbox label** — Fix asterisk spacing  
   - File: `frontend/src/components/VendorSignupForm/VendorSignupForm.tsx`.  
   - Change: In the label for "Agree to the Partner Service Terms", ensure a space character exists before the `<span>` or element that renders the required asterisk so the output reads `"Terms *"` instead of `"Terms*"`. If the asterisk is its own node, add `margin-left: 4px` to the asterisk element.

5. **SiteFooter mobile spacing** — Increase vertical rhythm at `390px`  
   - File: `frontend/src/components/SiteFooter/SiteFooter.css` (or the CSS module used by `SiteFooter.tsx`).  
   - Changes at the mobile breakpoint (`max-width: 566px`):
     - Footer anchor links: increase `margin-bottom` from the current ~`8px` to `16px` (or increase `line-height` to `2`) to match the design's looser vertical stacking.
     - Footer section headings (`Explore`, `Testing`, `Legal`): add `margin-top: 24px` (or `2rem`) to each heading that follows a previous section's link list, ensuring clear separation between stacked footer columns on mobile. The first heading (`Explore`) should remain flush with the footer's top padding.