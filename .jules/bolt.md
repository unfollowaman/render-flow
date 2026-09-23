## 2025-09-16 - Single-Pass Async Regex String Replacement Optimization
**Learning:** Standard double-pass `replaceAsync` patterns (`str.replace(regex, fn)` to collect promises followed by `str.replace(regex, fn)` to insert results) scan large text inputs twice, doubling regex matching overhead. Refactoring to a single `exec()` loop with string slice builder improves performance by ~40% while preserving standard `String.prototype.replace` parameter semantics and non-global regex behavior.
**Action:** Use single-pass `RegExp.prototype.exec()` and `str.slice()` string builder when implementing async regex string replacement helpers.

## 2025-09-17 - LaTeX Equation Rendering Map Cache & Lazy DOM Element Instantiation Optimization
**Learning:** KaTeX parsing (`katex.renderToString`) combined with DOMPurify sanitization is CPU-intensive (~1-3ms per formula). Caching sanitized HTML strings in a module-level `Map` keyed by LaTeX expression and display mode reduces repeated equation rendering during pagination layout calculations and React re-renders to ~0.001ms (>1000x speedup). Additionally, using a getter for `element` avoids redundant `document.createElement('span')` and `innerHTML` parsing when callers only consume `res.html`.
**Action:** When returning DOM helper structures from formula/markup parsers, cache sanitized HTML strings and use lazy getters for DOM element properties.

## 2025-09-18 - JSON Schema Validation Module-Scoped Constant Sets Optimization
**Learning:** Instantiating `new Set(...)` inside per-item/element validation loop functions (`validateItem` and `validateContentElement`) causes thousands of object allocations on large JSON inputs. Hoisting constant Sets (`KNOWN_ITEM_TYPES`, `ALLOWED_TYPES`) to module scope eliminates garbage collection pressure and allocation overhead during schema validation.
**Action:** Declare lookup Sets and options maps as module-scoped constants outside per-element loops or validator functions.

## 2025-09-19 - WeakMap Caching of Container CSS JSON Serialization
**Learning:** In DOM height measurement routines (`measureHeight`), `JSON.stringify(containerCss)` is called repeatedly for every element when computing cache keys. Caching the stringified JSON output in a module-scoped `WeakMap` keyed by the `containerCss` object reference eliminates ~90% of cache key generation overhead (~5ms vs ~47ms for 100k calls).
**Action:** Use a `WeakMap` to cache serialized string representations of object options passed into repeated inner measurement/lookup loops.

## 2025-09-20 - Single-Pass JSON Data Structure Flattening Optimization
**Learning:** Nested array transformations using `pages.flatMap(p => p.items.map(...))` allocate thousands of intermediate arrays and closure callbacks on large inputs, as well as redundant shallow object copies (`{ ...item }`). Flattening data structures using single-pass imperative `for` loops and preserving original object references when `id` is present improves performance by ~37% while reducing memory allocations.
**Action:** Use single-pass imperative `for` loops instead of nested array methods (`flatMap`/`map`) when processing large document data trees.

## 2025-09-21 - Single-Pass Measured Row Construction Optimization
**Learning:** In `paginateRows`, transforming items via `items.map(...)` allocated `N` intermediate objects (`{ id, height, rawItem }`) and an array before grouping them into row chunks. Inline-measuring DOM element heights directly during single-pass row construction eliminates temporary object allocations and array copying without changing DOM reflow count or layout behavior.
**Action:** Measure element properties directly during row chunking loops rather than allocating intermediate mapped arrays of wrapper objects.
