import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLatexToPngConversion } from './useLatexToPngConversion';
import katex from 'katex';
import DOMPurify from 'dompurify';

vi.mock('katex', () => ({
  default: {
    renderToString: vi.fn((latex, options) => {
      if (options?.trust === false && (latex.includes('\\href') || latex.includes('\\url'))) {
        return '<span class="katex-error">\\href</span>';
      }
      if (latex.includes('xss')) {
        return '<span class="katex">xss<img src=x onerror=alert(1)></span>';
      }
      return `<span class="katex">${latex}</span>`;
    })
  }
}));

vi.mock('html-to-image', () => ({
  toBlob: vi.fn().mockResolvedValue(new Blob(['fake-image'], { type: 'image/png' }))
}));

describe('useLatexToPngConversion security', () => {
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

  it('sanitizes KaTeX HTML output using DOMPurify before embedding in iframe', async () => {
    const sanitizeSpy = vi.spyOn(DOMPurify, 'sanitize');
    const outputRef = { current: { scrollIntoView: vi.fn() } };
    const { result } = renderHook(() => useLatexToPngConversion({ outputRef }));

    await act(async () => {
      await result.current.handleConvert('xss');
    });

    expect(sanitizeSpy).toHaveBeenCalledWith('<span class="katex">xss<img src=x onerror=alert(1)></span>');
    sanitizeSpy.mockRestore();
  });
});
