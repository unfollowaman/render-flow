# Notes Mode Specification & State

Notes Mode is Render Flow's fourth conversion mode. It accepts structured JSON describing chapter notes, formulas, and step-by-step solutions, and paginates them onto print-ready A4 pages.

---

## 1. Current State in Code

The following modules constitute the active Notes Mode implementation:

| Module | File | Implementation State | Description |
| :--- | :--- | :--- | :--- |
| **Conversion Hook** | [src/hooks/useNotesToPngConversion.js](file:///e:/Antigravity/Projects/render-flow/src/hooks/useNotesToPngConversion.js) | **IMPLEMENTED** | Manages JSON validation, offscreen measurement, row pagination execution (`paginateRows`), and page state. |
| **Schema Validation** | [src/lib/notesMode/validateSchema.js](file:///e:/Antigravity/Projects/render-flow/src/lib/notesMode/validateSchema.js) | **IMPLEMENTED** | Validates chapter structure, returning `{ valid, errors: [{ path, message }] }`. |
| **KaTeX Math Engine** | [src/lib/notesMode/renderEquation.js](file:///e:/Antigravity/Projects/render-flow/src/lib/notesMode/renderEquation.js) | **IMPLEMENTED** | Dynamic KaTeX loader and formula renderer with module-level `Map` caching for instant re-renders. |
| **SVG Math Diagrams** | [src/lib/notesMode/diagrams/](file:///e:/Antigravity/Projects/render-flow/src/lib/notesMode/diagrams/) | **IMPLEMENTED** | SVG Cartesian plane and geometry components (`CoordinatePlane.jsx`, `LineSegment.jsx`, `Point.jsx`, `Shape.jsx`). |
| **Card & Item Components** | [src/components/NotesModeCard.jsx](file:///e:/Antigravity/Projects/render-flow/src/components/NotesModeCard.jsx) | **IMPLEMENTED** | Full question-solution card (`QuestionSolutionCard`) and sub-elements (`EquationItem`, `CoordinateGraphItem`). |
| **Block Decomposition** | [src/lib/notesMode/flattenToBlocks.js](file:///e:/Antigravity/Projects/render-flow/src/lib/notesMode/flattenToBlocks.js) | **IMPLEMENTED** | Decomposes questions into granular blocks: `question-header`, `solution-first`, `solution-rest`. |
| **Block UI Components** | [src/components/NotesBlockComponents.jsx](file:///e:/Antigravity/Projects/render-flow/src/components/NotesBlockComponents.jsx) | **IMPLEMENTED** | Renders decomposed blocks and continuation headers (`ContinuationLabel`: "Q2 (continued)"). |
| **Pagination Engine** | [src/lib/notesMode/paginate.js](file:///e:/Antigravity/Projects/render-flow/src/lib/notesMode/paginate.js) | **PARTIAL** | Contains `measureHeight`, `paginateRows` (active in UI), and `flowBlocksIntoColumns` (merged but not wired to UI). |
| **A4 Page Shell** | [src/components/A4Page.jsx](file:///e:/Antigravity/Projects/render-flow/src/components/A4Page.jsx) | **IMPLEMENTED** | Standard 210mm x 297mm A4 layout with header, subtitle, 2-column grid, and overflow warnings. |
| **Converter & Export UI** | [src/components/NotesConverter.jsx](file:///e:/Antigravity/Projects/render-flow/src/components/NotesConverter.jsx) | **IMPLEMENTED** | Preview viewport, zoom controls, and multi-page PNG export via `html-to-image` (300 DPI). |
| **Print Stylesheet** | [src/styles/print.css](file:///e:/Antigravity/Projects/render-flow/src/styles/print.css) | **IMPLEMENTED** | Standard `@media print` rules enforcing `@page { size: A4; margin: 0; }` and page breaks. |
| **JSON Schema Docs** | [docs/notes-mode-schema.md](file:///e:/Antigravity/Projects/render-flow/docs/notes-mode-schema.md) | **IMPLEMENTED** | Complete specification for Phase 1 and target Phase 2+ schemas. |
| **Authoring Prompt** | [docs/notes-mode-chatgpt-master-prompt.md](file:///e:/Antigravity/Projects/render-flow/docs/notes-mode-chatgpt-master-prompt.md) | **IMPLEMENTED** | System prompt for LLMs to generate compliant Notes Mode JSON. |

---

## 2. Phase Roadmap & Implementation Status

### Phase 1: Static Shell
- **Status:** **IMPLEMENTED**
- **Description:** Basic A4 sheet layout (210mm x 297mm), title/subtitle header, 2-column grid, sample JSON loading, and UI card wrapping.
- **Key Files:** `src/components/A4Page.jsx`, `src/components/NotesModeCard.jsx`, `src/components/InputCard.jsx` (NotesWorkspace).

### Phase 2: KaTeX Math Integration
- **Status:** **IMPLEMENTED**
- **Description:** Dynamic import of KaTeX, inline math `$formula$` parsing, display equations, CPU cache via `equationCache` Map to eliminate duplicate parsing overhead, and DOMPurify sanitization.
- **Key Files:** `src/lib/notesMode/renderEquation.js`, `src/components/NotesModeCard.jsx` (`renderContentArray`).

### Phase 3: SVG Math Diagram Components
- **Status:** **IMPLEMENTED**
- **Description:** Declarative SVG Cartesian coordinate planes, dynamic grid scaling, point markers, line segments, arrows, and geometric polygons.
- **Key Files:** `src/lib/notesMode/diagrams/CoordinateContext.js`, `CoordinatePlane.jsx`, `LineSegment.jsx`, `Point.jsx`, `Shape.jsx`.

### Phase 4: Pagination Engine (Measure-Then-Place)
- **Status:** **PARTIAL**
- **Description:** 
  - Budget calculation: 297mm (A4 height) - 36mm (top/bottom padding) - 12mm (footer) - 24mm (header) = **225mm usable height budget per page**.
  - Offscreen DOM height measurement using `getBoundingClientRect()` against `80mm` container width.
  - **Implemented in code:** `paginateRows` (groups full question cards into row pairs) is active in the UI. `flattenToBlocks` and `flowBlocksIntoColumns` (continuous block-level column flow splitting questions and solutions) are fully implemented and unit-tested in `paginate.js` and `flattenToBlocks.js`, but **not yet wired** to `useNotesToPngConversion.js` or `A4Page.jsx`.

### Phase 5: Export Pipeline
- **Status:** **PARTIAL**
- **Description:** 
  - Multi-page client-side PNG export at 300 DPI (`pixelRatio = 3`) via `html-to-image` is **IMPLEMENTED** in `src/components/NotesConverter.jsx`.
  - Browser-native print-to-PDF (`window.print()`) styled via `src/styles/print.css` is **IMPLEMENTED**.
  - Direct single-click PDF file generation without print dialog is **PLANNED**.

### Phase 6: JSON Schema Hardening & Master Content Prompt
- **Status:** **IMPLEMENTED**
- **Description:** Strict schema validation with exact `{ path, message }` error reporting, detailed schema documentation, and ChatGPT master prompt for content generation.
- **Key Files:** `src/lib/notesMode/validateSchema.js`, `docs/notes-mode-schema.md`, `docs/notes-mode-chatgpt-master-prompt.md`.

---

## 3. Known Open Issues

### 1. `flattenToBlocks` + `flowBlocksIntoColumns` Flow Path Merged But Produced No Visible Change
- **Observed Behavior:** Merging continuous block-level column flow produced no visual change in the UI.
- **Root Cause Confirmed:** In [src/hooks/useNotesToPngConversion.js](file:///e:/Antigravity/Projects/render-flow/src/hooks/useNotesToPngConversion.js#L252), the hook is still invoking `paginateRows(itemsToMeasure)` (which paginates whole `QuestionSolutionCard` items), and [src/components/A4Page.jsx](file:///e:/Antigravity/Projects/render-flow/src/components/A4Page.jsx#L93-L100) renders `items.map(item => <QuestionSolutionCard ... />)`. The new `flattenToBlocks` -> `flowBlocksIntoColumns` -> `NotesBlockRenderer` pipeline is tested in `paginate.test.js` and `trigVerification.test.js` but was never swapped into the UI runtime.
- **Next Step:** Wire `flattenToBlocks` and `flowBlocksIntoColumns` into `useNotesToPngConversion.js` and update `A4Page.jsx` to render column blocks using `NotesBlockRenderer`.

### 2. Paged.js Spike Pending a Clean Re-run
- **Observed Behavior:** Paged.js was evaluated on experimental branch `remotes/origin/eval-pagedjs-spike-8691032562126720955` (`PAGEDJS_EVALUATION.md`, `NotesModeSpike.jsx`).
- **Findings:** Paged.js increased bundle size by ~899 KiB and generated 6 fragmented pages for a sample document that the hand-rolled measure-then-place engine fit onto 3 pages.
- **Status:** The spike branch is preserved; a clean re-run or benchmark comparison is pending before making any final architectural shift away from the custom measure-then-place engine.

---

## 4. Decisions Not to Relitigate

1. **Question and Solution May Split Across Columns and Pages**: Long derivations naturally exceed single-column height budgets. Splitting questions and solutions across column boundaries is an explicit design requirement.
2. **Continuation Labels**: When a problem splits across columns or pages, the subsequent section must be marked with a badge such as `Q2 (continued)` via `ContinuationLabel`.
3. **Export v1 is Browser-Native Print-to-PDF**: Export v1 relies on standard browser print-to-PDF with `@media print` stylesheets and high-resolution PNG download via `html-to-image`. Do not introduce server-side headless browsers or heavy PDF libraries for v1.
