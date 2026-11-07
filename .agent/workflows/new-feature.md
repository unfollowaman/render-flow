# Workflow: New Feature Implementation

Follow this procedure when implementing any new feature or enhancement in Render Flow.

---

## Steps

### 1. Confirm Scope & Architecture
- Review the task requirements and verify alignment with [AGENTS.md](file:///e:/Antigravity/Projects/render-flow/AGENTS.md) and [.agent/rules/project-rules.md](file:///e:/Antigravity/Projects/render-flow/.agent/rules/project-rules.md).
- Ensure the solution is 100% client-side with zero backend or server dependency.
- Enforce the **File-Disjoint Scoping** rule: Identify existing conversion hooks (`useHtmlToPngConversion.js`, `useMermaidToPngConversion.js`, `useLatexToPngConversion.js`, `useNotesToPngConversion.js`). Do **not** modify existing hooks for new feature work.

### 2. List Files to Touch
- Explicitly list all files planned to be created or touched before making modifications.
- Partition new functionality into dedicated new files (e.g. `src/hooks/use[Feature]Conversion.js`, `src/components/[Feature]Converter.jsx`, or `src/lib/[feature]/`).
- Define the "Do Not Touch" list of untouched baseline files.

### 3. Implement in New Files
- Create the new component, hook, or utility module.
- Adhere to project conventions:
  - Dynamic imports for large vendor libraries (`await import(...)`).
  - Strict 200,000,000 pixel canvas guardrail before canvas allocation.
  - DOMPurify sanitization on rendered markup.
  - `latestRequestIdRef` + `runIfLatest()` concurrency protection for asynchronous hooks.
  - Accessible Neumorphic UI patterns with ARIA attributes and keyboard navigation.

### 4. Verify Build and Tests
- Run tests:
  ```bash
  npm run test
  ```
- Run production build:
  ```bash
  npm run build
  ```
- Inspect build output for chunk size warnings, broken imports, or bundle regressions.

### 5. Report Changes
Provide a structured completion report containing:
- Exact file names created or modified.
- Line numbers of key additions and integrations.
- A concise summary of changes and diffs.
- Confirmation of successful build execution.
