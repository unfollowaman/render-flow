# Performance Audit Investigation Findings

This document details the diagnostic findings for the PageSpeed Insights performance audit on the mobile version of the site (Performance score: 56/100, FCP/LCP ~7.5s–7.8s).

---

## Issue 1 — Unused JavaScript on Initial Load

PageSpeed reports approximately **739 KiB** of unused JavaScript on initial load, concentrated in two vendor chunks (~432 KiB and ~307 KiB).

### Exact Files and Lines Involved
1. **`vite.config.js` (Lines 11–13)**
   ```javascript
   if (id.includes('mathjax')) {
     return 'vendor-mathjax';
   }
   ```
2. **`src/hooks/useLatexToPngConversion.js` (Line 4 and Line 39)**
   - Line 4: `import 'katex/dist/katex.min.css';` (Static top-level import)
   - Line 39: `const katexModule = await import('katex');` (Dynamic JS import)
3. **`src/hooks/useMermaidToPngConversion.js` (Line 176)**
   - Line 176: `const mermaidModule = await import('mermaid');` (Dynamic JS import)
4. **`src/App.jsx` (Lines 5–6 and Lines 20–54)**
   - Lines 5–6:
     ```javascript
     import { useMermaidToPngConversion } from "./hooks/useMermaidToPngConversion";
     import { useLatexToPngConversion } from "./hooks/useLatexToPngConversion";
     ```
   - Lines 20–54: Invokes `useHtmlToPngConversion`, `useMermaidToPngConversion`, and `useLatexToPngConversion` unconditionally on root component mount.

---

### Import and Loading Pattern Analysis

#### KaTeX / LaTeX Dependencies
* **Eager vs. Lazy Import Pattern:**
  * In `src/hooks/useLatexToPngConversion.js`, `katex` JavaScript is dynamically imported inside `handleConvert` (`await import('katex')`).
  * However, `katex/dist/katex.min.css` is statically imported at the top level of `useLatexToPngConversion.js` on Line 4.
  * Because `src/App.jsx` statically imports `useLatexToPngConversion` at the top level (Line 6), the KaTeX stylesheet and its bundled font definitions are eagerly loaded on initial page startup regardless of active user mode.
* **Chunk Boundary Alignment:**
  * In `vite.config.js` (lines 11–13), the manual chunking configuration still checks `if (id.includes('mathjax')) return 'vendor-mathjax';`.
  * The project migrated from MathJax to KaTeX; however, `vite.config.js` was not updated. KaTeX modules fail to match `'mathjax'` and fall through to `return 'vendor'`.
  * Consequently, KaTeX dependencies are merged directly into the primary initial `vendor` bundle rather than being isolated into a dedicated lazy chunk.

#### Mermaid Dependencies
* **Eager vs. Lazy Import Pattern:**
  * In `src/hooks/useMermaidToPngConversion.js` (Line 176), `mermaid` is dynamically imported (`await import('mermaid')`).
  * In `vite.config.js` (Line 14), `if (id.includes('mermaid')) return 'vendor-mermaid';` correctly isolates Mermaid into the `vendor-mermaid` chunk.
* **Initial Page Load Pull:**
  * Because `App.jsx` statically imports and executes `useMermaidToPngConversion` at top-level on initial render, Vite's build-time module resolution and default `modulepreload` behavior includes dynamic import chunk references in the main graph.
  * This causes the browser to preload `vendor-mermaid` (~432 KiB) during the critical path of the initial page load before the user interacts with or selects Mermaid mode.

---

### Assessment
**Genuine bug and configuration oversight.**

1. **Stale Bundler Configuration:** `vite.config.js` contains obsolete chunk rules for `'mathjax'` instead of `'katex'`.
2. **Top-Level CSS Import:** `katex/dist/katex.min.css` is imported at top level in `useLatexToPngConversion.js`, triggering eager evaluation.
3. **Eager Hook Instantiation:** Root component `App.jsx` statically imports all mode conversion hooks, causing Vite to discover and modulepreload non-critical heavy dynamic chunks (`vendor-mermaid`) on initial load.

---

### Recommendations for Remediation
1. **Update `vite.config.js` Manual Chunking:**
   Replace `id.includes('mathjax')` with `id.includes('katex')` to properly route KaTeX modules into an isolated `'vendor-katex'` chunk.
2. **Defer KaTeX CSS Loading:**
   Move `import 'katex/dist/katex.min.css'` inside the dynamic LaTeX conversion flow or conditionally load it when LaTeX mode is active so KaTeX CSS is not bundled into initial page CSS.
