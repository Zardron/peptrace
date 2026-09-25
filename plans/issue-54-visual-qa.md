Implement the complete `FullLeaderboard` page UI so it renders the designed layout at all breakpoints instead of an error-only placeholder.

### 1. Replace the error-only placeholder with the page layout shell
**File:** `frontend/src/components/FullLeaderboard/FullLeaderboard.tsx`
- **Current:** The preview shows a single sentence "Could not load product data. Please try again later." replacing the entire main content area, breaking vertical spacing and hiding all sections.
- **Target:** Render the page scaffold unconditionally: `<HeaderBar />`, `<HomeTopInfo />`, a `<main>` page wrapper, and `<SiteFooter />`. Perform data fetching inside the page wrapper. If data fails or loads, show localized states (spinners or inline messages) inside `VendorsPanel` and `TestHistorySection`, not as a full-page text block. Maintain `gap` or `margin-bottom` between sections at ≈24px (mobile) and ≈32px (desktop) even in error states.

### 2. Restore the missing `HomeTopInfo` banner on desktop
**File:** `frontend/src/components/FullLeaderboard/FullLeaderboard.tsx`
- **Discrepancy:** At 1440px the green "Get your free peptide safety test →" banner is absent in the preview.
- **Action:** Import and render `<HomeTopInfo />` immediately after `<HeaderBar />` for **all** breakpoints. Do not hide it on desktop; the design explicitly includes it at 1440px.

### 3. Build `Breadcrumbs`
**File:** `frontend/src/components/FullLeaderboard/Breadcrumbs.tsx`
- Render "Products / Retatrutide" as text links.
- **Typography:** Small, muted gray (`#6B7280` or similar) for inactive; slightly darker for the current page. Regular weight.
- **Spacing:** Horizontal padding must match the page gutter (see Section 8). Top padding below the banner ≈16px mobile, ≈24px desktop.

### 4. Build `ProductHeader`
**File:** `frontend/src/components/FullLeaderboard/ProductHeader.tsx`
- **Title "Retatrutide":** Bold, near-black, size ≈32px mobile and ≈40px desktop.
- **Subtitle "methodology · Purity focus":** Regular weight, muted gray, ≈14–16px, with `margin-top: 4px`.
- **Stats line "293 vendors 3,858 tests 17 Dec 2025 first 20 Sept 2026 latest":** Regular weight, muted gray, ≈12–14px, with `margin-top: 8px`.
- **Layout:** Stack vertically on mobile. On desktop, allow the methodology badge to sit on the same horizontal row as the title block (flex row, space-between or flex-start with large gap).

### 5. Build `MethodologyBadge`
**File:** `frontend/src/components/FullLeaderboard/MethodologyBadge.tsx`
- **Elements:** Text label "Purity Focused"; pill badges "purity 99.5%+" and "dose ±35%"; a downward chevron; and a "View methodology" link.
- **Pill styling:** Dark green fill (`#064E3B` or similar), white text, `border-radius: 9999px`, `padding: 4px 12px`, small font size (≈12px), medium weight.
- **Link styling:** Green text (`#059669`), underlined or semibold, positioned to the right of the badge group on desktop.
- **Responsive:** Stack below the product header on mobile/tablet; align inline with the header on desktop (≥1092px).

### 6. Build `VendorsPanel`
**Files:** `frontend/src/components/FullLeaderboard/VendorsPanel.tsx` and optional row sub-component.
- **Panel container:** White background, `border: 1px solid #E5E7EB`, `border-radius: 12px`, internal padding ≈16px mobile / ≈24px desktop.
- **Header:** "Vendors" (bold, ≈20px), subtitle "Filter and compare verified suppliers" (muted, ≈14px), `margin-bottom: 16px`.
- **Toolbar:**
  - Search field: rounded border, magnifying glass icon, placeholder "Search vendor...". Width: 100% on mobile; ≈320px on desktop.
  - Filter dropdowns: `Rating Sort`, `Rating`, `Price`, `Customer` (with inline star icon), `N`. Light gray border, rounded (`border-radius: 6px`), small padding (`8px 12px`), font size ≈13–14px.
  - Layout: wrapping flex row. On mobile, two rows of filters; on desktop, single row with `gap: 8–12px`.
