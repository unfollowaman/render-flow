import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, test, expect, beforeAll } from 'vitest';
import { NotesBlockRenderer, ContinuationLabel } from './NotesBlockComponents';
import { loadKatex } from '../lib/notesMode/renderEquation';

describe('NotesBlockComponents', () => {
  beforeAll(async () => {
    await loadKatex();
  });
  test('renders continuation label correctly', () => {
    const html = renderToStaticMarkup(<ContinuationLabel questionNumber={2} />);
    expect(html).toContain('Q2 (continued)');
    expect(html).toContain('continuation-label-block');
  });

  test('renders question header block correctly', () => {
    const block = {
      type: 'question-header',
      questionNumber: 1,
      content: [{ type: 'text', content: 'What is acceleration?' }]
    };
    const html = renderToStaticMarkup(<NotesBlockRenderer block={block} isTopOfColumn={false} />);
    expect(html).toContain('What is acceleration?');
    expect(html).toContain('question-header-block');
    expect(html).not.toContain('continued');
  });

  test('renders solution first block with continuation label when at top of column', () => {
    const block = {
      type: 'solution-first',
      questionNumber: 2,
      element: { type: 'text', content: 'Solution step 1' }
    };
    const html = renderToStaticMarkup(<NotesBlockRenderer block={block} isTopOfColumn={true} />);
    expect(html).toContain('Q2 (continued)');
    expect(html).toContain('Solution');
    expect(html).toContain('Solution step 1');
    expect(html).toContain('solution-first-block');
  });

  test('renders solution rest block correctly', () => {
    const block = {
      type: 'solution-rest',
      questionNumber: 2,
      element: { type: 'text', content: 'Solution step 2' }
    };
    const html = renderToStaticMarkup(<NotesBlockRenderer block={block} isTopOfColumn={false} />);
    expect(html).toContain('Solution step 2');
    expect(html).toContain('solution-rest-block');
    expect(html).not.toContain('continued');
  });

  test('sanitizes equation HTML rendered in content items', () => {
    const block = {
      type: 'solution-first',
      questionNumber: 1,
      element: { type: 'equation', latex: 'x^2 + y^2 = r^2' }
    };
    const html = renderToStaticMarkup(<NotesBlockRenderer block={block} isTopOfColumn={false} />);
    expect(html).toContain('katex');
    expect(html).not.toContain('onerror=');
  });
});
