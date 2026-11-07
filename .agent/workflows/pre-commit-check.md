# Workflow: Pre-Commit Check

Follow this checklist before creating commits or opening pull requests in Render Flow.

---

## Pre-Commit Verification Steps

### 1. Code Quality & Lint Check
- Verify JavaScript/JSX syntax and check for unused variables or syntax anomalies.
- *Note:* Render Flow does not have an automated `npm run lint` script in [package.json](file:///e:/Antigravity/Projects/render-flow/package.json). Review modified files manually or run `npm run test` to verify module import integrity.

### 2. Run Test Suite
- Execute all unit tests:
  ```bash
  npm run test
  ```
- Ensure 100% test pass rate across components, hooks, and Notes Mode utilities.

### 3. Run Production Build
- Execute Vite build to verify packaging and asset generation:
  ```bash
  npm run build
  ```
- Confirm build succeeds without fatal errors or unexpected chunk warning regressions.

### 4. Confirm No Debug Instrumentation Leftovers
- Scan modified files for temporary debug code:
  - Check for lingering `console.log`, `debugger`, or commented-out blocks.
  - Production code should only retain intentional diagnostic warnings (e.g. `console.warn` for non-critical font fallbacks).

### 5. Confirm No Secrets or Sensitive Data
- Verify no credentials, API keys, private tokens, or local environment paths (`.env`, auth tokens) are present in changed files.
- Remember: Render Flow is a 100% client-side, zero-backend public repository.

### 6. Summarize Changed Files & Git Status
- Check git status:
  ```bash
  git status
  ```
- Review the diff to confirm all modifications strictly match the approved task scope:
  ```bash
  git diff
  ```
- Commit in small increments with clear, conventional commit messages (e.g., `feat: ...`, `fix: ...`, `test: ...`, `docs: ...`).
