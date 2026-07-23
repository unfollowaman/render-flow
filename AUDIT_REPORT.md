# 1. Project Name and Motive

**Project Name**: Render Flow (formerly HTML-to-PNG)

**Motive**: The project serves as a 100% client-side converter that transforms HTML code, Mermaid diagrams, and LaTeX mathematical expressions into downloadable PNG images. It exists to provide users with a secure, efficient, and private way to generate images from code without relying on any backend servers or rendering engines (like Puppeteer/Playwright).

# 2. Feature List

- **HTML to PNG Conversion**: Users can paste HTML code, drag and drop an `.html` file, or upload an `.html` file. The application converts this HTML—along with its styles and images—into a PNG image that can be downloaded.
- **Mermaid to PNG Conversion**: Users can input Mermaid diagram syntax, which the application renders into a diagram and exports as a PNG image.
- **LaTeX to PNG Conversion**: Users can input LaTeX mathematical formulas, which are typeset and exported as a PNG image.
- **Load Sample**: Provides users with a one-click button to pre-fill the editor with sample code (HTML, Mermaid, or LaTeX depending on the active mode) to quickly demonstrate how the tool works.

# 3. Design Language

The application employs an advanced "double-layer" 3D Neumorphic Design System heavily reliant on a specific set of CSS classes and global variables defined in `globals.css`.

- **Typography**: Uses `Instrument Serif` (a serif font) for body text and `Montserrat` (a sans-serif font) for headings, buttons, labels, and monospace/UI elements.
- **Color Palette**: The primary brand color is a bright yellow (`#ffa100`) and the secondary/text color is a dark green (`#012b1b`). Backgrounds utilize various shades of off-white/gray (`#e8e8ea`, `#fafafa`, `#fdfdfd`).
- **Neumorphic Component Styles**:
  - **Raised Elements (`.neu-raised`, `.neu-card`)**: Used for inactive tabs, buttons, and structural cards. These have a background of `#fafafa`, an outer drop shadow, and a pseudo-element (`::before`) positioned inside with an inset shadow to create an inner frame. They are given `z-index: 1`.
  - **Recessed Elements (`.neu-recessed`)**: Used for active tabs, textareas, and pressed states. These have a background of `#fdfdfd`, an inner inset shadow, and a pseudo-element positioned outside to create a protruding rim. They omit `z-index: 1` to prevent stacking context clipping.
  - **Edges**: A 0.25px solid black outline (implemented via `0 0 0 1px rgba(0, 0, 0, 0.15)` in the `box-shadow`) is used consistently on all primary classes and their pseudo-elements to define precise 3D edges.
- **Interaction Patterns**: Hover states for raised elements increase the outer shadow. Toggles (like the conversion mode tabs) use `.neu-recessed` for the active state and `.neu-raised` for the inactive state.

# 4. Implementation Details Per Feature

### HTML to PNG
- **Files**: `src/components/InputCard.jsx`, `src/hooks/useHtmlToPngConversion.js`, `src/hooks/inlineResources.js`
- **Libraries**: `html-to-image` (lazy-loaded).
- **Technical Flow**:
  1. The user inputs HTML (via textarea or file drop/upload).
  2. `handleConvert` creates an isolated, hidden, offscreen `iframe`.
  3. `inlineResources` pre-fetches external resources (`<link>` styles and `<img>` sources) via CORS and asynchronously replaces their URLs with base64 Data URIs using regex.
  4. The processed HTML is written into the iframe document.
  5. The application waits for the iframe to load, and then races a 5-second timeout against `waitForFontsAndImages` to assure fonts and images are fully rendered.
  6. The `extractDimensions` function uses regex to look for explicit `width` and `height` CSS rules on the `body` or `html` tags. If absent, it reads the iframe document's natural `scrollWidth` and `scrollHeight`.
  7. A hard guardrail checks if the calculated pixel area exceeds 200,000,000 pixels.
  8. `html-to-image` is dynamically imported and called (`toPng`) on the iframe's body to produce a data URL.
- **Decisions**:
  - External resources are pre-inlined before iframe injection to prevent silent CORS failures within `html-to-image`. Regex is used instead of DOM parsing to preserve original HTML formatting so that dimension extraction can still read the raw string correctly.
  - A `useRef` counter acts as a request ID to prevent race conditions during concurrent conversion requests.

### Mermaid to PNG
- **Files**: `src/components/InputCard.jsx`, `src/hooks/useMermaidToPngConversion.js`
- **Libraries**: `mermaid` (lazy-loaded).
- **Technical Flow**:
  1. User inputs Mermaid code.
  2. The `mermaid` library is dynamically imported and initialized.
  3. The code is rendered to an SVG string.
  4. The SVG is parsed via `DOMParser` to extract intrinsic dimensions from its `viewBox` or `width`/`height` attributes.
  5. The SVG is converted to a Blob Object URL and loaded into a standard HTML `Image` object.
  6. After the image loads and fonts are ready (with a 5-second timeout), the image is drawn onto an offscreen `<canvas>` at a 2x DPI scale.
  7. The canvas is exported to a PNG blob using `toBlob`.
