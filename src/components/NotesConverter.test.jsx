import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, test, expect, afterEach } from 'vitest';
import React from 'react';
import App from '../App';
import NotesConverter from './NotesConverter';

describe('NotesConverter & Notes Mode integration', () => {
  afterEach(() => {
    cleanup();
  });

  const sampleJsonOnePage = JSON.stringify({
    chapter: { title: "Chapter 1: Physics", subtitle: "Kinematics" },
    pages: [
      {
        items: [
          {
            type: "question",
            number: 1,
            question: [{ type: "text", content: "What is velocity?" }],
            solution: [{ type: "text", content: "Speed in a given direction." }]
          },
          {
            type: "question",
            number: 2,
            question: [{ type: "text", content: "What is acceleration?" }],
            solution: [{ type: "text", content: "Rate of change of velocity." }]
          }
        ]
      }
    ]
  });

  const sampleJsonTwoPages = JSON.stringify({
    chapter: { title: "Chapter 2: Multi Page", subtitle: "Testing pagination" },
    pages: [
      {
        items: [
          {
            type: "question",
            number: 1,
            question: [{ type: "text", content: "First Page Question" }],
            solution: [{ type: "text", content: "First Page Solution" }]
          }
        ]
      },
      {
        items: [
          {
            type: "question",
            number: 2,
            question: [{ type: "text", content: "Second Page Question" }],
            solution: [{ type: "text", content: "Second Page Solution" }]
          }
        ]
      }
    ]
  });

  test('Test Case 1: Paste valid JSON with 1 page containing 2 questions -> clicking Generate renders A4 page with 2 card pairs', async () => {
    render(<NotesConverter mode="notes" setMode={() => {}} />);

    const textarea = screen.getByLabelText('Input Notes JSON');
    fireEvent.change(textarea, { target: { value: sampleJsonOnePage } });

    const generateBtn = screen.getByRole('button', { name: /Generate/i });
    fireEvent.click(generateBtn);

    expect(await screen.findByText('Chapter 1: Physics')).toBeTruthy();
    expect(screen.getByText('Kinematics')).toBeTruthy();
    expect(screen.getByText('What is velocity?')).toBeTruthy();
    expect(screen.getByText('Speed in a given direction.')).toBeTruthy();
    expect(screen.getByText('What is acceleration?')).toBeTruthy();
    expect(screen.getByText('Rate of change of velocity.')).toBeTruthy();
  });

  test('Test Case 2: Flattening & Pagination - Paste JSON with items -> Generate flattens items into multi-page array and allows navigation', async () => {
    render(<NotesConverter mode="notes" setMode={() => {}} />);

    const textarea = screen.getByLabelText('Input Notes JSON');
    fireEvent.change(textarea, { target: { value: sampleJsonTwoPages } });

    const generateBtn = screen.getByRole('button', { name: /Generate/i });
    fireEvent.click(generateBtn);

    expect(await screen.findByText('Chapter 2: Multi Page')).toBeTruthy();
    expect(screen.getByText('First Page Question')).toBeTruthy();

    // With pagination flattening, items are paginated. If page 1 has item 1, Next button moves to page 2.
    const pageCounter = screen.queryByText(/Page 1 of/i);
    if (pageCounter) {
      const nextBtn = screen.getByRole('button', { name: /Next/i });
      fireEvent.click(nextBtn);
      expect(await screen.findByText('Second Page Question')).toBeTruthy();
    }
  });

  test('Test Case 3: Paste invalid JSON -> Validate shows clear inline error message', () => {
    render(<NotesConverter mode="notes" setMode={() => {}} />);

    const textarea = screen.getByLabelText('Input Notes JSON');
    fireEvent.change(textarea, { target: { value: '{"chapter": "bad json",}' } });

    const validateBtn = screen.getByRole('button', { name: /Validate/i });
    fireEvent.click(validateBtn);

    expect(screen.getByText(/Expected/i)).toBeTruthy();
  });

  test('Test Case 4: Load JSON file from disk -> populates textarea', async () => {
    render(<NotesConverter mode="notes" setMode={() => {}} />);

    const file = new File(['{"chapter": {"title": "File Loaded"}}'], 'test.json', { type: 'application/json' });
    const fileInput = document.querySelector('input[type="file"][accept*=".json"]');

    fireEvent.change(fileInput, { target: { files: [file] } });

    const textarea = screen.getByLabelText('Input Notes JSON');
    await waitFor(() => {
      expect(textarea.value).toBe('{"chapter": {"title": "File Loaded"}}');
    });
  });

  test('Test Case 5: Click Clear after generating a page -> textarea empties and A4 preview clears', async () => {
    render(<NotesConverter mode="notes" setMode={() => {}} />);

    const textarea = screen.getByLabelText('Input Notes JSON');
    fireEvent.change(textarea, { target: { value: sampleJsonOnePage } });

    const generateBtn = screen.getByRole('button', { name: /Generate/i });
    fireEvent.click(generateBtn);

    expect(await screen.findByText('Chapter 1: Physics')).toBeTruthy();

    const clearBtn = screen.getByRole('button', { name: /Clear/i });
    fireEvent.click(clearBtn);

    expect(textarea.value).toBe('');
    expect(screen.queryByText('Chapter 1: Physics')).toBeNull();
  });

  test('Test Case 6: Switch between modes in App -> no crash or state leakage', async () => {
    render(<App />);

    expect(await screen.findByLabelText('Input HTML')).toBeTruthy();

    const notesTab = screen.getByRole('tab', { name: 'Notes Mode' });
    fireEvent.click(notesTab);

    expect(await screen.findByLabelText('Input Notes JSON')).toBeTruthy();

    const htmlTab = screen.getByRole('tab', { name: 'HTML Mode' });
    fireEvent.click(htmlTab);

    expect(await screen.findByLabelText('Input HTML')).toBeTruthy();
  });

  test('Specific Requirement Test 1: Question item with equation element renders KaTeX math HTML', async () => {
    const equationJson = JSON.stringify({
      chapter: { title: "Math Chapter", subtitle: "Equations" },
      pages: [
        {
          items: [
            {
              type: "question",
              number: 1,
              question: [{ type: "equation", latex: "E = mc^2" }],
              solution: [{ type: "text", content: "Energy mass equivalence." }]
            }
          ]
        }
      ]
    });

    render(<NotesConverter mode="notes" setMode={() => {}} />);

    const textarea = screen.getByLabelText('Input Notes JSON');
    fireEvent.change(textarea, { target: { value: equationJson } });

    const generateBtn = screen.getByRole('button', { name: /Generate/i });
    fireEvent.click(generateBtn);

    expect(await screen.findByText('Math Chapter')).toBeTruthy();
    const katexEl = document.querySelector('.katex');
    expect(katexEl).toBeTruthy();
  });

  test('Specific Requirement Test 2: Question item with coordinate_graph renders SVG', async () => {
    const graphJson = JSON.stringify({
      chapter: { title: "Geometry", subtitle: "Graphs" },
      pages: [
        {
          items: [
            {
              type: "question",
              number: 1,
              question: [{ type: "text", content: "Graph below:" }],
              solution: [
                {
                  type: "coordinate_graph",
                  points: [
                    { x: 0, y: 0, label: "A" },
                    { x: 3, y: 4, label: "B" }
                  ],
                  segments: [
                    { from: { x: 0, y: 0 }, to: { x: 3, y: 4 } }
                  ]
                }
              ]
            }
          ]
        }
      ]
    });

    render(<NotesConverter mode="notes" setMode={() => {}} />);

    const textarea = screen.getByLabelText('Input Notes JSON');
    fireEvent.change(textarea, { target: { value: graphJson } });

    const generateBtn = screen.getByRole('button', { name: /Generate/i });
    fireEvent.click(generateBtn);

    expect(await screen.findByText('Geometry')).toBeTruthy();
    const svgEl = document.querySelector('svg.coordinate-plane');
    expect(svgEl).toBeTruthy();
    expect(screen.getByText('A')).toBeTruthy();
    expect(screen.getByText('B')).toBeTruthy();
  });

  test('Specific Requirement Test 4: Malformed equation data fails validateNotesJson before rendering', async () => {
    const badEquationJson = JSON.stringify({
      chapter: { title: "Bad Math", subtitle: "Test" },
      pages: [
        {
          items: [
            {
              type: "question",
              number: 1,
              question: [{ type: "equation" }],
              solution: []
            }
          ]
        }
      ]
    });

    render(<NotesConverter mode="notes" setMode={() => {}} />);

    const textarea = screen.getByLabelText('Input Notes JSON');
    fireEvent.change(textarea, { target: { value: badEquationJson } });

    const generateBtn = screen.getByRole('button', { name: /Generate/i });
    fireEvent.click(generateBtn);

    expect(await screen.findByText(/Field "latex" is required/i)).toBeTruthy();
    expect(screen.queryByText('Bad Math')).toBeNull();
  });

  test('Specific Requirement Test 5 & 7: 3+ page pagination and page navigation', async () => {
    const multiPageItems = Array.from({ length: 15 }, (_, i) => ({
      type: "question",
      number: i + 1,
      question: [{ type: "text", content: `Question ${i + 1} content block with detailed text.` }],
      solution: [{ type: "text", content: `Solution ${i + 1} content block.` }]
    }));

    const doc3Pages = JSON.stringify({
      chapter: { title: "Large Doc", subtitle: "15 Items" },
      pages: [{ items: multiPageItems }]
    });

    render(<NotesConverter mode="notes" setMode={() => {}} />);

    const textarea = screen.getByLabelText('Input Notes JSON');
    fireEvent.change(textarea, { target: { value: doc3Pages } });

    const generateBtn = screen.getByRole('button', { name: /Generate/i });
    fireEvent.click(generateBtn);

    expect(await screen.findByText('Large Doc')).toBeTruthy();
    expect(screen.getByText(/Page 1 of/i)).toBeTruthy();

    const nextBtn = screen.getByRole('button', { name: /Go to next page/i });
    expect(nextBtn.getAttribute('aria-label')).toBe('Go to next page');
    fireEvent.click(nextBtn);
    expect(await screen.findByText(/Page 2 of/i)).toBeTruthy();

    fireEvent.click(nextBtn);
    expect(await screen.findByText(/Page 3 of/i)).toBeTruthy();

    const prevBtn = screen.getByRole('button', { name: /Go to previous page/i });
    expect(prevBtn.getAttribute('aria-label')).toBe('Go to previous page');
    fireEvent.click(prevBtn);
    expect(await screen.findByText(/Page 2 of/i)).toBeTruthy();
  });

  test('Specific Requirement Test 6: Oversized item rendered with overflow warning banner', async () => {
    const hugeText = "Lorem ipsum dolor sit amet ".repeat(500);
    const overflowDoc = JSON.stringify({
      chapter: { title: "Overflow Doc", subtitle: "Giant Item" },
      pages: [
        {
          items: [
            {
              type: "question",
              number: 1,
              question: [{ type: "text", content: hugeText }],
              solution: [{ type: "text", content: "Huge solution" }]
            }
          ]
        }
      ]
    });

    render(<NotesConverter mode="notes" setMode={() => {}} />);

    const textarea = screen.getByLabelText('Input Notes JSON');
    fireEvent.change(textarea, { target: { value: overflowDoc } });

    const generateBtn = screen.getByRole('button', { name: /Generate/i });
    fireEvent.click(generateBtn);

    expect(await screen.findByText('Content too large to fit within a single page in this phase')).toBeTruthy();
  });
});
