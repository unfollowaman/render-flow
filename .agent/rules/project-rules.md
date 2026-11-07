# Project Rules — Render Flow

These rules are always active across all tasks in this workspace.

---

## Non-Negotiable Hard Rules

- Zero-backend and GitHub Pages static hosting is an absolute constraint. Reject any solution needing a server, API, worker or database.
- File-disjoint scoping: never modify existing hooks for new feature work. New features get new files.
- Diagnose before fixing. Never combine diagnosis and fix in one task. One change at a time.
- Accuracy first: math, equation and diagram correctness is non-negotiable. Layout is secondary.
- Content versus layout separation: JSON describes meaning, the renderer decides layout.
- Keep the 200,000,000 pixel canvas guardrail (post-DPI-scaling, pre-canvas-creation) in all PNG pipelines.
- Never report a result you did not actually observe. If you cannot run or verify something, say so. Fabricated diagnostics are unacceptable.
- Diagnostic tasks must output raw console-logged values, not summaries.
- Commit in small increments with clear messages.
- Copy and UI text must read like a real person wrote it: confident, plain-language, benefit-driven. No negative-list filler such as "No X, no Y, no Z".

---

## Operational Guidelines

### Architectural Constraints
1. **Static Hosting Compatibility**: The entire build output must reside in `dist/` and run completely offline or statically on GitHub Pages. Any feature requiring Node runtime at serving time will fail CI/CD.
2. **Library Inlining & Dynamic Imports**: Client-side conversion libraries exceeding 500kB (e.g. `mermaid`, `katex`, `html-to-image`) must be dynamically imported on demand to protect Core Web Vitals (LCP, TBT).
3. **Canvas Tainting Prevention**: Never use `Blob` or `URL.createObjectURL` for SVG images that contain `<foreignObject>` or HTML markup when rendering to canvas in Chromium browsers. Use UTF-8 safe base64 data URIs (`data:image/svg+xml;base64,...`) or avoid HTML labels.

### Security
1. **Sanitize Everything**: Pass all dynamic markup (HTML, KaTeX output, Mermaid SVG) through `DOMPurify.sanitize()` before DOM mounting.
2. **Iframe Isolation**: Render untrusted HTML or third-party markup inside sandboxed iframes created via `createIsolatedIframe()`.
