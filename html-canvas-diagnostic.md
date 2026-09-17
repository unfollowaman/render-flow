# HTML Canvas Fallback Diagnostic Report

## Executive Summary
This is a diagnostic-only report analyzing why the HTML to PNG conversion pipeline in `src/hooks/useHtmlToPngConversion.js` outputs a ~9999x9999 pixel image when pasted HTML lacks explicit `px` width and height declarations on `body` or `html`. No behavior or logic was modified in the codebase; only temporary diagnostic logging was added.

---

## Code References

### 1. Dimension Extraction Logic (`src/hooks/useHtmlToPngConversion.js`, Lines 6–23)
```javascript
const BODY_WIDTH_REGEX = /(?:body|html)\s*(?:\/\*.*?\*\/\s*)*\{[^}]*?width:\s*(\d+)px/i
const BODY_HEIGHT_REGEX = /(?:body|html)\s*(?:\/\*.*?\*\/\s*)*\{[^}]*?height:\s*(\d+)px/i
const INLINE_WIDTH_REGEX = /<(?:body|html)[^>]*style="[^"]*width:\s*(\d+)px/i
const INLINE_HEIGHT_REGEX = /<(?:body|html)[^>]*style="[^"]*height:\s*(\d+)px/i

function extractDimensions(html) {
  const bodyWidthMatch = html.match(BODY_WIDTH_REGEX)
  const bodyHeightMatch = html.match(BODY_HEIGHT_REGEX)
  const inlineWidthMatch = html.match(INLINE_WIDTH_REGEX)
  const inlineHeightMatch = html.match(INLINE_HEIGHT_REGEX)

  const widthMatch = bodyWidthMatch?.[1] ?? inlineWidthMatch?.[1]
  const heightMatch = bodyHeightMatch?.[1] ?? inlineHeightMatch?.[1]

  const width = widthMatch ? parseInt(widthMatch, 10) : null
  const height = heightMatch ? parseInt(heightMatch, 10) : null

  return { width, height }
}
```

### 2. Fallback Assignment Logic (`src/hooks/useHtmlToPngConversion.js`, Lines 168–175)
```javascript
      const scrollWidth = iframe.contentDocument.documentElement.scrollWidth
      const scrollHeight = iframe.contentDocument.documentElement.scrollHeight

      await new Promise(resolve => setTimeout(resolve, 0))
      const { width: explicitWidth, height: explicitHeight } = extractDimensions(htmlToConvert)

      const finalWidth = explicitWidth !== null ? explicitWidth : scrollWidth
      const finalHeight = explicitHeight !== null ? explicitHeight : scrollHeight
```

### 3. Offscreen Iframe Initialization (`src/utils/createIsolatedIframe.js`, Lines 8–15)
```javascript
  const iframe = document.createElement('iframe')
  iframe.style.position = 'absolute'
  iframe.style.top = '-99999px'
  iframe.style.left = '-99999px'
  iframe.style.width = '9999px'
  iframe.style.height = '9999px'
  iframe.style.border = 'none'
  iframe.style.visibility = 'hidden'
```

---

## Detailed Technical Cause & Explanation

1. **Trigger Condition**:
   When the pasted HTML snippet does not contain CSS rules or inline style attributes specifying explicit pixel width and height on `body` or `html` (e.g., `body { width: 400px; height: 300px; }`), `extractDimensions(htmlToConvert)` yields `{ width: null, height: null }`.

2. **Fallback Value Selection**:
   In `useHtmlToPngConversion.js`, `explicitWidth !== null ? explicitWidth : scrollWidth` evaluates to `scrollWidth`, and `explicitHeight !== null ? explicitHeight : scrollHeight` evaluates to `scrollHeight`.

3. **Origin of the 9999x9999 Dimensions**:
   Before reading `documentElement.scrollWidth` and `documentElement.scrollHeight`, the isolated rendering `iframe` is constructed via `createIsolatedIframe()`. As seen in `src/utils/createIsolatedIframe.js`, the iframe element is given initial styles `width: '9999px'` and `height: '9999px'`.

   In CSS layout calculations, standard block-level elements (like `<div>` or default `<body>`) inside an unconstrained viewport expand to fill 100% of the available layout viewport width (9999px) and layout height (9999px). Consequently, reading `documentElement.scrollWidth` and `documentElement.scrollHeight` from within the 9999px-sized iframe measures the full viewport size (9999px by 9999px) rather than tight bounding box dimensions of the rendered content.

4. **Capture Phase**:
   `finalWidth` and `finalHeight` evaluate to 9999px (or close to 9999px depending on body margins), which are then applied to `iframe.style.width` / `iframe.style.height` and passed directly as target parameters into `html-to-image`'s `toPng(..., { width: 9999, height: 9999 })`. This produces a large output PNG canvas.

---

## Verification Instructions for Aman

To independently verify this diagnosis using browser Developer Tools:

1. Launch the application in Vite development mode (`pnpm dev`).
2. Open the browser to the application page and navigate to **HTML Converter** mode.
3. Open **Browser Developer Tools** (Press `F12` or `Cmd+Option+I` / `Ctrl+Shift+I`) and switch to the **Console** tab.
4. Paste the following test HTML snippet into the HTML input textarea (which intentionally has no width or height set on `body` or `html`):
   ```html
   <div style="background: lightblue; padding: 20px;">
     <h2>Hello World</h2>
     <p>This is a test card with no explicit body dimensions.</p>
   </div>
   ```
5. Click the **Convert to PNG** button.
6. Observe the three diagnostic console messages logged in the console, prefixed with `STRESS-DIAG`:
   - **`STRESS-DIAG 1: Regex dimension extraction`**: Look at `extractedWidth` and `extractedHeight`. Both will be `null`.
   - **`STRESS-DIAG 2: Applying iframe dimensions`**: Look at `scrollWidth` and `scrollHeight`. They will be `9999` (or approximately `9999` based on body margin offsets), showing that `finalWidth` / `finalHeight` fell back to the initial 9999px iframe viewport dimensions.
   - **`STRESS-DIAG 3: Options passed to html-to-image (toPng)`**: Note `width: 9999` and `height: 9999` passed to `toPng`.
