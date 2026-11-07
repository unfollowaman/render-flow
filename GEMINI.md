# GEMINI.md — Agent Quickstart

Read [AGENTS.md](file:///e:/Antigravity/Projects/render-flow/AGENTS.md) fully before starting any task in this repository.

---

## 5 Critical Rules

1. **Zero-Backend & Static Hosting Constraint**: Render Flow runs 100% in the browser on GitHub Pages. Never suggest or implement any backend, serverless API, server-rendered route, background worker, or external database.
2. **File-Disjoint Scoping**: Never modify existing conversion hooks (`useHtmlToPngConversion.js`, `useMermaidToPngConversion.js`, `useLatexToPngConversion.js`) when implementing a new feature or mode. New features get new files.
3. **Diagnose Before Fixing**: Never combine diagnostic investigation and bug fixing into a single task. Diagnose first, present evidence and raw observed logs, and wait for confirmation before proposing a targeted fix. One change at a time.
4. **Accuracy First & Content/Layout Separation**: Math formulas, equations, and diagrams must be 100% mathematically accurate. Content describes semantic meaning; the client-side renderer determines layout. Layout is secondary to correctness.
5. **200M Pixel Canvas Guardrail**: Every PNG conversion pipeline must enforce the `finalWidth * finalHeight <= 200,000,000` total pixel guardrail post-DPI scaling before allocating any canvas or image buffer.