3. **Lazy Load Mode Conversion Hooks or Workspaces:**
   Refactor `App.jsx` or `InputCard.jsx` to dynamically load conversion hooks or workspace components (e.g. using `React.lazy` or dynamic `import()`) only when the corresponding mode tab ("Mermaid" or "LaTeX") is activated or converted.
4. **Configure Vite Module Preload:**
   Disable aggressive module preloading in `vite.config.js` (`build.modulePreload: false` or fine-tuned `resolveDependencies`) so dynamic vendor chunks are fetched strictly on demand.

---

## Issue 2 — Render-blocking Font Loading

PageSpeed flags critical-path requests to `fonts.gstatic.com` for `.woff2` files taking ~1,045ms–1,046ms each and identifies `fonts.googleapis.com` CSS as render-blocking (~1,050ms estimated savings).

### Exact Files and Lines Involved
1. **`index.html` (Lines 10–12)**
   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
   <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
   ```
2. **`src/styles/globals.css` (Line 1 and Lines 118, 125)**
   - Line 1:
     ```css
     @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&family=Instrument+Serif:ital@0;1&display=swap');
     ```
   - Line 118: `font-family: 'Instrument Serif', Georgia, serif;` (Applied to `body`)
   - Line 125: `font-family: 'Montserrat', sans-serif;` (Applied to headings, labels, buttons, mono elements)

---

### Font Loading Pattern Analysis

* **Page-Level Google Fonts Dependencies:**
  * `index.html` (Lines 10–12) loads `Instrument Serif` and `Montserrat` directly from `fonts.googleapis.com` via a render-blocking `<link rel="stylesheet">`.
  * `src/styles/globals.css` (Line 1) duplicates this network call via `@import url('https://fonts.googleapis.com/css2?...')`.
* **Distinct Contexts (UI vs Diagram Rendering):**
  * The self-hosted fonts (`Arya` and `Playfair Display` located in `public/fonts/`) were adopted specifically for diagram SVG export rendering and inlining.
  * In contrast, page-level UI typography (`Instrument Serif` for body and `Montserrat` for headings/buttons) was left dependent on external Google Fonts origins (`fonts.googleapis.com` and `fonts.gstatic.com`).
* **Preconnect Effectiveness:**
  * Preconnect hints (`<link rel="preconnect">`) are present in `index.html` (lines 10–11).
  * However, external DNS resolution, TLS handshakes, CSS fetching, and `.woff2` font downloads across third-party domains still impose an ~1.05s network bottleneck on mobile connections before First Contentful Paint (FCP) can complete.

---

### Assessment
**Classification: (c) Page-level external font dependency for primary UI theme typography (`Instrument Serif` & `Montserrat`).**

This is a genuine performance bottleneck and regression risk caused by:
1. **Duplicate Loading:** Loading Google Fonts CSS simultaneously in `index.html` and via CSS `@import` in `globals.css`.
2. **External Blocking Requests:** Relying on third-party Google Fonts domains for critical-path UI rendering fonts instead of hosting them locally on the same origin.

---

### Recommendations for Remediation
1. **Self-Host UI Typography Fonts:**
   Download `.woff2` font files for `Montserrat` and `Instrument Serif` into `public/fonts/` (or `src/assets/fonts/`) and define local `@font-face` rules in `globals.css` using `font-display: swap`.
2. **Remove CSS `@import` Rule:**
   Delete Line 1 (`@import url('https://fonts.googleapis.com/...')`) from `src/styles/globals.css`.
3. **Remove Google Fonts Tags from `index.html`:**
   Delete Lines 10–12 (`<link rel="preconnect">` and Google Fonts `<link rel="stylesheet">`) from `index.html`.

---

## Confirmation & Inspected Files

### Source Code Modification Confirmation
**No source code files were modified during this diagnostic investigation.** Only this report (`AUDIT_PERFORMANCE_INVESTIGATION.md`) was created at the root of the repository.

### List of All Inspected Files
1. `index.html`
2. `vite.config.js`
3. `package.json`
4. `src/App.jsx`
5. `src/main.jsx`
6. `src/components/InputCard.jsx`
7. `src/components/OutputCard.jsx`
8. `src/components/ErrorCard.jsx`
9. `src/components/Header.jsx`
10. `src/components/Hero.jsx`
11. `src/components/Footer.jsx`
12. `src/components/index.js`
13. `src/hooks/useHtmlToPngConversion.js`
14. `src/hooks/useMermaidToPngConversion.js`
15. `src/hooks/useLatexToPngConversion.js`
16. `src/hooks/inlineResources.js`
17. `src/utils/canvasToBlob.js`
18. `src/styles/globals.css`
19. `src/styles/Home.module.css`
