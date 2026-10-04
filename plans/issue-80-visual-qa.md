1. **Fix checkbox label string in `VendorSignupForm`**
   - **File:** `frontend/src/components/VendorSignupForm/VendorSignupForm.tsx` (or the locale/copy file it consumes)
   - **Evidence:** Mobile (390px) preview shows `Agree to thePartner Service Terms` (missing space).
   - **Correction:** Update the string constant / JSX text node for the agreement checkbox so it reads `Agree to the Partner Service Terms` (target) instead of `Agree to thePartner Service Terms` (current).

2. **Make commercial-distribution label responsive**
   - **File:** `frontend/src/components/VendorSignupForm/VendorSignupForm.tsx` and/or `VendorSignupForm.css`
   - **Evidence:** Mobile design label is `DO YOU DISTRIBUTE COMMERCIALLY?` while the preview renders the desktop-length `DO YOU DISTRIBUTE PEPTIDES COMMERCIALLY?` at 390px.
   - **Correction:** Introduce a breakpoint-sensitive label. At mobile widths (`max-width: 566px`), render the shorter label text. At `min-width: 567px`, keep the current longer label. If the component uses a single shared string, add a media-query scoped text override or a conditional render based on viewport / container width.

3. **Increase footer link vertical spacing on mobile**
   - **File:** `frontend/src/components/SiteFooter/SiteFooter.css` (or the component's style module)
   - **Evidence:** Mobile design shows looser vertical rhythm between footer links; the preview links are too tight.
   - **Correction:** Within the mobile media query (`max-width: 566px`), increase `margin-bottom` on footer anchor links from the current value (appears to be ~`4px`) to **~`8px–12px`** or increase `line-height` to **~`1.75`**, matching the design's looser stack. Verify that desktop (`min-width: 1092px`) spacing remains unchanged so the 1440px layout stays intact.

4. **iPad breakpoint verification**
   - Because the 744px screenshots were unavailable, manually verify the three corrections above at the `min-width: 579px` and `min-width: 944px` media queries in `VendorSignupForm.css` to ensure no regressions on tablet layout.