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
});
