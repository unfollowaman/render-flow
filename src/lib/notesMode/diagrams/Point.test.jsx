import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CoordinatePlane } from './CoordinatePlane';
import { Point, point } from './Point';

describe('Point Component', () => {
  it('renders a circle with default styling and transformed coordinates when inside CoordinatePlane', () => {
    // Default CoordinatePlane: xRange=[-5, 5], yRange=[-5, 5], width=400, height=400, padding=40
    // (3, 4) -> x = 40 + (3 - (-5))*32 = 296, y = 360 - (4 - (-5))*32 = 72
    const { container } = render(
      <CoordinatePlane xRange={[-5, 5]} yRange={[-5, 5]} width={400} height={400} padding={40}>
        <Point x={3} y={4} />
      </CoordinatePlane>
    );

    const pointGroup = container.querySelector('[data-testid="coordinate-point"]');
    expect(pointGroup).not.toBeNull();

    const circle = pointGroup.querySelector('circle');
    expect(circle).not.toBeNull();
    expect(parseFloat(circle.getAttribute('cx'))).toBe(296);
    expect(parseFloat(circle.getAttribute('cy'))).toBe(72);
    expect(circle.getAttribute('r')).toBe('5');
    expect(circle.getAttribute('fill')).toBe('#7C3AED');

    // No text label rendered when label prop is omitted
    const text = pointGroup.querySelector('text');
    expect(text).toBeNull();
  });

  it('renders label with explicit labelPosition and offset calculations', () => {
    // (3, 4) -> SVG (296, 72)
    // labelPosition="bottom-left": dx = -10, dy = 14, textAnchor = 'end', dominantBaseline = 'auto'
    // label x = 296 - 10 = 286, label y = 72 + 14 = 86
    const { container } = render(
      <CoordinatePlane xRange={[-5, 5]} yRange={[-5, 5]} width={400} height={400} padding={40}>
        <Point x={3} y={4} label="A" labelPosition="bottom-left" />
      </CoordinatePlane>
    );

    const text = container.querySelector('.coordinate-point text');
    expect(text).not.toBeNull();
    expect(text.textContent).toBe('A');
    expect(parseFloat(text.getAttribute('x'))).toBe(286);
    expect(parseFloat(text.getAttribute('y'))).toBe(86);
    expect(text.getAttribute('fill')).toBe('#7C3AED');
    expect(text.getAttribute('font-size')).toBe('13');
    expect(text.getAttribute('font-weight')).toBe('bold');
    expect(text.getAttribute('text-anchor')).toBe('end');
    expect(text.getAttribute('dominant-baseline')).toBe('auto');
  });

  it('falls back to default top-right offset when invalid labelPosition is provided', () => {
    // labelPosition="invalid-position" -> falls back to top-right (dx: 10, dy: -10)
    // (3, 4) -> SVG (296, 72)
    // label x = 296 + 10 = 306, label y = 72 - 10 = 62
    const { container } = render(
      <CoordinatePlane xRange={[-5, 5]} yRange={[-5, 5]} width={400} height={400} padding={40}>
        <Point x={3} y={4} label="B" labelPosition="invalid-position" />
      </CoordinatePlane>
    );

    const text = container.querySelector('.coordinate-point text');
    expect(text).not.toBeNull();
    expect(parseFloat(text.getAttribute('x'))).toBe(306);
    expect(parseFloat(text.getAttribute('y'))).toBe(62);
    expect(text.getAttribute('text-anchor')).toBe('start');
  });

  it('automatically resolves label position based on neighbors array', () => {
    const pA = { x: 1, y: 1 };
    const pB = { x: 1.2, y: 1.3 };
    const neighbors = [pA, pB];

    const { container } = render(
      <CoordinatePlane xRange={[-5, 5]} yRange={[-5, 5]}>
        <Point x={pA.x} y={pA.y} label="A" neighbors={neighbors} />
        <Point x={pB.x} y={pB.y} label="B" neighbors={neighbors} />
      </CoordinatePlane>
    );

    const texts = container.querySelectorAll('.coordinate-point text');
    expect(texts.length).toBe(2);
    // Automatic position resolution ensures labels avoid each other and don't place at exact same relative offset
    expect(texts[0].getAttribute('x')).not.toBe(texts[1].getAttribute('x'));
  });

  it('supports custom styling props (color, radius, fontSize, fontWeight)', () => {
    const { container } = render(
      <CoordinatePlane>
        <Point
          x={0}
          y={0}
          label="Origin"
          color="#EF4444"
          radius={8}
          fontSize={16}
          fontWeight="normal"
        />
      </CoordinatePlane>
    );

    const circle = container.querySelector('.coordinate-point circle');
    expect(circle.getAttribute('fill')).toBe('#EF4444');
    expect(circle.getAttribute('r')).toBe('8');

    const text = container.querySelector('.coordinate-point text');
    expect(text.getAttribute('fill')).toBe('#EF4444');
    expect(text.getAttribute('font-size')).toBe('16');
    expect(text.getAttribute('font-weight')).toBe('normal');
  });

  it('renders correctly via point helper function', () => {
    const { container } = render(
      <CoordinatePlane>
        {point({ x: 2, y: 2, label: 'Helper Point', color: '#10B981' })}
      </CoordinatePlane>
    );

    const circle = container.querySelector('.coordinate-point circle');
    const text = container.querySelector('.coordinate-point text');

    expect(circle).not.toBeNull();
    expect(text).not.toBeNull();
    expect(text.textContent).toBe('Helper Point');
    expect(circle.getAttribute('fill')).toBe('#10B981');
  });
});
