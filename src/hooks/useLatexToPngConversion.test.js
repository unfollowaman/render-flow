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
});
