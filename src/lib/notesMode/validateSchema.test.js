import { describe, test, expect } from 'vitest';
import { validateNotesJson } from './validateSchema';

describe('validateNotesJson', () => {
  // Test Case 1: A fully valid Phase 1 JSON document passes with valid: true and an empty errors array.
  test('Test Case 1: A fully valid Phase 1 JSON document passes with valid: true and an empty errors array', () => {
    const validDoc = {
      chapter: {
        title: 'Chapter 1: Kinematics',
        subtitle: 'Motion in One Dimension'
      },
      pages: [
        {
          items: [
            {
              type: 'question',
              number: 1,
              question: [{ type: 'text', content: 'What is constant acceleration?' }],
              solution: [{ type: 'text', content: 'Acceleration that does not change over time.' }]
            }
          ]
        }
      ]
    };

    const result = validateNotesJson(validDoc);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  // Test Case 2: A document missing chapter.title fails with a specific error path pointing at "chapter.title".
  test('Test Case 2: A document missing chapter.title fails with a specific error path pointing at "chapter.title"', () => {
    const invalidDoc = {
      chapter: {
        subtitle: 'Motion in One Dimension'
      },
      pages: []
    };

    const result = validateNotesJson(invalidDoc);
    expect(result.valid).toBe(false);
    expect(result.errors.some(err => err.path === 'chapter.title')).toBe(true);
  });

  // Test Case 3: A document where items[0] has no solution array fails with an error path pointing at the specific item index.
  test('Test Case 3: A document where items[0] has no solution array fails with an error path pointing at the specific item index', () => {
    const invalidDoc = {
      chapter: {
        title: 'Chapter 1: Kinematics',
        subtitle: 'Motion in One Dimension'
      },
      pages: [
        {
          items: [
            {
              type: 'question',
              number: 1,
              question: [{ type: 'text', content: 'What is velocity?' }]
            }
          ]
        }
      ]
    };

    const result = validateNotesJson(invalidDoc);
    expect(result.valid).toBe(false);
    expect(result.errors.some(err => err.path === 'pages[0].items[0].solution')).toBe(true);
  });

  // Test Case 4: A document where an item has an unrecognized type (e.g. "foobar") is flagged rather than silently accepted or silently rendered as blank.
  test('Test Case 4: A document where an item has an unrecognized type (e.g. "foobar") is flagged', () => {
    const invalidDoc = {
      chapter: {
        title: 'Chapter 1: Kinematics',
        subtitle: 'Motion in One Dimension'
      },
      pages: [
        {
          items: [
            {
              type: 'foobar',
              number: 1
            }
          ]
        }
      ]
    };

    const result = validateNotesJson(invalidDoc);
    expect(result.valid).toBe(false);
    expect(result.errors.some(err => err.path === 'pages[0].items[0].type')).toBe(true);
  });

  // Test Case 5: An empty pages array is accepted as structurally valid (zero pages is not itself an error).
  test('Test Case 5: An empty pages array is accepted as structurally valid', () => {
    const validDocWithEmptyPages = {
      chapter: {
        title: 'Chapter 1: Kinematics',
        subtitle: 'Motion in One Dimension'
      },
      pages: []
    };

    const result = validateNotesJson(validDocWithEmptyPages);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test('Validates equation and coordinate_graph content elements', () => {
    const docWithNewElements = {
      chapter: { title: 'Math & Graphs', subtitle: 'Advanced Types' },
      pages: [
        {
          items: [
            {
              type: 'question',
              number: 1,
              question: [
                { type: 'text', content: 'Solve:' },
                { type: 'equation', latex: 'E=mc^2' }
              ],
              solution: [
                {
                  type: 'coordinate_graph',
                  xRange: [-5, 5],
                  yRange: [-5, 5],
                  points: [{ x: 1, y: 2, label: 'P1' }]
                }
              ]
            }
          ]
        }
      ]
    };

    const result = validateNotesJson(docWithNewElements);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test('Fails on equation missing latex', () => {
    const badEquationDoc = {
      chapter: { title: 'Math', subtitle: 'Test' },
      pages: [
        {
          items: [
            {
              type: 'question',
              number: 1,
              question: [{ type: 'equation' }],
              solution: []
            }
          ]
        }
      ]
    };

    const result = validateNotesJson(badEquationDoc);
    expect(result.valid).toBe(false);
    expect(result.errors.some(err => err.path === 'pages[0].items[0].question[0].latex')).toBe(true);
  });

  test('Fails on coordinate_graph point missing y', () => {
    const badGraphDoc = {
      chapter: { title: 'Graph', subtitle: 'Test' },
      pages: [
        {
          items: [
            {
              type: 'question',
              number: 1,
              question: [
                {
                  type: 'coordinate_graph',
                  points: [{ x: 1 }]
                }
              ],
              solution: []
            }
          ]
        }
      ]
    };

    const result = validateNotesJson(badGraphDoc);
    expect(result.valid).toBe(false);
    expect(result.errors.some(err => err.path === 'pages[0].items[0].question[0].points[0].y')).toBe(true);
  });

  test('Fails on completely invalid root document inputs', () => {
    const invalidInputs = [null, undefined, 'invalid string', ['an', 'array'], 123, true];

    invalidInputs.forEach(input => {
      const result = validateNotesJson(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual([
        { path: '', message: 'Root document must be a JSON object' }
      ]);
    });
  });

  test('Benchmark: measures performance on large document validation', () => {
    const largeDoc = {
      chapter: { title: 'Large Benchmark Chapter', subtitle: 'Performance Test' },
      pages: Array.from({ length: 10 }, (_, pIdx) => ({
        items: Array.from({ length: 50 }, (_, iIdx) => ({
          type: 'question',
          number: pIdx * 50 + iIdx + 1,
          question: [
            { type: 'text', content: 'Sample question content text' },
            { type: 'equation', latex: 'f(x) = ax^2 + bx + c' }
          ],
          solution: [
            { type: 'text', content: 'Step 1 calculation' },
            {
              type: 'coordinate_graph',
              xRange: [-10, 10],
              yRange: [-10, 10],
              points: [{ x: 0, y: 0, label: 'Origin' }]
            }
          ]
        }))
      }))
    };

    // Warmup
    validateNotesJson(largeDoc);

    const iterations = 50;
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      const res = validateNotesJson(largeDoc);
      expect(res.valid).toBe(true);
    }
    const duration = performance.now() - start;

    console.log(`[Benchmark validateNotesJson] ${iterations} runs on 500 items x 4 content elements: ${duration.toFixed(2)}ms (${(duration / iterations).toFixed(4)}ms/run)`);
    expect(duration).toBeGreaterThan(0);
  });
});
