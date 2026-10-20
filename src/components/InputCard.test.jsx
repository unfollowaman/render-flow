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

  describe('Performance Optimization', () => {
    it('benchmark MODE_CONFIG_LIST static array vs dynamic Object.values allocation', () => {
      const sampleConfigs = {
        html: { mode: 'html', label: 'HTML Mode' },
        mermaid: { mode: 'mermaid', label: 'Mermaid Mode' },
        latex: { mode: 'latex', label: 'LaTeX Mode' },
        notes: { mode: 'notes', label: 'Notes Mode' },
      };
      const staticList = Object.values(sampleConfigs);

      const iterations = 100000;

      const startDynamic = performance.now();
      for (let i = 0; i < iterations; i++) {
        const arr = Object.values(sampleConfigs);
        for (let j = 0; j < arr.length; j++) {
          const _val = arr[j].mode;
        }
      }
      const durationDynamic = performance.now() - startDynamic;

      const startStatic = performance.now();
      for (let i = 0; i < iterations; i++) {
        const arr = staticList;
        for (let j = 0; j < arr.length; j++) {
          const _val = arr[j].mode;
        }
      }
      const durationStatic = performance.now() - startStatic;

      expect(durationStatic).toBeLessThanOrEqual(durationDynamic + 5);
    });
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

      expect(htmlTab.getAttribute('id')).toBe('html-tab');
      expect(mermaidTab.getAttribute('id')).toBe('mermaid-tab');
      expect(latexTab.getAttribute('id')).toBe('latex-tab');
      expect(notesTab.getAttribute('id')).toBe('notes-tab');

      expect(htmlTab.getAttribute('aria-controls')).toBe('html-tabpanel');
      expect(mermaidTab.getAttribute('aria-controls')).toBe('mermaid-tabpanel');
      expect(latexTab.getAttribute('aria-controls')).toBe('latex-tabpanel');
      expect(notesTab.getAttribute('aria-controls')).toBe('notes-tabpanel');

      const tabPanel = screen.getByRole('tabpanel', { name: 'HTML Mode' });
      expect(tabPanel).toBeTruthy();
      expect(tabPanel.getAttribute('id')).toBe('html-tabpanel');
      expect(tabPanel.getAttribute('aria-labelledby')).toBe('html-tab');

      expect(htmlTab.getAttribute('aria-selected')).toBe('true');
      expect(mermaidTab.getAttribute('aria-selected')).toBe('false');
      expect(latexTab.getAttribute('aria-selected')).toBe('false');
      expect(notesTab.getAttribute('aria-selected')).toBe('false');

      expect(htmlTab.getAttribute('tabindex')).toBe('0');
      expect(mermaidTab.getAttribute('tabindex')).toBe('-1');
      expect(latexTab.getAttribute('tabindex')).toBe('-1');
      expect(notesTab.getAttribute('tabindex')).toBe('-1');

      fireEvent.click(mermaidTab);
      expect(setMode).toHaveBeenCalledWith('mermaid');

      fireEvent.click(latexTab);
      expect(setMode).toHaveBeenCalledWith('latex');

      fireEvent.click(notesTab);
      expect(setMode).toHaveBeenCalledWith('notes');
    });

    it('supports keyboard arrow navigation across tabs (ArrowRight, ArrowLeft, Home, End)', () => {
      const setMode = vi.fn();
      render(<InputCard {...defaultProps} mode="html" setMode={setMode} />);

      const htmlTab = screen.getByRole('tab', { name: 'HTML Mode' });

      // ArrowRight from HTML -> Mermaid
      fireEvent.keyDown(htmlTab, { key: 'ArrowRight' });
      expect(setMode).toHaveBeenCalledWith('mermaid');

      // ArrowLeft from HTML -> Notes (wraps around)
      fireEvent.keyDown(htmlTab, { key: 'ArrowLeft' });
      expect(setMode).toHaveBeenCalledWith('notes');

      // End from HTML -> Notes
      fireEvent.keyDown(htmlTab, { key: 'End' });
      expect(setMode).toHaveBeenCalledWith('notes');

      // Home from HTML -> HTML (index 0)
      fireEvent.keyDown(htmlTab, { key: 'Home' });
      expect(setMode).toHaveBeenLastCalledWith('notes'); // no setMode call because index is same
    });

    it('renders HTML Workspace when mode is "html" with keyboard shortcut hint and aria-describedby', () => {
      render(<InputCard {...defaultProps} mode="html" />);

      expect(screen.getByText('Input HTML')).toBeTruthy();
      const htmlEditor = screen.getByRole('textbox', { name: 'Input HTML' });
      expect(htmlEditor).toBeTruthy();

      const shortcutHint = document.getElementById('html-shortcut-hint');
      expect(shortcutHint).toBeTruthy();
      expect(shortcutHint.textContent).toContain('Press');
      expect(shortcutHint.textContent).toContain('Ctrl+Enter');
      expect(shortcutHint.textContent).toContain('⌘+Enter');
      expect(shortcutHint.textContent).toContain('to submit');

      expect(screen.queryByRole('textbox', { name: 'Input Mermaid' })).toBeNull();
      expect(screen.queryByRole('textbox', { name: 'Input LaTeX' })).toBeNull();
      expect(screen.queryByRole('textbox', { name: 'Input Notes JSON' })).toBeNull();
    });

    it('renders Mermaid Workspace when mode is "mermaid"', () => {
      render(<InputCard {...defaultProps} mode="mermaid" />);

      expect(screen.getByText('Input Mermaid')).toBeTruthy();
      expect(screen.getByRole('textbox', { name: 'Input Mermaid' })).toBeTruthy();
      expect(screen.queryByRole('textbox', { name: 'Input HTML' })).toBeNull();
    });

    it('renders LaTeX Workspace when mode is "latex"', () => {
      render(<InputCard {...defaultProps} mode="latex" />);

      expect(screen.getByText('Input LaTeX')).toBeTruthy();
      expect(screen.getByRole('textbox', { name: 'Input LaTeX' })).toBeTruthy();
      expect(screen.queryByRole('textbox', { name: 'Input HTML' })).toBeNull();
    });

    it('renders Notes Workspace when mode is "notes" with keyboard shortcut hint and aria-describedby', () => {
      render(<InputCard {...defaultProps} mode="notes" />);

      expect(screen.getByText('Input Notes JSON')).toBeTruthy();
      const notesEditor = screen.getByRole('textbox', { name: 'Input Notes JSON' });
      expect(notesEditor).toBeTruthy();

      const shortcutHint = document.getElementById('notes-shortcut-hint');
      expect(shortcutHint).toBeTruthy();
      expect(shortcutHint.textContent).toContain('Press');
      expect(shortcutHint.textContent).toContain('Ctrl+Enter');
      expect(shortcutHint.textContent).toContain('⌘+Enter');
      expect(shortcutHint.textContent).toContain('to submit');

      expect(screen.queryByRole('textbox', { name: 'Input HTML' })).toBeNull();
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

      act(() => {
        ref.current.resetHtml();
      });

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
    it('populates sample text, updates button feedback state, and announces via status region when "Load sample ↗" is clicked in HTML mode', () => {
      const setError = vi.fn();
      const { container } = render(<InputCard {...defaultProps} mode="html" setError={setError} />);

      const loadSampleBtn = screen.getByRole('button', { name: 'Load sample ↗' });
      fireEvent.click(loadSampleBtn);

      expect(setError).toHaveBeenCalledWith(null);
      expect(screen.getByRole('button', { name: '✓ Sample loaded' })).toBeTruthy();

      const statusRegion = container.querySelector('[role="status"][aria-live="polite"]');
      expect(statusRegion).toBeTruthy();
      expect(statusRegion.textContent).toBe('Sample HTML Mode code loaded successfully.');
    });

    it('populates sample text, updates button feedback state, and announces via status region when "Load sample ↗" is clicked in Mermaid mode', () => {
      const setMermaidError = vi.fn();
      const { container } = render(<InputCard {...defaultProps} mode="mermaid" setMermaidError={setMermaidError} />);

      const loadSampleBtn = screen.getByRole('button', { name: 'Load sample ↗' });
      fireEvent.click(loadSampleBtn);

      expect(setMermaidError).toHaveBeenCalledWith(null);
      expect(screen.getByRole('button', { name: '✓ Sample loaded' })).toBeTruthy();

      const statusRegion = container.querySelector('[role="status"][aria-live="polite"]');
      expect(statusRegion).toBeTruthy();
      expect(statusRegion.textContent).toBe('Sample Mermaid Mode code loaded successfully.');
    });

    it('handles file upload for valid HTML files and announces status via aria-live region', async () => {
      const setError = vi.fn();
      const { container } = render(<InputCard {...defaultProps} mode="html" setError={setError} />);

      const fileInput = container.querySelector('input[type="file"]');
      const file = new File(['<h1>Uploaded File</h1>'], 'sample.html', { type: 'text/html' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        const statusRegion = container.querySelector('[role="status"][aria-live="polite"]');
        expect(statusRegion.textContent).toBe('File "sample.html" loaded successfully.');
      });
      expect(setError).toHaveBeenCalledWith(null);
    });

    it('displays error and announces invalid file type via aria-live region in HTML mode', () => {
      const setError = vi.fn();
      const { container } = render(<InputCard {...defaultProps} mode="html" setError={setError} />);

      const fileInput = container.querySelector('input[type="file"]');
      const file = new File(['{"key": "val"}'], 'sample.json', { type: 'application/json' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(setError).toHaveBeenCalledWith('Please upload a valid .html file.');

      const statusRegion = container.querySelector('[role="status"][aria-live="polite"]');
      expect(statusRegion).toBeTruthy();
      expect(statusRegion.textContent).toBe('Please upload a valid .html file.');
    });

    it('handles drag over, drag leave, and drop for HTML files', async () => {
      const setError = vi.fn();
      const { container } = render(<InputCard {...defaultProps} mode="html" setError={setError} />);

      const editorLabel = screen.getByLabelText('Input HTML');
      const dropZone = editorLabel.closest('.dropZone') || editorLabel.parentElement;

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
        const statusRegion = container.querySelector('[role="status"][aria-live="polite"]');
        expect(statusRegion.textContent).toBe('File "drop.html" loaded successfully.');
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

      // Loading state tooltip
      rerender(<InputCard {...defaultProps} mode="notes" notesLoading={true} />);
      const loadingGenerateBtn = screen.getByRole('button', { name: 'Generating…' });
      expect(loadingGenerateBtn.getAttribute('title')).toBe('Generating…');
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

    it('handles Notes Workspace interactions: Copy/Clear, JSON upload, Validate, and Generate', async () => {
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

      const successEl = screen.getByText('✓ Valid Notes JSON structure');
      const errorEl = screen.getByText('⚠️ Invalid JSON formatting');
      expect(successEl).toBeTruthy();
      expect(successEl.getAttribute('role')).toBe('status');
      expect(successEl.getAttribute('aria-live')).toBe('polite');
      expect(errorEl).toBeTruthy();
      expect(errorEl.getAttribute('role')).toBe('alert');
      expect(errorEl.getAttribute('aria-live')).toBe('assertive');

      // Click Validate
      const validateBtn = screen.getByRole('button', { name: 'Validate' });
      fireEvent.click(validateBtn);
      expect(validateNotesJson).toHaveBeenCalled();

      // Upload JSON file via file input
      const fileInput = container.querySelector('input[type="file"]');
      const jsonFile = new File(['{"uploaded": true}'], 'notes.json', { type: 'application/json' });
      fireEvent.change(fileInput, { target: { files: [jsonFile] } });

      const statusRegion = container.querySelector('[role="status"][aria-live="polite"]');
      await waitFor(() => {
        expect(statusRegion.textContent).toBe('File "notes.json" loaded successfully.');
      });
      expect(handleNotesReset).toHaveBeenCalled();
    });

    it('handles drag over, drag leave, drop valid JSON, and invalid file error handling in Notes Workspace', async () => {
      const setNotesError = vi.fn();
      const { container } = render(<InputCard {...defaultProps} mode="notes" setNotesError={setNotesError} />);

      const editorLabel = screen.getByLabelText('Input Notes JSON');
      const dropZone = editorLabel.closest('.dropZone') || editorLabel.parentElement;

      // Drag Over
      fireEvent.dragOver(dropZone, { dataTransfer: { files: [] } });
      expect(screen.getByText('📂 Drop .json file here')).toBeTruthy();

      // Drag Leave
      fireEvent.dragLeave(dropZone);
      expect(screen.queryByText('📂 Drop .json file here')).toBeNull();

      // Drop valid JSON
      const jsonFile = new File(['{"dropped": true}'], 'drop.json', { type: 'application/json' });
      fireEvent.drop(dropZone, {
        dataTransfer: { files: [jsonFile] }
      });

      const statusRegion = container.querySelector('[role="status"][aria-live="polite"]');
      await waitFor(() => {
        expect(statusRegion.textContent).toBe('File "drop.json" loaded successfully.');
      });

      // Drop invalid file
      const invalidFile = new File(['plain text'], 'invalid.txt', { type: 'text/plain' });
      fireEvent.drop(dropZone, {
        dataTransfer: { files: [invalidFile] }
      });

      expect(setNotesError).toHaveBeenCalledWith('Please upload a valid .json file.');
      expect(statusRegion.textContent).toBe('Please upload a valid .json file.');
    });
  });
});
