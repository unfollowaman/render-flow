import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import DefaultQuestionSolutionCard, {
  QuestionSolutionCard,
  renderContentItem,
  renderContentArray,
} from './NotesModeCard';

describe('NotesModeCard Component and Helpers', () => {
  beforeEach(() => {
    cleanup();
  });

  describe('renderContentItem', () => {
    it('renders a string item in a span', () => {
      const { container } = render(renderContentItem('Plain text string', 0));
      expect(container.textContent).toBe('Plain text string');
      expect(container.querySelector('span')).not.toBeNull();
    });

    it('renders primitive non-object values as string spans', () => {
      const { container: c1 } = render(renderContentItem(42, 0));
      expect(c1.textContent).toBe('42');

      const { container: c2 } = render(renderContentItem(null, 1));
      expect(c2.textContent).toBe('null');

      const { container: c3 } = render(renderContentItem(undefined, 2));
      expect(c3.textContent).toBe('undefined');
    });

    it('renders text type item with content or text property', () => {
      const { container: c1 } = render(renderContentItem({ type: 'text', content: 'Text Content' }, 0));
      expect(c1.textContent).toBe('Text Content');

      const { container: c2 } = render(renderContentItem({ type: 'text', text: 'Text Prop' }, 1));
      expect(c2.textContent).toBe('Text Prop');

      const { container: c3 } = render(renderContentItem({ type: 'text' }, 2));
      expect(c3.textContent).toBe('');
    });

    it('renders equation type item with KaTeX HTML', () => {
      const { container } = render(renderContentItem({ type: 'equation', latex: 'E = mc^2' }, 0));
      expect(container.querySelector('.katex')).not.toBeNull();
    });

    it('renders equation error message when KaTeX parsing fails', () => {
      const { container } = render(
        renderContentItem({ type: 'equation', latex: '\\invalidMacro{' }, 0)
      );
      expect(container.textContent).toContain('[equation error:');
      const errorSpan = container.querySelector('span');
      expect(errorSpan.style.color).toBe('rgb(220, 38, 38)');
    });

    it('renders coordinate_graph type item with CoordinatePlane, Shape, LineSegment, and Point', () => {
      const graphItem = {
        type: 'coordinate_graph',
        xRange: [-5, 5],
        yRange: [-5, 5],
        showGrid: true,
        showAxes: true,
        width: 400,
        height: 300,
        padding: 20,
        gridColor: '#e0e0e0',
        axisColor: '#000000',
        textColor: '#333333',
        shapes: [
          {
            points: [
              { x: 0, y: 0 },
              { x: 2, y: 0 },
              { x: 1, y: 2 },
            ],
            label: 'Triangle',
            fillColor: 'rgba(0, 0, 255, 0.1)',
            strokeColor: '#0000ff',
            strokeWidth: 2,
            opacity: 0.8,
            strokeDasharray: '4',
            fontSize: 12,
          },
        ],
        segments: [
          {
            from: { x: 0, y: 0 },
            to: { x: 3, y: 3 },
            label: 'Diagonal',
            color: '#ff0000',
            strokeWidth: 1.5,
            strokeDasharray: '2 2',
            fontSize: 10,
          },
        ],
        points: [
          {
            x: 2,
            y: 3,
            label: 'P(2,3)',
            color: '#008000',
            radius: 4,
            labelPosition: 'top',
            fontSize: 11,
            fontWeight: 'bold',
          },
        ],
      };

      const { container } = render(renderContentItem(graphItem, 0));
      const svg = container.querySelector('svg');
      expect(svg).not.toBeNull();
      expect(container.querySelector('.coordinate-shape')).not.toBeNull();
      expect(container.textContent).toContain('Diagonal');
      expect(container.textContent).toContain('P(2,3)');
    });

    it('renders fallback representation for unknown object types or missing type', () => {
      const { container: c1 } = render(renderContentItem({ content: 'Fallback Content' }, 0));
      expect(c1.textContent).toBe('Fallback Content');

      const { container: c2 } = render(renderContentItem({ text: 'Fallback Text' }, 1));
      expect(c2.textContent).toBe('Fallback Text');

      const { container: c3 } = render(renderContentItem({ customProp: 'value' }, 2));
      expect(c3.textContent).toBe('{"customProp":"value"}');
    });
  });

  describe('renderContentArray', () => {
    it('returns null when contentItems is null or undefined', () => {
      expect(renderContentArray(null)).toBeNull();
      expect(renderContentArray(undefined)).toBeNull();
    });

    it('returns string unchanged when contentItems is a string', () => {
      expect(renderContentArray('Direct string')).toBe('Direct string');
    });

    it('converts non-array non-string value to string', () => {
      expect(renderContentArray(12345)).toBe('12345');
    });

    it('renders an array of items correctly', () => {
      const items = [
        'First item. ',
        { type: 'text', content: 'Second item.' },
      ];
      const { container } = render(<div>{renderContentArray(items)}</div>);
      expect(container.textContent).toBe('First item. Second item.');
    });
  });

  describe('QuestionSolutionCard Component', () => {
    it('renders null when item prop is null or undefined', () => {
      const { container: c1 } = render(<QuestionSolutionCard item={null} />);
      expect(c1.firstChild).toBeNull();

      const { container: c2 } = render(<QuestionSolutionCard />);
      expect(c2.firstChild).toBeNull();
    });

    it('renders question and question number correctly', () => {
      const item = {
        question: 'What is the speed of light?',
      };
      render(<QuestionSolutionCard item={item} questionNumber={3} />);

      expect(screen.getByText('3')).toBeTruthy();
      expect(screen.getByText('What is the speed of light?')).toBeTruthy();
    });

    it('falls back to item.number if questionNumber prop is not provided', () => {
      const item = {
        number: 7,
        question: 'What is Newton second law?',
      };
      render(<QuestionSolutionCard item={item} />);

      expect(screen.getByText('7')).toBeTruthy();
      expect(screen.getByText('What is Newton second law?')).toBeTruthy();
    });

    it('defaults question number to 1 if neither questionNumber nor item.number is provided', () => {
      const item = {
        question: 'What is gravity?',
      };
      render(<QuestionSolutionCard item={item} />);

      expect(screen.getByText('1')).toBeTruthy();
      expect(screen.getByText('What is gravity?')).toBeTruthy();
    });

    it('renders solution card when solution prop is present in item', () => {
      const item = {
        question: 'Find x: x + 2 = 5',
        solution: 'x = 3',
      };
      render(<QuestionSolutionCard item={item} questionNumber={1} />);

      expect(screen.getByText('Find x: x + 2 = 5')).toBeTruthy();
      expect(screen.getByText('Solution')).toBeTruthy();
      expect(screen.getByText('x = 3')).toBeTruthy();
    });

    it('omits solution block when solution prop is absent', () => {
      const item = {
        question: 'Open question without solution',
      };
      render(<QuestionSolutionCard item={item} questionNumber={1} />);

      expect(screen.getByText('Open question without solution')).toBeTruthy();
      expect(screen.queryByText('Solution')).toBeNull();
    });

    it('works identically via default export', () => {
      const item = {
        question: 'Default Export Question',
        solution: 'Default Export Solution',
      };
      render(<DefaultQuestionSolutionCard item={item} questionNumber={5} />);

      expect(screen.getByText('5')).toBeTruthy();
      expect(screen.getByText('Default Export Question')).toBeTruthy();
      expect(screen.getByText('Default Export Solution')).toBeTruthy();
    });
  });
});
