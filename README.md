# html2png

Serverless Next.js application that converts user-supplied HTML into PNG screenshots using Playwright and headless Chromium.

## Overview

`html2png` provides a small web UI and a JSON API for rendering raw HTML into a PNG image. Users paste HTML into the browser, upload or drag and drop a `.html` file, or load the bundled sample, then submit it to a server-side renderer. The server launches headless Chromium through Playwright, loads the supplied markup, waits for the page and network to settle, captures a PNG screenshot, and returns it as a Base64 data URL.

Main use cases include:

- Generating Open Graph and social preview images from HTML/CSS templates.
- Creating static visual snapshots of small HTML documents.
- Rendering externally hosted fonts, stylesheets, and images into a PNG.
- Testing HTML-to-image output in a simple local or serverless environment.

Key features verified from the implementation:

- Raw HTML textarea input.
- `.html` file upload and drag-and-drop support.
- Sample HTML loader.
- Server-side rendering with `playwright-core` and `@sparticuz/chromium`.
- JavaScript disabled during rendering.
- HTTP, HTTPS, and `data:` resource support with protocol filtering.
- DNS lookup checks for HTTP(S) resources before allowing network requests.
- Blocking of loopback, private, link-local, unspecified, and unique-local IP address ranges covered by the current implementation.
- Stateless response model: no database, object storage, user accounts, or server-side persistence.
- Client-side preview and download of the returned PNG data URL.

## How It Works

```text
User HTML
↓
Frontend
↓
API
↓
Playwright
↓
Chromium
↓
PNG
```

1. **User HTML**
   - The user enters HTML in the textarea, uploads a `.html` file, drags a file onto the editor, or loads the sample HTML.
   - The frontend only checks that the submitted string is non-empty before sending it to the API.

2. **Frontend**
   - The Next.js page at `/` renders the application shell.
   - React state stores the HTML input, loading state, API result, and error message.
   - When the user clicks **Convert to PNG**, the frontend calls `fetch('/api/convert')` with a JSON body shaped as `{ "html": "..." }`.
   - After a successful response, the returned `image` data URL is displayed in an `<img>` element and can be downloaded by creating a temporary client-side anchor.

3. **API**
   - `POST /api/convert` is implemented as a Next.js Pages Router API route.
   - The route rejects non-POST methods.
   - The route rejects missing or non-string `html` values.
   - Next.js body parsing is configured with a `6mb` request body limit.
   - The route extracts output dimensions from CSS text using regular expressions, with defaults and clamps.

4. **Playwright**
   - The API uses `playwright-core` to control Chromium.
   - A Chromium browser instance is cached in module scope and reused while the serverless process remains warm and the browser is still connected.
   - Each conversion creates a new browser context with `javaScriptEnabled: false`.
   - A route handler intercepts every network request and allows only approved protocols and resolved public IP targets.

5. **Chromium**
   - The Chromium executable is supplied by `@sparticuz/chromium`.
   - On Vercel, the API sets `AWS_LAMBDA_JS_RUNTIME` based on the current Node.js major version before importing `@sparticuz/chromium`, so the package can resolve the correct Lambda-compatible runtime behavior.
   - The page content is loaded with `page.setContent(html, { waitUntil: 'load', timeout: 45000 })`.
   - The renderer then waits for Playwright's `networkidle` load state, also with a 45-second timeout.

6. **PNG**
   - The API captures a PNG screenshot with `page.screenshot({ type: 'png', fullPage: false, clip })`.
   - The clip starts at `x: 0, y: 0` and uses the extracted width and height.
   - The screenshot buffer is encoded as Base64 and returned as a JSON data URL: `data:image/png;base64,...`.

## Architecture

### Frontend Stack

- **Next.js Pages Router** serves the application page and API route.
- **React 18** powers the interactive UI.
- **CSS Modules** style the page-specific components through `styles/Home.module.css`.
- **Global CSS** defines resets, theme variables, fonts, and base element styles.
- **Components** split the UI into header, hero, input, loading, error, output, and footer cards.
- **Hooks** isolate conversion and loading-animation state.

