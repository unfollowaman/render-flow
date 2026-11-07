# AGENTS.md — Render Flow Agent Guide

This document is the single source of truth for AI agents (and human contributors) working on the Render Flow repository. Read this file in full before performing any work.

---

## 1. Project Summary

**Render Flow** is a fully client-side, zero-backend, static web application built with Vite and React (JavaScript/JSX). It is hosted on GitHub Pages with automated CI/CD via GitHub Actions.

The core purpose of Render Flow is to convert code and markup into high-resolution PNG images entirely inside the user's browser without uploading code or assets to any server.

### Conversion Modes
1. **HTML to PNG**: Converts arbitrary HTML/CSS markup to PNG images using an isolated iframe and `html-to-image`.
2. **Mermaid to PNG**: Converts Mermaid diagram syntax to SVG via `mermaid`, inlines custom base64-encoded webfonts, renders onto an HTML `<canvas>`, and exports to PNG.
3. **LaTeX to PNG**: Converts mathematical formulas to HTML using KaTeX, renders inside an isolated iframe to prevent stylesheet interference, and exports to PNG via `html-to-image`.
4. **Notes Mode (4th Mode, in active development)**: Accepts structured educational chapter JSON and renders multi-page, print-ready A4 notes with two-column layout, LaTeX equations, SVG coordinate diagrams, and automatic pagination.

---

## 2. Tech Stack & Dependencies

