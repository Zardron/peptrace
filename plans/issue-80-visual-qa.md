Based on the available visual evidence, the `/vendor-signup` route assembly in `frontend/src/App.tsx` and the reused shared components (`HeaderBar`, `VendorSignupForm`, `SiteFooter`) render correctly at the evaluated breakpoints. **No corrective code changes are required** for the 390px and 1440px viewports.

1. **Manually verify the 744px (iPad) breakpoint**  
   Because the 744px screenshots could not be loaded, perform a quick visual smoke-test at viewport widths between `567px` and `1091px`. Confirm that the existing media query in `frontend/src/components/VendorSignupForm/VendorSignupForm.css` (`min-width: 579px`) correctly sets:
   - `max-width: 768px`
   - `padding: 24px`  
   If the card width or internal spacing deviates from Figma node `2365:882`, update those exact properties to the target values.

2. **No changes to `frontend/src/App.tsx`**  
   The conditional branch for `isVendorSignUpPage`, the `activeRoute="/vendor-signup"` prop on `HeaderBar`, and the `routedPaths` entry are all correct.

3. **No changes to shared components**  
   - `HeaderBar` — spacing, logo lockup, nav links, divider, “sign up” pill, and mobile hamburger menu are visually correct.
   - `VendorSignupForm` — form fields, chip/pill states, premium panel, checkboxes, CTA sizing, and responsive text variations match the design.
   - `SiteFooter` — single-column mobile layout and three-column desktop layout with correct link lists and copyright are visually correct.