### Backend Stack

- **Next.js API Routes** expose `POST /api/convert`.
- **Node.js** runs the API code and DNS lookups.
- **`dns/promises`** resolves external request hostnames before Chromium is allowed to continue those requests.
- **`playwright-core`** drives the browser without bundling a browser binary.
- **`@sparticuz/chromium`** provides the Chromium binary and launch arguments suitable for serverless deployment.

### Rendering Engine

The rendering engine is headless Chromium controlled through Playwright. The API loads the user's HTML directly into a page with `page.setContent`, waits for `load` and `networkidle`, then screenshots a clipped region. JavaScript execution inside the rendered page is explicitly disabled.

### Security Layer

The security layer is implemented inside the API route, not as a separate module or middleware. It includes:

- HTTP method validation.
- Request body validation for a string `html` field.
- Next.js body parser size limit of `6mb`.
- Playwright request interception for all resource requests.
- Protocol allow-list for `http:`, `https:`, and `data:`.
- DNS lookup with timeout and in-memory cache.
- Blocking of selected private, local, link-local, unspecified, and IPv4-mapped private IP addresses after DNS resolution.

There is no authentication, authorization, rate limiting, CAPTCHA, persistent audit log, user isolation beyond per-conversion browser contexts, or dedicated SSRF protection library.

### Deployment Architecture

The repository is configured for deployment as a Next.js application, with special Vercel function settings for the conversion API:

- `pages/api/convert.js` runs as a serverless function on Vercel.
- `vercel.json` assigns the conversion function 1024 MB of memory and a maximum duration of 60 seconds.
- The API itself uses a 45-second render timeout for page loading and network idle waits.
- Browser reuse happens only within a warm serverless instance; cold starts launch Chromium again.

The same app can also run on other Node.js hosts if the runtime can execute Next.js and launch the `@sparticuz/chromium` binary successfully.

## Tech Stack

| Technology | Where It Is Used | Verified Purpose |
|---|---|---|
| Next.js `^14.0.0` | `pages/`, `next.config.js`, API routes | Web application framework, page rendering, API routing, production build/start scripts |
| React `^18.0.0` | `pages/index.js`, `components/`, `hooks/` | Interactive UI, state management, component composition |
| React DOM `^18.0.0` | Next.js runtime dependency | Browser DOM rendering for React |
| Playwright Core `1.42.1` | `pages/api/convert.js` | Programmatic control of headless Chromium without bundled browsers |
| `@sparticuz/chromium` `123.0.1` | `pages/api/convert.js`, `next.config.js` | Serverless-compatible Chromium executable, launch arguments, headless settings |
| Node.js | API route, scripts, DNS code | Server runtime, DNS resolution, buffer encoding, benchmark scripts |
| `dns/promises` | `pages/api/convert.js`, `bench_dns.js` | Hostname resolution before allowing external resource requests |
| CSS Modules | `styles/Home.module.css` | Component and page styling scoped through imported class names |
| Global CSS | `styles/globals.css` | Global reset, CSS variables, typography, scrollbar styles |
| Vercel Functions | `vercel.json` | Serverless deployment target and function resource configuration |

## Project Structure

```text
.
├── README.md
├── Trash
├── bench.js
├── bench_dns.js
├── components/
│   ├── ErrorCard.js
│   ├── Footer.js
│   ├── Header.js
│   ├── Hero.js
│   ├── InputCard.js
│   ├── LoadingCard.js
│   ├── OutputCard.js
│   └── index.js
├── hooks/
│   ├── useHtmlToPngConversion.js
│   └── useMarioAnimation.js
├── next.config.js
├── package.json
├── package-lock.json
├── pages/
│   ├── _app.js
│   ├── _document.js
│   ├── api/
│   │   └── convert.js
│   └── index.js
├── styles/
│   ├── Home.module.css
│   └── globals.css
└── vercel.json
```

### `pages/`

