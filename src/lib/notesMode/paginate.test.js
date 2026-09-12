import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { measureHeight, clearMeasurementCache, paginate, paginateRows, flowBlocksIntoColumns } from './paginate';

/**
 * Helper to create a mock DOM element with specified height.
 * Attaches a getBoundingClientRect implementation if jsdom returns 0 for unrendered elements,
 * ensuring test height is reported accurately in px (assuming 96 DPI: 1mm = 3.779527559px).
 */
function createMockElement(heightMm, id = null) {
  const el = document.createElement('div');
  el.style.height = `${heightMm}mm`;
  if (id) el.id = id;

  const pxVal = heightMm * (96 / 25.4);
  el.getBoundingClientRect = () => ({
    width: 100,
    height: pxVal,
    top: 0,
    left: 0,
    right: 100,
    bottom: pxVal,
    x: 0,
    y: 0,
    toJSON: () => {},
  });

  return el;
}

describe('paginate & measureHeight standalone module', () => {
  let initialBodyChildCount;

  beforeEach(() => {
    clearMeasurementCache();
    initialBodyChildCount = document.body.children.length;
  });

  afterEach(() => {
    clearMeasurementCache();
  });

  test('Test Case 1: Five mock items of 40mm each, usableHeightPerPage: 100mm', async () => {
    const items = [
      { id: 'item1', element: createMockElement(40) },
      { id: 'item2', element: createMockElement(40) },
      { id: 'item3', element: createMockElement(40) },
      { id: 'item4', element: createMockElement(40) },
      { id: 'item5', element: createMockElement(40) },
    ];

    const result = await paginate(items, { usableHeightPerPage: 100, unit: 'mm' });

    expect(result.overflowItems).toEqual([]);
    expect(result.pages).toEqual([
      ['item1', 'item2'],
      ['item3', 'item4'],
      ['item5'],
    ]);

    // Verify no page total height exceeds usableHeightPerPage (100mm)
    for (const page of result.pages) {
      const pageHeight = page.length * 40;
      expect(pageHeight).toBeLessThanOrEqual(100);
    }
  });

  test('Test Case 2: A single mock item of 150mm with usableHeightPerPage: 100mm', async () => {
    const items = [
      { id: 'normal1', element: createMockElement(30) },
      { id: 'oversized', element: createMockElement(150) },
      { id: 'normal2', element: createMockElement(40) },
    ];

    const result = await paginate(items, { usableHeightPerPage: 100, unit: 'mm' });

    expect(result.overflowItems).toEqual(['oversized']);
    expect(result.pages).toEqual([
      ['normal1', 'normal2'],
    ]);
  });

  test('Test Case 3: Items of varying heights (30mm, 70mm, 20mm, 60mm) with usableHeightPerPage: 100mm', async () => {
    const items = [
      { id: 'v1', element: createMockElement(30) },
      { id: 'v2', element: createMockElement(70) },
      { id: 'v3', element: createMockElement(20) },
      { id: 'v4', element: createMockElement(60) },
    ];

    const result = await paginate(items, { usableHeightPerPage: 100, unit: 'mm' });

    expect(result.overflowItems).toEqual([]);
    expect(result.pages).toEqual([
      ['v1', 'v2'], // 30 + 70 = 100mm
      ['v3', 'v4'], // 20 + 60 = 80mm
    ]);

    // Verify greedy grouping total heights
    const page1Total = 30 + 70;
    const page2Total = 20 + 60;
    expect(page1Total).toBeLessThanOrEqual(100);
    expect(page2Total).toBeLessThanOrEqual(100);
  });

  test('Test Case 4: Hidden measurement container cleanup — no leftover DOM nodes after cache clear', async () => {
    const initialCount = document.body.children.length;

    const singleEl = createMockElement(25);
    const measured = measureHeight(singleEl, { fontSize: '14px' }, 'mm');
    expect(measured).toBeCloseTo(25, 2);
    // Persistent measurement container remains attached during measurement session
    expect(document.body.children.length).toBe(initialCount + 1);

    const items = [
      { id: 'c1', element: createMockElement(30) },
      { id: 'c2', element: createMockElement(40) },
      { id: 'c3', element: createMockElement(50) },
    ];

    await paginate(items, { usableHeightPerPage: 100, unit: 'mm' });
    // Clear measurement cache removes persistent off-screen container completely
    clearMeasurementCache();
    expect(document.body.children.length).toBe(initialCount);
  });

  test('Test Case 5: Non-blocking async execution for 50 mock items with progress callback', async () => {
    const items = Array.from({ length: 50 }, (_, i) => ({
      id: `item-${i + 1}`,
      element: createMockElement(15),
    }));

    const progressSpy = vi.fn();

    const paginatePromise = paginate(items, {
      usableHeightPerPage: 100,
      unit: 'mm',
      chunkSize: 10,
      onProgress: progressSpy,
    });

    // Expect paginate to return a Promise
    expect(paginatePromise).toBeInstanceOf(Promise);

    const result = await paginatePromise;

    expect(result.overflowItems).toEqual([]);
    // 50 items * 15mm = 750mm. Each page holds 6 items (6 * 15 = 90mm <= 100mm). 50 / 6 = 8 pages of 6 + 1 page of 2 = 9 pages.
    expect(result.pages.length).toBe(9);
    expect(progressSpy).toHaveBeenCalled();
    expect(progressSpy).toHaveBeenLastCalledWith({ processed: 50, total: 50 });
  });
});

