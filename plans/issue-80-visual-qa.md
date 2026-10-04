1. **Remove extra icons from the premium upgrade panel**
   - File: `frontend/src/components/VendorSignupForm/VendorSignupForm.tsx`
   - Remove the decorative `<svg>`/`<img>`/`<span>` element that renders the sparkle/star icon immediately before the text “Upgrade to Premium for 10% off on Launch with Peptrace”.
   - Remove the downward chevron icon from the price pill (“$279/month”). The design specifies a plain green pill with text only—no dropdown arrow.

2. **Update mobile-only copy strings (≤ 566 px)**
   - File: `frontend/src/components/VendorSignupForm/VendorSignupForm.tsx`
   - The component currently renders desktop copy at all breakpoints. Add viewport-conditional rendering (or use the existing mobile media-query class) so that at the mobile breakpoint the strings match the Figma mobile frame:
     - **Form subtitle**: Target `"Register with Peptrace to build client trust."` vs current `"Register your business with Peptrace and build customer trust."`
     - **Agreement checkbox label**: Target `"Agree to the Partner Service Terms *"` vs current `"I confirm I am authorized to represent this vendor and agree to the Partner Service Terms *"`
     - **CTA button text**: Target `"Continue — $279/mo"` vs current `"Continue to Payment — $279/mo"`

3. **Increase footer link vertical spacing**
   - File: `frontend/src/components/SiteFooter/SiteFooter.css` (or equivalent styled-component)
   - Increase the spacing between footer anchor links to match the design’s looser rhythm. Current apparent value is roughly `margin-bottom: 8px` (or `line-height: ~1.5`). Target approximately `margin-bottom: 12px`–`16px` (or `line-height: 1.7`–`1.8`). Verify at both 390 px (single-column) and 1440 px (three-column).

4. **iPad breakpoint regression check**
   - Once the 744 px assets are available, confirm that the existing `min-width: 579px` media query in `VendorSignupForm.css` still expands the card to `max-width: 768px` with `24px` padding, and confirm that the premium-panel icon removal and copy changes above do not introduce regressions at this width.

5. **No changes required in `App.tsx` for layout**
   - The route assembly in `App.tsx` correctly renders `<HeaderBar>`, `<main>`, `<VendorSignupForm>`, and `<SiteFooter>` in sequence. The page-level composition already matches the design structure.