- `pages/index.js` is the main web page. It wires together the UI components and hooks.
- `pages/_app.js` imports global CSS and renders the active page component.
- `pages/_document.js` customizes the HTML document, adds preconnects, loads Montserrat and Instrument Serif from Google Fonts for the application UI, and sets the theme color.
- `pages/api/convert.js` is the HTML-to-PNG conversion API.

### `pages/api/`

- Contains the server-side conversion endpoint.
- The endpoint handles validation, browser setup, request interception, DNS checks, rendering, screenshot capture, and JSON response formatting.

### `components/`

- `Header.js`: logo and navigation links.
- `Hero.js`: landing-page hero text and decorative pixel grid.
- `InputCard.js`: textarea, sample loader, upload button, drag-and-drop handling, and convert button.
- `LoadingCard.js`: visual loading state and status text.
- `ErrorCard.js`: rendering error display.
- `OutputCard.js`: screenshot preview and download button.
- `index.js`: barrel exports for all UI components.

### `hooks/`

- `useHtmlToPngConversion.js`: owns the conversion request lifecycle, including loading state, result state, error state, and the `fetch('/api/convert')` call.
- `useMarioAnimation.js`: owns the animated loading sprite and rotating loading-step messages.

### `styles/`

- `styles/globals.css`: global CSS reset, theme variables, font imports, base typography, and scrollbar styling.
- `styles/Home.module.css`: all page, card, form, loading, preview, footer, and responsive styles for the UI.

### Important Root Files

- `package.json`: project name, version, dependencies, and runnable scripts.
- `package-lock.json`: locked dependency tree generated by npm.
- `next.config.js`: Next.js configuration. It marks `@sparticuz/chromium` as an external package for server components through the experimental `serverComponentsExternalPackages` option.
- `vercel.json`: Vercel function resource configuration for `pages/api/convert.js`.
- `.gitignore`: excludes `node_modules/`, `.next/`, environment files, logs, and `.DS_Store`.
- `bench.js`: standalone Node benchmark comparing repeated inline array creation to a precomputed array.
- `bench_dns.js`: standalone Node benchmark comparing DNS lookup behavior with and without an in-memory cache.
- `Trash`: an existing architectural audit report preserved in the repository. It is not used by the application at runtime.

## API Documentation

### `POST /api/convert`

Converts a user-supplied HTML string into a PNG screenshot encoded as a Base64 data URL.

#### Request

```http
POST /api/convert
Content-Type: application/json
```

```json
{
  "html": "<!DOCTYPE html><html><head><style>body{width:1200px;height:630px;margin:0}</style></head><body>Hello</body></html>"
}
```

#### Request Fields

| Field | Type | Required | Description |
|---|---:|---:|---|
| `html` | string | Yes | Complete or partial HTML document to render. The API passes this string to Playwright's `page.setContent`. |

No other API parameters are currently supported. Width and height are inferred from CSS text in `html`; they are not accepted as explicit JSON fields.

#### Successful Response

Status: `200 OK`

```json
{
  "image": "data:image/png;base64,iVBORw0KGgo...",
  "width": 1200,
  "height": 630
}
```

| Field | Type | Description |
|---|---:|---|
| `image` | string | PNG image encoded as a `data:image/png;base64,...` URL. |
| `width` | number | Screenshot clip width selected by the dimension extraction logic. |
| `height` | number | Screenshot clip height selected by the dimension extraction logic. |

#### Error Responses

| Status | Response | Cause |
|---:|---|---|
| `400` | `{ "error": "Missing or invalid HTML content" }` | `html` is missing, empty/falsy, or not a string. |
| `405` | `{ "error": "Method not allowed" }` | Request method is not `POST`. |
| `500` | `{ "error": "Timeout: Page took too long to load." }` | A rendering step throws an error whose message includes `timeout`. |
| `500` | `{ "error": "Network error loading external resource." }` | A rendering step throws an error whose message includes `net::ERR`. |
| `500` | `{ "error": "An internal server error occurred." }` | Any other unhandled conversion error. |

Blocked subresource requests do not automatically produce an API error. The renderer aborts those individual requests and continues rendering unless the page load or screenshot flow later fails.

#### Limits

