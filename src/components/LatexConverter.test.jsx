import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { createRef } from 'react';
import LatexConverter from './LatexConverter';
import * as hooks from '../hooks/useLatexToPngConversion';

describe('LatexConverter', () => {
  let mockHandleConvert;
  let mockHandleReset;
  let mockSetError;

  beforeEach(() => {
    mockHandleConvert = vi.fn();
    mockHandleReset = vi.fn();
    mockSetError = vi.fn();

    vi.spyOn(hooks, 'useLatexToPngConversion').mockReturnValue({
      loading: false,
      result: null,
      error: null,
      parseError: null,
      setError: mockSetError,
      handleConvert: mockHandleConvert,
      handleReset: mockHandleReset,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders InputCard and does not render ErrorCard or OutputCard when error and result are null', () => {
    const inputRef = createRef();
    const outputRef = createRef();
    const setMode = vi.fn();
    const onReset = vi.fn();

    render(
      <LatexConverter
        inputRef={inputRef}
        outputRef={outputRef}
        mode="latex"
        setMode={setMode}
        onReset={onReset}
      />
    );

    expect(screen.getByLabelText('Input LaTeX')).toBeTruthy();
    expect(screen.queryByText('Rendering failed')).toBeNull();
    expect(screen.queryByText('Preview')).toBeNull();
  });

  it('renders ErrorCard when latexError is present', () => {
    vi.spyOn(hooks, 'useLatexToPngConversion').mockReturnValue({
      loading: false,
      result: null,
      error: 'KaTeX rendering error: Invalid formula',
      parseError: null,
      setError: mockSetError,
      handleConvert: mockHandleConvert,
      handleReset: mockHandleReset,
    });

    render(
      <LatexConverter
        mode="latex"
        setMode={vi.fn()}
        onReset={vi.fn()}
      />
    );

    expect(screen.getByText('Rendering failed')).toBeTruthy();
    expect(screen.getByText('KaTeX rendering error: Invalid formula')).toBeTruthy();
  });

  it('renders OutputCard when latexResult is present', () => {
    const mockResult = {
      image: 'data:image/png;base64,fakeimage',
      width: 400,
      height: 200,
    };

    vi.spyOn(hooks, 'useLatexToPngConversion').mockReturnValue({
      loading: false,
      result: mockResult,
      error: null,
      parseError: null,
      setError: mockSetError,
      handleConvert: mockHandleConvert,
      handleReset: mockHandleReset,
    });

    const onReset = vi.fn();

    render(
      <LatexConverter
        mode="latex"
        setMode={vi.fn()}
        onReset={onReset}
      />
    );

    expect(screen.getByText('Preview')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Download PNG/i })).toBeTruthy();
  });

  it('exposes handleReset through forwarded ref via useImperativeHandle', () => {
    const ref = createRef();

    render(
      <LatexConverter
        ref={ref}
        mode="latex"
        setMode={vi.fn()}
        onReset={vi.fn()}
      />
    );

    expect(ref.current).toBeDefined();
    expect(typeof ref.current.handleReset).toBe('function');

    ref.current.handleReset();
    expect(mockHandleReset).toHaveBeenCalledTimes(1);
  });

  it('triggers handleConvert when converting LaTeX math code in InputCard', () => {
    render(
      <LatexConverter
        mode="latex"
        setMode={vi.fn()}
        onReset={vi.fn()}
      />
    );

    const textarea = screen.getByLabelText('Input LaTeX');
    fireEvent.change(textarea, { target: { value: 'E = mc^2' } });

    const convertBtn = screen.getByRole('button', { name: 'Convert to PNG' });
    fireEvent.click(convertBtn);

    expect(mockHandleConvert).toHaveBeenCalledWith('E = mc^2');
  });

  it('renders parseError in InputCard when latexParseError is present', () => {
    vi.spyOn(hooks, 'useLatexToPngConversion').mockReturnValue({
      loading: false,
      result: null,
      error: null,
      parseError: 'Parse error in LaTeX formula at line 1',
      setError: mockSetError,
      handleConvert: mockHandleConvert,
      handleReset: mockHandleReset,
    });

    render(
      <LatexConverter
        mode="latex"
        setMode={vi.fn()}
        onReset={vi.fn()}
      />
    );

    expect(screen.getByText('Parse error in LaTeX formula at line 1')).toBeTruthy();
  });
});
