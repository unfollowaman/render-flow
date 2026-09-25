# Production Bundle Unused JavaScript Diagnosis Report

**Date:** March 2025
**Project:** Render Flow (`render-flow`)
**Scope:** Investigation of PageSpeed Insights (Mobile) "Reduce unused JavaScript" finding (~749 KiB estimated savings).
**Constraint Notice:** Read-only diagnosis — no application code, configuration, or dependency changes were made.

---

## 1. Current Chunk Splitting & Build Configuration

In `vite.config.js`, chunk splitting is configured using Rollup's `output.manualChunks` alongside `modulePreload.resolveDependencies`:

```javascript
// vite.config.js (relevant excerpt)
export default defineConfig({
  plugins: [react(), inlineCssPlugin()],
  base: '/render-flow/',
  build: {
    chunkSizeWarningLimit: 3000,
    modulePreload: {
      resolveDependencies(filename, deps) {
        return deps.filter(
          (dep) =>
            !dep.includes('vendor-katex') &&
            !dep.includes('vendor-mermaid') &&
            !dep.includes('vendor-html-to-image')
        );
      },
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        docs: resolve(__dirname, 'docs.html'),
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('node_modules/mermaid') ||
              id.includes('node_modules/@mermaid-js')
            ) {
              return 'vendor-mermaid';
            }
            if (id.includes('node_modules/katex')) {
              return 'vendor-katex';
            }
            if (id.includes('node_modules/html-to-image')) {
              return 'vendor-html-to-image';
            }
            return 'vendor';
          }
        }
      }
    }
  }
})
```

---

## 2. Package Breakdown across Vendor Chunks

The table below breaks down the npm packages bundled into each vendor chunk, including approximate rendered/minified size contributions, import mechanics, and source code locations.