| Limit | Value | Source of Limit |
|---|---:|---|
| Request body size | `6mb` | Next.js API body parser config in `pages/api/convert.js` |
| Render timeout | 45 seconds | `RENDER_TIMEOUT_MS` |
| DNS lookup timeout | 5 seconds per uncached hostname lookup | `safeDnsLookup(hostname, 5000)` |
| DNS cache size | 1,000 hostnames | In-memory `Map` eviction threshold |
| Minimum output width | 100 px | Dimension clamp |
| Maximum output width | 3,840 px | Dimension clamp |
| Minimum output height | 100 px | Dimension clamp |
| Maximum output height | 2,160 px | Dimension clamp |
| Default output width | 1,200 px | Dimension fallback |
| Default output height | 630 px | Dimension fallback |
| Vercel function memory | 1,024 MB | `vercel.json` |
| Vercel function duration | 60 seconds | `vercel.json` |

Because the request is JSON encoded, the largest practical HTML string is somewhat smaller than the raw `6mb` body parser limit.

#### Expected Behavior

- The API renders HTML with JavaScript disabled.
- External HTTP(S) resources may load if their DNS-resolved address is not blocked by the current IP filtering logic.
- `data:` resources are allowed.
- Other protocols, such as `file:`, `ftp:`, `ws:`, and `wss:`, are blocked by request interception.
- The response is JSON, not a binary `image/png` response.
- The PNG is captured at 1x scale according to the current browser/device scale behavior.

## Rendering Engine

### Playwright Usage

The API imports `chromium` from `playwright-core`, launches a browser with the executable path and launch arguments supplied by `@sparticuz/chromium`, creates a new context for each conversion, opens a page, intercepts requests, loads HTML with `page.setContent`, waits for network idle, and captures a screenshot.

### Chromium Usage

`@sparticuz/chromium` provides:

- The Chromium executable path.
- The default launch arguments.
- The headless-mode setting.

The implementation removes `--single-process` and `--in-process-gpu` from the Chromium argument list before launch. It also sets `chromiumBinary.setGraphicsMode = false` before launching or reusing Chromium.

### JavaScript Execution

JavaScript is **disabled** during rendering. The API creates each browser context with:

```js
browser.newContext({ javaScriptEnabled: false })
```

This means `<script>` tags and client-side JavaScript in the submitted HTML do not execute. Static HTML, CSS, images, fonts, and other non-script resources can still affect the render if they load successfully.

### Screenshot Generation

- Screenshot type: PNG.
- `fullPage`: `false`.
- Clip origin: `x: 0`, `y: 0`.
- Clip width and height: extracted from the HTML string and clamped.
- Response encoding: Base64 data URL inside JSON.

### Width and Height Handling

Dimensions are inferred with regular expressions, not by evaluating layout or reading computed styles from the browser.

The extraction order is:

1. Look for `width: Npx` in a CSS rule whose selector text starts with or contains `body` or `html` within the regex window.
2. Look for `height: Npx` in a CSS rule whose selector text starts with or contains `body` or `html` within the regex window.
3. Fall back to the first `width: Npx` anywhere in the HTML string.
4. Fall back to the first `height: Npx` anywhere in the HTML string.
5. Use defaults of `1200 × 630` if no matches are found.
6. Clamp width to `100–3840` and height to `100–2160`.

Important implications:

- Only pixel values matching `width: 123px` or `height: 123px` are detected.
- Values such as `%`, `vw`, `vh`, `rem`, `calc(...)`, CSS variables, inline `width="1200"` attributes, and JavaScript-computed dimensions are not recognized.
- The browser context does not explicitly set the Playwright viewport to the extracted dimensions; the dimensions are used for the screenshot clip.
- Responsive CSS that depends on viewport size may therefore be based on Playwright's default viewport behavior rather than the extracted screenshot dimensions.

### Network Request Handling

Every Playwright request is intercepted with `page.route('**/*', ...)`.

Allowed request protocols:

- `http:`
- `https:`
- `data:`

For HTTP and HTTPS requests:

