import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { createRef } from 'react';
import HtmlConverter from './HtmlConverter';
import * as hooks from '../hooks/useHtmlToPngConversion';

describe('HtmlConverter', () => {
  let mockHandleConvert;
  let mockHandleReset;
  let mockSetError;
  let mockSetHtmlWarning;

  beforeEach(() => {
    mockHandleConvert = vi.fn();
    mockHandleReset = vi.fn();
    mockSetError = vi.fn();
    mockSetHtmlWarning = vi.fn();

    vi.spyOn(hooks, 'useHtmlToPngConversion').mockReturnValue({
      loading: false,
      result: null,
      error: null,
      failedResources: [],
      htmlWarning: null,
      setHtmlWarning: mockSetHtmlWarning,
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
      <HtmlConverter
        inputRef={inputRef}
        outputRef={outputRef}
        mode="html"
        setMode={setMode}
        onReset={onReset}
      />
    );

    expect(screen.getByLabelText('Input HTML')).toBeTruthy();
    expect(screen.queryByText('Rendering failed')).toBeNull();
    expect(screen.queryByText('Preview')).toBeNull();
  });

  it('renders ErrorCard when error is present', () => {
    vi.spyOn(hooks, 'useHtmlToPngConversion').mockReturnValue({
      loading: false,
      result: null,
      error: 'Rendering failed. Try inlining external assets as data: URLs.',
      failedResources: [],
      htmlWarning: null,
      setHtmlWarning: mockSetHtmlWarning,
      setError: mockSetError,
      handleConvert: mockHandleConvert,
      handleReset: mockHandleReset,
    });

    render(
      <HtmlConverter
        mode="html"
        setMode={vi.fn()}
        onReset={vi.fn()}
      />
    );

    expect(screen.getByText('Rendering failed')).toBeTruthy();
    expect(screen.getByText('Rendering failed. Try inlining external assets as data: URLs.')).toBeTruthy();
  });

  it('renders OutputCard when result is present', () => {
    const mockResult = {
      image: 'data:image/png;base64,fakeimage',
      width: 800,
      height: 600,
    };

    vi.spyOn(hooks, 'useHtmlToPngConversion').mockReturnValue({
      loading: false,
      result: mockResult,
      error: null,
      failedResources: [],
      htmlWarning: null,
      setHtmlWarning: mockSetHtmlWarning,
      setError: mockSetError,
      handleConvert: mockHandleConvert,
      handleReset: mockHandleReset,
    });

    const onReset = vi.fn();

    render(
      <HtmlConverter
        mode="html"
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
      <HtmlConverter
        ref={ref}
        mode="html"
        setMode={vi.fn()}
        onReset={vi.fn()}
      />
    );

    expect(ref.current).toBeDefined();
    expect(typeof ref.current.handleReset).toBe('function');

    ref.current.handleReset();
    expect(mockHandleReset).toHaveBeenCalledTimes(1);
  });

  it('triggers handleConvert when converting HTML code in InputCard', () => {
    render(
      <HtmlConverter
        mode="html"
        setMode={vi.fn()}
        onReset={vi.fn()}
      />
    );

    const textarea = screen.getByLabelText('Input HTML');
    fireEvent.change(textarea, { target: { value: '<div>Hello World</div>' } });

    const convertBtn = screen.getByRole('button', { name: 'Convert to PNG' });
    fireEvent.click(convertBtn);

    expect(mockHandleConvert).toHaveBeenCalledWith('<div>Hello World</div>');
  });

  it('displays failedResources notice in InputCard when failedResources is non-empty', () => {
    vi.spyOn(hooks, 'useHtmlToPngConversion').mockReturnValue({
      loading: false,
      result: null,
      error: null,
      failedResources: ['https://example.com/style.css'],
      htmlWarning: null,
      setHtmlWarning: mockSetHtmlWarning,
      setError: mockSetError,
      handleConvert: mockHandleConvert,
      handleReset: mockHandleReset,
    });

    render(
      <HtmlConverter
        mode="html"
        setMode={vi.fn()}
        onReset={vi.fn()}
      />
    );

    expect(screen.getByText(/Notice: 1 external resource failed to load/i)).toBeTruthy();
  });

  it('displays htmlWarning in InputCard when htmlWarning is present', () => {
    const warningMsg = 'Very large HTML may cause the browser tab to become unresponsive.';
    vi.spyOn(hooks, 'useHtmlToPngConversion').mockReturnValue({
      loading: false,
      result: null,
      error: null,
      failedResources: [],
      htmlWarning: warningMsg,
      setHtmlWarning: mockSetHtmlWarning,
      setError: mockSetError,
      handleConvert: mockHandleConvert,
      handleReset: mockHandleReset,
    });

    render(
      <HtmlConverter
        mode="html"
        setMode={vi.fn()}
        onReset={vi.fn()}
      />
    );

    expect(screen.getByText(warningMsg)).toBeTruthy();
  });
});