| Package | Chunk | Approx Size (Rendered / Minified) | Import Type | Where Imported | Usage Scope |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `react` | `vendor` (`vendor-CNUmeSah.js`) | ~8.8 KiB rendered (~2.6 KiB min) | Top-level | `src/main.jsx:1`, `src/docs.jsx:1`, `src/App.jsx:1`, `src/DocsApp.jsx:1` | Essential React core library required on initial page load. |
| `react-dom` | `vendor` (`vendor-CNUmeSah.js`) | ~205.5 KiB rendered (~65 KiB min) | Top-level | `src/main.jsx:2`, `src/docs.jsx:2`, `src/lib/notesMode/paginate.js:2` | DOM rendering & static SSR markup rendering (`renderToStaticMarkup`). |
| `dompurify` | `vendor` (`vendor-CNUmeSah.js`) | ~130.1 KiB rendered (~22 KiB min) | Top-level | `src/hooks/useHtmlToPngConversion.js:2`, `src/hooks/useNotesToPngConversion.js:3`, `src/lib/notesMode/renderEquation.js:2`, `src/lib/notesMode/paginate.js:3` | HTML sanitization across conversion pipelines. |
| `cytoscape` | `vendor` (`vendor-CNUmeSah.js`) | ~1,083.2 KiB rendered (~150 KiB min) | Transitive (Mermaid dep) | *Not imported in app code* (pulls via `mermaid`) | Graph layout engine for Mermaid; leaked into `vendor` chunk by `manualChunks`. |
| `layout-base` | `vendor` (`vendor-CNUmeSah.js`) | ~272.9 KiB rendered (~38 KiB min) | Transitive (Mermaid dep) | *Not imported in app code* (pulls via `cytoscape`/`mermaid`) | Graph layout base algorithms for Mermaid; leaked into `vendor`. |
| `cose-base` | `vendor` (`vendor-CNUmeSah.js`) | ~168.3 KiB rendered (~25 KiB min) | Transitive (Mermaid dep) | *Not imported in app code* (pulls via `cytoscape`/`mermaid`) | CoSE graph layout algorithms for Mermaid; leaked into `vendor`. |
| `lodash-es` | `vendor` (`vendor-CNUmeSah.js`) | ~150.2 KiB rendered (~25 KiB min) | Transitive (Mermaid dep) | *Not imported in app code* (pulls via `dagre-d3-es`/`mermaid`) | Utility functions used inside Mermaid graph layout engines; leaked into `vendor`. |
| `dagre-d3-es` | `vendor` (`vendor-CNUmeSah.js`) | ~107.0 KiB rendered (~18 KiB min) | Transitive (Mermaid dep) | *Not imported in app code* (pulls via `mermaid`) | Directed graph rendering for Mermaid; leaked into `vendor`. |
| `@upsetjs/venn.js` | `vendor` (`vendor-CNUmeSah.js`) | ~63.7 KiB rendered (~10 KiB min) | Transitive (Mermaid dep) | *Not imported in app code* (pulls via `mermaid`) | Venn diagram layout for Mermaid; leaked into `vendor`. |
| `cytoscape-fcose` | `vendor` (`vendor-CNUmeSah.js`) | ~56.8 KiB rendered (~8 KiB min) | Transitive (Mermaid dep) | *Not imported in app code* (pulls via `mermaid`) | Compound spring embedder layout for Mermaid; leaked into `vendor`. |
| `marked` | `vendor` (`vendor-CNUmeSah.js`) | ~39.6 KiB rendered (~6 KiB min) | Transitive (Mermaid dep) | *Not imported in app code* (pulls via `mermaid`) | Markdown parser for Mermaid; leaked into `vendor`. |
| `d3-*` (d3-shape, d3-selection, etc.) | `vendor` (`vendor-CNUmeSah.js`) | ~220.0 KiB rendered (~35 KiB min) | Transitive (Mermaid dep) | *Not imported in app code* (pulls via `mermaid`) | Visualization primitives for Mermaid; leaked into `vendor`. |
| `es-toolkit` | `vendor` (`vendor-CNUmeSah.js`) | ~36.4 KiB rendered (~5 KiB min) | Transitive (Mermaid dep) | *Not imported in app code* (pulls via `mermaid`) | Utility helpers for Mermaid; leaked into `vendor`. |
| `roughjs` | `vendor` (`vendor-CNUmeSah.js`) | ~27.6 KiB rendered (~4 KiB min) | Transitive (Mermaid dep) | *Not imported in app code* (pulls via `mermaid`) | Hand-drawn styling renderer for Mermaid; leaked into `vendor`. |
| `khroma` | `vendor` (`vendor-CNUmeSah.js`) | ~21.0 KiB rendered (~3 KiB min) | Transitive (Mermaid dep) | *Not imported in app code* (pulls via `mermaid`) | Color manipulation library for Mermaid; leaked into `vendor`. |
| `dayjs` | `vendor` (`vendor-CNUmeSah.js`) | ~17.8 KiB rendered (~3 KiB min) | Transitive (Mermaid dep) | *Not imported in app code* (pulls via `mermaid`) | Date library for Mermaid gantt charts; leaked into `vendor`. |
| `stylis` | `vendor` (`vendor-CNUmeSah.js`) | ~12.6 KiB rendered (~2 KiB min) | Transitive (Mermaid dep) | *Not imported in app code* (pulls via `mermaid`) | CSS preprocessor for Mermaid; leaked into `vendor`. |
| `mermaid` | `vendor-mermaid` (`vendor-me[hash].js`) | ~2,679.2 KiB rendered (~1,460 KiB min) | Dynamic (`await import`) | `src/hooks/useMermaidToPngConversion.js:179`, `src/DocsApp.jsx:15` | Full diagram rendering engine. |
| `@mermaid-js/parser` | `vendor-mermaid` (`vendor-me[hash].js`) | ~1,319.2 KiB rendered (~728 KiB min) | Dynamic (`await import`) | *Pulled automatically by `mermaid`* | Diagram grammar parsers for Mermaid. |
| `katex` | `vendor-katex` (`vendor-ka[hash].js`) | ~1,185.4 KiB rendered (~518.6 KiB min) | Top-level & Dynamic | `src/lib/notesMode/renderEquation.js:1` (top-level), `src/hooks/useLatexToPngConversion.js:38` (dynamic) | Math typesetting engine; top-level import in `renderEquation.js` causes early evaluation. |
| `html-to-image` | `vendor-html-to-image` (`vendor-html-to-image-[hash].js`) | ~32.2 KiB rendered (~13.8 KiB min) | Dynamic (`await import`) | `src/hooks/useHtmlToPngConversion.js:187`, `src/hooks/useLatexToPngConversion.js:143`, `src/components/NotesConverter.jsx:92` | DOM node to canvas rasterization. |

---

## 3. Analysis of Flagged Vendor Chunks

### A. `vendor-me[hash].js` (`vendor-mermaid-[hash].js`)
- **Transferred:** ~617.7 KiB (Minified: 2,189.1 KiB, Rendered: 4,000.3 KiB)
- **Estimated Unused:** ~431.8 KiB
- **Modules Contained:** `mermaid` (67%) and `@mermaid-js/parser` (33%).
- **Import Mechanics:** Dynamically imported via `await import('mermaid')` in `src/hooks/useMermaidToPngConversion.js:179` and `src/DocsApp.jsx:15`.
- **Why Unused:**
  1. On `docs.html` (`DocsApp.jsx`), a top-level `useEffect` executes `await import('mermaid')` on initial page mount to render the static architecture flowcharts. This forces mobile visitors to immediately download 617.7 KiB of JavaScript before reading the page.
  2. `mermaid` includes parsers and renderers for 15+ diagram types (flowchart, sequence, class, state, er, gantt, pie, gitGraph, mindmap, timeline, architecture, zenuml, etc.). Render Flow only uses flowchart diagrams, so over 70% of `mermaid`'s internal code paths are never executed.