1. The hostname is resolved with `dns.lookup`.
2. The DNS lookup races a 5-second timeout.
3. The resolved address is stored in a process-local cache.
4. The resolved address is checked by `isForbiddenIP`.
5. The request is aborted if the address is blocked or DNS resolution fails.
6. The request continues if the address passes the checks.

For `data:` requests:

- The request is allowed without DNS lookup.

For all other protocols:

- The request is aborted with `accessdenied`.

### Font Loading

Fonts are handled like any other browser resource:

- External font CSS and font files can load over HTTP(S) if DNS and IP checks allow them.
- `data:` fonts are allowed.
- The renderer waits for `load` and then `networkidle`; there is no explicit `document.fonts.ready` wait in the code.
- If font requests are blocked, fail, or time out, Chromium falls back according to normal browser font behavior.

### Image Loading

Images are handled like any other browser resource:

- HTTP(S) images can load if the request passes DNS and IP filtering.
- `data:` images are allowed.
- Private-network, loopback, link-local, and otherwise blocked image URLs are aborted.
- There is no image-specific retry, caching, proxying, transformation, or optimization layer.

## Security Features

The application includes several practical safeguards, but it should still be treated as a public rendering service that executes untrusted HTML in a browser process.

### Protocol Filtering

The Playwright route handler allows only:

- `http:`
- `https:`
- `data:`

All other parsed protocols are aborted.

### DNS Checks

For HTTP(S) resource requests, the API resolves the hostname using `dns.lookup` before allowing the request to continue. DNS lookups are limited by a 5-second timeout and cached in memory up to 1,000 hostnames.

### Private IP Blocking

The implementation blocks resolved addresses that match the following checks:

- IPv4 loopback: `127.*`
- IPv4 private range: `10.*`
- IPv4 private range: `192.168.*`
- IPv4 private range: `172.16.*` through `172.31.*`
- IPv4 link-local: `169.254.*`
- IPv4 unspecified: `0.0.0.0`
- IPv6 loopback: `::1`
- IPv6 unique-local prefixes starting with `fc` or `fd`
- IPv6 link-local addresses starting with `fe80`
- IPv6 unspecified: `::`
- IPv4-mapped IPv6 addresses beginning with `::ffff:` when the mapped IPv4 address is blocked

### Request Validation

The API validates:

- Method must be `POST`.
- `req.body.html` must exist and be a string.

The frontend also disables the convert button when the local HTML state is blank and displays a client-side error for blank submissions, but the server-side validation is the authoritative check.

### Body Size Limits

The Next.js API route config sets:

```js
bodyParser: { sizeLimit: '6mb' }
```

This limit applies to the JSON request body parsed by Next.js.

### Security Features Not Present

The current implementation does **not** include:

- Authentication or API keys.
- Authorization.
- Rate limiting.
- CAPTCHA or abuse protection.
- Per-user quotas.
- Persistent request logging or audit trails.
- CSRF protection specific to the API route.
- HTML sanitization.
- A dedicated SSRF protection library.
- Protection against all DNS rebinding or multi-address resolution edge cases.
- Blocking based on final connected IP after redirects beyond the request interception and DNS check behavior implemented here.
- Sandboxing outside Chromium/Playwright and the hosting platform's process isolation.

## Local Development

### Prerequisites

- Node.js compatible with Next.js 14 and the installed dependencies.
- npm, because this repository includes `package-lock.json`.

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

Open `http://localhost:3000`.

### Production Build

```bash
npm run build
```

### Production Start

```bash
npm run start
```

`npm run start` runs `next start` and expects a successful production build to already exist.

### Available Scripts

| Command | package.json Script | Purpose |
|---|---|---|
| `npm run dev` | `next dev` | Start the local development server. |
| `npm run build` | `next build` | Build the Next.js app for production. |
| `npm run start` | `next start` | Start the production Next.js server after building. |

## Deployment

### Current Deployment Model

The repository is configured for a Vercel-oriented serverless deployment:

