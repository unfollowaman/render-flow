import { describe, it, expect, vi } from 'vitest';
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
});
