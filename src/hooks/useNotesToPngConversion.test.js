import { renderHook, act } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import {
  useNotesToPngConversion,
  getContentLengthAndGraphFlag,
  computeFallbackHeightMm,
  flattenPagesItems,
  prepareItemsToMeasure,
  assemblePages
} from './useNotesToPngConversion';

describe('useNotesToPngConversion', () => {
  test('validates valid JSON string', () => {
    const { result } = renderHook(() => useNotesToPngConversion());
    const validJson = JSON.stringify({ chapter: { title: "Test", subtitle: "Sub" }, pages: [] });

    act(() => {
      const res = result.current.validateJson(validJson);
      expect(res.valid).toBe(true);
    });

    expect(result.current.validationSuccess).toBe('Valid JSON format.');
    expect(result.current.validationError).toBe(null);
  });

  test('validates invalid JSON string', () => {
    const { result } = renderHook(() => useNotesToPngConversion());
    const invalidJson = '{"chapter": "Test",}';

    act(() => {
      const res = result.current.validateJson(invalidJson);
      expect(res.valid).toBe(false);
    });

    expect(result.current.validationError).toBeTruthy();
    expect(result.current.validationSuccess).toBe(null);
  });

  test('generates result for valid JSON', async () => {
    const { result } = renderHook(() => useNotesToPngConversion());
    const jsonObj = { chapter: { title: "Ch1", subtitle: "Sub" }, pages: [{ items: [] }] };

    await act(async () => {
      await result.current.handleGenerate(JSON.stringify(jsonObj));
    });

    expect(result.current.result).toEqual({
      chapter: { title: "Ch1", subtitle: "Sub" },
      pages: [],
      totalPages: 0
    });
    expect(result.current.validationError).toBe(null);
  });

  test('resets state properly', async () => {
    const { result } = renderHook(() => useNotesToPngConversion());
    const jsonObj = {
      chapter: { title: "Ch1", subtitle: "Sub" },
      pages: [
        {
          items: [
            {
              type: "question",
              number: 1,
              question: [{ type: "text", content: "Q1" }],
              solution: [{ type: "text", content: "S1" }]
            }
          ]
        }
      ]
    };

    await act(async () => {
      await result.current.handleGenerate(JSON.stringify(jsonObj));
    });
    expect(result.current.result).toBeTruthy();

    act(() => {
      result.current.handleReset();
    });

    expect(result.current.result).toBe(null);
    expect(result.current.validationError).toBe(null);
    expect(result.current.validationSuccess).toBe(null);
  });

  test('benchmark handleGenerate fallback measurement calculation performance for 100 items', async () => {
    const { result } = renderHook(() => useNotesToPngConversion());

    const items = Array.from({ length: 100 }, (_, i) => ({
      type: "question",
      number: i + 1,
      question: [{ type: "text", content: `Question ${i + 1} with sample text for testing performance.` }],
      solution: [
        { type: "text", content: `Solution ${i + 1} with details.` },
        { type: "coordinate_graph", points: [{ x: 0, y: 0 }] }
      ]
    }));

    const jsonObj = {
      chapter: { title: "Benchmark Chapter", subtitle: "Performance Test" },
      pages: [{ items }]
    };

    const start = performance.now();
    await act(async () => {
      await result.current.handleGenerate(JSON.stringify(jsonObj));
    });
    const duration = performance.now() - start;

    console.log(`[Benchmark handleGenerate] 100 items in JSDOM duration: ${duration.toFixed(2)}ms`);
    expect(result.current.result).toBeTruthy();
    expect(result.current.result.pages.length).toBeGreaterThan(0);
  }, 30000);

  test('benchmark array flattening: flatMap+map vs single-pass loop for 10,000 items across 1,000 pages', () => {
    const pages = Array.from({ length: 1000 }, (_, p) => ({
      items: Array.from({ length: 10 }, (_, i) => ({
        type: 'question',
        number: p * 10 + i + 1,
        question: 'Sample question'
      }))
    }));
    const parsed = { pages };

    // Baseline: flatMap + map
    const iterations = 50;
    const startFlatMap = performance.now();
    for (let iter = 0; iter < iterations; iter += 1) {
      let itemCounter = 0;
      const flattenedItems = Array.isArray(parsed.pages)
        ? parsed.pages.flatMap(page =>
            Array.isArray(page?.items)
              ? page.items.map(item => {
                  itemCounter += 1;
                  return {
                    ...item,
                    id: item.id || `item-${itemCounter}`
                  };
                })
              : []
          )
        : [];
      expect(flattenedItems.length).toBe(10000);
    }
    const flatMapDuration = performance.now() - startFlatMap;

    // Single-pass loop
    const startLoop = performance.now();
    for (let iter = 0; iter < iterations; iter += 1) {
      const flattenedItems = [];
      if (Array.isArray(parsed.pages)) {
        let itemCounter = 0;
        const pageList = parsed.pages;
        for (let p = 0; p < pageList.length; p += 1) {
          const page = pageList[p];
          if (Array.isArray(page?.items)) {
            const items = page.items;
            for (let i = 0; i < items.length; i += 1) {
              const item = items[i];
              itemCounter += 1;
              flattenedItems.push({
                ...item,
                id: item.id || `item-${itemCounter}`
              });
            }
          }
        }
      }
      expect(flattenedItems.length).toBe(10000);
    }
    const loopDuration = performance.now() - startLoop;

    console.log(`[Benchmark Array Flattening] 50 runs x 10,000 items -> flatMap+map: ${flatMapDuration.toFixed(2)}ms, single loop: ${loopDuration.toFixed(2)}ms`);
  });
});

