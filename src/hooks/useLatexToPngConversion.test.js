import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLatexToPngConversion } from './useLatexToPngConversion';
import katex from 'katex';

vi.mock('katex', () => ({
  default: {
    renderToString: vi.fn((latex, options) => {
      if (options?.trust === false && (latex.includes('\\href') || latex.includes('\\url'))) {
        return '<span class="katex-error">\\href</span>';
      }
      return `<span class="katex">${latex}</span>`;
    })
  }
}));

vi.mock('html-to-image', () => ({
  toBlob: vi.fn().mockResolvedValue(new Blob(['fake-image'], { type: 'image/png' }))
}));

describe('useLatexToPngConversion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (!globalThis.URL.createObjectURL) {
      globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    }
  });

  it('calls katex.renderToString with trust: false', async () => {
    const outputRef = { current: { scrollIntoView: vi.fn() } };
    const { result } = renderHook(() => useLatexToPngConversion({ outputRef }));

    await act(async () => {
      await result.current.handleConvert('\\href{javascript:alert(1)}{click}');
    });

    expect(katex.renderToString).toHaveBeenCalledWith(
      '\\href{javascript:alert(1)}{click}',
      expect.objectContaining({
        displayMode: true,
        throwOnError: true,
        trust: false
      })
    );
  });

  it('sets parseError and stops loading when katex.renderToString throws an error', async () => {
    const outputRef = { current: { scrollIntoView: vi.fn() } };
    const { result } = renderHook(() => useLatexToPngConversion({ outputRef }));

    vi.mocked(katex.renderToString).mockImplementationOnce(() => {
      throw new Error('KaTeX parse error: Undefined control sequence');
    });

    await act(async () => {
      await result.current.handleConvert('\\invalidcommand');
    });

    expect(result.current.parseError).toBe('KaTeX parse error: Undefined control sequence');
    expect(result.current.loading).toBe(false);
    expect(result.current.result).toBeNull();
  });

  it('fallback parseError message when thrown error has no message', async () => {
    const outputRef = { current: { scrollIntoView: vi.fn() } };
    const { result } = renderHook(() => useLatexToPngConversion({ outputRef }));

    vi.mocked(katex.renderToString).mockImplementationOnce(() => {
      throw new Error();
    });

    await act(async () => {
      await result.current.handleConvert('\\invalidcommand');
    });

    expect(result.current.parseError).toBe('LaTeX could not be parsed.');
    expect(result.current.loading).toBe(false);
  });

  it('sets error when provided with empty or whitespace-only latex', async () => {
    const outputRef = { current: { scrollIntoView: vi.fn() } };
    const { result } = renderHook(() => useLatexToPngConversion({ outputRef }));

    await act(async () => {
      await result.current.handleConvert('   ');
    });

    expect(result.current.error).toBe('Please enter some LaTeX code first.');
    expect(result.current.loading).toBe(false);
  });

  it('resets state when handleReset is called', async () => {
    const outputRef = { current: { scrollIntoView: vi.fn() } };
    const { result } = renderHook(() => useLatexToPngConversion({ outputRef }));

    // First cause an error
    await act(async () => {
      await result.current.handleConvert('   ');
    });
    expect(result.current.error).toBe('Please enter some LaTeX code first.');

    // Now reset
    act(() => {
      result.current.handleReset();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.parseError).toBeNull();
    expect(result.current.result).toBeNull();
  });

  it('cleans up iframe from document.body on successful conversion', async () => {
    const outputRef = { current: { scrollIntoView: vi.fn() } };
    const { result } = renderHook(() => useLatexToPngConversion({ outputRef }));

    await act(async () => {
      await result.current.handleConvert('E = mc^2');
    });

    expect(result.current.error).toBeNull();
    expect(result.current.result).not.toBeNull();
    expect(document.querySelectorAll('iframe').length).toBe(0);
  });

  it('cleans up iframe from document.body when an error occurs before toBlob (e.g. stylesheet query failure)', async () => {
    const outputRef = { current: { scrollIntoView: vi.fn() } };
    const { result } = renderHook(() => useLatexToPngConversion({ outputRef }));

    const originalQuerySelectorAll = document.querySelectorAll;
    document.querySelectorAll = vi.fn((selector) => {
      if (selector === 'style, link[rel="stylesheet"]') {
        throw new Error('Simulated stylesheet query failure');
      }
      return originalQuerySelectorAll.call(document, selector);
    });

    try {
      await act(async () => {
        await result.current.handleConvert('x^2 + y^2 = z^2');
      });

      expect(result.current.error).toBe('Simulated stylesheet query failure');
      expect(document.querySelectorAll('iframe').length).toBe(0);
    } finally {
      document.querySelectorAll = originalQuerySelectorAll;
      document.querySelectorAll('iframe').forEach(el => el.remove());
    }
  });

  it('cleans up iframe from document.body when fonts.ready rejects', async () => {
    const outputRef = { current: { scrollIntoView: vi.fn() } };
    const { result } = renderHook(() => useLatexToPngConversion({ outputRef }));

    const origAppendChild = document.body.appendChild;
    vi.spyOn(document.body, 'appendChild').mockImplementation(function (node) {
      const res = origAppendChild.call(document.body, node);
      if (node.tagName === 'IFRAME') {
        const doc = node.contentDocument || node.contentWindow.document;
        const rejectedPromise = Promise.reject(new Error('Font readiness failed: network timeout'));
        // Prevent Vitest unhandled rejection noise in node environment
        rejectedPromise.catch(() => {});
        Object.defineProperty(doc, 'fonts', {
          configurable: true,
          get: () => ({
            ready: rejectedPromise
          })
        });
      }
      return res;
    });

    try {
      await act(async () => {
        await result.current.handleConvert('\\int_0^\\infty e^{-x^2} dx');
      });

      expect(result.current.error).toBe('Font readiness failed: network timeout');
      expect(document.querySelectorAll('iframe').length).toBe(0);
    } finally {
      document.body.appendChild.mockRestore();
      document.querySelectorAll('iframe').forEach(el => el.remove());
    }
  });

  it('cleans up iframe from document.body when formula exceeds maximum canvas size guardrail', async () => {
    const outputRef = { current: { scrollIntoView: vi.fn() } };
    const { result } = renderHook(() => useLatexToPngConversion({ outputRef }));

    const origAppendChild = document.body.appendChild;
    vi.spyOn(document.body, 'appendChild').mockImplementation(function (node) {
      const res = origAppendChild.call(document.body, node);
      if (node.tagName === 'IFRAME') {
        const doc = node.contentDocument || node.contentWindow.document;
        const origGetElementById = doc.getElementById.bind(doc);
        doc.getElementById = (id) => {
          const el = origGetElementById(id);
          if (el && id === 'latex-container') {
            el.getBoundingClientRect = () => ({ width: 20000, height: 20000 });
          }
          return el;
        };
      }
      return res;
    });

    try {
      await act(async () => {
        await result.current.handleConvert('\\Huge x');
      });

      expect(result.current.error).toContain('Formula is too large to render');
      expect(document.querySelectorAll('iframe').length).toBe(0);
    } finally {
      document.body.appendChild.mockRestore();
      document.querySelectorAll('iframe').forEach(el => el.remove());
    }
  });
});
