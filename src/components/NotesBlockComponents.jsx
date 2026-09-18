import React, { memo } from 'react';
import { renderContentArray, renderContentItem } from './NotesModeCard';

// Performance optimization: Memoize ContinuationLabel to avoid re-renders during page/zoom transitions.
export const ContinuationLabel = memo(function ContinuationLabel({ questionNumber }) {
  return (
    <div
      className="continuation-label-block"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        backgroundColor: '#F3E8FF',
        color: '#6B21A8',
        border: '1px solid #D8B4FE',
        borderRadius: '6px',
        padding: '2px 8px',
        fontSize: '11px',
        fontWeight: 600,
        fontStyle: 'italic',
        marginBottom: '6px',
        boxSizing: 'border-box',
      }}
    >
      <span>Q{questionNumber} (continued)</span>
    </div>
  );
});

// Performance optimization: Memoize QuestionHeaderBlock to prevent expensive content re-rendering during layout shifts.
export const QuestionHeaderBlock = memo(function QuestionHeaderBlock({ block }) {
  const { questionNumber, content } = block;
  return (
    <div
      className="notes-block question-header-block"
      style={{
        backgroundColor: 'transparent',
        borderLeft: '4px solid #7C3AED',
        padding: '8px 12px',
        marginBottom: '6px',
        boxSizing: 'border-box',
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <div
          style={{
            backgroundColor: '#7C3AED',
            color: '#FFFFFF',
            borderRadius: '6px',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontWeight: 700,
            fontSize: '12px',
          }}
        >
          {questionNumber}
        </div>
        <div
          style={{
            fontSize: '13.5px',
            lineHeight: 1.45,
            color: '#1F2937',
            fontWeight: 600,
            paddingTop: '2px',
            flex: 1,
          }}
        >
          {renderContentArray(content)}
        </div>
      </div>
    </div>
  );
});

// Performance optimization: Memoize SolutionFirstBlock to prevent re-rendering math equations and complex elements.
export const SolutionFirstBlock = memo(function SolutionFirstBlock({ block }) {
  const { element } = block;
  return (
    <div
      className="notes-block solution-first-block"
      style={{
        backgroundColor: 'transparent',
        borderLeft: '4px solid #16A34A',
        padding: '8px 12px',
        marginBottom: '6px',
        boxSizing: 'border-box',
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: '#16A34A',
            color: '#FFFFFF',
            borderRadius: '5px',
            padding: '2px 7px',
            fontSize: '11px',
            fontWeight: 600,
            lineHeight: 1.2,
          }}
        >
          <svg
            width="11"
            height="11"
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
      </div>
      <div
        style={{
          fontSize: '13px',
          lineHeight: 1.45,
          color: '#374151',
        }}
      >
        {renderContentItem(element, 0)}
      </div>
    </div>
  );
});

// Performance optimization: Memoize SolutionRestBlock to prevent re-rendering when parent container or page state changes.
export const SolutionRestBlock = memo(function SolutionRestBlock({ block }) {
  const { element } = block;
  return (
    <div
      className="notes-block solution-rest-block"
      style={{
        backgroundColor: 'transparent',
        borderLeft: '4px solid #16A34A',
        padding: '6px 12px',
        marginBottom: '6px',
        boxSizing: 'border-box',
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: '13px',
          lineHeight: 1.45,
          color: '#374151',
        }}
      >
        {renderContentItem(element, 0)}
      </div>
    </div>
  );
});

// Performance optimization: Memoize NotesBlockRenderer to prevent wasteful block tree re-renders across pagination state updates.
export const NotesBlockRenderer = memo(function NotesBlockRenderer({ block, isTopOfColumn = false }) {
  if (!block) return null;

  const showContinuation = isTopOfColumn && block.type !== 'question-header';

  return (
    <div style={{ minWidth: 0, boxSizing: 'border-box' }}>
      {showContinuation && <ContinuationLabel questionNumber={block.questionNumber} />}
      {block.type === 'question-header' && <QuestionHeaderBlock block={block} />}
      {block.type === 'solution-first' && <SolutionFirstBlock block={block} />}
      {block.type === 'solution-rest' && <SolutionRestBlock block={block} />}
    </div>
  );
});

export default NotesBlockRenderer;
