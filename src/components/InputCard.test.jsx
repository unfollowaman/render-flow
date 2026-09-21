import { render, screen, fireEvent, cleanup, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { createRef } from 'react';
import { InputCard } from './InputCard';

describe('InputCard', () => {
  const defaultProps = {
    mode: 'html',
    setMode: vi.fn(),
    loading: false,
    failedResources: [],
    htmlWarning: null,
    setHtmlWarning: vi.fn(),
    handleConvert: vi.fn(),
    setError: vi.fn(),
    mermaidLoading: false,
    setMermaidError: vi.fn(),
    handleMermaidConvert: vi.fn(),
    latexLoading: false,
    latexParseError: null,
    setLatexError: vi.fn(),
    handleLatexConvert: vi.fn(),
    notesLoading: false,
    notesValidationError: null,
    notesValidationSuccess: null,
    setNotesError: vi.fn(),
    validateNotesJson: vi.fn(),
    handleNotesGenerate: vi.fn(),
    handleNotesReset: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('Mode Switching and Workspace Rendering', () => {
    it('renders mode toggle tablist and tabs with correct ARIA attributes', () => {
      const setMode = vi.fn();
      render(<InputCard {...defaultProps} mode="html" setMode={setMode} />);

      const tabList = screen.getByRole('tablist', { name: 'Input mode selector' });
      expect(tabList).toBeTruthy();

      const htmlTab = screen.getByRole('tab', { name: 'HTML Mode' });
      const mermaidTab = screen.getByRole('tab', { name: 'Mermaid Mode' });
      const latexTab = screen.getByRole('tab', { name: 'LaTeX Mode' });
      const notesTab = screen.getByRole('tab', { name: 'Notes Mode' });

      expect(htmlTab.getAttribute('aria-selected')).toBe('true');
      expect(mermaidTab.getAttribute('aria-selected')).toBe('false');
      expect(latexTab.getAttribute('aria-selected')).toBe('false');
      expect(notesTab.getAttribute('aria-selected')).toBe('false');

      fireEvent.click(mermaidTab);
      expect(setMode).toHaveBeenCalledWith('mermaid');

      fireEvent.click(latexTab);
      expect(setMode).toHaveBeenCalledWith('latex');

      fireEvent.click(notesTab);
      expect(setMode).toHaveBeenCalledWith('notes');
    });

    it('renders HTML Workspace when mode is "html"', () => {
      render(<InputCard {...defaultProps} mode="html" />);

      expect(screen.getByText('Input HTML')).toBeTruthy();
      const htmlTextarea = screen.getByLabelText('Input HTML');
      expect(htmlTextarea).toBeTruthy();
      expect(htmlTextarea.getAttribute('aria-keyshortcuts')).toBe('Control+Enter Meta+Enter');
      expect(screen.queryByLabelText('Input Mermaid')).toBeNull();
      expect(screen.queryByLabelText('Input LaTeX')).toBeNull();
      expect(screen.queryByLabelText('Input Notes JSON')).toBeNull();
    });

    it('renders Mermaid Workspace when mode is "mermaid"', () => {
      render(<InputCard {...defaultProps} mode="mermaid" />);

      expect(screen.getByText('Input Mermaid')).toBeTruthy();
      expect(screen.getByLabelText('Input Mermaid')).toBeTruthy();
      expect(screen.queryByLabelText('Input HTML')).toBeNull();
    });

    it('renders LaTeX Workspace when mode is "latex"', () => {
      render(<InputCard {...defaultProps} mode="latex" />);

      expect(screen.getByText('Input LaTeX')).toBeTruthy();
      expect(screen.getByLabelText('Input LaTeX')).toBeTruthy();
      expect(screen.queryByLabelText('Input HTML')).toBeNull();
    });

    it('renders Notes Workspace when mode is "notes"', () => {
      render(<InputCard {...defaultProps} mode="notes" />);

      expect(screen.getByText('Input Notes JSON')).toBeTruthy();
      expect(screen.getByLabelText('Input Notes JSON')).toBeTruthy();
      expect(screen.queryByLabelText('Input HTML')).toBeNull();
    });
  });

  describe('Ref Forwarding & Imperative Handle', () => {
    it('exposes resetHtml, resetMermaid, resetLatex, resetNotes, and scrollToInput via ref', () => {
      const ref = createRef();
      const handleNotesReset = vi.fn();

      render(
        <InputCard
          {...defaultProps}
          ref={ref}
          mode="html"
          handleNotesReset={handleNotesReset}
        />
      );

      expect(ref.current).toBeTruthy();
      expect(typeof ref.current.resetHtml).toBe('function');
      expect(typeof ref.current.resetMermaid).toBe('function');
      expect(typeof ref.current.resetLatex).toBe('function');
      expect(typeof ref.current.resetNotes).toBe('function');
      expect(typeof ref.current.scrollToInput).toBe('function');

      const textarea = screen.getByLabelText('Input HTML');
      fireEvent.change(textarea, { target: { value: '<div>Test</div>' } });
      expect(textarea.value).toBe('<div>Test</div>');

      act(() => {
        ref.current.resetHtml();
      });
      expect(textarea.value).toBe('');

      // Call resetNotes and verify handleNotesReset is invoked
      act(() => {
        ref.current.resetNotes();
      });
      expect(handleNotesReset).toHaveBeenCalledTimes(1);

      // Verify scrollToInput calls scrollIntoView
      const scrollIntoViewMock = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoViewMock;
      ref.current.scrollToInput();
      expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' });
    });
  });

  describe('Sample Loading and HTML Workspace Features', () => {
    it('populates sample text when "Load sample ↗" is clicked in HTML mode', () => {
      const setError = vi.fn();
      render(<InputCard {...defaultProps} mode="html" setError={setError} />);

      const loadSampleBtn = screen.getByRole('button', { name: 'Load sample ↗' });
      fireEvent.click(loadSampleBtn);

      const textarea = screen.getByLabelText('Input HTML');
      expect(textarea.value).toContain('<!DOCTYPE html>');
      expect(setError).toHaveBeenCalledWith(null);
    });

    it('populates sample text when "Load sample ↗" is clicked in Mermaid mode', () => {
      const setMermaidError = vi.fn();
      render(<InputCard {...defaultProps} mode="mermaid" setMermaidError={setMermaidError} />);

      const loadSampleBtn = screen.getByRole('button', { name: 'Load sample ↗' });
      fireEvent.click(loadSampleBtn);

      const textarea = screen.getByLabelText('Input Mermaid');
      expect(textarea.value).toContain('graph TD');
      expect(setMermaidError).toHaveBeenCalledWith(null);
    });

    it('handles file upload for valid HTML files', async () => {
      const setError = vi.fn();
      const { container } = render(<InputCard {...defaultProps} mode="html" setError={setError} />);

      const fileInput = container.querySelector('input[type="file"]');
      const file = new File(['<h1>Uploaded File</h1>'], 'sample.html', { type: 'text/html' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        const textarea = screen.getByLabelText('Input HTML');
        expect(textarea.value).toBe('<h1>Uploaded File</h1>');
      });
      expect(setError).toHaveBeenCalledWith(null);
    });

    it('displays error when an invalid file type is uploaded in HTML mode', () => {
      const setError = vi.fn();
      const { container } = render(<InputCard {...defaultProps} mode="html" setError={setError} />);

      const fileInput = container.querySelector('input[type="file"]');
      const file = new File(['{"key": "val"}'], 'sample.json', { type: 'application/json' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(setError).toHaveBeenCalledWith('Please upload a valid .html file.');
    });

    it('handles drag over, drag leave, and drop for HTML files', async () => {
      const setError = vi.fn();
      render(<InputCard {...defaultProps} mode="html" setError={setError} />);

      const textarea = screen.getByLabelText('Input HTML');
      const dropZone = textarea.closest('.dropZone') || textarea.parentElement;

      // Drag Over
      fireEvent.dragOver(dropZone, { dataTransfer: { files: [] } });
      expect(screen.getByText('📂 Drop .html file here')).toBeTruthy();

      // Drag Leave
      fireEvent.dragLeave(dropZone);
      expect(screen.queryByText('📂 Drop .html file here')).toBeNull();

      // Drop
      const file = new File(['<p>Dropped HTML</p>'], 'drop.html', { type: 'text/html' });
      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] }
      });

      await waitFor(() => {
        expect(textarea.value).toBe('<p>Dropped HTML</p>');
      });
    });

    it('renders failed external resources notice when failedResources array is non-empty', () => {
      render(
        <InputCard
          {...defaultProps}
          mode="html"
          failedResources={['https://example.com/style1.css', 'https://example.com/style2.css']}
        />
      );

      expect(screen.getByText('Notice: 2 external resources failed to load (likely due to CORS).')).toBeTruthy();
    });

    it('renders htmlWarning alert box and handles Proceed anyway / Cancel clicks', () => {
      const setHtmlWarning = vi.fn();
      const handleConvert = vi.fn();

      render(
        <InputCard
          {...defaultProps}
          mode="html"
          htmlWarning="HTML size exceeds recommended limit."
          setHtmlWarning={setHtmlWarning}
          handleConvert={handleConvert}
        />
      );

      expect(screen.getByText('HTML size exceeds recommended limit.')).toBeTruthy();

      const proceedBtn = screen.getByRole('button', { name: 'Proceed anyway' });
      const cancelBtn = screen.getByRole('button', { name: 'Cancel' });

      // Click "Proceed anyway"
      fireEvent.click(proceedBtn);
      expect(setHtmlWarning).toHaveBeenCalledWith(null);
      expect(handleConvert).toHaveBeenCalledWith('', true);

      // Click "Cancel"
      fireEvent.click(cancelBtn);
      expect(setHtmlWarning).toHaveBeenCalledWith(null);
    });
  });

  describe('Mermaid, LaTeX, and Notes Workspace Interactions', () => {
    it('displays dynamic tooltip titles on convert button depending on loading, empty, and enabled states', () => {
      const handleMermaidConvert = vi.fn();
      const { rerender } = render(
        <InputCard {...defaultProps} mode="mermaid" handleMermaidConvert={handleMermaidConvert} />
      );

      // Empty state tooltip
      const convertBtn = screen.getByRole('button', { name: 'Convert to PNG' });
      expect(convertBtn.getAttribute('title')).toBe('Enter code or load sample to convert (Ctrl+Enter or ⌘+Enter)');

      // Non-empty state tooltip
      const textarea = screen.getByLabelText('Input Mermaid');
      fireEvent.change(textarea, { target: { value: 'graph TD\n  A-->B' } });
      expect(convertBtn.getAttribute('title')).toBe('Convert to PNG (Ctrl+Enter or ⌘+Enter)');

      // Loading state tooltip
      rerender(
        <InputCard {...defaultProps} mode="mermaid" mermaidLoading={true} handleMermaidConvert={handleMermaidConvert} />
      );
      const loadingConvertBtn = screen.getByRole('button', { name: 'Converting…' });
      expect(loadingConvertBtn.getAttribute('title')).toBe('Converting…');
    });

    it('displays dynamic tooltip titles on notes generate button depending on loading, empty, and enabled states', () => {
      const { rerender } = render(<InputCard {...defaultProps} mode="notes" />);

      // Empty state tooltip
      const generateBtn = screen.getByRole('button', { name: 'Generate' });
      expect(generateBtn.getAttribute('title')).toBe('Enter JSON or load sample to generate (Ctrl+Enter or ⌘+Enter)');

      // Non-empty state tooltip
      const textarea = screen.getByLabelText('Input Notes JSON');
      fireEvent.change(textarea, { target: { value: '{"test": 123}' } });
      expect(generateBtn.getAttribute('title')).toBe('Generate (Ctrl+Enter or ⌘+Enter)');

      // Loading state tooltip
      rerender(<InputCard {...defaultProps} mode="notes" notesLoading={true} />);
      const loadingGenerateBtn = screen.getByRole('button', { name: 'Generating…' });
      expect(loadingGenerateBtn.getAttribute('title')).toBe('Generating…');
    });

    it('triggers handleMermaidConvert when Convert to PNG is clicked in Mermaid mode', () => {
      const handleMermaidConvert = vi.fn();
      render(<InputCard {...defaultProps} mode="mermaid" handleMermaidConvert={handleMermaidConvert} />);

      const textarea = screen.getByLabelText('Input Mermaid');
      fireEvent.change(textarea, { target: { value: 'graph TD\n  A-->B' } });

      const convertBtn = screen.getByRole('button', { name: 'Convert to PNG' });
      fireEvent.click(convertBtn);

      expect(handleMermaidConvert).toHaveBeenCalledWith('graph TD\n  A-->B');
    });

    it('triggers conversion when Ctrl+Enter or Cmd+Enter is pressed inside textarea', () => {
      const handleConvert = vi.fn();
      render(<InputCard {...defaultProps} mode="html" handleConvert={handleConvert} />);

      const textarea = screen.getByLabelText('Input HTML');
      fireEvent.change(textarea, { target: { value: '<h1>Test Shortcuts</h1>' } });

      // Press Ctrl+Enter
      fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });
      expect(handleConvert).toHaveBeenCalledWith('<h1>Test Shortcuts</h1>');

      // Press Cmd+Enter (metaKey)
      fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true });
      expect(handleConvert).toHaveBeenCalledTimes(2);
    });

    it('triggers notes generation when Ctrl+Enter is pressed inside Notes Mode textarea', () => {
      const handleNotesGenerate = vi.fn();
      render(<InputCard {...defaultProps} mode="notes" handleNotesGenerate={handleNotesGenerate} />);

      const textarea = screen.getByLabelText('Input Notes JSON');
      fireEvent.change(textarea, { target: { value: '{"test": 123}' } });

      fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });
      expect(handleNotesGenerate).toHaveBeenCalledWith('{"test": 123}');
    });

    it('triggers handleLatexConvert when Convert to PNG is clicked in LaTeX mode', () => {
      const handleLatexConvert = vi.fn();
      render(<InputCard {...defaultProps} mode="latex" handleLatexConvert={handleLatexConvert} />);

      const textarea = screen.getByLabelText('Input LaTeX');
      fireEvent.change(textarea, { target: { value: 'E = mc^2' } });

      const convertBtn = screen.getByRole('button', { name: 'Convert to PNG' });
      fireEvent.click(convertBtn);

      expect(handleLatexConvert).toHaveBeenCalledWith('E = mc^2');
    });

    it('renders LaTeX parse error when latexParseError is passed', () => {
      const errText = "KaTeX parse error: Expected 'EOF', got '\\' at position 3";
      render(
        <InputCard
          {...defaultProps}
          mode="latex"
          latexParseError={errText}
        />
      );

      expect(screen.getByText((content) => content.includes("KaTeX parse error"))).toBeTruthy();
    });

    it('renders character count and handles Copy and Clear input text buttons in Workspace', async () => {
      const setError = vi.fn();
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      render(<InputCard {...defaultProps} mode="mermaid" setMermaidError={setError} />);

      const textarea = screen.getByLabelText('Input Mermaid');
      fireEvent.change(textarea, { target: { value: 'graph TD\n  A-->B' } });

      expect(screen.getByText('16 chars')).toBeTruthy();

      const copyBtn = screen.getByRole('button', { name: 'Copy input text to clipboard' });
      expect(copyBtn).toBeTruthy();

      await act(async () => {
        fireEvent.click(copyBtn);
      });

      expect(writeTextMock).toHaveBeenCalledWith('graph TD\n  A-->B');
      expect(screen.getByText('✓ Copied!')).toBeTruthy();

      const clearBtn = screen.getByRole('button', { name: 'Clear input text' });
      expect(clearBtn).toBeTruthy();

      fireEvent.click(clearBtn);

      expect(textarea.value).toBe('');
      expect(screen.queryByText('16 chars')).toBeNull();
      expect(setError).toHaveBeenCalledWith(null);
    });

    it('handles Notes Workspace interactions: JSON upload, Validate, Clear, and Generate', async () => {
      const validateNotesJson = vi.fn();
      const handleNotesGenerate = vi.fn();
      const handleNotesReset = vi.fn();

      const { container } = render(
        <InputCard
          {...defaultProps}
          mode="notes"
          validateNotesJson={validateNotesJson}
          handleNotesGenerate={handleNotesGenerate}
          handleNotesReset={handleNotesReset}
          notesValidationSuccess="Valid Notes JSON structure"
          notesValidationError="Invalid JSON formatting"
        />
      );

      expect(screen.getByText('✓ Valid Notes JSON structure')).toBeTruthy();
      expect(screen.getByText('⚠️ Invalid JSON formatting')).toBeTruthy();

      const textarea = screen.getByLabelText('Input Notes JSON');
      fireEvent.change(textarea, { target: { value: '{"chapter": "Test"}' } });

      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      // Click Validate
      const validateBtn = screen.getByRole('button', { name: 'Validate' });
      fireEvent.click(validateBtn);
      expect(validateNotesJson).toHaveBeenCalledWith('{"chapter": "Test"}');

      // Click Copy
      const copyNotesBtn = screen.getByRole('button', { name: 'Copy notes input text to clipboard' });
      expect(copyNotesBtn).toBeTruthy();
      await act(async () => {
        fireEvent.click(copyNotesBtn);
      });
      expect(writeTextMock).toHaveBeenCalledWith('{"chapter": "Test"}');
      expect(screen.getByText('✓ Copied!')).toBeTruthy();

      // Click Generate
      const generateBtn = screen.getByRole('button', { name: 'Generate' });
      fireEvent.click(generateBtn);
      expect(handleNotesGenerate).toHaveBeenCalledWith('{"chapter": "Test"}');

      // Click Clear
      const clearBtn = screen.getByRole('button', { name: 'Clear notes input text' });
      expect(clearBtn).toBeTruthy();
      fireEvent.click(clearBtn);
      expect(textarea.value).toBe('');
      expect(handleNotesReset).toHaveBeenCalledTimes(1);

      // Upload JSON file via file input
      const fileInput = container.querySelector('input[type="file"]');
      const jsonFile = new File(['{"uploaded": true}'], 'notes.json', { type: 'application/json' });
      fireEvent.change(fileInput, { target: { files: [jsonFile] } });

      await waitFor(() => {
        expect(textarea.value).toBe('{"uploaded": true}');
      });
      expect(handleNotesReset).toHaveBeenCalled();
    });
  });
});
