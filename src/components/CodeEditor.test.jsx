import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { createRef } from 'react';
import { CodeEditor } from './CodeEditor';

describe('CodeEditor', () => {
  const defaultProps = {
    value: '<span>Hello RenderFlow</span>',
    onChange: vi.fn(),
    onSubmit: vi.fn(),
    mode: 'html',
    placeholder: 'Enter code here...',
    ariaLabel: 'Input HTML',
    shortcutHintId: 'html-shortcut-hint'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders editor header with language badge, cursor info, and char count', () => {
    const { container } = render(<CodeEditor {...defaultProps} />);

    const badge = container.querySelector('span[class*="languageBadge"]');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toBe('HTML');

    expect(screen.getByText(/Ln 1, Col 1/)).toBeTruthy();
    expect(screen.getByText(/29 chars/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Copy editor content to clipboard' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Clear editor text' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Expand editor height' })).toBeTruthy();
  });

  it('renders accessible hidden textarea synced with CodeMirror value', () => {
    const { container } = render(<CodeEditor {...defaultProps} />);

    const textarea = container.querySelector('textarea');
    expect(textarea).toBeTruthy();
    expect(textarea.value).toBe('<span>Hello RenderFlow</span>');
    expect(textarea.getAttribute('aria-describedby')).toBe('html-shortcut-hint');
    expect(textarea.getAttribute('aria-keyshortcuts')).toBe('Control+Enter Meta+Enter');
  });

  it('handles value changes via props and onChange callback', () => {
    const onChange = vi.fn();
    const { container, rerender } = render(<CodeEditor {...defaultProps} onChange={onChange} />);

    const textarea = container.querySelector('textarea');
    fireEvent.change(textarea, { target: { value: '<span>Updated</span>' } });

    expect(onChange).toHaveBeenCalledWith('<span>Updated</span>');

    rerender(<CodeEditor {...defaultProps} value="<span>New Prop Value</span>" onChange={onChange} />);
    expect(textarea.value).toBe('<span>New Prop Value</span>');
  });

  it('triggers onSubmit when Ctrl+Enter or Cmd+Enter key combination is pressed', () => {
    const onSubmit = vi.fn();
    const { container } = render(<CodeEditor {...defaultProps} onSubmit={onSubmit} />);

    const textarea = container.querySelector('textarea');

    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });
    expect(onSubmit).toHaveBeenCalledWith('<span>Hello RenderFlow</span>');

    fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true });
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });

  it('handles copy button interaction and copies text to clipboard', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock
      }
    });

    render(<CodeEditor {...defaultProps} />);

    const copyBtn = screen.getByRole('button', { name: 'Copy editor content to clipboard' });
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(writeTextMock).toHaveBeenCalledWith('<span>Hello RenderFlow</span>');
    expect(screen.getByText('✓ Copied!')).toBeTruthy();
  });

  it('handles clear button requiring confirmation to clear editor content', () => {
    const onChange = vi.fn();
    render(<CodeEditor {...defaultProps} onChange={onChange} />);

    const clearBtn = screen.getByRole('button', { name: 'Clear editor text' });

    // First click: prompts confirmation
    fireEvent.click(clearBtn);
    expect(screen.getByText('⚠️ Confirm Clear?')).toBeTruthy();
    expect(onChange).not.toHaveBeenCalled();

    // Second click: performs clear
    const confirmBtn = screen.getByRole('button', { name: 'Confirm clear editor text' });
    fireEvent.click(confirmBtn);
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('toggles expand height mode when expand button is clicked', () => {
    render(<CodeEditor {...defaultProps} />);

    const expandBtn = screen.getByRole('button', { name: 'Expand editor height' });

    fireEvent.click(expandBtn);
    expect(screen.getByRole('button', { name: 'Collapse editor height' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Collapse editor height' }));
    expect(screen.getByRole('button', { name: 'Expand editor height' })).toBeTruthy();
  });

  it('exposes focus, setValue, and getEditorView via ref imperative handle', () => {
    const ref = createRef();
    const onChange = vi.fn();
    render(<CodeEditor {...defaultProps} ref={ref} onChange={onChange} />);

    expect(ref.current).toBeTruthy();
    expect(typeof ref.current.focus).toBe('function');
    expect(typeof ref.current.setValue).toBe('function');
    expect(typeof ref.current.getEditorView).toBe('function');

    act(() => {
      ref.current.setValue('<span>Imperative content</span>');
    });

    expect(ref.current.getEditorView().state.doc.toString()).toBe('<span>Imperative content</span>');
    expect(onChange).toHaveBeenCalledWith('<span>Imperative content</span>');
  });

  it('updates language badge dynamically when mode changes', () => {
    const { container, rerender } = render(<CodeEditor {...defaultProps} mode="html" />);
    const badge = container.querySelector('span[class*="languageBadge"]');
    expect(badge.textContent).toBe('HTML');

    rerender(<CodeEditor {...defaultProps} mode="mermaid" />);
    expect(badge.textContent).toBe('MERMAID');

    rerender(<CodeEditor {...defaultProps} mode="latex" />);
    expect(badge.textContent).toBe('LATEX');

    rerender(<CodeEditor {...defaultProps} mode="notes" />);
    expect(badge.textContent).toBe('JSON');
  });
});