- The frontend is a standard Next.js site.
- The conversion endpoint is a Next.js API route.
- `vercel.json` increases resources for `pages/api/convert.js` to support Chromium startup and rendering.
- The API dynamically imports `@sparticuz/chromium` after setting a Lambda runtime environment variable on Vercel.

### Vercel Configuration

`vercel.json` configures:

```json
{
  "functions": {
    "pages/api/convert.js": {
      "memory": 1024,
      "maxDuration": 60
    }
  }
}
```

This gives the conversion API more memory and time than many default serverless settings. The application-level render timeout remains 45 seconds.

### Deploying Elsewhere

The application is not hard-coded to Vercel only, but the rendering path depends on launching Chromium successfully in the target runtime.

#### Railway

- Deploy as a Node.js app.
- Run `npm install`, `npm run build`, and `npm run start`.
- Ensure the runtime supports the Chromium binary and native dependencies required by `@sparticuz/chromium`.
- Allocate enough memory for Chromium; 1 GB is a practical starting point based on the Vercel config.

#### Render

- Use a Node.js web service.
- Build command: `npm install && npm run build`.
- Start command: `npm run start`.
- Verify Chromium can launch in the selected environment and plan.
- Increase memory if conversions fail during browser launch or screenshot capture.

#### VPS or Container Host

- Install Node.js and npm.
- Run `npm install`, `npm run build`, and `npm run start`.
- Expose the Next.js server behind a reverse proxy if needed.
- Ensure system libraries required by Chromium are available, or adapt the browser installation strategy.
- Add operational protections such as authentication, rate limiting, process monitoring, and request logging before exposing the service publicly.

## Known Limitations

- **No authentication:** Anyone who can reach the app can submit render jobs.
- **No rate limiting:** The API does not throttle requests or enforce quotas.
- **No persistence:** Inputs and outputs are not stored by the application.
- **Public rendering endpoint:** `/api/convert` is available without API keys or authorization.
- **Base64 JSON response:** Images are returned inside JSON as data URLs, increasing response size compared with binary PNG responses.
- **JavaScript disabled:** HTML that depends on client-side JavaScript will not render as it would in a normal browser with JavaScript enabled.
- **Regex-based dimension extraction:** Width and height are inferred from raw HTML/CSS text and can be wrong for complex CSS.
- **No explicit width/height API fields:** Callers cannot pass dimensions directly as JSON parameters.
- **Viewport is not explicitly set:** Extracted dimensions are used for screenshot clipping, not for `browser.newContext({ viewport })`.
- **Limited CSS unit support for dimension detection:** Only `px` declarations matching the regex are detected.
- **No explicit font readiness wait:** The renderer waits for `load` and `networkidle`, but does not call `document.fonts.ready`.
- **Network idle can be fragile:** Pages with long-lived, slow, blocked, or continuously pending resources can time out.
- **Subresource failures may be silent in the API response:** Blocked or failed images/fonts/styles may simply be missing from the rendered PNG.
- **SSRF protection is partial:** The app performs protocol filtering and DNS/IP checks, but does not provide comprehensive SSRF hardening.
- **DNS cache is process-local:** Cache state disappears on cold starts and is not shared between serverless instances.
- **No browser pool management:** The app caches one browser instance, but does not implement a robust pool, queue, concurrency limits, or crash recovery beyond basic connected-state checks.
- **No tests configured:** `package.json` does not define test, lint, typecheck, or formatting scripts.
- **Some UI copy still mentions Puppeteer:** The implementation uses Playwright, but `Footer.js` and `Hero.js` contain user-facing text that says Puppeteer.
- **Navigation links are generic:** The header links point to `https://github.com` and `https://vercel.com`, not a repository-specific GitHub URL or deployment page.
- **Repository is private in package metadata:** `package.json` has `"private": true`, even though this README is written for open-source-style onboarding.

## Future Improvements

