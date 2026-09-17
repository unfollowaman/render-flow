import React, { createRef } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OutputCard } from './OutputCard';

describe('OutputCard', () => {
  beforeEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const mockResult = {
    image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    width: 800,
    height: 600,
  };

  it('renders preview title, dimensions, image, and hint correctly', () => {
    const handleReset = vi.fn();
    const { container } = render(
      <OutputCard result={mockResult} onReset={handleReset} mode="html" />
    );

    expect(screen.getByText('Preview')).toBeTruthy();
    expect(screen.getByText('800 × 600px')).toBeTruthy();
    expect(screen.getByText('800 × 600 · PNG · 1x scale')).toBeTruthy();

    const img = screen.getByAltText('Rendered HTML output');
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe(mockResult.image);

    const cardElement = container.querySelector('.neu-card');
    expect(cardElement).not.toBeNull();
  });

  it('renders correct alt text based on mode prop', () => {
    const { rerender } = render(
      <OutputCard result={mockResult} onReset={() => {}} mode="mermaid" />
    );
    expect(screen.getByAltText('Rendered Mermaid diagram')).toBeTruthy();

    rerender(<OutputCard result={mockResult} onReset={() => {}} mode="latex" />);
    expect(screen.getByAltText('Rendered LaTeX equation')).toBeTruthy();

    rerender(<OutputCard result={mockResult} onReset={() => {}} mode="other" />);
    expect(screen.getByAltText('Rendered HTML output')).toBeTruthy();
  });

  it('opens and closes fullscreen overlay when preview image is clicked', () => {
    render(<OutputCard result={mockResult} onReset={() => {}} mode="html" />);

    const previewImg = screen.getByRole('button', { name: /Rendered HTML output - Click to enlarge/i });
    expect(screen.queryByAltText('Rendered HTML output (fullscreen view)')).toBeNull();

    // Open fullscreen
    fireEvent.click(previewImg);
    const fullscreenImg = screen.getByAltText('Rendered HTML output (fullscreen view)');
    expect(fullscreenImg).toBeTruthy();

    // Close fullscreen by clicking overlay
    const overlay = fullscreenImg.parentElement;
    fireEvent.click(overlay);
    expect(screen.queryByAltText('Rendered HTML output (fullscreen view)')).toBeNull();
  });

  it('closes fullscreen overlay when explicit close button is clicked', () => {
    render(<OutputCard result={mockResult} onReset={() => {}} mode="html" />);

    const previewImg = screen.getByRole('button', { name: /Rendered HTML output - Click to enlarge/i });
    fireEvent.click(previewImg);
    expect(screen.getByAltText('Rendered HTML output (fullscreen view)')).toBeTruthy();

    const closeBtn = screen.getByRole('button', { name: /Close fullscreen preview/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByAltText('Rendered HTML output (fullscreen view)')).toBeNull();
  });

  it('opens and closes fullscreen overlay with keyboard navigation (Enter, Space, Escape)', () => {
    render(<OutputCard result={mockResult} onReset={() => {}} mode="html" />);

    const previewImg = screen.getByRole('button', { name: /Rendered HTML output - Click to enlarge/i });

    // Open via Enter key
    fireEvent.keyDown(previewImg, { key: 'Enter' });
    expect(screen.getByAltText('Rendered HTML output (fullscreen view)')).toBeTruthy();

    // Close via Escape key
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByAltText('Rendered HTML output (fullscreen view)')).toBeNull();

    // Open via Space key
    fireEvent.keyDown(previewImg, { key: ' ' });
    expect(screen.getByAltText('Rendered HTML output (fullscreen view)')).toBeTruthy();

    // Close via overlay keyboard interaction
    const overlay = screen.getByRole('button', { name: /Close preview overlay/i });
    fireEvent.keyDown(overlay, { key: 'Escape' });
    expect(screen.queryByAltText('Rendered HTML output (fullscreen view)')).toBeNull();
  });

  it('triggers onReset when Reset button is clicked', () => {
    const handleReset = vi.fn();
    render(<OutputCard result={mockResult} onReset={handleReset} mode="html" />);

    const resetButton = screen.getByRole('button', { name: /Reset/i });
    fireEvent.click(resetButton);

    expect(handleReset).toHaveBeenCalledTimes(1);
  });

  it('triggers image download on Download PNG button click and updates text feedback', () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const { container } = render(<OutputCard result={mockResult} onReset={() => {}} mode="html" />);

    const downloadButton = screen.getByRole('button', { name: /Download PNG/i });
    fireEvent.click(downloadButton);

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByText('✓ Downloaded!')).toBeTruthy();

    const iconImg = container.querySelector('button img');
    expect(iconImg).not.toBeNull();
    expect(iconImg.getAttribute('alt')).toBe('');
    expect(iconImg.getAttribute('aria-hidden')).toBe('true');
  });

  it('handles download safely when result or result.image is missing', () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const emptyResult = { width: 0, height: 0 };
    render(<OutputCard result={emptyResult} onReset={() => {}} mode="html" />);

    const downloadButton = screen.getByRole('button', { name: /Download PNG/i });
    fireEvent.click(downloadButton);

    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('forwards ref correctly to the root card container', () => {
    const ref = createRef();
    render(<OutputCard result={mockResult} onReset={() => {}} mode="html" ref={ref} />);

    expect(ref.current).not.toBeNull();
    expect(ref.current.classList.contains('neu-card')).toBe(true);
  });
});
