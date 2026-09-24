## 2025-05-18 - Fullscreen Preview Modal Keyboard Accessibility
**Learning:** In modal image view overlays or interactive preview containers, non-interactive elements like `<img>` and `<div>` overlays used as click targets must explicitly define `role="button"`, `tabIndex={0}`, descriptive `aria-label` text, and keyboard event handlers (`Enter`, `Space`, `Escape`) to satisfy WCAG keyboard navigation standards without altering design layouts.
**Action:** When creating image preview popups or overlay modals, ensure `onKeyDown` handles `Enter`/`Space` for opening and `Escape` (plus window listener) for closing, and add matching ARIA roles.

## 2025-05-18 - Mode Switcher Tablist Accessibility Pattern
**Learning:** In Neumorphic tab controls where visual state uses `.neu-recessed` (active) and `.neu-raised` (inactive), screen readers cannot infer selection state without explicit ARIA tab semantics (`role="tablist"`, `role="tab"`, and `aria-selected`).
**Action:** Always wrap mode switcher tab groups in `role="tablist"` with an `aria-label`, and mark tab buttons with `role="tab"` and dynamic `aria-selected` attributes matching active state.

## 2025-05-18 - Multi-platform Keyboard Shortcut Pattern for Textarea Submission
**Learning:** In text editors/code input cards, users expect standard IDE shortcuts (`Ctrl+Enter` on Windows/Linux, `Cmd+Enter` / `e.metaKey` on macOS) to trigger submit actions without needing to tab out or click buttons. Pair this with `title` attributes on submit buttons to make the shortcut discoverable, and `aria-keyshortcuts="Control+Enter Meta+Enter"` on textareas and submit buttons for assistive technologies.
**Action:** Add `aria-keyshortcuts="Control+Enter Meta+Enter"` to textareas and submission buttons when `Ctrl+Enter` / `Cmd+Enter` shortcuts are enabled.

## 2025-05-18 - Modal Overlay React Portals & Stacking Context Isolation
**Learning:** Fixed overlay modals rendered inside nested layout containers with `position: relative` and low `z-index` (e.g. `<main style={{ z-index: 2 }}>`) become trapped within that container's local stacking context, causing higher `z-index` header elements (e.g. `<header style={{ z-index: 100 }}>`) to overlap modal controls.
**Action:** Render modal overlays via `createPortal(..., document.body)` so they mount at root DOM level, escaping local parent stacking contexts and ensuring overlay controls sit unobstructed above fixed/sticky headers.

## 2025-05-18 - Export Action Download Feedback Consistency
**Learning:** In export/download actions where file generation runs asynchronously, displaying temporary visual confirmation ("✓ Downloaded!") upon completion reassures users that their file was generated and saved without requiring them to inspect browser download popups.
**Action:** Always provide a 2-second success state (e.g. `isDownloaded`) on export buttons following asynchronous file save actions.

## 2025-05-18 - Screen Reader Status Announcements for Async Exports
**Learning:** Visual-only feedback on export buttons (like "Exporting..." or "✓ Downloaded!") is invisible to screen reader users unless paired with a visually hidden (`sr-only`) `role="status"` live region (`aria-live="polite"`). Differentiating multiple status regions on a single page using descriptive `aria-label`s prevents query collisions in Testing Library and screen readers.
**Action:** Include a dedicated `<div role="status" aria-label="..." aria-live="polite" className="sr-only">` to announce workflow state transitions for asynchronous export/download and print preparation actions.
