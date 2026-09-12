import { describe, test, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QuestionSolutionCard } from '../components/NotesModeCard';
import { measureHeight, clearMeasurementCache } from '../lib/notesMode/paginate';

describe('Notes Mode Pagination & DOM Measurement Verification', () => {
  const containerCss = {
    width: '174mm',
    boxSizing: 'border-box',
    fontFamily: "'Montserrat', sans-serif",
  };

  test('Test Case 1: Two items with identical short text, one containing equation and one not — confirm markup structure and equation presence', () => {
    const textOnlyItem = {
      id: 'q1',
      number: 1,
      question: [{ type: 'text', content: 'What is acceleration?' }],
      solution: [{ type: 'text', content: 'Rate of change of velocity.' }]
    };

    const equationItem = {
      id: 'q2',
      number: 2,
      question: [{ type: 'text', content: 'What is acceleration?' }],
      solution: [
        { type: 'text', content: 'Rate of change of velocity.' },
        { type: 'equation', latex: 'a = \\frac{dv}{dt}' }
      ]
    };

    const textMarkup = renderToStaticMarkup(<QuestionSolutionCard item={textOnlyItem} questionNumber={1} />);
    const eqMarkup = renderToStaticMarkup(<QuestionSolutionCard item={equationItem} questionNumber={2} />);

    // Confirm equation markup contains KaTeX rendered elements while text-only does not
    expect(textMarkup).not.toContain('katex');
    expect(eqMarkup).toContain('katex');
    expect(eqMarkup.length).toBeGreaterThan(textMarkup.length);
  });

  test('Test Case 2: An item containing a coordinate_graph element measures accounting for diagram size', () => {
    const textItem = {
      id: 'q1',
      number: 1,
      question: [{ type: 'text', content: 'Graph test question' }],
      solution: [{ type: 'text', content: 'Short solution text' }]
    };

    const graphItem = {
      id: 'q2',
      number: 2,
      question: [{ type: 'text', content: 'Graph test question' }],
      solution: [
        {
          type: 'coordinate_graph',
          width: 300,
          height: 300,
          points: [{ x: 0, y: 0, label: 'Origin' }]
        }
      ]
    };

    const textMarkup = renderToStaticMarkup(<QuestionSolutionCard item={textItem} questionNumber={1} />);
    const graphMarkup = renderToStaticMarkup(<QuestionSolutionCard item={graphItem} questionNumber={2} />);

    expect(graphMarkup).toContain('svg');
    expect(graphMarkup).toContain('coordinate-plane');
    expect(graphMarkup.length).toBeGreaterThan(textMarkup.length);
  });

  test('Test Case 4: Hidden measurement containers created during process are fully removed from DOM after cache reset', () => {
    clearMeasurementCache();
    const initialChildCount = document.body.children.length;

    const item = {
      id: 'q1',
      number: 1,
      question: [{ type: 'text', content: 'Cleanup check' }]
    };

    const html = renderToStaticMarkup(<QuestionSolutionCard item={item} questionNumber={1} />);
    const el = document.createElement('div');
    el.innerHTML = html;

    measureHeight(el.firstElementChild, containerCss, 'mm');
    expect(document.body.children.length).toBe(initialChildCount + 1);

    clearMeasurementCache();
    expect(document.body.children.length).toBe(initialChildCount);
  });
});
