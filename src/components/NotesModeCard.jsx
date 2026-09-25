import React from 'react';
import { renderEquation, loadKatex } from '../lib/notesMode/renderEquation';
import { CoordinatePlane, Point, LineSegment, Shape } from '../lib/notesMode/diagrams';

function EquationItem({ latex, displayMode }) {
  const [, setLoaded] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    loadKatex().then(() => {
      if (active) setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const result = renderEquation(latex, { displayMode });

  if (result.loading) {
    return null;
  }

  if (result.error) {
    return (
      <span style={{ color: '#DC2626', fontWeight: 600 }}>
        [equation error: {result.message}]
      </span>
    );
  }

  return <span dangerouslySetInnerHTML={{ __html: result.html }} />;
}

export function renderContentItem(item, idx) {
  if (typeof item === 'string') {
    return <span key={idx}>{item}</span>;
  }
  if (!item || typeof item !== 'object') {
    return <span key={idx}>{String(item)}</span>;
  }

  if (item.type === 'text') {
    return <span key={idx}>{item.content ?? item.text ?? ''}</span>;
  }

  if (item.type === 'equation') {
    const result = renderEquation(item.latex, { displayMode: item.displayMode ?? false });
    if (result.loading) {
      return <EquationItem key={idx} latex={item.latex} displayMode={item.displayMode ?? false} />;
    }
    if (result.error) {
      return (
        <span key={idx} style={{ color: '#DC2626', fontWeight: 600 }}>
          [equation error: {result.message}]
        </span>
      );
    }
    // Optimization: renderEquation already returns sanitized HTML from DOMPurify.
    return <span key={idx} dangerouslySetInnerHTML={{ __html: result.html }} />;
  }

  if (item.type === 'coordinate_graph') {
    const planeProps = {};
    if (item.xRange !== undefined) planeProps.xRange = item.xRange;
    if (item.yRange !== undefined) planeProps.yRange = item.yRange;
    if (item.showGrid !== undefined) planeProps.showGrid = item.showGrid;
    if (item.showAxes !== undefined) planeProps.showAxes = item.showAxes;
    if (item.width !== undefined) planeProps.width = item.width;
    if (item.height !== undefined) planeProps.height = item.height;
    if (item.padding !== undefined) planeProps.padding = item.padding;
    if (item.gridColor !== undefined) planeProps.gridColor = item.gridColor;
    if (item.axisColor !== undefined) planeProps.axisColor = item.axisColor;
    if (item.textColor !== undefined) planeProps.textColor = item.textColor;

    const points = Array.isArray(item.points) ? item.points : [];
    const segments = Array.isArray(item.segments) ? item.segments : [];
    const shapes = Array.isArray(item.shapes) ? item.shapes : [];

    return (
      <div key={idx} style={{ margin: '12px 0', display: 'flex', justifyContent: 'center', maxWidth: '100%', overflow: 'hidden' }}>
        <CoordinatePlane {...planeProps}>
          {shapes.map((shp, sIdx) => {
            const shpProps = { points: shp.points };
            if (shp.label !== undefined) shpProps.label = shp.label;
            if (shp.fillColor !== undefined) shpProps.fillColor = shp.fillColor;
            if (shp.strokeColor !== undefined) shpProps.strokeColor = shp.strokeColor;
            if (shp.strokeWidth !== undefined) shpProps.strokeWidth = shp.strokeWidth;
            if (shp.opacity !== undefined) shpProps.opacity = shp.opacity;
            if (shp.strokeDasharray !== undefined) shpProps.strokeDasharray = shp.strokeDasharray;
            if (shp.fontSize !== undefined) shpProps.fontSize = shp.fontSize;
            return <Shape key={`shape-${sIdx}`} {...shpProps} />;
          })}

          {segments.map((seg, sIdx) => {
            const segProps = { from: seg.from, to: seg.to };
            if (seg.label !== undefined) segProps.label = seg.label;
            if (seg.color !== undefined) segProps.color = seg.color;
            if (seg.strokeWidth !== undefined) segProps.strokeWidth = seg.strokeWidth;
            if (seg.strokeDasharray !== undefined) segProps.strokeDasharray = seg.strokeDasharray;
            if (seg.fontSize !== undefined) segProps.fontSize = seg.fontSize;
            return <LineSegment key={`seg-${sIdx}`} {...segProps} />;
          })}

          {points.map((pt, pIdx) => {
            const ptProps = { x: pt.x, y: pt.y };
            if (pt.label !== undefined) ptProps.label = pt.label;
            if (pt.color !== undefined) ptProps.color = pt.color;
            if (pt.radius !== undefined) ptProps.radius = pt.radius;
            if (pt.labelPosition !== undefined) ptProps.labelPosition = pt.labelPosition;
            if (pt.neighbors !== undefined) ptProps.neighbors = pt.neighbors;
            if (pt.fontSize !== undefined) ptProps.fontSize = pt.fontSize;
            if (pt.fontWeight !== undefined) ptProps.fontWeight = pt.fontWeight;
            return <Point key={`pt-${pIdx}`} {...ptProps} />;
          })}
        </CoordinatePlane>
      </div>
    );
  }

  // Fallback for unrecognized types or plain text objects without type
  const text = item.content ?? item.text ?? JSON.stringify(item);
  return <span key={idx}>{text}</span>;
}

export function renderContentArray(contentItems) {
  if (!contentItems) return null;
  if (typeof contentItems === 'string') {
    return contentItems;
  }
  if (!Array.isArray(contentItems)) {
    return String(contentItems);
  }
  return contentItems.map((item, idx) => renderContentItem(item, idx));
}

export function QuestionSolutionCard({ item, questionNumber }) {
  if (!item) return null;
  const qNumber = questionNumber !== undefined ? questionNumber : (item.number !== undefined ? item.number : 1);

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: '14px',
        borderLeft: '4px solid #7C3AED',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        marginBottom: '0px',
        borderTop: '1px solid #F3F4F6',
        borderRight: '1px solid #F3F4F6',
        borderBottom: '1px solid #F3F4F6',
        boxSizing: 'border-box',
        minWidth: 0,
      }}
    >
      {/* Question Row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <div
          style={{
            backgroundColor: '#7C3AED',
            color: '#FFFFFF',
            borderRadius: '8px',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontWeight: 700,
            fontSize: '13px',
          }}
        >
          {qNumber}
        </div>
        <div
          style={{
            fontSize: '14px',
            lineHeight: 1.5,
            color: '#1F2937',
            fontWeight: 500,
            paddingTop: '2px',
            flex: 1,
          }}
        >
          {renderContentArray(item.question)}
        </div>
      </div>

      {/* Solution Card (if present) */}
      {item.solution && (
        <div
          style={{
            position: 'relative',
            backgroundColor: '#FFFFFF',
            borderRadius: '10px',
            padding: '12px 14px',
            borderLeft: '4px solid #16A34A',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
            marginTop: '16px',
            borderTop: '1px solid #F3F4F6',
            borderRight: '1px solid #F3F4F6',
            borderBottom: '1px solid #F3F4F6',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-11px',
              left: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#16A34A',
              color: '#FFFFFF',
              borderRadius: '6px',
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.02em',
              lineHeight: 1.2,
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Solution</span>
          </div>
          <div
            style={{
              fontSize: '13px',
              lineHeight: 1.5,
              color: '#374151',
              paddingTop: '4px',
            }}
          >
            {renderContentArray(item.solution)}
          </div>
        </div>
      )}
    </div>
  );
}

export default QuestionSolutionCard;