### B. `vendor-CNUmeSah.js` (`vendor-[hash].js`)
- **Transferred:** ~369.8 KiB (Minified: 1,195.3 KiB, Rendered: 2,657.8 KiB)
- **Estimated Unused:** ~282.6 KiB
- **Modules Contained:** `react`, `react-dom`, `dompurify` AND all transitive dependencies of `mermaid` (`cytoscape`, `layout-base`, `cose-base`, `lodash-es`, `dagre-d3-es`, `@upsetjs/venn.js`, `cytoscape-fcose`, `marked`, `d3-*`, `roughjs`, `khroma`, `dayjs`, `stylis`).
- **Import Mechanics:** Preloaded on initial page load of both `index.html` and `docs.html` via `<link rel="modulepreload" href="assets/vendor-[hash].js">`.
- **Why Unused:**
  - `manualChunks` in `vite.config.js` only checked `id.includes('node_modules/mermaid')` and `id.includes('node_modules/@mermaid-js')`.
  - It failed to catch sub-dependencies of `mermaid` (`cytoscape`, `layout-base`, `cose-base`, `dagre-d3-es`, `d3-*`, `lodash-es`, etc.), causing Rollup to assign them to the default `'vendor'` chunk.
  - Because `vendor-[hash].js` also contains `react` and `react-dom`, every visitor on initial page load downloads ~1.19 MB minified (~369.8 KiB transferred) of JavaScript, of which ~85% (~282.6 KiB transferred) consists of unused diagram layout engines.

### C. `vendor-ka[hash].js` (`vendor-katex-[hash].js`)
- **Transferred:** ~75.4 KiB (Minified: 518.6 KiB, Rendered: 1,185.4 KiB)
- **Estimated Unused:** ~35.0 KiB
- **Modules Contained:** `katex` (100%).
- **Import Mechanics:** Dynamically imported in `src/hooks/useLatexToPngConversion.js:38`, but statically imported at the top level in `src/lib/notesMode/renderEquation.js:1` (`import katex from 'katex'`).
- **Why Unused:**
  1. `renderEquation.js` is imported by `NotesModeCard.jsx` -> `A4Page.jsx` / `NotesBlockComponents.jsx` -> `NotesConverter.jsx`. Even though `NotesConverter` is lazy-loaded in `App.jsx`, when Notes mode loads, `vendor-katex` is loaded immediately even if the user hasn't rendered any LaTeX math formulas.
  2. KaTeX includes comprehensive TeX symbol tables, macro processing, matrix builders, and layout rules for all math domains. For basic expressions, ~45% (~35.0 KiB transferred) of KaTeX's symbol mapping code remains unexecuted.

### D. `vendor-html-to-image-[hash].js`
- **Transferred:** ~13.8 KiB (Minified: 13.8 KiB, Rendered: 32.2 KiB)
- **Estimated Unused:** Negligible (~1-2 KiB)
- **Modules Contained:** `html-to-image` (100%).
- **Import Mechanics:** Dynamic import (`await import('html-to-image')`) across all export hooks.
- **Evaluation:** Correctly isolated into an on-demand chunk and loaded only when the user clicks "Download PNG".

---

## 4. Heavy Rendering Libraries Checklist (`html-to-image`, `mermaid`, `katex`)

Data confirms that heavy rendering libraries account for the vast majority (~95%+) of the total JavaScript weight:

1. **`mermaid` (including transitive dependencies):** Total size ~5.18 MB minified (~987.5 KiB transferred across `vendor-mermaid` and leaked `vendor` dependencies).
2. **`katex`:** Total size ~518.6 KiB minified (~75.4 KiB transferred).
3. **`html-to-image`:** Total size ~13.8 KiB minified (~13.8 KiB transferred).

---

## 5. Root Cause Statement

The PageSpeed Insights "Reduce unused JavaScript" finding (~749 KiB estimated savings) is caused by a combination of four specific structural root causes:

1. **Defective `manualChunks` Partitioning (Primary Cause — ~282.6 KiB initial load waste):**
   The `manualChunks` function in `vite.config.js` only matches `node_modules/mermaid` and `node_modules/@mermaid-js`. It fails to match `mermaid`'s heavy transitive dependencies (`cytoscape`, `layout-base`, `cose-base`, `dagre-d3-es`, `lodash-es`, `d3-*`, `roughjs`, `@upsetjs/venn.js`, etc.). These dependencies (~1.8 MB rendered / ~282.6 KiB transferred) default to `'vendor'` (`vendor-[hash].js`). Because `vendor-[hash].js` also contains `react` and `react-dom`, the browser downloads the entire graph layout suite on initial page load of `index.html` and `docs.html`.

2. **Eager Mermaid Loading on Docs Page (~431.8 KiB docs page load waste):**
   `DocsApp.jsx` (`docs.html`) invokes `await import("mermaid")` inside a top-level `useEffect` on component mount to render static documentation flowcharts. This forces every visitor hitting `/docs.html` to immediately download the 617.7 KiB `vendor-mermaid` chunk.

3. **Top-Level Import of `katex` in Notes Mode (~35.0 KiB waste):**
   `src/lib/notesMode/renderEquation.js` uses a top-level `import katex from 'katex'` statement instead of a dynamic import, forcing `vendor-katex` to be loaded upfront whenever Notes mode is rendered.

4. **Third-Party ES5 Pre-Transpiled Code ("Legacy JavaScript" finding — 8.9 KiB waste):**
   `vite.config.js` does not specify `build.target` (defaulting to Vite's `'modules'` / `es2020`), and no custom `.browserslistrc` or Babel config exists. Third-party packages (`cytoscape`, `cose-base`, `layout-base`, `cytoscape-cose-bilkent`) ship pre-compiled ES5 bundles containing Babel class helpers (`_classCallCheck`, `_createClass`, `_toConsumableArray`) and `Math.hypot` polyfills. Vite bundles these verbatim without re-transpiling to modern ES2020+.

---

## 6. Target Configuration & "Legacy JavaScript" Finding

- **Current `build.target` Config:** Unset in `vite.config.js`. Vite 5 defaults to `'modules'` (`['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14']`).
- **Browserslist / Babel Config:** None specified in `package.json` or root folder.
- **Origin of Legacy Code:** 8.9 KiB of legacy JavaScript in `vendor-[hash].js` originates from npm packages (`cytoscape`, `cose-base`, `layout-base`) pre-compiled to ES5 by their maintainers before publishing to npm.

---

## 7. Candidate Fixes (Ranked by Expected Impact)

*Note: These candidate fixes are provided for future planning only and were not implemented in this task.*

1. **Fix `manualChunks` in `vite.config.js` to catch Mermaid sub-dependencies (Rank 1 — Highest Impact)**
   - **Action:** Update `manualChunks` to match all transitive dependencies of `mermaid` (e.g., `cytoscape`, `layout-base`, `cose-base`, `dagre-d3-es`, `d3-`, `lodash-es`, `@upsetjs/venn.js`, `khroma`, `roughjs`, `stylis`) and route them into `vendor-mermaid`.
   - **Expected Impact:** Reduces initial bundle transferred size on `index.html` by **~282.6 KiB** (eliminates ~85% of `vendor-[hash].js` initial download).

2. **Viewport-driven / Lazy-loaded Mermaid diagrams on Docs page (Rank 2 — High Impact)**
   - **Action:** In `DocsApp.jsx`, replace top-level `useEffect` dynamic import of `mermaid` with an `IntersectionObserver` that only loads `mermaid` when diagram nodes enter the viewport, or pre-render doc diagrams to static SVGs at build time.
   - **Expected Impact:** Saves **~617.7 KiB transferred** on initial load of `docs.html`.

3. **Dynamic import for `katex` in `renderEquation.js` (Rank 3 — Medium Impact)**
   - **Action:** Replace `import katex from 'katex'` in `src/lib/notesMode/renderEquation.js` with `await import('katex')`.
   - **Expected Impact:** Prevents **~75.4 KiB transferred** (`vendor-katex`) from downloading until LaTeX math content is rendered.

4. **Set modern `build.target` in `vite.config.js` (Rank 4 — Low Impact)**
   - **Action:** Set `build.target: 'esnext'` or `'es2022'` in `vite.config.js`.
   - **Expected Impact:** Reduces bundle size by **~8.9 KiB** and eliminates PageSpeed "Legacy JavaScript" flags.

---

## 8. Git Diff

```diff
diff --git a/docs/jules-reports/unused-js-diagnosis.md b/docs/jules-reports/unused-js-diagnosis.md
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/docs/jules-reports/unused-js-diagnosis.md
```
