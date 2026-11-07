# Workflow: Diagnose Bug (Investigation Only)

Follow this procedure when investigating bugs, unexpected behavior, or rendering anomalies in Render Flow.

> [!IMPORTANT]
> **Strict Diagnostic Constraint**: Diagnose before fixing. Never combine diagnosis and fix in one task. One change at a time. Do not apply fixes during this workflow.

---

## Steps

### 1. Reproduce the Issue
- Identify the exact inputs, conversion mode, browser environment, or edge case triggering the failure.
- Formulate a clear hypothesis regarding where the failure occurs in the pipeline.

### 2. Add Temporary Instrumentation
- Add targeted, temporary `console.log` statements around suspected failure points (e.g., input parsing, dimension calculation, DOM measurement, font loading, or canvas rendering).
- Do not make any structural code changes or speculative fixes while instrumenting.

### 3. Capture Verbatim Output
- Execute the test or reproduction scenario.
- Output raw, unedited, verbatim console-logged values and error stack traces.
- Do not summarize or paraphrase observed outputs.
- Never report a result you did not actually observe. If an environment or test cannot be run, say so explicitly.

### 4. State Root Cause with Evidence
- Provide the exact file path and line numbers where the bug originates.
- Cite the empirical evidence from the captured console output and code references that proves the root cause.

### 5. Propose Fix (Do NOT Apply)
- Detail the proposed solution and architecture.
- Explain how the proposed change will resolve the issue without regressing existing features or violating project constraints.
- Await user approval before touching code to apply the fix.

### 6. List Instrumentation to Remove
- Enumerate every temporary `console.log` or debug line added in Step 2 with exact file paths and line numbers so they can be cleaned up cleanly.
