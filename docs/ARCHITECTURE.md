# Render Flow Architecture

This document describes the verified architecture of Render Flow based directly on source code inspection. Every section cites the specific source files and line numbers responsible for the implementation.

---

## 1. High-Level Architectural Principles

- **Zero-Backend Constraint**: 100% of processing, rendering, and PNG generation occurs client-side in the browser. No code or images are transmitted to external servers.
- **Dynamic Vendor Chunking**: Heavy conversion dependencies (`html-to-image`, `katex`, `mermaid`) are dynamically imported on demand and isolated into separate Rollup chunks in [vite.config.js](file:///e:/Antigravity/Projects/render-flow/vite.config.js#L58-L95) to prevent bundle bloat on initial page load.
- **Isolated Iframe Sandboxing**: Untrusted markup and equation rendering are isolated from the host page using hidden iframes created by [src/utils/createIsolatedIframe.js](file:///e:/Antigravity/Projects/render-flow/src/utils/createIsolatedIframe.js#L1-L15).
- **Canvas Size Guardrail**: All pipelines enforce a strict `200,000,000` total pixel area ceiling post-DPI scaling before allocating canvas or image memory.
- **Concurrency & Freshness**: Asynchronous operations in conversion hooks use `latestRequestIdRef` and `runIfLatest()` in [src/utils/requestHelpers.js](file:///e:/Antigravity/Projects/render-flow/src/utils/requestHelpers.js#L1-L16) to eliminate race conditions from rapid successive user actions.

---

## 2. Pipeline Architecture

```
User Input ──────► InputCard.jsx (CodeMirror 6)
                         │
        ┌────────────────┼────────────────┬────────────────┐
        ▼                ▼                ▼                ▼
   [HTML Mode]     [Mermaid Mode]   [LaTeX Mode]     [Notes Mode]
 useHtmlToPng...  useMermaidTo...   useLatexTo...   useNotesToPng...
        │                │                │                │
 Isolated Iframe   Mermaid SVG     KaTeX HTML in    JSON Validation &
   + DOMPurify    + Base64 Fonts  Isolated Iframe  DOM Height Measure
        │                │                │                │
  html-to-image    Canvas & Blob   html-to-image      Paginated A4
    toPng()          toBlob()         toBlob()     (html-to-image 300DPI)
        └────────────────┼────────────────┴────────────────┘
                         ▼
             OutputCard.jsx / NotesConverter.jsx
               (Preview & PNG Download)
```

---

## 3. HTML to PNG Pipeline

**Primary Hook:** [src/hooks/useHtmlToPngConversion.js](file:///e:/Antigravity/Projects/render-flow/src/hooks/useHtmlToPngConversion.js)  
**Supporting Modules:** [src/hooks/inlineResources.js](file:///e:/Antigravity/Projects/render-flow/src/hooks/inlineResources.js), [src/utils/createIsolatedIframe.js](file:///e:/Antigravity/Projects/render-flow/src/utils/createIsolatedIframe.js)

### Execution Flow:
1. **Validation & Warning**:
   - Validates that HTML input is non-empty ([L104-L109](file:///e:/Antigravity/Projects/render-flow/src/hooks/useHtmlToPngConversion.js#L104-L109)).
   - Displays a responsiveness warning if input size exceeds 500,000 characters unless forced ([L114-L121](file:///e:/Antigravity/Projects/render-flow/src/hooks/useHtmlToPngConversion.js#L114-L121)).
2. **Iframe Isolation**:
   - Creates a hidden, zero-size iframe (`createIsolatedIframe`) and appends it to `document.body` ([L125-L127](file:///e:/Antigravity/Projects/render-flow/src/hooks/useHtmlToPngConversion.js#L125-L127)).
3. **Asset Inlining**:
   - Inlines external resources (CSS stylesheets and images) as base64 data URIs via `inlineResources()` ([L130-L134](file:///e:/Antigravity/Projects/render-flow/src/hooks/useHtmlToPngConversion.js#L130-L134)).
4. **Sanitization**:
   - Sanitizes the processed HTML using `DOMPurify.sanitize(..., { WHOLE_DOCUMENT: true, ADD_TAGS: ['style', 'link'], ADD_ATTR: ['style', 'rel', 'href'] })` to prevent XSS ([L137-L141](file:///e:/Antigravity/Projects/render-flow/src/hooks/useHtmlToPngConversion.js#L137-L141)).
5. **DOM Injection & Readiness Synchronization**:
   - Injects markup via `iframeDoc.open()`, `iframeDoc.write(sanitizedHtml)`, `iframeDoc.close()` ([L144-L147](file:///e:/Antigravity/Projects/render-flow/src/hooks/useHtmlToPngConversion.js#L144-L147)).
   - Waits for document `load` / `readyState === 'complete'` ([L150-L162](file:///e:/Antigravity/Projects/render-flow/src/hooks/useHtmlToPngConversion.js#L150-L162)).
   - Executes `waitForFontsAndImages()` ([L27-L83](file:///e:/Antigravity/Projects/render-flow/src/hooks/useHtmlToPngConversion.js#L27-L83)), which waits for `doc.fonts.ready`, pending `<img>` load events, and quiescence in post-paint DOM mutations via a `MutationObserver` (400ms debounce).
6. **Dimension Calculation & Guardrail**:
   - Parses explicit body/style dimensions via regex (`extractDimensions`, [L12-L25](file:///e:/Antigravity/Projects/render-flow/src/hooks/useHtmlToPngConversion.js#L12-L25)) or falls back to `scrollWidth` / `scrollHeight` ([L167-L173](file:///e:/Antigravity/Projects/render-flow/src/hooks/useHtmlToPngConversion.js#L167-L173)).
   - Asserts `finalWidth * finalHeight <= 200,000,000` pixels ([L175-L179](file:///e:/Antigravity/Projects/render-flow/src/hooks/useHtmlToPngConversion.js#L175-L179)).
7. **PNG Generation**:
   - Dynamically imports `html-to-image` and executes `toPng(iframe.contentDocument.body, { width, height, backgroundColor: null })` ([L185-L194](file:///e:/Antigravity/Projects/render-flow/src/hooks/useHtmlToPngConversion.js#L185-L194)).
   - Cleans up by removing the iframe from `document.body` in the `finally` block ([L213](file:///e:/Antigravity/Projects/render-flow/src/hooks/useHtmlToPngConversion.js#L213)).

---

## 4. Mermaid to PNG Pipeline

**Primary Hook:** [src/hooks/useMermaidToPngConversion.js](file:///e:/Antigravity/Projects/render-flow/src/hooks/useMermaidToPngConversion.js)  
**Supporting Modules:** [src/utils/canvasToBlob.js](file:///e:/Antigravity/Projects/render-flow/src/utils/canvasToBlob.js)

### Execution Flow:
1. **Typography Loading & Inlining**:
   - Preloads custom fonts (`Arya` 400/700, `Playfair Display` 400/700) using `document.fonts.load()` with a 5000ms timeout ([L135-L171](file:///e:/Antigravity/Projects/render-flow/src/hooks/useMermaidToPngConversion.js#L135-L171)).
   - Fetches font WOFF2 binaries, converts them to base64 via `arrayBufferToBase64()` ([L8-L20](file:///e:/Antigravity/Projects/render-flow/src/hooks/useMermaidToPngConversion.js#L8-L20)), and builds embedded `@font-face` CSS strings ([L22-L104](file:///e:/Antigravity/Projects/render-flow/src/hooks/useMermaidToPngConversion.js#L22-L104)).
2. **Mermaid Rendering**:
   - Dynamically imports `mermaid` ([L180](file:///e:/Antigravity/Projects/render-flow/src/hooks/useMermaidToPngConversion.js#L180)).
   - Initializes with `htmlLabels: false` and `securityLevel: 'strict'` ([L183](file:///e:/Antigravity/Projects/render-flow/src/hooks/useMermaidToPngConversion.js#L183)). This forces Mermaid to emit pure SVG `<text>` elements rather than HTML `<foreignObject>` containers, preventing canvas tainting in Chromium.
   - Invokes `mermaid.render(uniqueId, mermaidCodeString)` to generate the raw SVG string ([L189](file:///e:/Antigravity/Projects/render-flow/src/hooks/useMermaidToPngConversion.js#L189)).
3. **SVG DOM Augmentation**:
   - Parses the SVG string using `DOMParser` ([L198-L200](file:///e:/Antigravity/Projects/render-flow/src/hooks/useMermaidToPngConversion.js#L198-L200)).
   - Injects the font `@font-face` `<style>` element as the first child of the `<svg>` ([L202-L205](file:///e:/Antigravity/Projects/render-flow/src/hooks/useMermaidToPngConversion.js#L202-L205)).
   - Resolves intrinsic dimensions from `viewBox` or `width`/`height` attributes ([L224-L248](file:///e:/Antigravity/Projects/render-flow/src/hooks/useMermaidToPngConversion.js#L224-L248)).
4. **Data URI Encoding**:
   - Serializes the augmented SVG DOM via `XMLSerializer` ([L251-L252](file:///e:/Antigravity/Projects/render-flow/src/hooks/useMermaidToPngConversion.js#L251-L252)).
   - Encodes into a base64 Data URI: `data:image/svg+xml;base64,` + `btoa(unescape(encodeURIComponent(updatedSvgString)))` ([L256-L257](file:///e:/Antigravity/Projects/render-flow/src/hooks/useMermaidToPngConversion.js#L256-L257)).
5. **Canvas Rasterization & Export**:
   - Loads the Data URI into an HTML `Image` object ([L260-L268](file:///e:/Antigravity/Projects/render-flow/src/hooks/useMermaidToPngConversion.js#L260-L268)).
   - Calls `renderImageToPngBlobUrl()` ([src/utils/canvasToBlob.js](file:///e:/Antigravity/Projects/render-flow/src/utils/canvasToBlob.js#L1-L35)), applying `DPI_SCALE = 2` (double resolution for crisp lines).
   - Validates the 200M pixel limit ([L6-L8](file:///e:/Antigravity/Projects/render-flow/src/utils/canvasToBlob.js#L6-L8)).
   - Draws image onto offscreen `<canvas>` and converts to PNG blob using `canvas.toBlob(...)` and `URL.createObjectURL(pngBlob)` ([L10-L34](file:///e:/Antigravity/Projects/render-flow/src/utils/canvasToBlob.js#L10-L34)).

---

## 5. LaTeX to PNG Pipeline

**Primary Hook:** [src/hooks/useLatexToPngConversion.js](file:///e:/Antigravity/Projects/render-flow/src/hooks/useLatexToPngConversion.js)  
**Supporting Modules:** [src/utils/createIsolatedIframe.js](file:///e:/Antigravity/Projects/render-flow/src/utils/createIsolatedIframe.js)

### Execution Flow:
1. **Dynamic KaTeX Import**:
   - Dynamically imports `katex` and `katex/dist/katex.min.css` ([L38-L42](file:///e:/Antigravity/Projects/render-flow/src/hooks/useLatexToPngConversion.js#L38-L42)).
2. **Formula Parsing**:
   - Parses formula via `katex.renderToString(latexString, { displayMode: true, throwOnError: true, trust: false })` ([L48-L60](file:///e:/Antigravity/Projects/render-flow/src/hooks/useLatexToPngConversion.js#L48-L60)). Syntax errors are intercepted and surfaced as user-friendly parse errors.
3. **Isolated Iframe Sandbox**:
   - Creates a hidden sandbox iframe via `createIsolatedIframe()` ([L66-L68](file:///e:/Antigravity/Projects/render-flow/src/hooks/useLatexToPngConversion.js#L66-L68)).
   - Injects an HTML shell with `<div id="latex-container">${htmlContent}</div>` ([L70-L84](file:///e:/Antigravity/Projects/render-flow/src/hooks/useLatexToPngConversion.js#L70-L84)).
   - Clones local stylesheets into the iframe while excluding Google Fonts (`fonts.googleapis.com`) to prevent cross-origin stylesheet SecurityErrors during `html-to-image` font traversal ([L89-L102](file:///e:/Antigravity/Projects/render-flow/src/hooks/useLatexToPngConversion.js#L89-L102)).
4. **Layout Measurement & DPI Scaling**:
   - Waits for stylesheet links and `iframeDoc.fonts.ready` ([L104-L116](file:///e:/Antigravity/Projects/render-flow/src/hooks/useLatexToPngConversion.js#L104-L116)).
   - Measures intrinsic formula bounding box using `container.getBoundingClientRect()` ([L118-L125](file:///e:/Antigravity/Projects/render-flow/src/hooks/useLatexToPngConversion.js#L118-L125)).
   - Scales dimensions by `DPI_SCALE = 2` and verifies `finalWidth * finalHeight <= 200,000,000` ([L132-L139](file:///e:/Antigravity/Projects/render-flow/src/hooks/useLatexToPngConversion.js#L132-L139)).
5. **PNG Generation**:
   - Calls `html-to-image`'s `toBlob(container, { width, height, pixelRatio: 2, backgroundColor: '#ffffff' })` ([L144-L154](file:///e:/Antigravity/Projects/render-flow/src/hooks/useLatexToPngConversion.js#L144-L154)).
   - Removes the iframe in the `finally` block and generates an Object URL ([L156-L163](file:///e:/Antigravity/Projects/render-flow/src/hooks/useLatexToPngConversion.js#L156-L163)).

---

## 6. Notes Mode Pipeline

**Primary Hook:** [src/hooks/useNotesToPngConversion.js](file:///e:/Antigravity/Projects/render-flow/src/hooks/useNotesToPngConversion.js)  
**Core Modules:** [src/lib/notesMode/validateSchema.js](file:///e:/Antigravity/Projects/render-flow/src/lib/notesMode/validateSchema.js), [src/lib/notesMode/paginate.js](file:///e:/Antigravity/Projects/render-flow/src/lib/notesMode/paginate.js), [src/lib/notesMode/renderEquation.js](file:///e:/Antigravity/Projects/render-flow/src/lib/notesMode/renderEquation.js), [src/components/NotesConverter.jsx](file:///e:/Antigravity/Projects/render-flow/src/components/NotesConverter.jsx), [src/components/A4Page.jsx](file:///e:/Antigravity/Projects/render-flow/src/components/A4Page.jsx)

### Execution Flow:
1. **Schema Validation**:
   - Validates JSON structure using `validateNotesJson` in `validateSchema.js` ([L153-L180](file:///e:/Antigravity/Projects/render-flow/src/hooks/useNotesToPngConversion.js#L153-L180)). Returns structured arrays of `{ path, message }` errors if the document fails Phase 1 compliance.
2. **Item Flattening & KaTeX Preloading**:
   - Flattens pages/items into a continuous array using `flattenPagesItems` ([L57-L77](file:///e:/Antigravity/Projects/render-flow/src/hooks/useNotesToPngConversion.js#L57-L77)).
   - Dynamically loads KaTeX on demand via `loadKatex()` in `renderEquation.js` ([L237](file:///e:/Antigravity/Projects/render-flow/src/hooks/useNotesToPngConversion.js#L237)).
3. **DOM Height Measurement & Budgeting**:
   - Instantiates offscreen DOM measurement elements (`prepareItemsToMeasure`, [L79-L113](file:///e:/Antigravity/Projects/render-flow/src/hooks/useNotesToPngConversion.js#L79-L113)). Supports JSDOM fallback styling when running Vitest test suites ([L100-L103](file:///e:/Antigravity/Projects/render-flow/src/hooks/useNotesToPngConversion.js#L100-L103)).
   - Computes physical page budget: A4 total height 297mm minus padding (36mm), footer (12mm), and header estimate (24mm) yields a **225mm usable height budget per page** ([L230-L240](file:///e:/Antigravity/Projects/render-flow/src/hooks/useNotesToPngConversion.js#L230-L240)).
4. **Pagination**:
   - Invokes `paginateRows` ([src/lib/notesMode/paginate.js](file:///e:/Antigravity/Projects/render-flow/src/lib/notesMode/paginate.js#L554-L589)) with a 2-column layout and 3.7mm row gap ([L252-L258](file:///e:/Antigravity/Projects/render-flow/src/hooks/useNotesToPngConversion.js#L252-L258)).
   - Reassembles paginated items into pages via `assemblePages()` ([L115-L136](file:///e:/Antigravity/Projects/render-flow/src/hooks/useNotesToPngConversion.js#L115-L136)).
5. **Rendering & Multi-Page PNG Export**:
   - Renders each page inside [src/components/A4Page.jsx](file:///e:/Antigravity/Projects/render-flow/src/components/A4Page.jsx#L13-L110) (210mm x 297mm container).
   - In [src/components/NotesConverter.jsx](file:///e:/Antigravity/Projects/render-flow/src/components/NotesConverter.jsx#L49-L97), `handleDownloadPng` loops through all rendered pages and exports each at `pixelRatio = 3` (300 DPI print quality) via `html-to-image`, verifying the 200M pixel limit per page.
