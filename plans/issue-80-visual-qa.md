1. **Fix required-field asterisk color in `VendorSignupForm`**  
   - **Files**: `frontend/src/components/VendorSignupForm/VendorSignupForm.css` (or styled-jsx/CSS-module equivalent) and markup in `VendorSignupForm.tsx`.  
   - **Change**: Target the asterisk element inside `<label>` tags and the checkbox label (e.g., `.form-label .asterisk, .checkbox-label .asterisk`) and set `color: #D97A07` (or the project’s orange-500 token) instead of inheriting the default dark gray (`#1F1F1F`).  
   - **Current vs target**: Current preview renders dark asterisks; design shows orange/amber asterisks on every required field label and on the Partner Service Terms checkbox.

2. **Fix footer link vertical spacing in `SiteFooter`**  
   - **File**: `frontend/src/components/SiteFooter/SiteFooter.css`.  
   - **Change**: Increase the vertical gap between footer anchor links from the current `~8 px` (likely `margin-bottom: 0.5rem` or dense `line-height`) to `16 px` (`margin-bottom: 1rem` or `line-height: 1.6`).  
   - **Current vs target**: Preview links are visually cramped at both 390 px and 1440 px; the design shows airier, evenly spaced links.

3. **Add missing premium panel icon in `VendorSignupForm`**  
   - **File**: `frontend/src/components/VendorSignupForm/VendorSignupForm.tsx`.  
   - **Change**: Insert the sparkle/upgrade SVG icon immediately before the headline text inside the premium upgrade panel. Ensure it displays on desktop (≥ 944 px) and tablet (≥ 579 px) layouts; hide or swap for a simpler variant on mobile if the mobile design omits it.  
   - **Current vs target**: 1440 px design includes the icon; 1440 px preview does not.

4. **Fix batch-identifier pill stretching in `VendorSignupForm.css` (desktop)**  
   - **File**: `frontend/src/components/VendorSignupForm/VendorSignupForm.css`.  
   - **Change**: Inside the `@media (min-width: 944px)` rules for the batch-identifier group, remove `flex: 1` or `width: 100%` from the pill buttons. Set `flex-grow: 0`, `width: auto`, and rely on `gap: 12px` (or `margin-right: 12px`) so the pills sit inline without stretching across the form width.  
   - **Current vs target**: Preview pills expand to fill the row; design keeps them compact and left-aligned.

5. **Fix checkbox label spacing and copy in `VendorSignupForm.tsx`**  
   - **File**: `frontend/src/components/VendorSignupForm/VendorSignupForm.tsx`.  
   - **Change**: Correct the second checkbox label string to `"Agree to the Partner Service Terms "` (insert space after “the”) and render the asterisk as a separate `<span class="asterisk">*</span>` styled in orange.  
   - **Current vs target**: Preview shows `"Agree to thePartner Service Terms*"`; design shows proper spacing and an orange asterisk.

6. **Implement responsive CTA button copy in `VendorSignupForm.tsx`**  
   - **File**: `frontend/src/components/VendorSignupForm/VendorSignupForm.tsx`.  
   - **Change**: Use a window-width check or a CSS media-query content switch so that the CTA button text is `"Continue — $279/mo"` below `566 px` and `"Continue to Payment — $279/mo"` at `567 px` and above.  
   - **Current vs target**: 390 px preview incorrectly renders the long desktop label; the mobile design specifies the short label.

7. **Implement responsive Vendor Name helper text in `VendorSignupForm.tsx`**  
   - **File**: `frontend/src/components/VendorSignupForm/VendorSignupForm.tsx`.  
   - **Change**: Conditionally render the helper text: `"Identified on the Finnrick website"` for viewports `≤ 566 px`, and `"How your business will be identified on the Finnrnick web site"` for viewports `≥ 567 px`.  
   - **Current vs target**: 390 px preview shows the desktop-long helper; the mobile design calls for the abbreviated version.

8. **Re-test iPad breakpoint once assets are available**  
   - **File**: `frontend/src/components/VendorSignupForm/VendorSignupForm.css`.  
   - **Action**: Verify that the `min-width: 579px` media query correctly expands the form card to `max-width: 768px` with `24px` padding, and that the header shows the full desktop nav without overlap, as soon as the 744 px screenshots can be generated.