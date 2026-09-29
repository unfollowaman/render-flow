## 2025-05-18 - Fullscreen Preview Modal Keyboard Accessibility
**Learning:** In modal image view overlays or interactive preview containers, non-interactive elements like `<img>` and `<div>` overlays used as click targets must explicitly define `role="button"`, `tabIndex={0}`, descriptive `aria-label` text, and keyboard event handlers (`Enter`, `Space`, `Escape`) to satisfy WCAG keyboard navigation standards without altering design layouts.
**Action:** When creating image preview popups or overlay modals, ensure `onKeyDown` handles `Enter`/`Space` for opening and `Escape` (plus window listener) for closing, and add matching ARIA roles.

## 2025-05-18 - Mode Switcher Tablist Accessibility Pattern
**Learning:** In Neumorphic tab controls where visual state uses `.neu-recessed` (active) and `.neu-raised` (inactive), screen readers cannot infer selection state without explicit ARIA tab semantics (`role="tablist"`, `role="tab"`, and `aria-selected`). Roving `tabIndex` (`0` for active tab, `-1` for inactive tabs) paired with arrow key navigation (`ArrowRight`/`ArrowLeft`/`ArrowUp`/`ArrowDown`/`Home`/`End`) allows keyboard users to navigate between tabs seamlessly without tabbing through every tab stop.
**Action:** Always wrap mode switcher tab groups in `role="tablist"` with an `aria-label`, mark tab buttons with `role="tab"`, dynamic `aria-selected`, roving `tabIndex`, and arrow key handlers that automatically update active state and focus the target tab button.

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

## 2026-09-27 - Drag-and-Drop Editor Import Parity & Validation Feedback
**Learning:** When multi-mode input editors offer file uploads (like HTML or JSON imports), providing consistent drag-and-drop support across all modes with visual drag hover overlays (`dropZoneActive`), file extension/MIME type validation, and `aria-live` status announcements prevents user confusion and accidental page navigation when dropping files onto textareas.
**Action:** Ensure all file-import drop zones validate file types before reading, display a visual drop target indicator during `onDragOver`, and announce upload success or validation errors via a `role="status"` live region.

## 2026-09-27 - Zoom Level ARIA Spinbutton & Keyboard Navigation Pattern
**Learning:** Text representations of adjustable numerical metrics (such as zoom levels or page scale indicators) lack accessibility semantics unless marked up as `role="spinbutton"`. Providing `tabIndex={0}`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-valuetext`, and key handlers (`ArrowUp`/`ArrowDown`/`ArrowLeft`/`ArrowRight`, `Home`, `End`) allows keyboard and screen reader users to discover and modify numerical values directly.
**Action:** Model interactive scale and zoom indicators as `role="spinbutton"` widgets with complete ARIA value properties and key handlers for directional key steps and boundary bounds (`Home`/`End`).