- Add explicit `width` and `height` request fields to `POST /api/convert`.
- Set the Playwright viewport to the requested or inferred dimensions.
- Improve dimension handling by reading computed layout from the browser or using explicit API parameters instead of regex extraction.
- Add a binary `image/png` response mode to avoid Base64 overhead.
- Add rate limiting, quotas, and abuse protection.
- Add authentication or API keys for non-public deployments.
- Strengthen SSRF protection with multi-address DNS resolution, redirect-aware checks, final-address validation where possible, and a dedicated allow/deny policy.
- Add configurable network allow-lists or block-lists for production deployments.
- Add explicit font readiness handling where compatible with JavaScript-disabled rendering constraints.
- Add structured logging and metrics for render duration, failure categories, and Chromium launch behavior.
- Add automated tests for dimension extraction, IP blocking, method validation, and API error handling.
- Split `pages/api/convert.js` into smaller modules for browser lifecycle, network policy, dimension extraction, and response formatting.
- Add a browser pool or queue for predictable concurrency under load.
- Update in-app copy to consistently reference Playwright instead of Puppeteer.
- Add deployment documentation for Docker if a container image is introduced.

## Troubleshooting

### `Timeout: Page took too long to load.`

Likely causes:

- External resources are slow or never reach `networkidle`.
- Fonts, images, or stylesheets are hosted on domains that respond slowly.
- The HTML references many resources.
- A resource request is hanging until the render timeout.

What to try:

- Inline critical CSS.
- Use fewer external resources.
- Use reliable public HTTPS URLs.
- Convert remote images to `data:` URLs for small assets.
- Remove resources that are not required for the screenshot.

### `Network error loading external resource.`

Likely causes:

- Chromium or Playwright raised a `net::ERR...` error.
- An external resource is unreachable.
- DNS failed or a resource host is unavailable.

What to try:

- Verify all external URLs in a browser.
- Prefer HTTPS resources from stable CDNs.
- Avoid private or local network URLs.

### Missing images, fonts, or CSS in the PNG

Likely causes:

- The resource URL uses a blocked protocol.
- DNS resolution failed.
- The resolved IP address is blocked by the private IP filter.
- The resource server blocked headless Chromium or serverless traffic.
- The resource did not finish before `networkidle` or timeout behavior.

What to try:

- Use absolute `https://` URLs.
- Inline small assets with `data:` URLs.
- Host assets on a public CDN.
- Verify the resource does not resolve to a private or local address.

### Output dimensions are wrong

Likely causes:

- The HTML does not contain `width: Npx` and `height: Npx` declarations in a format recognized by the regex.
- Dimensions are defined with CSS variables, percentages, viewport units, `calc(...)`, attributes, or JavaScript.
- The first generic `width: Npx` or `height: Npx` match belongs to an inner element rather than the intended canvas.

What to try:

- Add simple pixel dimensions to `body` or `html`, for example:

```html
<style>
  body {
    margin: 0;
    width: 1200px;
    height: 630px;
  }
</style>
```

### Scripts do not run

This is expected. The rendering context is created with JavaScript disabled. Use static HTML and CSS, or render dynamic content before submitting the HTML to the API.

### Build or runtime fails around Chromium

Likely causes:

- The host environment cannot execute the Chromium binary.
- Native system libraries required by Chromium are missing.
- The deployment has too little memory.
- Serverless function duration is too short for cold starts plus rendering.

What to try:

- Use the Vercel settings in `vercel.json` as a baseline.
- Allocate at least 1024 MB of memory for the conversion function or service.
- Confirm the target platform supports `@sparticuz/chromium`.
- On a VPS/container, install Chromium-compatible system dependencies or adjust the browser strategy.

## FAQ

### Is this a browser-based converter?

The UI runs in the browser, but conversion happens on the server. The frontend sends HTML to `/api/convert`, and the API renders it in headless Chromium.

### Does submitted JavaScript run?

No. JavaScript is explicitly disabled in the Playwright browser context used for rendering.

### Can I use Google Fonts?

Yes, if the font CSS and font files are reachable over allowed protocols and pass DNS/IP checks. The bundled sample uses Google Fonts, and the renderer treats those requests like other HTTP(S) resources.

### Can I use external images?

Yes, public HTTP(S) images can load if they pass the request filtering logic. `data:` images are also allowed.

### Can I render private intranet pages or localhost assets?

