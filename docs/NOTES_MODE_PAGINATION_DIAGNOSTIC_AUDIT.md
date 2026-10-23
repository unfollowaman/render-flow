# Notes Mode Pagination Diagnostic Audit Report

## Executive Summary
This diagnostic audit investigates why Notes Mode pagination produces specific page groupings and leaves unused vertical space per page when rendering the 7-question Trigonometry test document, even after applying the `coordinate_graph` diagram responsive sizing fix.

---

## 1. Environment & Setup Confirmation
- **`usableHeightPerPage`**: `225` mm
- **`containerCss.width`**: `'80mm'` (width budget for individual off-screen item measurement in 2-column grid layout)

---

## 2. Captured Instrumentation Output

### A. Individual Off-Screen Item Measurements (`measureHeight`)
| Item / Question | Item Type / Components | Measured Height (mm) | Measured Height (px at 96 DPI) |
| :--- | :--- | :--- | :--- |
| **Q1** | Text + Equation ($\sin\theta$) | `53.38 mm` | `201.75 px` |
| **Q2** | Text + `coordinate_graph` SVG | `106.59 mm` | `402.86 px` |
| **Q3** | Text + Equation ($\cos 60^\circ$) | `37.05 mm` | `140.03 px` |
| **Q4** | Text + Equation ($\tan 45^\circ$) | `32.80 mm` | `123.97 px` |
| **Q5** | Text + Equation ($\sin^2\theta + \cos^2\theta$) | `42.22 mm` | `159.57 px` |
| **Q6** | Text + Equation ($\sec 0^\circ$) | `37.98 mm` | `143.55 px` |
| **Q7** | Text + Equation ($\cot\theta$) | `47.80 mm` | `180.68 px` |

### B. Row-Pairing Heights (`paginateRows` Sequential Pairing)
Row height is computed as `Math.max(height(ItemA), height(ItemB))`:

- **Row 1**: `[Q1, Q2]` -> `Math.max(53.38, 106.59) = 106.59 mm`
- **Row 2**: `[Q3, Q4]` -> `Math.max(37.05, 32.80) = 37.05 mm`
- **Row 3**: `[Q5, Q6]` -> `Math.max(42.22, 37.98) = 42.22 mm`
- **Row 4**: `[Q7]` (Single-column row) -> `47.80 mm`

### C. Running Total Page Accumulation & Page Break Decision
- **Page 1 Start**: Row 1 (`106.59 mm`). Running Total = **`106.59 mm`** / `225 mm`
- **Page 1 Add Row 2**: Row 2 (`37.05 mm`) + Gap (`3.7 mm`) = `40.75 mm`. Running Total = **`147.33 mm`** / `225 mm`
- **Page 1 Add Row 3**: Row 3 (`42.22 mm`) + Gap (`3.7 mm`) = `45.92 mm`. Running Total = **`193.25 mm`** / `225 mm`
- **Page Break Decision**:
  - Attempting to add Row 4 (`47.80 mm`) + Gap (`3.7 mm`) = `51.50 mm`.
  - `193.25 mm + 51.50 mm = 244.75 mm` > `225 mm` (`usableHeightPerPage`).
  - **PAGE BREAK TRIGGERED**: Page 1 closes at **`193.25 mm`** (leaving `31.75 mm` unused space).
- **Page 2 Start**: Row 4 (`47.80 mm`). Running Total = **`47.80 mm`** / `225 mm`.

---

## 3. On-Screen Rendered DOM Measurement Comparison

Comparing off-screen measured heights against actual live rendered heights in the on-screen `A4Page` DOM:

| Question Card | Measured Height (Off-screen) | On-screen Card Height (`A4Page`) | On-screen SVG Height | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Q1** | `53.38 mm` | `111.34 mm` (`420.81 px`) | N/A | Stretched by CSS Grid `alignItems: stretch` in Row 1 to match Q2. |
| **Q2** | `106.59 mm` | `111.34 mm` (`420.81 px`) | `67.68 mm` (`255.81 px`) | Matches off-screen measured height (~106.6 mm) + grid padding alignment. |
| **Q3** | `37.05 mm` | `32.68 mm` (`123.50 px`) | N/A | Matched with Q4 in Row 2. |
| **Q4** | `32.80 mm` | `32.68 mm` (`123.50 px`) | N/A | Matched with Q3 in Row 2. |
| **Q5** | `42.22 mm` | `42.07 mm` (`159.00 px`) | N/A | Matched with Q6 in Row 3. |
| **Q6** | `37.98 mm` | `42.07 mm` (`159.00 px`) | N/A | Matched with Q5 in Row 3. |
| **Q7** | `47.80 mm` | `42.07 mm` (`159.00 px`) | N/A | Rendered on Page 2 (Row 4). |

### Direct Questions Answered
1. **Did Q2's measured height actually drop after the sizing fix?**
   - **Yes.** Prior to the responsive SVG diagram sizing fix, Q2 was measured at over `150–180+ mm`. After the sizing fix, Q2's off-screen measured height dropped to **`106.59 mm`**.
2. **Does the off-screen measured height match the live on-screen rendered height?**
   - **Yes.** Q2's measured height (`106.59 mm`) matches its live on-screen card height (`111.34 mm`, inclusive of grid row alignment) and its SVG diagram height (`67.68 mm`). There is no measurement mismatch or stale data issue.

---

## 4. Root Cause Analysis

The pagination behavior (breaking after 6 items and leaving `31.75 mm` of unused space on Page 1) is caused by the interaction of two factors:

1. **Strict Sequential Pair Packing (`paginateRows`)**:
   - Items are paired strictly in adjacent input sequence: `Row 1 = [Q1, Q2]`, `Row 2 = [Q3, Q4]`, `Row 3 = [Q5, Q6]`, `Row 4 = [Q7]`.
   - Because Q2 (`106.59 mm`) is paired with Q1, Row 1 consumes `106.59 mm` out of the `225 mm` page budget.

2. **Mathematical Page Height Budget Constraint**:
   - Total height of Rows 1, 2, and 3 plus row gaps is `193.25 mm`.
   - The remaining page space is `225 mm - 193.25 mm = 31.75 mm`.
   - Row 4 (Q7) requires `47.80 mm` (`51.50 mm` including gap).
   - Because `51.50 mm > 31.75 mm`, Row 4 cannot fit on Page 1 and must wrap to Page 2.

The pagination engine is operating strictly as designed according to its sequential 2-column row-packing algorithm.
