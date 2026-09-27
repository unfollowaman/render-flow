import { renderHook, act } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { useNotesToPngConversion } from './useNotesToPngConversion';

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
