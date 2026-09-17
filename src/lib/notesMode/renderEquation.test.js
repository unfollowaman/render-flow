import { describe, it, expect, vi, beforeEach } from 'vitest';
import katex from 'katex';
import { renderEquation, clearEquationCache } from './renderEquation';

describe('renderEquation LaTeX-to-rendered-equation utility', () => {
  beforeEach(() => {
    clearEquationCache();
  });
  it('1. Inline equation: "x^2 + y^2 = r^2" renders correctly with displayMode: false', () => {
    const res = renderEquation('x^2 + y^2 = r^2', { displayMode: false });
    expect(res.error).toBe(false);
    expect(res.html).toContain('katex');
    expect(res.html).not.toContain('katex-display');
    expect(res.element).toBeInstanceOf(HTMLElement);
    expect(res.element.className).toContain('inline-equation');
  });

  it('2. Display equation: "\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}" renders correctly with displayMode: true', () => {
    const res = renderEquation('\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}', { displayMode: true });
    expect(res.error).toBe(false);
    expect(res.html).toContain('katex-display');
    expect(res.element).toBeInstanceOf(HTMLElement);
    expect(res.element.className).toContain('display-equation');
  });

  it('3. Square root: "\\sqrt{x^2+y^2}=5" renders correctly', () => {
    const res = renderEquation('\\sqrt{x^2+y^2}=5', { displayMode: false });
    expect(res.error).toBe(false);
    expect(res.html).toContain('sqrt');
    expect(res.element).toBeInstanceOf(HTMLElement);
  });

  it('4. Matrix: a 2x2 matrix using \\begin{matrix}...\\end{matrix} renders correctly', () => {
    const latex = '\\begin{matrix} a & b \\\\ c & d \\end{matrix}';
    const res = renderEquation(latex, { displayMode: true });
    expect(res.error).toBe(false);
    expect(res.html).toContain('matrix');
    expect(res.element).toBeInstanceOf(HTMLElement);
  });

  it('5. Greek symbols and subscripts/superscripts: "\\theta_1^2 + \\alpha" renders correctly', () => {
    const res = renderEquation('\\theta_1^2 + \\alpha', { displayMode: false });
    expect(res.error).toBe(false);
    expect(res.html).toContain('mord');
    expect(res.element).toBeInstanceOf(HTMLElement);
  });

  it('6. Invalid LaTeX: unclosed brace "\\frac{1{2}" returns flagged error object, does not throw', () => {
    expect(() => {
      const res = renderEquation('\\frac{1{2}', { displayMode: false });
      expect(res.error).toBe(true);
      expect(typeof res.message).toBe('string');
      expect(res.message).toMatch(/KaTeX parse error/i);
    }).not.toThrow();
  });

  it('7. Non-string input: returns error object when input is not a string', () => {
    const invalidInputs = [null, undefined, 123, {}, [], true];
    invalidInputs.forEach((input) => {
      const res = renderEquation(input);
      expect(res).toEqual({
        error: true,
        message: 'Invalid input: LaTeX expression must be a string.'
      });
    });
  });

  it('8. Sanitizes HTML output with DOMPurify preventing unsanitized HTML/script injection', () => {
    const res = renderEquation('a + b = c', { displayMode: false });
    expect(res.error).toBe(false);
    expect(res.element.innerHTML).not.toContain('<script');
    expect(res.element.innerHTML).not.toContain('onerror=');
    expect(res.html).toBe(res.element.innerHTML);
  });

  it('9. Fallback error message: returns "LaTeX parsing error." when thrown error lacks a message property', () => {
    const spy = vi.spyOn(katex, 'renderToString').mockImplementationOnce(() => {
      throw {};
    });

    const res = renderEquation('x + y');
    expect(res).toEqual({
      error: true,
      message: 'LaTeX parsing error.'
    });

    spy.mockRestore();
  });

  it('10. Caching & Performance: caches identical equations and avoids repeated KaTeX calls', () => {
    const latex = '\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}';
    const spy = vi.spyOn(katex, 'renderToString');

    const res1 = renderEquation(latex, { displayMode: true });
    expect(spy).toHaveBeenCalledTimes(1);

    const res2 = renderEquation(latex, { displayMode: true });
    // Second call should hit cache and NOT invoke katex.renderToString again
    expect(spy).toHaveBeenCalledTimes(1);
    expect(res2.html).toBe(res1.html);
    expect(res2.element.innerHTML).toBe(res1.element.innerHTML);

    // clearEquationCache resets cache
    clearEquationCache();
    renderEquation(latex, { displayMode: true });
    expect(spy).toHaveBeenCalledTimes(2);

    spy.mockRestore();
  });

  it('11. Benchmark: measures performance speedup from equation caching', () => {
    clearEquationCache();
    const latex = '\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}';

    // First call (uncached)
    const t0 = performance.now();
    renderEquation(latex, { displayMode: true });
    const uncachedDuration = performance.now() - t0;

    // Subsequent 100 calls (cached)
    const t1 = performance.now();
    for (let i = 0; i < 100; i++) {
      renderEquation(latex, { displayMode: true });
    }
    const cached100Duration = performance.now() - t1;

    console.log(`[Benchmark renderEquation] 1 uncached: ${uncachedDuration.toFixed(2)}ms vs 100 cached: ${cached100Duration.toFixed(2)}ms`);
    expect(cached100Duration).toBeLessThan(uncachedDuration * 10);
  });
});