- **Decisions**:
  - Initialized with `htmlLabels: false` explicitly to prevent Chromium canvas tainting. Mermaid's default `<foreignObject>` HTML labels cause security restrictions that block canvas exporting.
  - `DOMParser` is used instead of regex (unlike HTML mode) because it is more reliable for standard SVG attribute extraction.

### LaTeX to PNG
- **Files**: `src/components/InputCard.jsx`, `src/hooks/useLatexToPngConversion.js`
- **Libraries**: `mathjax` (`mathjax/es5/tex-svg.js`).
- **Technical Flow**:
  1. User inputs LaTeX code.
  2. Before loading MathJax, a global `window.MathJax` configuration object is injected to disable network package fetching, accessibility, speech, and braille features.
  3. `mathjax/es5/tex-svg.js` is dynamically imported.
  4. The LaTeX string is passed to `window.MathJax.tex2svgPromise` to generate an SVG element.
  5. Dimensions are extracted. If defined in `ex` units, they are approximated to pixels (1ex ~ 12px). Otherwise, the `viewBox` is used.
  6. The SVG is serialized to a string, converted to a Blob Object URL, and loaded into an `Image` object.
  7. The image is drawn onto an offscreen `<canvas>` (at a 2x DPI scale) that has been pre-filled with a white `#ffffff` background.
  8. The canvas is exported to a PNG blob.
- **Decisions**:
  - `window.MathJax` is explicitly configured *prior* to dynamic import because MathJax v3 operates as a zero-backend package in Vite environments. Without disabling network features, MathJax will attempt to fetch external scripts (like Speech Rule Engine workers) via `importScripts`, which fails in this setup.
  - White background is forced onto the canvas because LaTeX SVG output is transparent and often uses black text, which would be illegible on dark background image viewers.

# 5. Choke Points and Failure Points

### HTML to PNG
- **CORS / Asset Fetching Failures**: External stylesheets or images hosted on servers without CORS headers will fail to load during the `fetchAsDataUrl` step in `inlineResources.js`. This is caught and bypasses the inlining, but will likely result in missing styles or broken images in the final PNG.
- **Large Document Crashing**: The maximum total area is hard-capped at 200,000,000 pixels. If an unconstrained layout or explicit dimensions surpass this limit, it throws a hard error.
- **Regex Dimension Extraction Limits**: The dimension extraction uses strict regex (`/(?:body|html)\s*(?:\/\*.*?\*\/\s*)*\{[^}]*?width:\s*(\d+)px/i`). If a user uses `rem`, `%`, `vw`, or places styles in nested structures, the regex fails and falls back to `scrollWidth`, which could incorrectly clip the layout.
- **Timing and Font Loading Races**: If custom fonts or external images take longer than the 5000ms hard timeout in `waitForFontsAndImages`, the rendering will proceed anyway, potentially resulting in unstyled text (fallback fonts) or missing graphics.

### Mermaid to PNG
- **Canvas Size Limits (Unhandled)**: Because the internal width and height are scaled by a `DPI_SCALE = 2`, extremely large or wide Mermaid diagrams will exceed browser maximum canvas dimensions. Unlike the HTML conversion, there is no explicit pixel area guardrail in `useMermaidToPngConversion.js`, meaning very large diagrams will silently fail to generate a blob or crash the browser tab.
- **Dimension Parsing Failures**: If the generated SVG lacks both a `viewBox` and `width`/`height` attributes, it throws a rigid error ("Unable to determine dimensions from Mermaid SVG.") and fails entirely.
- **Syntax Errors**: Invalid Mermaid syntax causes `mermaid.render` to throw an error, which is caught and surfaced as a generic "Invalid Mermaid syntax" without detailing the specific node or line that failed.

### LaTeX to PNG
- **Global MathJax Race Condition**: If another script or component were to set `window.MathJax` or trigger a MathJax load *before* `useLatexToPngConversion.js` defines its strict zero-network configuration, MathJax would attempt to load web workers/assets, throwing an unrecoverable `importScripts` error.
- **Dimension Inaccuracy (ex to px)**: The code approximates dimensions by multiplying `ex` units by 12 (`const exToPx = 12`). Depending on the font and display scaling, this hardcoded heuristic can be inaccurate, leading to slightly clipped edges or excessive padding.
- **Canvas Size Limits (Unhandled)**: Similar to Mermaid, the dimensions are multiplied by a `DPI_SCALE = 2`. Extremely long mathematical formulas can exceed canvas limits with no explicit area guardrail, resulting in silent failure.
- **Missing `xmlns` Attribute**: While handled with a workaround (`svgElement.setAttribute('xmlns', ...)`), if MathJax's output structure changes in future versions and the SVG serialization fails before this attribute is attached, it will fail to load in the `Image` object.