describe('useNotesToPngConversion extracted helper functions', () => {
  describe('getContentLengthAndGraphFlag', () => {
    test('handles null, empty, string, and number inputs', () => {
      expect(getContentLengthAndGraphFlag(null)).toEqual({ len: 0, hasGraph: false });
      expect(getContentLengthAndGraphFlag('')).toEqual({ len: 0, hasGraph: false });
      expect(getContentLengthAndGraphFlag('Hello world')).toEqual({ len: 11, hasGraph: false });
      expect(getContentLengthAndGraphFlag(12345)).toEqual({ len: 5, hasGraph: false });
    });

    test('parses array of strings and content objects with graphs', () => {
      const arrayInput = [
        'Intro text',
        { type: 'text', content: 'Detailed question' },
        { type: 'equation', latex: 'e = mc^2' },
        { type: 'coordinate_graph', text: 'Graph label' }
      ];
      const res = getContentLengthAndGraphFlag(arrayInput);
      expect(res.hasGraph).toBe(true);
      expect(res.len).toBe('Intro text'.length + 'Detailed question'.length + 'e = mc^2'.length + 'Graph label'.length);
    });
  });

  describe('computeFallbackHeightMm', () => {
    test('computes base height for simple question without graph', () => {
      const item = {
        question: [{ type: 'text', content: 'Short question' }],
        solution: [{ type: 'text', content: 'Short solution' }]
      };
      const height = computeFallbackHeightMm(item);
      expect(height).toBeGreaterThanOrEqual(40);
    });

    test('adds graph height bonus when graph is present', () => {
      const itemWithoutGraph = {
        question: [{ type: 'text', content: 'Short question' }],
        solution: [{ type: 'text', content: 'Short solution' }]
      };
      const itemWithGraph = {
        type: 'coordinate_graph',
        question: [{ type: 'text', content: 'Short question' }],
        solution: [{ type: 'text', content: 'Short solution' }]
      };

      expect(computeFallbackHeightMm(itemWithGraph) - computeFallbackHeightMm(itemWithoutGraph)).toBe(110);
    });
  });

  describe('flattenPagesItems', () => {
    test('handles empty or non-array inputs', () => {
      expect(flattenPagesItems(null)).toEqual([]);
      expect(flattenPagesItems(undefined)).toEqual([]);
      expect(flattenPagesItems([])).toEqual([]);
    });

    test('flattens pages items preserving explicit IDs and generating missing IDs', () => {
      const pages = [
        {
          items: [
            { id: 'custom-1', question: 'Q1' },
            { question: 'Q2' }
          ]
        },
        {
          items: [
            { question: 'Q3' }
          ]
        }
      ];

      const res = flattenPagesItems(pages);
      expect(res).toEqual([
        { id: 'custom-1', question: 'Q1' },
        { id: 'item-2', question: 'Q2' },
        { id: 'item-3', question: 'Q3' }
      ]);
    });
  });

  describe('prepareItemsToMeasure', () => {
    test('prepares elements and target structures for items', () => {
      const items = [
        { id: 'item-1', number: 1, question: [{ type: 'text', content: 'Q1' }], solution: [{ type: 'text', content: 'S1' }] }
      ];

      const measured = prepareItemsToMeasure(items);
      expect(measured).toHaveLength(1);
      expect(measured[0].id).toBe('item-1');
      expect(measured[0].rawItem).toBe(items[0]);
      expect(measured[0].element).toBeTruthy();
      expect(measured[0].element.style.height).toBeTruthy();
    });
  });

  describe('assemblePages', () => {
    test('assembles normal and overflow pages correctly', () => {
      const flattenedItems = [
        { id: 'item-1', name: 'Item 1' },
        { id: 'item-2', name: 'Item 2' },
        { id: 'item-3', name: 'Item 3' }
      ];

      const pageItemIds = [['item-1', 'item-2']];
      const overflowItems = ['item-3'];

      const pages = assemblePages(pageItemIds, overflowItems, flattenedItems);
      expect(pages).toHaveLength(2);
      expect(pages[0]).toEqual({
        pageIndex: 0,
        isOverflow: false,
        items: [flattenedItems[0], flattenedItems[1]]
      });
      expect(pages[1]).toEqual({
        pageIndex: 1,
        isOverflow: true,
        items: [flattenedItems[2]]
      });
    });
  });
});