No. The request interception layer is designed to block loopback, private, link-local, unspecified, and selected IPv6 local ranges after DNS resolution.

### Can I send width and height in the API request?

No. The current API only accepts `html`. Width and height are inferred from CSS text and then clamped.

### What happens if no dimensions are found?

The API defaults to `1200 × 630`.

### What is the maximum output size?

The current clamps are `3840 × 2160`. Width and height are also clamped to minimums of `100 × 100`.

### Does the API return a binary PNG?

No. It returns JSON containing a Base64 `data:image/png` URL.

### Are rendered images saved anywhere?

No. The application does not persist inputs or outputs. The browser preview and download happen from the response data URL on the client.

### Is this safe to expose publicly?

Not without additional controls. The implementation includes request validation and partial network protections, but it has no authentication, rate limiting, quotas, persistent logging, or comprehensive SSRF hardening.

### Why does some UI text say Puppeteer?

That text is outdated. The code uses Playwright, not Puppeteer. This README documents the actual implementation.

### Can this run outside Vercel?

Yes in principle, because it is a standard Next.js app, but the deployment target must be able to run Chromium through `@sparticuz/chromium` or an adapted browser setup.

## Corrections From Previous README

The previous README and current UI copy contained statements that were inaccurate, contradictory, incomplete, or easy to misread when compared with the implementation. Corrections are listed below.

| Previous Statement | Corrected Version |
|---|---|
| Rendering details listed JavaScript as enabled. | JavaScript is disabled during rendering via `browser.newContext({ javaScriptEnabled: false })`. |
| Feature list said “No JS execution,” while the rendering table said JavaScript was enabled. | The accurate and non-contradictory statement is: submitted page JavaScript does not execute. |
| “Max HTML size 5MB.” | The API body parser is configured with `sizeLimit: '6mb'`; practical HTML size is slightly smaller because the body is JSON encoded. |
| “External assets — Google Fonts, CDN CSS, external images all fetched automatically.” | External assets are requested by Chromium, but only `http:`, `https:`, and `data:` protocols are allowed, HTTP(S) hostnames must resolve successfully, and resolved IPs must pass the private/local IP filter. |
| “Pixel-perfect rendering” as an unconditional claim. | The app renders with headless Chromium, but exact fidelity depends on static HTML/CSS, disabled JavaScript, resource loading, font availability, regex dimension extraction, and viewport behavior. |
| API documentation implied only a generic error response. | The API returns specific `400`, `405`, and several `500` error messages depending on validation and failure category. |
| Rendering settings did not mention request interception or DNS/IP filtering. | Every Playwright resource request is intercepted; HTTP(S) requests are DNS-checked and blocked when they resolve to configured private/local ranges. |
| Tips implied body width/height directly set the viewport. | Body/html pixel dimensions influence screenshot clip extraction, but the Playwright viewport is not explicitly set from those dimensions. |
| Dependencies table omitted React, React DOM, Node.js, CSS Modules, global CSS, Vercel configuration, and DNS usage. | The tech stack now documents all significant dependencies and runtime pieces visible in the repository. |
| Project structure omitted `components/`, `hooks/`, benchmark scripts, `package-lock.json`, `.gitignore`, and `Trash`. | The project structure section now describes those directories and files. |
| README described the app as serverless on Vercel but did not explain non-Vercel deployment considerations. | The deployment section now documents the Vercel-specific configuration and outlines requirements for Railway, Render, VPS, and container-style hosts. |
| README did not document security limitations. | The security and known limitations sections now state that there is no authentication, authorization, rate limiting, persistence, dedicated SSRF library, or comprehensive abuse protection. |
| UI copy in `Hero.js` and `Footer.js` says Puppeteer. | The actual implementation uses Playwright through `playwright-core`; the Puppeteer references are stale UI copy. |
| README did not describe browser caching behavior. | The API caches one browser instance in module scope and reuses it only while the process remains warm and connected. |
| README did not explain response encoding tradeoffs. | The API returns a Base64 PNG data URL in JSON rather than a binary image response. |
