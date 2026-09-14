import { describe, it, expect } from 'vitest';
import { arrayBufferToBase64 } from './useMermaidToPngConversion';

import { vi } from 'vitest';

import { renderHook, act } from '@testing-library/react';

describe('useMermaidToPngConversion security configuration', () => {
  it('initializes Mermaid with securityLevel set to strict', async () => {
    // Mock fetch for font loading
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    });

    // Mock Image
    globalThis.Image = class {
      constructor() {
        setTimeout(() => this.onload && this.onload(), 10);
      }
    };

    const mermaidModule = await import('mermaid');
    const mermaid = mermaidModule.default || mermaidModule;
    const initializeSpy = vi.spyOn(mermaid, 'initialize').mockImplementation(() => {});
    vi.spyOn(mermaid, 'render').mockResolvedValue({
      svg: '<svg viewBox="0 0 100 100"></svg>',
    });

    const { useMermaidToPngConversion } = await import('./useMermaidToPngConversion.js');
    const ref = { current: null };

    const { result } = renderHook(() => useMermaidToPngConversion({ outputRef: ref }));

    await act(async () => {
      await result.current.handleConvert('graph TD; A-->B;');
    });

    expect(initializeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        securityLevel: 'strict',
      })
    );
  });
});

describe('arrayBufferToBase64', () => {
  it('correctly converts empty ArrayBuffer', async () => {
    const buffer = new Uint8Array([]).buffer;
    expect(await arrayBufferToBase64(buffer)).toBe('');
  });

  it('correctly converts small ArrayBuffer', async () => {
    const text = 'Hello, World!';
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text);
    const expected = btoa(text);
    expect(await arrayBufferToBase64(bytes.buffer)).toBe(expected);
  });

  it('correctly converts large ArrayBuffer spanning multiple chunks', async () => {
    // Generate 100KB of random-ish bytes
    const size = 100 * 1024;
    const bytes = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      bytes[i] = i % 256;
    }
    const expected = Buffer.from(bytes).toString('base64');
    expect(await arrayBufferToBase64(bytes.buffer)).toBe(expected);
  });

  it('benchmark arrayBufferToBase64 performance', async () => {
    // Generate 2MB buffer simulating font file sizes
    const size = 2 * 1024 * 1024;
    const bytes = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      bytes[i] = (i * 31 + 17) % 256;
    }

    // Warmup
    await arrayBufferToBase64(bytes.buffer);

    const iterations = 50;
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      await arrayBufferToBase64(bytes.buffer);
    }
    const totalTime = performance.now() - start;
    const avgTime = totalTime / iterations;

    console.log(`[Benchmark arrayBufferToBase64] Total: ${totalTime.toFixed(2)}ms, Avg: ${avgTime.toFixed(4)}ms over ${iterations} runs (${size / 1024 / 1024}MB buffer)`);
    expect(totalTime).toBeGreaterThan(0);
  });
});