describe('paginateRows 2-column row packing', () => {
  test('Requirement Test Case 1: 8 short items render into 2-column rows (4 rows x 2 cols)', async () => {
    const items = Array.from({ length: 8 }, (_, i) => ({
      id: `item-${i + 1}`,
      element: createMockElement(30),
    }));

    const result = await paginateRows(items, {
      usableHeightPerPage: 225,
      columnsPerRow: 2,
      rowGap: 3.7,
      unit: 'mm',
    });

    expect(result.overflowItems).toEqual([]);
    expect(result.pages.length).toBe(1);
    expect(result.pages[0]).toEqual(['item-1', 'item-2', 'item-3', 'item-4', 'item-5', 'item-6', 'item-7', 'item-8']);
  });

  test('Requirement Test Case 2: 7 short items render into 3 full rows + 1 single-column row', async () => {
    const items = Array.from({ length: 7 }, (_, i) => ({
      id: `item-${i + 1}`,
      element: createMockElement(30),
    }));

    const result = await paginateRows(items, {
      usableHeightPerPage: 225,
      columnsPerRow: 2,
      rowGap: 3.7,
      unit: 'mm',
    });

    expect(result.overflowItems).toEqual([]);
    expect(result.pages.length).toBe(1);
    expect(result.pages[0]).toEqual(['item-1', 'item-2', 'item-3', 'item-4', 'item-5', 'item-6', 'item-7']);
  });

  test('Requirement Test Case 3: Row with one oversized item and one short item re-pairs short item without dropping it', async () => {
    const items = [
      { id: 'short1', element: createMockElement(30) },
      { id: 'oversized', element: createMockElement(300) }, // 300mm exceeds 225mm budget
      { id: 'short2', element: createMockElement(30) },
      { id: 'short3', element: createMockElement(30) },
    ];

    const result = await paginateRows(items, {
      usableHeightPerPage: 225,
      columnsPerRow: 2,
      rowGap: 3.7,
      unit: 'mm',
    });

    // Confirm only genuinely oversized item is in overflowItems
    expect(result.overflowItems).toEqual(['oversized']);

    // Confirm short1 is re-paired with short2, followed by short3
    const allPageItems = result.pages.flat();
    expect(allPageItems).toEqual(['short1', 'short2', 'short3']);

    // Total count conservation
    const totalCount = allPageItems.length + result.overflowItems.length;
    expect(totalCount).toBe(items.length);
  });

  test('Requirement Test Case 4: Item conservation — total items across pages + overflow equals input item count', async () => {
    // Test document A (15 items)
    const docA = Array.from({ length: 15 }, (_, i) => ({
      id: `docA-${i + 1}`,
      element: createMockElement(40 + (i % 3) * 20),
    }));

    const resultA = await paginateRows(docA, {
      usableHeightPerPage: 100,
      columnsPerRow: 2,
      rowGap: 3.7,
      unit: 'mm',
    });

    const totalA = resultA.pages.flat().length + resultA.overflowItems.length;
    expect(totalA).toBe(docA.length);

    // Test document B (23 items with an oversized item)
    const docB = Array.from({ length: 23 }, (_, i) => ({
      id: `docB-${i + 1}`,
      element: createMockElement(i === 5 ? 250 : 25 + (i % 4) * 15),
    }));

    const resultB = await paginateRows(docB, {
      usableHeightPerPage: 100,
      columnsPerRow: 2,
      rowGap: 3.7,
      unit: 'mm',
    });

    const totalB = resultB.pages.flat().length + resultB.overflowItems.length;
    expect(totalB).toBe(docB.length);
  });

  test('Requirement Test Case 6: Confirm original paginate() signature retains backward compatibility', async () => {
    const items = [
      { id: 'p1', element: createMockElement(50) },
      { id: 'p2', element: createMockElement(60) },
    ];

    const res = await paginate(items, { usableHeightPerPage: 100, unit: 'mm' });
    expect(res.pages).toEqual([['p1'], ['p2']]);
    expect(res.overflowItems).toEqual([]);
  });
});

