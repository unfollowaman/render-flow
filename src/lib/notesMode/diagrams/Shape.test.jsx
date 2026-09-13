import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CoordinatePlane } from './CoordinatePlane';
import { Shape, shape } from './Shape';

describe('Shape Component', () => {
  it('returns null when points array is empty, null, or undefined', () => {
    const { container: c1 } = render(
      <CoordinatePlane>
        <Shape points={[]} />
      </CoordinatePlane>
    );
    expect(c1.querySelector('.coordinate-shape')).toBeNull();

    const { container: c2 } = render(
      <CoordinatePlane>
        <Shape points={null} />
      </CoordinatePlane>
    );
    expect(c2.querySelector('.coordinate-shape')).toBeNull();

    const { container: c3 } = render(
      <CoordinatePlane>
        <Shape />
      </CoordinatePlane>
    );
    expect(c3.querySelector('.coordinate-shape')).toBeNull();
  });

  it('renders a polygon with default styling and transformed coordinates when closed={true}', () => {
    // Default CoordinatePlane: xRange=[-5, 5], yRange=[-5, 5], width=400, height=400, padding=40
    // innerWidth = 320, scaleX = 32 -> x = 40 + (x - (-5))*32
    // innerHeight = 320, scaleY = 32 -> y = 360 - (y - (-5))*32
    // A(0, 0): x = 40 + 5*32 = 200, y = 360 - 5*32 = 200
    // B(4, 0): x = 40 + 9*32 = 328, y = 200
    // C(0, 3): x = 200, y = 360 - 8*32 = 104
    const points = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 0, y: 3 }
    ];

    const { container } = render(
      <CoordinatePlane xRange={[-5, 5]} yRange={[-5, 5]} width={400} height={400} padding={40}>
        <Shape points={points} />
      </CoordinatePlane>
    );

    const shapeGroup = container.querySelector('[data-testid="coordinate-shape"]');
    expect(shapeGroup).not.toBeNull();

    const polygon = shapeGroup.querySelector('polygon');
    expect(polygon).not.toBeNull();
    expect(polygon.getAttribute('points')).toBe('200,200 328,200 200,104');
    expect(polygon.getAttribute('fill')).toBe('rgba(124, 58, 237, 0.15)');
    expect(polygon.getAttribute('stroke')).toBe('#7C3AED');
    expect(polygon.getAttribute('stroke-width')).toBe('2');
    expect(polygon.getAttribute('stroke-dasharray')).toBeNull();

    // Ensures polyline is not rendered
    expect(shapeGroup.querySelector('polyline')).toBeNull();
  });

  it('renders a polyline with fill="none" when closed={false}', () => {
    const points = [
      { x: -1, y: -1 },
      { x: 1, y: 2 },
      { x: 3, y: 0 }
    ];

    const { container } = render(
      <CoordinatePlane>
        <Shape points={points} closed={false} />
      </CoordinatePlane>
    );

    const polyline = container.querySelector('.coordinate-shape polyline');
    expect(polyline).not.toBeNull();
    expect(polyline.getAttribute('fill')).toBe('none');
    expect(polyline.getAttribute('stroke')).toBe('#7C3AED');
    expect(polyline.getAttribute('stroke-width')).toBe('2');

    // Ensures polygon is not rendered
    expect(container.querySelector('.coordinate-shape polygon')).toBeNull();
  });

  it('renders with custom styling props (fillColor, strokeColor, strokeWidth, strokeDasharray)', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 2, y: 2 },
      { x: 0, y: 2 }
    ];

    const { container } = render(
      <CoordinatePlane>
        <Shape
          points={points}
          closed={true}
          fillColor="#FF0000"
          strokeColor="#00FF00"
          strokeWidth={3}
          strokeDasharray="4,4"
        />
      </CoordinatePlane>
    );

    const polygon = container.querySelector('.coordinate-shape polygon');
    expect(polygon.getAttribute('fill')).toBe('#FF0000');
    expect(polygon.getAttribute('stroke')).toBe('#00FF00');
    expect(polygon.getAttribute('stroke-width')).toBe('3');
    expect(polygon.getAttribute('stroke-dasharray')).toBe('4,4');
  });

  it('renders correctly via shape helper function', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 1, y: 1 }
    ];

    const { container } = render(
      <CoordinatePlane>
        {shape({ points, closed: false, strokeColor: '#000000' })}
      </CoordinatePlane>
    );

    const polyline = container.querySelector('.coordinate-shape polyline');
    expect(polyline).not.toBeNull();
    expect(polyline.getAttribute('stroke')).toBe('#000000');
  });
});
