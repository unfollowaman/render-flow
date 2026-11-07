# Architectural Decision Records (ADR)

This running log records key architectural decisions, rationale, trade-offs, and historical context for Render Flow.

---

## Decision Log

### 2026-07-10: Replace `dom-to-image-more` with `html-to-image`
- **Decision:** Replace `dom-to-image-more` with `html-to-image` as the core DOM-to-PNG export engine.
- **Reason:** `dom-to-image-more` exhibited severe visual text-wrapping bugs and incorrect element dimension calculations on modern flex/grid layouts. `html-to-image` resolves these wrapping anomalies, provides cleaner options (e.g. `backgroundColor`, `pixelRatio`), and supports dynamic on-demand imports.
- **Reference:** Commit `356d3d8` ("chore: replace dom-to-image-more with html-to-image").

---

### 2026-07-26: Adopt Base64 Data URIs instead of Blob URLs for Mermaid SVGs
- **Decision:** Convert Mermaid SVG markup into UTF-8 safe base64 Data URIs (`data:image/svg+xml;base64,...`) instead of creating `Blob` Object URLs (`URL.createObjectURL(blob)`).
- **Reason:** Chromium-based browsers treat SVG images loaded via Blob URLs that contain `<foreignObject>` tags as cross-origin, immediately tainting the HTML `<canvas>` and causing `canvas.toBlob()` / `canvas.toDataURL()` to throw "Tainted canvases may not be exported". Base64 Data URIs (`btoa(unescape(encodeURIComponent(svg)))`) avoid this canvas tainting while safely preserving non-Latin (e.g. Devanagari/Hindi) character sets.
- **Reference:** Commit `9ef05c7` / PR `#109` ("Fix 'Tainted Canvas' error on Mermaid PNG export by using base64 data URI").

---

### 2026-07-26: Initial Mermaid Configuration (`htmlLabels: true`, `securityLevel: 'loose'`)
- **Decision:** Initially configured Mermaid with `htmlLabels: true` and `securityLevel: 'loose'`.
- **Reason:** Allowed user diagrams to include inline HTML formatting (e.g., `<b>bold</b>`, `<br/>`, `<i>italic</i>`). The client-side XSS trade-off was accepted because Render Flow is purely client-side with no persistent storage, accounts, or user data leakage vectors.
- **Reference:** Commit `25fb925` ("fix: enable HTML labels in Mermaid conversion").

---

### 2026-08-18: Replace MathJax with KaTeX
- **Decision:** Replace MathJax (`tex-svg.js`) with KaTeX in the LaTeX conversion pipeline and Notes Mode.
- **Reason:** MathJax's `tex-svg` bundle was ~2.0 MB minified (~660 KB gzipped), creating massive asset chunks that triggered Vite build warnings, degraded Core Web Vitals (Total Blocking Time, LCP), and caused noticeable rendering delays. KaTeX is ~74 KB gzipped, renders formulas over 10x faster, and drastically reduces memory overhead.
- **Reference:** Commit `d2eef7c` ("Swap MathJax for KaTeX in LaTeX conversion pipeline").

---

### 2026-08-20: Isolated Iframe Sandboxing for LaTeX and HTML Rendering
- **Decision:** Render KaTeX formulas and user HTML inside offscreen hidden iframes created via `createIsolatedIframe()` rather than mounting directly to host DOM nodes.
- **Reason:** Direct host DOM mounting caused `html-to-image` to traverse host document stylesheets. When external fonts (such as `fonts.googleapis.com`) were present, the browser threw cross-origin `SecurityError`s when reading `styleSheet.cssRules`. Sandboxing in an isolated iframe with cloned local styles eliminates cross-origin stylesheet collisions.
- **Reference:** Commit `7618dae` / PR `#131` ("Fix html-to-image SecurityError during KaTeX rendering").

---

### 2026-09-02: Retain Custom Measure-Then-Place Engine Over Paged.js
- **Decision:** Reject Paged.js and maintain Render Flow's hand-rolled measure-then-place DOM pagination algorithm for Notes Mode.
- **Reason:** An architectural spike on Paged.js (`eval-pagedjs-spike-8691032562126720955`, commit `face5db`) demonstrated that Paged.js added ~899 KB of bundle weight and generated 6 fragmented pages for a sample document that Render Flow's custom 225mm budget engine cleanly fit onto 3 pages. Custom DOM measurement provides full control over continuation labels, column flow, and zero runtime bundle bloat.
- **Reference:** `PAGEDJS_EVALUATION.md` on branch `remotes/origin/eval-pagedjs-spike-8691032562126720955`.

---

### 2026-09-20: Enforce 200,000,000 Pixel Canvas Guardrail Across All Pipelines
- **Decision:** Assert `finalWidth * finalHeight <= 200,000,000` total pixels (post-DPI scaling) before allocating `<canvas>` elements or executing `html-to-image`.
- **Reason:** Browsers impose hard limits on canvas dimensions (typically 16,384px or ~268M pixels). Excessive dimensions cause immediate GPU memory allocation failures, tab crashes, or silent blank exports. Enforcing this guardrail pre-creation surfaces clear, actionable feedback to users.
- **Reference:** `src/hooks/useHtmlToPngConversion.js` (line 176), `src/utils/canvasToBlob.js` (line 6), `src/hooks/useLatexToPngConversion.js` (line 136).

---

### 2026-10-15: Standardize Mermaid on `htmlLabels: false` and `securityLevel: 'strict'`
- **Decision:** Switch Mermaid default initialization to `htmlLabels: false`, `flowchart: { htmlLabels: false }`, and `securityLevel: 'strict'`.
- **Reason:** When DOMPurify sanitization was introduced on SVG output in `DocsApp.jsx`, HTML labels inside `<foreignObject>` tags were stripped or produced invisible text, and certain Chromium versions continued to taint canvases on foreign objects. Emitting native SVG `<text>` elements guarantees clean DOMPurify sanitization and 100% reliable canvas export without canvas tainting.
- **Reference:** Commit `120f093` ("Fix invisible flowchart text on docs page by setting htmlLabels: false").
