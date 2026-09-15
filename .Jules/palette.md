## 2025-05-18 - Fullscreen Preview Modal Keyboard Accessibility
**Learning:** In modal image view overlays or interactive preview containers, non-interactive elements like `<img>` and `<div>` overlays used as click targets must explicitly define `role="button"`, `tabIndex={0}`, descriptive `aria-label` text, and keyboard event handlers (`Enter`, `Space`, `Escape`) to satisfy WCAG keyboard navigation standards without altering design layouts.
**Action:** When creating image preview popups or overlay modals, ensure `onKeyDown` handles `Enter`/`Space` for opening and `Escape` (plus window listener) for closing, and add matching ARIA roles.

## 2025-05-18 - Mode Switcher Tablist Accessibility Pattern
**Learning:** In Neumorphic tab controls where visual state uses `.neu-recessed` (active) and `.neu-raised` (inactive), screen readers cannot infer selection state without explicit ARIA tab semantics (`role="tablist"`, `role="tab"`, and `aria-selected`).
**Action:** Always wrap mode switcher tab groups in `role="tablist"` with an `aria-label`, and mark tab buttons with `role="tab"` and dynamic `aria-selected` attributes matching active state.
