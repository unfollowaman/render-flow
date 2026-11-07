# Agent Prompt Templates

Use these prompt skeletons when delegating tasks to AI agents working on Render Flow. Each template enforces the workspace hard rules, file-disjoint scoping, and mandatory verification artifacts.

---

## 1. Feature Implementation Task Template

```markdown
ROLE & CONTEXT:
You are an expert React/Vite developer working on the Render Flow repository.
Read AGENTS.md, .agent/rules/project-rules.md, and .agent/workflows/new-feature.md before starting.
Render Flow is 100% client-side with zero backend, hosted statically on GitHub Pages.

TASK:
[Describe the feature to be added in concise, clear detail.]

SCOPING & CONSTRAINTS:
1. Single-file scope when possible: Keep changes isolated to a new component, hook, or utility file.
2. File-disjoint scoping: Never modify existing conversion hooks (useHtmlToPngConversion.js, useMermaidToPngConversion.js, useLatexToPngConversion.js, useNotesToPngConversion.js). Create new files for new capabilities.
3. Guardrails: If working with canvas/PNG export, enforce the 200,000,000 pixel area limit before canvas allocation.
4. DO-NOT-TOUCH LIST:
   - package.json / package-lock.json (unless adding a pre-approved library)
   - vite.config.js
   - src/hooks/useHtmlToPngConversion.js
   - src/hooks/useMermaidToPngConversion.js
   - src/hooks/useLatexToPngConversion.js
   - Existing CSS Modules outside task scope

VERIFICATION & ARTIFACT:
At the conclusion of the task, you MUST provide a structured report containing:
1. List of files created or modified.
2. Line numbers of all new additions or integrations.
3. Git diff summary.
4. Output of `npm run test` and `npm run build` confirming clean build.
```

---

## 2. Bug Diagnostic Task Template (Investigation Only)

```markdown
ROLE & CONTEXT:
You are a diagnostic investigator on Render Flow.
Read AGENTS.md, .agent/rules/project-rules.md, and .agent/workflows/diagnose-bug.md before starting.

STRICT CONSTRAINT:
This is an INVESTIGATION ONLY task. Diagnose before fixing. Do NOT apply any fixes or alter application logic. One change at a time.

REPORTED DEFECT:
- Mode / Location: [e.g. LaTeX mode / Notes Mode pagination / Mermaid rendering]
- Exact Error Message Wording: "[Paste exact error message or stack trace here]"
- Expected Behavior: [What should occur]
- Observed Behavior: [What actually occurs]

INVESTIGATION PROCEDURE:
1. Scope: Inspect only files related to this specific failure path.
2. DO-NOT-TOUCH LIST:
   - Do not modify application logic.
   - Do not install packages.
   - Do not edit unrelated files.
3. Temporary Instrumentation: Add targeted `console.log` statements around input parsing, DOM measurement, or rendering execution.
4. Execute reproduction scenario.
5. Capture and output raw, unedited, verbatim console-logged values and errors. Never report a result you did not actually observe.

VERIFICATION & ARTIFACT:
Provide an investigation report with:
1. Exact file paths and line numbers where the root cause originates.
2. Empirical evidence and verbatim logs proving the root cause.
3. Proposed fix description (for human review and approval).
4. Explicit list of all temporary `console.log` lines to be removed before fixing.
```

---

## 3. Bug Fix Task Template (Targeted Fix)

```markdown
ROLE & CONTEXT:
You are an engineer applying an approved bug fix in Render Flow.
Read AGENTS.md, .agent/rules/project-rules.md, and .agent/workflows/pre-commit-check.md before starting.

TARGET DEFECT:
- Problem: [Brief summary of the approved root cause]
- Exact Error Message Wording: "[Paste exact error message or symptom here]"
- Diagnostic Reference: [Link or cite diagnostic report/findings]

CONSTRAINTS & SCOPING:
1. Single-file scope when possible: Limit edits strictly to the file containing the bug.
2. Do not introduce new libraries or backend dependencies.
3. Remove all temporary diagnostic `console.log` statements added during investigation.
4. DO-NOT-TOUCH LIST:
   - Do not touch unrelated mode hooks or components.
   - Do not touch package.json or lockfiles.
   - Do not alter public font assets or configuration files.

VERIFICATION & ARTIFACT:
Run tests and build, then output a completion artifact containing:
1. Exact file path and line numbers modified.
2. A complete git diff of the fix.
3. Test suite execution output (`npm run test`) demonstrating passing status.
4. Production build output (`npm run build`) confirming successful compilation.
```
