import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CoordinatePlane, coordinatePlane } from './CoordinatePlane';
import { Point } from './Point';

describe('CoordinatePlane Component', () => {
  it('renders SVG coordinate plane with default props (grid, axes, ticks, markers, labels)', () => {
    const { container } = render(<CoordinatePlane />);

    const svg = container.querySelector('svg.coordinate-plane');
    expect(svg).not.toBeNull();
    expect(svg.getAttribute('viewBox')).toBe('0 0 400 400');
    expect(svg.style.backgroundColor).toBe('rgb(255, 255, 255)');

    // Check arrow markers in <defs>
    const markers = container.querySelectorAll('defs marker path');
    expect(markers.length).toBe(2);
    expect(markers[0].getAttribute('fill')).toBe('#374151');
    expect(markers[1].getAttribute('fill')).toBe('#374151');

    // Check Grid lines (-5 to 5 integer ticks = 11 xTicks and 11 yTicks -> 22 total lines)
    const gridGroup = container.querySelector('.grid-lines');
    expect(gridGroup.getAttribute('stroke')).toBe('#e5e7eb');
    const gridLines = gridGroup.querySelectorAll('line');
    expect(gridLines.length).toBe(22);

    // Check Axes
    const axesGroup = container.querySelector('.axes');
    expect(axesGroup).not.toBeNull();

    // Check Ticks (origin x=0 and y=0 tick text are skipped -> 10 xTicks, 10 yTicks)
    const xTicks = container.querySelectorAll('.x-tick');
    const yTicks = container.querySelectorAll('.y-tick');
    expect(xTicks.length).toBe(10);
    expect(yTicks.length).toBe(10);

    // Check axis labels 'x' and 'y'
    const textElements = Array.from(container.querySelectorAll('.axes > text'));
    const xLabel = textElements.find((el) => el.textContent === 'x');
    const yLabel = textElements.find((el) => el.textContent === 'y');
    expect(xLabel).not.toBeUndefined();
    expect(yLabel).not.toBeUndefined();
    expect(xLabel.getAttribute('fill')).toBe('#374151');
    expect(yLabel.getAttribute('fill')).toBe('#374151');
  });

  it('customizes dimensions, ranges, padding, colors, and font size', () => {
    const { container } = render(
      <CoordinatePlane
        xRange={[-10, 10]}
        yRange={[-10, 10]}
        width={600}
        height={600}
        padding={50}
        gridColor="#cccccc"
        axisColor="#111111"
        textColor="#222222"
        fontSize={14}
      />
    );

    const svg = container.querySelector('svg');
    expect(svg.getAttribute('viewBox')).toBe('0 0 600 600');

    // Grid lines count: 21 xTicks (-10 to 10) + 21 yTicks = 42 lines
    const gridGroup = container.querySelector('.grid-lines');
    expect(gridGroup.getAttribute('stroke')).toBe('#cccccc');
    const gridLines = gridGroup.querySelectorAll('line');
    expect(gridLines.length).toBe(42);

    // Check arrow marker fill color
    const markers = container.querySelectorAll('defs marker path');
    expect(markers.length).toBe(2);
    expect(markers[0].getAttribute('fill')).toBe('#111111');

    // Check tick text styling
    const xTickText = container.querySelector('.x-tick text');
    expect(xTickText.getAttribute('fill')).toBe('#222222');
    expect(xTickText.getAttribute('font-size')).toBe('14');
  });

  it('hides grid lines when showGrid is false', () => {
    const { container } = render(<CoordinatePlane showGrid={false} />);

    const gridGroup = container.querySelector('.grid-lines');
    expect(gridGroup).toBeNull();

    const axesGroup = container.querySelector('.axes');
    expect(axesGroup).not.toBeNull();
  });

  it('hides axes and ticks when showAxes is false', () => {
    const { container } = render(<CoordinatePlane showAxes={false} />);

    const axesGroup = container.querySelector('.axes');
    expect(axesGroup).toBeNull();

    const gridGroup = container.querySelector('.grid-lines');
    expect(gridGroup).not.toBeNull();
  });

  it('clamps axis positions when origin is off-screen', () => {
    // xRange: [10, 20], yRange: [10, 20], width: 400, height: 400, padding: 40
    // Origin (0,0) is far outside view area.
    // xAxisY and yAxisX should be clamped to padding (40) or (height - padding) (360)
    const { container } = render(
      <CoordinatePlane xRange={[10, 20]} yRange={[10, 20]} width={400} height={400} padding={40} />
    );

    const axesLines = container.querySelectorAll('.axes > line');
    expect(axesLines.length).toBe(2);

    const xAxisLine = axesLines[0]; // X axis line (y1, y2 should equal xAxisY)
    const yAxisLine = axesLines[1]; // Y axis line (x1, x2 should equal yAxisX)

    const xAxisY = parseFloat(xAxisLine.getAttribute('y1'));
    const yAxisX = parseFloat(yAxisLine.getAttribute('x1'));

    // Clamped bounds: padding (40) or width/height - padding (360)
    expect(xAxisY).toBeGreaterThanOrEqual(40);
    expect(xAxisY).toBeLessThanOrEqual(360);
    expect(yAxisX).toBeGreaterThanOrEqual(40);
    expect(yAxisX).toBeLessThanOrEqual(360);
  });

  it('passes transformers through CoordinateContext to children components', () => {
    const { container } = render(
      <CoordinatePlane xRange={[-5, 5]} yRange={[-5, 5]} width={400} height={400} padding={40}>
        <Point x={0} y={0} label="Origin" />
      </CoordinatePlane>
    );

    const circle = container.querySelector('.coordinate-point circle');
    expect(circle).not.toBeNull();
    // Origin (0,0) mapped to SVG center: 40 + (0 - (-5)) * 32 = 200, 360 - (0 - (-5)) * 32 = 200
    expect(parseFloat(circle.getAttribute('cx'))).toBe(200);
    expect(parseFloat(circle.getAttribute('cy'))).toBe(200);
  });

  it('renders correctly via coordinatePlane functional wrapper', () => {
    const { container } = render(
      coordinatePlane({
        xRange: [-2, 2],
        yRange: [-2, 2],
        showGrid: true,
        children: <Point x={1} y={1} label="P" />
      })
    );

    const svg = container.querySelector('svg.coordinate-plane');
    expect(svg).not.toBeNull();

    const pointElement = container.querySelector('.coordinate-point');
    expect(pointElement).not.toBeNull();
  });
});
