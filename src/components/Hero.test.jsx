import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { Hero } from './Hero';
import styles from '../styles/Home.module.css';

describe('Hero', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders main heading and word roller with proper accessibility attributes', () => {
    render(<Hero />);

    expect(screen.getByText('Render Flow')).toBeTruthy();
    expect(screen.getByText('Code to Image')).toBeTruthy();

    const wordRoller = screen.getByLabelText('HTML Mermaid LaTeX JSON');
    expect(wordRoller).toBeTruthy();
    expect(screen.getByText('HTML')).toBeTruthy();
    expect(screen.getByText('Mermaid')).toBeTruthy();
    expect(screen.getByText('LaTeX')).toBeTruthy();
    expect(screen.getByText('JSON')).toBeTruthy();
  });

  it('renders description paragraph', () => {
    render(<Hero />);

    const descText = screen.getByText(
      /Paste your HTML, Mermaid diagram, or LaTeX\. Get back a clean PNG in seconds — rendered right there in your browser tab\. That's the whole process\./i
    );
    expect(descText).toBeTruthy();
  });

  it('renders feature meta badges', () => {
    render(<Hero />);

    expect(screen.getByText('⚡ Instant results')).toBeTruthy();
    expect(screen.getByText('🎨 HTML, Mermaid & LaTeX')).toBeTruthy();
    expect(screen.getByText('🔒 Stays on your device')).toBeTruthy();
    expect(screen.getByText('🌐 Just open and use')).toBeTruthy();
  });

  it('renders decorative pixel grid aria-hidden wrapper and grid cells', () => {
    const { container } = render(<Hero />);

    const hiddenGrids = container.querySelectorAll('[aria-hidden="true"]');
    expect(hiddenGrids.length).toBeGreaterThan(0);

    const pixelCellSelector = `.${styles.pixelCell}`;
    const pixelCells = container.querySelectorAll(pixelCellSelector);
    expect(pixelCells.length).toBe(512);
  });
});