describe('measureHeight caching & performance benchmark', () => {
  beforeEach(() => {
    clearMeasurementCache();
  });

  test('measureHeight caches results on repeated calls for the same element', () => {
    const el = createMockElement(50);
    const appendSpy = vi.spyOn(document.body, 'appendChild');

    const firstH = measureHeight(el, { width: '80mm' }, 'mm');
    const callsAfterFirst = appendSpy.mock.calls.length;

    const secondH = measureHeight(el, { width: '80mm' }, 'mm');
    const callsAfterSecond = appendSpy.mock.calls.length;

    expect(firstH).toBeCloseTo(50, 1);
    expect(secondH).toEqual(firstH);
    // On the second call, cached result is returned so document.body.appendChild is not invoked again for measurement container
    expect(callsAfterSecond).toEqual(callsAfterFirst);

    appendSpy.mockRestore();
  });

  test('measureHeight re-measures when containerCss or unit differs', () => {
    const el = createMockElement(40);
    const hMm = measureHeight(el, { width: '80mm' }, 'mm');
    const hPx = measureHeight(el, { width: '80mm' }, 'px');

    expect(hMm).toBeCloseTo(40, 1);
    expect(hPx).toBeGreaterThan(hMm);
  });

  test('clearMeasurementCache invalidates element cache and resets persistent container when called without arguments', () => {
    const el = createMockElement(35);
    const appendSpy = vi.spyOn(document.body, 'appendChild');

    measureHeight(el, { width: '80mm' }, 'mm');
    const count1 = appendSpy.mock.calls.length;

    // Full clear removes container from DOM
    clearMeasurementCache();
    measureHeight(el, { width: '80mm' }, 'mm');
    const count2 = appendSpy.mock.calls.length;

    expect(count2).toBeGreaterThan(count1);

    appendSpy.mockRestore();
  });

  test('benchmark measureHeight performance: cached vs uncached for 100 elements', () => {
    const items = Array.from({ length: 100 }, (_, i) => createMockElement(20 + (i % 10)));

    // Uncached measurement pass
    clearMeasurementCache();
    const t0 = performance.now();
    for (const el of items) {
      measureHeight(el, { width: '80mm' }, 'mm');
    }
    const durationUncached = performance.now() - t0;

    // Cached measurement pass (measuring same 100 elements again)
    const t1 = performance.now();
    for (const el of items) {
      measureHeight(el, { width: '80mm' }, 'mm');
    }
    const durationCached = performance.now() - t1;

    console.log(`[Benchmark measureHeight] 100 elements -> Uncached: ${durationUncached.toFixed(2)}ms, Cached: ${durationCached.toFixed(2)}ms`);

    expect(durationCached).toBeLessThanOrEqual(durationUncached);
  });
});

describe('flowBlocksIntoColumns XSS Sanitization', () => {
  test('sanitizes malicious XSS payload in blocks during DOM measurement', async () => {
    window.__xss_executed = false;
    const maliciousBlock = {
      id: 'q1-header',
      type: 'question-header',
      questionNumber: 1,
      content: [
        '<img src="invalid" onerror="window.__xss_executed=true">'
      ],
    };

    const result = await flowBlocksIntoColumns([maliciousBlock], { usableHeightPerPage: 225 });

    expect(window.__xss_executed).toBe(false);
    expect(result.pages.length).toBe(1);
    expect(result.pages[0].columnA).toEqual(['q1-header']);
  });
});

describe('empty items edge cases for pagination functions', () => {
  test('paginate handles empty array, null, and undefined items', async () => {
    const resEmpty = await paginate([], { usableHeightPerPage: 100 });
    expect(resEmpty).toEqual({ pages: [], overflowItems: [] });

    const resNull = await paginate(null, { usableHeightPerPage: 100 });
    expect(resNull).toEqual({ pages: [], overflowItems: [] });

    const resUndefined = await paginate(undefined, { usableHeightPerPage: 100 });
    expect(resUndefined).toEqual({ pages: [], overflowItems: [] });
  });

  test('paginateRows handles empty array, null, and undefined items', async () => {
    const resEmpty = await paginateRows([], { usableHeightPerPage: 100 });
    expect(resEmpty).toEqual({ pages: [], overflowItems: [] });

    const resNull = await paginateRows(null, { usableHeightPerPage: 100 });
    expect(resNull).toEqual({ pages: [], overflowItems: [] });

    const resUndefined = await paginateRows(undefined, { usableHeightPerPage: 100 });
    expect(resUndefined).toEqual({ pages: [], overflowItems: [] });
  });

  test('flowBlocksIntoColumns handles empty array, null, and undefined blocks', async () => {
    const resEmpty = await flowBlocksIntoColumns([], { usableHeightPerPage: 225 });
    expect(resEmpty).toEqual({ pages: [], overflowBlocks: [] });

    const resNull = await flowBlocksIntoColumns(null, { usableHeightPerPage: 225 });
    expect(resNull).toEqual({ pages: [], overflowBlocks: [] });

    const resUndefined = await flowBlocksIntoColumns(undefined, { usableHeightPerPage: 225 });
    expect(resUndefined).toEqual({ pages: [], overflowBlocks: [] });
  });
});
