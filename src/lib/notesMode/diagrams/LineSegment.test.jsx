import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CoordinatePlane } from './CoordinatePlane';
import { LineSegment, lineSegment } from './LineSegment';

describe('LineSegment Component', () => {
  it('returns null when "from" or "to" prop is missing', () => {
    const { container: c1 } = render(
      <CoordinatePlane>
        <LineSegment to={{ x: 1, y: 1 }} />
      </CoordinatePlane>
    );
    expect(c1.querySelector('.coordinate-line-segment')).toBeNull();

    const { container: c2 } = render(
      <CoordinatePlane>
        <LineSegment from={{ x: 0, y: 0 }} />
      </CoordinatePlane>
    );
    expect(c2.querySelector('.coordinate-line-segment')).toBeNull();

    const { container: c3 } = render(
      <CoordinatePlane>
        <LineSegment />
      </CoordinatePlane>
    );
    expect(c3.querySelector('.coordinate-line-segment')).toBeNull();
  });

  it('renders a line with default styling and transformed coordinates when inside CoordinatePlane', () => {
    // Default CoordinatePlane: xRange=[-5, 5], yRange=[-5, 5], width=400, height=400, padding=40
    // innerWidth = 320, scaleX = 32 -> x = 40 + (x - (-5))*32
    // innerHeight = 320, scaleY = 32 -> y = 360 - (y - (-5))*32
    // from (-2, -1): x1 = 40 + 3*32 = 136, y1 = 360 - 4*32 = 232
    // to (3, 3): x2 = 40 + 8*32 = 296, y2 = 360 - 8*32 = 104
    const from = { x: -2, y: -1 };
    const to = { x: 3, y: 3 };

    const { container } = render(
      <CoordinatePlane xRange={[-5, 5]} yRange={[-5, 5]} width={400} height={400} padding={40}>
        <LineSegment from={from} to={to} />
      </CoordinatePlane>
    );

    const lineGroup = container.querySelector('[data-testid="coordinate-line-segment"]');
    expect(lineGroup).not.toBeNull();

    const line = lineGroup.querySelector('line');
    expect(line).not.toBeNull();
    expect(parseFloat(line.getAttribute('x1'))).toBe(136);
    expect(parseFloat(line.getAttribute('y1'))).toBe(232);
    expect(parseFloat(line.getAttribute('x2'))).toBe(296);
    expect(parseFloat(line.getAttribute('y2'))).toBe(104);

    expect(line.getAttribute('stroke')).toBe('#2563EB');
    expect(line.getAttribute('stroke-width')).toBe('2');
    expect(line.getAttribute('stroke-dasharray')).toBeNull();

    // No text label rendered when label prop is omitted
    const text = lineGroup.querySelector('text');
    expect(text).toBeNull();
  });

  it('renders line with custom styling props (color, strokeWidth, strokeDasharray)', () => {
    const from = { x: 0, y: 0 };
    const to = { x: 4, y: 4 };

    const { container } = render(
      <CoordinatePlane>
        <LineSegment
          from={from}
          to={to}
          color="#DC2626"
          strokeWidth={4}
          strokeDasharray="5,5"
        />
      </CoordinatePlane>
    );

    const line = container.querySelector('.coordinate-line-segment line');
    expect(line.getAttribute('stroke')).toBe('#DC2626');
    expect(line.getAttribute('stroke-width')).toBe('4');
    expect(line.getAttribute('stroke-dasharray')).toBe('5,5');
  });

  it('renders label text at midpoint (midX, midY - 8) with correct fontSize and fill', () => {
    // from (-2, -1): SVG (136, 232)
    // to (3, 3): SVG (296, 104)
    // midX = (136 + 296) / 2 = 216
    // midY = (232 + 104) / 2 = 168
    // label y = 168 - 8 = 160
    const from = { x: -2, y: -1 };
    const to = { x: 3, y: 3 };

    const { container } = render(
      <CoordinatePlane xRange={[-5, 5]} yRange={[-5, 5]} width={400} height={400} padding={40}>
        <LineSegment from={from} to={to} label="Hypotenuse" color="#16A34A" fontSize={14} />
      </CoordinatePlane>
    );

    const text = container.querySelector('.coordinate-line-segment text');
    expect(text).not.toBeNull();
    expect(text.textContent).toBe('Hypotenuse');
    expect(parseFloat(text.getAttribute('x'))).toBe(216);
    expect(parseFloat(text.getAttribute('y'))).toBe(160);
    expect(text.getAttribute('fill')).toBe('#16A34A');
    expect(text.getAttribute('font-size')).toBe('14');
    expect(text.getAttribute('text-anchor')).toBe('middle');
  });

  it('renders correctly via lineSegment helper function', () => {
    const from = { x: 0, y: 0 };
    const to = { x: 2, y: 2 };

    const { container } = render(
      <CoordinatePlane>
        {lineSegment({ from, to, label: 'Helper Line' })}
      </CoordinatePlane>
    );

    const line = container.querySelector('.coordinate-line-segment line');
    const text = container.querySelector('.coordinate-line-segment text');

    expect(line).not.toBeNull();
    expect(text).not.toBeNull();
    expect(text.textContent).toBe('Helper Line');
  });
});
