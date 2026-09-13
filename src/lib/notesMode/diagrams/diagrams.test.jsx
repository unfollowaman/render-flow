import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  CoordinatePlane,
  coordinatePlane,
  Point,
  point,
  lineSegment,
  Shape,
  shape,
  resolveLabelPosition,
  createCoordinateTransformers
} from './index';

describe('SVG Math Diagram Generators - Notes Mode', () => {
  it('Test Case 1: coordinatePlane renders with correct axis range and grid when given xRange: [-5,5], yRange: [-5,5]', () => {
    const { container } = render(
      <CoordinatePlane xRange={[-5, 5]} yRange={[-5, 5]} showGrid={true} showAxes={true} width={400} height={400} />
    );

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg.getAttribute('viewBox')).toBe('0 0 400 400');

    // Ticks -5 to 5 exist (11 ticks on x, 11 ticks on y)
    const xTicks = container.querySelectorAll('.x-tick');
    const yTicks = container.querySelectorAll('.y-tick');
    expect(xTicks.length).toBe(10); // 0 tick label skipped
    expect(yTicks.length).toBe(10); // 0 tick label skipped

    // Grid lines count: 11 vertical + 11 horizontal lines
    const gridLines = container.querySelectorAll('.grid-lines line');
    expect(gridLines.length).toBe(22);
  });

  it('Test Case 2: A single point({x:3, y:4, label:"A"}) plots at the mathematically correct position within a coordinatePlane of the same range, and its label does not overlap the point marker', () => {
    // Canvas: width=400, height=400, padding=40. Inner grid: 320x320 for range [-5,5] -> scale = 32px per unit.
    // Origin (0,0) is at SVG (200, 200).
    // Point (3,4): x_svg = 40 + (3 - (-5)) * 32 = 296, y_svg = 360 - (4 - (-5)) * 32 = 72.
    const { container } = render(
      <CoordinatePlane xRange={[-5, 5]} yRange={[-5, 5]} width={400} height={400} padding={40}>
        <Point x={3} y={4} label="A" />
      </CoordinatePlane>
    );

    const circle = container.querySelector('circle');
    expect(circle).not.toBeNull();
    expect(parseFloat(circle.getAttribute('cx'))).toBe(296);
    expect(parseFloat(circle.getAttribute('cy'))).toBe(72);

    const text = container.querySelector('.coordinate-point text');
    expect(text).not.toBeNull();
    expect(text.textContent).toBe('A');

    // Confirm label offset is applied so label position (text x, y) does not equal circle center
    const textX = parseFloat(text.getAttribute('x'));
    const textY = parseFloat(text.getAttribute('y'));
    expect(textX).not.toBe(296);
    expect(textY).not.toBe(72);
    expect(textX).toBeGreaterThan(296); // offset top-right default
    expect(textY).toBeLessThan(72);
  });

  it('Test Case 3: Two points plus a lineSegment connecting them render as a correctly positioned line matching both endpoints', () => {
    const p1 = { x: -2, y: -1 };
    const p2 = { x: 3, y: 3 };

    // Transformers calculation verification:
    // p1 (-2, -1): x_svg = 40 + 3*32 = 136, y_svg = 360 - 4*32 = 232
    // p2 (3, 3): x_svg = 40 + 8*32 = 296, y_svg = 360 - 8*32 = 104
    const { container } = render(
      coordinatePlane({
        xRange: [-5, 5],
        yRange: [-5, 5],
        width: 400,
        height: 400,
        padding: 40,
        children: [
          <React.Fragment key="p1">{point({ ...p1, label: 'P1' })}</React.Fragment>,
          <React.Fragment key="p2">{point({ ...p2, label: 'P2' })}</React.Fragment>,
          <React.Fragment key="line">{lineSegment({ from: p1, to: p2, label: 'segment' })}</React.Fragment>
        ]
      })
    );

    const line = container.querySelector('.coordinate-line-segment line');
    expect(line).not.toBeNull();

    expect(parseFloat(line.getAttribute('x1'))).toBe(136);
    expect(parseFloat(line.getAttribute('y1'))).toBe(232);
    expect(parseFloat(line.getAttribute('x2'))).toBe(296);
    expect(parseFloat(line.getAttribute('y2'))).toBe(104);
  });

  it('Test Case 4: A 3-point closed shape (triangle) with points A(0,0), B(4,0), C(0,3) renders as a correctly proportioned right triangle', () => {
    // A(0,0): (200, 200)
    // B(4,0): 40 + 9*32 = 328, y = 200
    // C(0,3): x = 200, y = 360 - 8*32 = 104
    const points = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 0, y: 3 }
    ];

    const { container } = render(
      <CoordinatePlane xRange={[-5, 5]} yRange={[-5, 5]} width={400} height={400} padding={40}>
        <Shape points={points} closed={true} fillColor="rgba(0,0,0,0.1)" strokeColor="#000" />
      </CoordinatePlane>
    );

    const polygon = container.querySelector('polygon');
    expect(polygon).not.toBeNull();
    const pointsAttr = polygon.getAttribute('points');
    expect(pointsAttr).toBe('200,200 328,200 200,104');
  });

  it('Test Case 5: Multiple points with labels close together render without label text visually overlapping (collision avoidance strategy)', () => {
    // Two close points: A(1, 1) and B(1.2, 1.3)
    const pA = { x: 1, y: 1 };
    const pB = { x: 1.2, y: 1.3 };
    const neighbors = [pA, pB];

    const posA = resolveLabelPosition(pA.x, pA.y, neighbors);
    const posB = resolveLabelPosition(pB.x, pB.y, neighbors);

    // Collision avoidance strategy: resolveLabelPosition computes a repulsion direction vector
    // away from nearby neighbor points and selects a non-overlapping label quadrant ('bottom-left' vs 'top-right').
    expect(posA).not.toBe(posB);

    const { container } = render(
      <CoordinatePlane xRange={[-5, 5]} yRange={[-5, 5]}>
        <Point x={pA.x} y={pA.y} label="A" neighbors={neighbors} />
        <Point x={pB.x} y={pB.y} label="B" neighbors={neighbors} />
      </CoordinatePlane>
    );

    const texts = container.querySelectorAll('.coordinate-point text');
    expect(texts.length).toBe(2);
    const textA = texts[0];
    const textB = texts[1];

    expect(textA.getAttribute('x')).not.toBe(textB.getAttribute('x'));
    expect(textA.getAttribute('y')).not.toBe(textB.getAttribute('y'));
  });

  it('Test Case 6: Negative coordinates (e.g. point at x:-3, y:-2) render correctly positioned relative to the origin, not clipped or mis-transformed', () => {
    // x: -3 -> 40 + (-3 - (-5)) * 32 = 40 + 2*32 = 104
    // y: -2 -> 360 - (-2 - (-5)) * 32 = 360 - 3*32 = 264
    const transformers = createCoordinateTransformers({
      xRange: [-5, 5],
      yRange: [-5, 5],
      width: 400,
      height: 400,
      padding: 40
    });

    expect(transformers.toSvgX(-3)).toBe(104);
    expect(transformers.toSvgY(-2)).toBe(264);

    const { container } = render(
      <CoordinatePlane xRange={[-5, 5]} yRange={[-5, 5]} width={400} height={400} padding={40}>
        <Point x={-3} y={-2} label="P_neg" />
      </CoordinatePlane>
    );

    const circle = container.querySelector('circle');
    expect(circle).not.toBeNull();
    expect(parseFloat(circle.getAttribute('cx'))).toBe(104);
    expect(parseFloat(circle.getAttribute('cy'))).toBe(264);

    // Ensure within viewBox bounds (0 to 400)
    expect(parseFloat(circle.getAttribute('cx'))).toBeGreaterThan(0);
    expect(parseFloat(circle.getAttribute('cx'))).toBeLessThan(400);
    expect(parseFloat(circle.getAttribute('cy'))).toBeGreaterThan(0);
    expect(parseFloat(circle.getAttribute('cy'))).toBeLessThan(400);
  });
});