All versions are verified directly from [package.json](file:///e:/Antigravity/Projects/render-flow/package.json):

### Core Framework
- **React**: `^18.3.1`
- **React DOM**: `^18.3.1`
- **Vite**: `^5.4.0`
- **@vitejs/plugin-react**: `^4.3.1`

### Code Editor (CodeMirror 6)
- **@codemirror/view**: `^6.43.15`
- **@codemirror/state**: `^6.7.6`
- **@codemirror/language**: `^6.13.1`
- **@codemirror/commands**: `^6.11.1`
- **@codemirror/theme-one-dark**: `^6.1.3`
- **@codemirror/lang-html**: `^6.4.12`
- **@codemirror/lang-json**: `^6.0.2`
- **@codemirror/lang-markdown**: `^6.5.2`

### Conversion & Rendering Libraries
- **html-to-image**: `^1.11.13` (DOM-to-PNG export)
- **katex**: `^0.18.4` (LaTeX math rendering)
- **mermaid**: `^11.16.0` (diagram parsing and SVG rendering)
- **dompurify**: `^3.4.14` (client-side XSS sanitization)

### Testing
- **vitest**: `^3.2.6`
- **jsdom**: `^29.1.1`
- **@testing-library/react**: `^16.3.2`
- **@testing-library/dom**: `^10.4.1`

---

## 3. Exact Commands & Scripts

Commands defined in [package.json](file:///e:/Antigravity/Projects/render-flow/package.json):

| Task | Command | Notes |
| :--- | :--- | :--- |
| **Install** | `npm ci` (or `npm install`) | Production-locked dependency install |
| **Dev Server** | `npm run dev` | Runs `vite` locally on port 5173 |
| **Build** | `npm run build` | Runs `vite build` targeting `dist/` |
| **Preview** | `npm run preview` | Runs `vite preview` on built `dist/` |
| **Test** | `npm run test` (or `npx vitest run`) | Runs `vitest run` unit test suite |
| **Lint** | *[UNVERIFIED - No lint script in package.json]* | Verify code manually; no ESLint script exists |
| **Deploy** | Automated via GitHub Actions | Push to `main` triggers `.github/workflows/deploy.yml` |

> [!NOTE]
> There is no npm `lint` or `deploy` script in `package.json`. Deployment is triggered automatically on `git push origin main` using GitHub Actions (`npm ci && npm run build` -> GitHub Pages).

---

## 4. Repository Folder Map

```
render-flow/
├── .agent/                       # Agent workflows and project rules
│   ├── rules/
│   │   └── project-rules.md      # Always-on workspace constraints
│   └── workflows/
│       ├── new-feature.md        # Workflow for implementing features
│       ├── diagnose-bug.md       # Workflow for diagnostic investigations
│       └── pre-commit-check.md   # Quality & build verification
├── .github/
│   └── workflows/
│       └── deploy.yml            # CI/CD pipeline deploying dist/ to GitHub Pages
├── .Jules/                       # Development notes and UI/perf learnings
│   ├── bolt.md                   # Performance optimization learnings
│   └── palette.md                # UI/UX and accessibility learnings
├── docs/                         # Project documentation and specifications
│   ├── jules-reports/            # Diagnostic reports (e.g. unused-js-diagnosis.md)
│   ├── ARCHITECTURE.md           # Pipeline architectural breakdown
│   ├── DECISIONS.md              # Architectural decision record (ADR)
│   ├── NOTES_MODE.md             # Notes Mode status, roadmap, and open issues
│   ├── PROJECT_STATE.md          # Current handoff state and session log
│   ├── PROMPT_TEMPLATES.md       # Reusable prompts for agent tasks
│   ├── notes-mode-schema.md      # Notes Mode JSON schema specification
│   └── notes-mode-chatgpt-master-prompt.md # Authoring prompt for chapter JSON
├── public/                       # Static public assets served as-is
│   ├── fonts/                    # Self-hosted woff2 font files
│   │   ├── arya/                 # Arya Regular (400) and Bold (700)
│   │   ├── instrument-serif/     # Instrument Serif Regular and Italic
│   │   ├── montserrat/           # Montserrat weights 400 through 900
│   │   └── playfair-display/     # Playfair Display Regular (400) and Bold (700)
│   ├── apple-touch-icon.png
│   ├── favicon-32x32.png
│   ├── favicon.svg
│   ├── robots.txt
│   └── sitemap.xml
├── src/                          # Application source code
│   ├── assets/                   # React asset imports (download-icon.png, logo.svg)
│   ├── components/               # React UI components
│   │   ├── A4Page.jsx            # A4 page container (210mm x 297mm)
│   │   ├── CodeEditor.jsx        # CodeMirror 6 editor wrapper
│   │   ├── ErrorCard.jsx         # Error alert card with copy button
│   │   ├── Footer.jsx            # Page footer with 3D unfold animation
│   │   ├── Header.jsx            # Header bar with navigation links
│   │   ├── Hero.jsx              # Landing hero headline
│   │   ├── HtmlConverter.jsx     # HTML mode converter container
│   │   ├── InputCard.jsx         # Mode switcher, Workspace, and NotesWorkspace
│   │   ├── LatexConverter.jsx    # LaTeX mode converter container
│   │   ├── MermaidConverter.jsx  # Mermaid mode converter container
│   │   ├── NotesBlockComponents.jsx # Decomposed question/solution block components
│   │   ├── NotesConverter.jsx    # Notes mode converter container with PNG export
│   │   ├── NotesModeCard.jsx     # Question/Solution card and content renderers
│   │   └── OutputCard.jsx        # Preview card with image preview & modal
│   ├── hooks/                    # Custom conversion hooks
│   │   ├── inlineResources.js    # External CSS/image fetching and inlining
│   │   ├── useHtmlToPngConversion.js    # HTML to PNG pipeline hook
│   │   ├── useLatexToPngConversion.js   # LaTeX to PNG pipeline hook
│   │   ├── useMermaidToPngConversion.js # Mermaid to PNG pipeline hook
│   │   ├── useNotesToPngConversion.js   # Notes JSON to paginated A4 hook
│   │   └── useReveal.js          # IntersectionObserver 3D reveal animation hook
│   ├── lib/
│   │   └── notesMode/            # Notes Mode processing engine
│   │       ├── diagrams/         # SVG math diagram components
│   │       │   ├── CoordinateContext.js
│   │       │   ├── CoordinatePlane.jsx
│   │       │   ├── LineSegment.jsx
│   │       │   ├── Point.jsx
│   │       │   └── Shape.jsx
│   │       ├── flattenToBlocks.js   # Chapter JSON to sequential block flattener
│   │       ├── paginate.js          # DOM height measurement & column/row pagination
│   │       ├── renderEquation.js    # KaTeX formula renderer with memory cache
│   │       └── validateSchema.js    # JSON schema validator returning structured errors
│   ├── styles/                   # CSS Modules and global stylesheets
│   │   ├── Docs.module.css       # Docs page stylesheet
│   │   ├── globals.css           # Global typography, resets, Neumorphic utilities
│   │   ├── Home.module.css       # Main app layout and controls stylesheet
│   │   └── print.css             # Print media styles (@page A4, @media print)
│   ├── utils/                    # Shared utility helpers
│   │   ├── canvasToBlob.js       # Offscreen canvas scaling and PNG blob generation
│   │   ├── createIsolatedIframe.js # Sandboxed hidden iframe factory
│   │   └── requestHelpers.js     # runIfLatest concurrency and race condition guard
│   ├── App.jsx                   # Main application layout and mode state
│   ├── docs.jsx                  # Entry point for docs multi-page build
│   ├── DocsApp.jsx               # Documentation page root component
│   └── main.jsx                  # Entry point for index.html
├── AUDIT_INDEXING_READINESS.md   # SEO, LCP, and accessibility audit report
├── docs.html                     # Multi-page Rollup input for /docs.html
├── index.html                    # Single-page Rollup input for root app
├── package.json
├── package-lock.json
├── vite.config.js                # Vite build config with manual vendor chunking
└── vitest.config.js              # Vitest test runner configuration
```

---

## 5. Coding Conventions

1. **Strict Client-Side Boundary**: No servers, no Node runtime dependencies in production code, no external rendering engines (Puppeteer/Playwright in production). All transformations must run in the browser.
2. **File-Disjoint Scoping**: Keep conversion logic strictly partitioned by mode. Never modify existing mode hooks (`useHtmlToPngConversion.js`, `useMermaidToPngConversion.js`, `useLatexToPngConversion.js`) when working on a new mode or feature. Create dedicated files.
3. **Lazy-Load Heavy Vendor Chunks**: Heavy dependencies (`mermaid`, `katex`, `html-to-image`) must be dynamically imported on demand (`await import(...)`) to maintain sub-second initial page load times.
4. **Isolated Iframe Sandbox**: When rendering user-supplied HTML or KaTeX, use `createIsolatedIframe()` to prevent style bleeding, external font collisions, and cross-origin security errors.
5. **DOMPurify Sanitization**: All user-supplied HTML, rendered KaTeX strings, and Mermaid SVGs must pass through `DOMPurify.sanitize()` prior to DOM insertion.
6. **Concurrency Protection**: Always guard asynchronous operations in conversion hooks with `latestRequestIdRef` and `runIfLatest()` to prevent out-of-order state updates when a user triggers multiple conversions.
7. **Maximum Canvas Guardrail**: All image and canvas pipelines must enforce `finalWidth * finalHeight <= 200000000` (200 million pixels) post-DPI scaling before canvas allocation.
8. **Neumorphic & Accessible UI**: Maintain Neumorphic styling (`.neu-card`, `.neu-raised`, `.neu-recessed`) while upholding WCAG standards:
   - Provide `role="tablist"` and `role="tab"` with roving `tabIndex` for mode selectors.
   - Provide `role="status"` live regions (`aria-live="polite"`) for async operation status.
   - Provide explicit `aria-label`s on buttons and textareas.
9. **Performance Optimization Patterns**:
   - Cache expensive regex parsing and stringified options in module-scoped Maps/WeakMaps.
   - Use imperative `for` loops rather than intermediate array mapping (`flatMap`, chained `.map()`) when manipulating large document data trees.
   - Memoize rendered components (`memo`) that display static or expensive content.

---

## 6. Hard Rules (Non-Negotiable)

1. **Zero-backend and GitHub Pages static hosting is an absolute constraint.** Reject any solution needing a server, API, worker or database.
2. **File-disjoint scoping: never modify existing hooks for new feature work.** New features get new files.
3. **Diagnose before fixing. Never combine diagnosis and fix in one task.** One change at a time.
4. **Accuracy first: math, equation and diagram correctness is non-negotiable.** Layout is secondary.
5. **Content versus layout separation: JSON describes meaning, the renderer decides layout.**
6. **Keep the 200,000,000 pixel canvas guardrail (post-DPI-scaling, pre-canvas-creation) in all PNG pipelines.**
7. **Never report a result you did not actually observe.** If you cannot run or verify something, say so. Fabricated diagnostics are unacceptable.
8. **Diagnostic tasks must output raw console-logged values, not summaries.**
9. **Commit in small increments with clear messages.**
10. **Copy and UI text must read like a real person wrote it: confident, plain-language, benefit-driven.** No negative-list filler such as "No X, no Y, no Z".
