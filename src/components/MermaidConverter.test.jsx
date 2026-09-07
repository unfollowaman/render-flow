import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { createRef } from 'react';
import MermaidConverter from './MermaidConverter';
import * as hooks from '../hooks/useMermaidToPngConversion';

describe('MermaidConverter', () => {
  let mockHandleConvert;
  let mockHandleReset;
  let mockSetError;

  beforeEach(() => {
    mockHandleConvert = vi.fn();
    mockHandleReset = vi.fn();
    mockSetError = vi.fn();

    vi.spyOn(hooks, 'useMermaidToPngConversion').mockReturnValue({
      loading: false,
      result: null,
      error: null,
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
      <MermaidConverter
        inputRef={inputRef}
        outputRef={outputRef}
        mode="mermaid"
        setMode={setMode}
        onReset={onReset}
      />
    );

    expect(screen.getByLabelText('Input Mermaid')).toBeTruthy();
    expect(screen.queryByText('Rendering failed')).toBeNull();
    expect(screen.queryByText('Preview')).toBeNull();
  });

  it('renders ErrorCard when mermaidError is present', () => {
    vi.spyOn(hooks, 'useMermaidToPngConversion').mockReturnValue({
      loading: false,
      result: null,
      error: 'Invalid Mermaid syntax.',
      setError: mockSetError,
      handleConvert: mockHandleConvert,
      handleReset: mockHandleReset,
    });

    render(
      <MermaidConverter
        mode="mermaid"
        setMode={vi.fn()}
        onReset={vi.fn()}
      />
    );

    expect(screen.getByText('Rendering failed')).toBeTruthy();
    expect(screen.getByText('Invalid Mermaid syntax.')).toBeTruthy();
  });

  it('renders OutputCard when mermaidResult is present', () => {
    const mockResult = {
      image: 'data:image/png;base64,fakeimage',
      width: 500,
      height: 300,
    };

    vi.spyOn(hooks, 'useMermaidToPngConversion').mockReturnValue({
      loading: false,
      result: mockResult,
      error: null,
      setError: mockSetError,
      handleConvert: mockHandleConvert,
      handleReset: mockHandleReset,
    });

    const onReset = vi.fn();

    render(
      <MermaidConverter
        mode="mermaid"
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
      <MermaidConverter
        ref={ref}
        mode="mermaid"
        setMode={vi.fn()}
        onReset={vi.fn()}
      />
    );

    expect(ref.current).toBeDefined();
    expect(typeof ref.current.handleReset).toBe('function');

    ref.current.handleReset();
    expect(mockHandleReset).toHaveBeenCalledTimes(1);
  });

  it('triggers handleConvert when converting Mermaid diagram code in InputCard', () => {
    render(
      <MermaidConverter
        mode="mermaid"
        setMode={vi.fn()}
        onReset={vi.fn()}
      />
    );

    const textarea = screen.getByLabelText('Input Mermaid');
    fireEvent.change(textarea, { target: { value: 'graph TD; A-->B;' } });

    const convertBtn = screen.getByRole('button', { name: 'Convert to PNG' });
    fireEvent.click(convertBtn);

    expect(mockHandleConvert).toHaveBeenCalledWith('graph TD; A-->B;');
  });
});
