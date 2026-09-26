import React from 'react';
import { CoordinateContext, createCoordinateTransformers } from './CoordinateContext';

/**
 * SVG marker definitions for coordinate axes arrows
 */
function PlaneDefs({ axisColor }) {
  return (
    <defs>
      <marker
        id="arrow-x"
        viewBox="0 0 10 10"
        refX="6"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M 0 1 L 10 5 L 0 9 z" fill={axisColor} />
      </marker>
      <marker
        id="arrow-y"
        viewBox="0 0 10 10"
        refX="6"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M 0 1 L 10 5 L 0 9 z" fill={axisColor} />
      </marker>
    </defs>
  );
}

/**
 * Renders grid lines for coordinate plane
 */
function GridLines({ gridColor, xTicks, yTicks, toSvgX, toSvgY, padding, width, height }) {
  return (
    <g className="grid-lines" stroke={gridColor} strokeWidth="1">
      {xTicks.map((x) => (
        <line
          key={`grid-x-${x}`}
          x1={toSvgX(x)}
          y1={padding}
          x2={toSvgX(x)}
          y2={height - padding}
        />
      ))}
      {yTicks.map((y) => (
        <line
          key={`grid-y-${y}`}
          x1={padding}
          y1={toSvgY(y)}
          x2={width - padding}
          y2={toSvgY(y)}
        />
      ))}
    </g>
  );
}

/**
 * Renders coordinate axes, tick lines, tick values, and axis title labels
 */
function Axes({
  axisColor,
  textColor,
  fontSize,
  padding,
  width,
  height,
  xAxisY,
  yAxisX,
  xTicks,
  yTicks,
  toSvgX,
  toSvgY
}) {
  return (
    <g className="axes">
      {/* X Axis */}
      <line
        x1={padding / 2}
        y1={xAxisY}
        x2={width - padding / 2}
        y2={xAxisY}
        stroke={axisColor}
        strokeWidth="1.5"
        markerEnd="url(#arrow-x)"
      />
      {/* Y Axis */}
      <line
        x1={yAxisX}
        y1={height - padding / 2}
        x2={yAxisX}
        y2={padding / 2}
        stroke={axisColor}
        strokeWidth="1.5"
        markerEnd="url(#arrow-y)"
      />

      {/* X Axis Ticks and Labels */}
      {xTicks.map((x) => {
        if (x === 0) return null; // Skip origin label on axis ticks
        const svgX = toSvgX(x);
        return (
          <g key={`tick-x-${x}`} className="x-tick">
            <line
              x1={svgX}
              y1={xAxisY - 4}
              x2={svgX}
              y2={xAxisY + 4}
              stroke={axisColor}
              strokeWidth="1"
            />
            <text
              x={svgX}
              y={xAxisY + 16}
              fill={textColor}
              fontSize={fontSize}
              textAnchor="middle"
            >
              {x}
            </text>
          </g>
        );
      })}

      {/* Y Axis Ticks and Labels */}
      {yTicks.map((y) => {
        if (y === 0) return null; // Skip origin label on axis ticks
        const svgY = toSvgY(y);
        return (
          <g key={`tick-y-${y}`} className="y-tick">
            <line
              x1={yAxisX - 4}
              y1={svgY}
              x2={yAxisX + 4}
              y2={svgY}
              stroke={axisColor}
              strokeWidth="1"
            />
            <text
              x={yAxisX - 8}
              y={svgY + 4}
              fill={textColor}
              fontSize={fontSize}
              textAnchor="end"
            >
              {y}
            </text>
          </g>
        );
      })}

      {/* Axis Name Labels */}
      <text
        x={width - padding / 2 + 8}
        y={xAxisY + 4}
        fill={axisColor}
        fontSize={fontSize + 2}
        fontWeight="bold"
      >
        x
      </text>
      <text
        x={yAxisX}
        y={padding / 2 - 8}
        fill={axisColor}
        fontSize={fontSize + 2}
        fontWeight="bold"
        textAnchor="middle"
      >
        y
      </text>
    </g>
  );
}

/**
 * CoordinatePlane Component
 * Renders an SVG coordinate plane with grid lines, labeled axes, and mathematical coordinate space mapping.
 */
export function CoordinatePlane({
  xRange = [-5, 5],
  yRange = [-5, 5],
  showGrid = true,
  showAxes = true,
  width = 400,
  height = 400,
  padding = 40,
  gridColor = '#e5e7eb',
  axisColor = '#374151',
  textColor = '#4b5563',
  fontSize = 12,
  children
}) {
  const transformers = createCoordinateTransformers({
    xRange,
    yRange,
    width,
    height,
    padding
  });

  const { toSvgX, toSvgY, xMin, xMax, yMin, yMax } = transformers;

  // Generate integer ticks for grid and axis labels
  const xTicks = [];
  for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
    xTicks.push(x);
  }

  const yTicks = [];
  for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
    yTicks.push(y);
  }

  const originX = toSvgX(0);
  const originY = toSvgY(0);

  // Axis positions clamped to view area so axes remain visible if origin is off-screen
  const xAxisY = Math.max(padding, Math.min(height - padding, originY));
  const yAxisX = Math.max(padding, Math.min(width - padding, originX));

  return (
    <CoordinateContext.Provider value={transformers}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        xmlns="http://www.w3.org/2000/svg"
        className="coordinate-plane"
        style={{
          width: '100%',
          height: 'auto',
          maxWidth: `${width}px`,
          display: 'block',
          fontFamily: 'sans-serif',
          backgroundColor: '#ffffff'
        }}
      >
        <PlaneDefs axisColor={axisColor} />

        {showGrid && (
          <GridLines
            gridColor={gridColor}
            xTicks={xTicks}
            yTicks={yTicks}
            toSvgX={toSvgX}
            toSvgY={toSvgY}
            padding={padding}
            width={width}
            height={height}
          />
        )}

        {showAxes && (
          <Axes
            axisColor={axisColor}
            textColor={textColor}
            fontSize={fontSize}
            padding={padding}
            width={width}
            height={height}
            xAxisY={xAxisY}
            yAxisX={yAxisX}
            xTicks={xTicks}
            yTicks={yTicks}
            toSvgX={toSvgX}
            toSvgY={toSvgY}
          />
        )}

        {/* Layered child elements (Points, Lines, Shapes) */}
        {children}
      </svg>
    </CoordinateContext.Provider>
  );
}

/**
 * Functional wrapper for coordinatePlane
 */
export function coordinatePlane(props = {}) {
  const { children, ...restProps } = props;
  return <CoordinatePlane {...restProps}>{children}</CoordinatePlane>;
}