- **Vendor table / list:**
  - **Mobile (≤566px):** Hide table headers. Each vendor renders as a card-like row: ranking number (muted, fixed width), colored circle with initials, vendor name (bold), "Verified Supplier" microtext, orange "Get report" link, price right-aligned, purity percentage in a green pill. `Customer Rating` and `N` columns are hidden.
  - **Tablet (567–1091px):** Show headers `#`, `Vendor`, `$/mg`, `Customer Rating`, `Purity Rating`, `N`. Row height ≈64px. Allow horizontal scroll if the container is too narrow.
  - **Desktop (≥1092px):** Full table with all columns. Vendor cell: initials circle + name + "Verified Supplier" + "Get report". Customer Rating: yellow star icon + score + count in parentheses. Purity Rating: green percentage pill. N: plain number. Column alignment: `#` centered, text columns left-aligned, numeric columns right-aligned or consistent.

### 7. Build `TestHistorySection`
**File:** `frontend/src/components/FullLeaderboard/TestHistorySection.tsx`
- **Section header:** "Retatrutide test history" (bold, ≈20px). Stats: "18 TESTS · 17 PASS · 1 FAIL" in small caps; PASS text green, FAIL text red. "COA-BACKED LAB TESTS" badge with a green dot and small uppercase text.
- **Table header:** Light gray background or bottom border, uppercase labels ≈11–12px, muted color, semibold.
- **Columns by breakpoint:**
  - Mobile: `DATE`, `RESULT`, `TEST`.
  - Tablet: add `LAB`, `PURITY`, `DOSAGE`.
  - Desktop: add `LABEL`, `COA`.
- **Row styling:**
  - Date: bold, dark.
  - Result: green dot + "Pass" (green text) or red dot + "Fail" (red text). On failed rows, add a red micro-note "purity below standard" below the row.
  - Test: product name bold, vendor name muted below.
  - Lab: dark pill/badge "LAB NAME".
  - Purity: bold percentage + "identity Pass" microtext.
  - Dosage: bold deviation (e.g., "-15%") + microtext "34 mg tested / 40 mg label".
  - Label: batch info + sender info.
  - COA: green outlined button "VIEW COA", small rounded corners.
- **Responsive:** At mobile, render rows as stacked blocks. At tablet/desktop, render as standard table rows with `border-bottom: 1px solid #E5E7EB` and adequate cell padding (≈12px mobile, ≈16px desktop).

### 8. Define responsive page gutters and container
**File:** `frontend/src/components/FullLeaderboard/FullLeaderboard.css`
- **Mobile (≤566px):** Page wrapper `padding: 0 16px`; section spacing `margin-bottom: 24px`.
- **Tablet (567–1091px):** Page wrapper `padding: 0 32px`; section spacing `margin-bottom: 28px`.
- **Desktop (≥1092px):** Page wrapper `max-width: 1280px` (or `1440px` per design), centered, `padding: 0 64px`; section spacing `margin-bottom: 32px`.
- Ensure all internal cards (`VendorsPanel`, `TestHistorySection`) use `background: #FFFFFF` and `border: 1px solid #E5E7EB` to match the elevated card surfaces in Figma.

### 9. Wire data fetching without destroying layout
**File:** `frontend/src/components/FullLeaderboard/FullLeaderboard.tsx`
- Use `useEffect` to call `GET /products/:slug/leaderboard` and `GET /products/:slug/tests`.
- On network error or missing data, render the empty table structures with a centered inline message (e.g., "Unable to load vendors") **inside** the panel, preserving the designed panel borders, padding, and spacing. Do not return early from the component with a plain string.

### 10. Route verification
**File:** `frontend/src/App.tsx`
- Confirm the route `/products/:slug` renders the `FullLeaderboard` component inside the standard layout that already includes `HeaderBar` and `SiteFooter`. The preview shell is correct; only the page component interior is missing.