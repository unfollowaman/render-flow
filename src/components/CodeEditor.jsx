import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef, useCallback } from "react";
import { EditorState, StateEffect, Compartment } from "@codemirror/state";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  placeholder as cmPlaceholder
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { syntaxHighlighting, defaultHighlightStyle, LanguageDescription } from "@codemirror/language";
import { html } from "@codemirror/lang-html";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import styles from "../styles/Home.module.css";

const languageCompartment = new Compartment();
const placeholderCompartment = new Compartment();

const getLanguageExtension = (mode) => {
  switch (mode) {
    case "html":
      return html();
    case "notes":
      return json();
    case "mermaid":
    case "latex":
    default:
      return markdown();
  }
};

const MODE_LABELS = {
  html: "HTML",
  mermaid: "MERMAID",
  latex: "LATEX",
  notes: "JSON"
};

export const CodeEditor = forwardRef(function CodeEditor(
  {
    value = "",
    onChange,
    onSubmit,
    mode = "html",
    placeholder = "Paste or type code here...",
    ariaLabel = "Code editor",
    shortcutHintId,
    readOnly = false,
    className = ""
  },
  ref
) {
  const containerRef = useRef(null);
  const viewRef = useRef(null);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [isCopied, setIsCopied] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const clearTimeoutRef = useRef(null);

  // Expose imperative handle methods
  useImperativeHandle(ref, () => ({
    focus: () => {
      viewRef.current?.focus();
    },
    setValue: (val) => {
      if (!viewRef.current) return;
      const currentVal = viewRef.current.state.doc.toString();
      if (currentVal !== val) {
        viewRef.current.dispatch({
          changes: { from: 0, to: currentVal.length, insert: val || "" }
        });
      }
    },
    getEditorView: () => viewRef.current
  }));

  // Helper for tracking selection
  const updateCursorPos = useCallback((view) => {
    const mainSel = view.state.selection.main;
    const line = view.state.doc.lineAt(mainSel.head);
    setCursorPos({
      line: line.number,
      col: mainSel.head - line.from + 1
    });
  }, []);

  // Initialize CodeMirror instance
  useEffect(() => {
    if (!containerRef.current) return;

    const onSubmitHandler = (view) => {
      if (onSubmit) {
        const val = view.state.doc.toString();
        onSubmit(val);
        return true;
      }
      return false;
    };

    const submitKeymap = keymap.of([
      {
        key: "Mod-Enter",
        run: onSubmitHandler
      },
      ...defaultKeymap,
      ...historyKeymap
    ]);

    const renderFlowTheme = EditorView.theme(
      {
        "&": {
          height: isExpanded ? "500px" : "320px",
          fontSize: "13px",
          fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
          backgroundColor: "transparent",
          borderRadius: "0 0 12px 12px"
        },
        ".cm-scroller": {
          overflow: "auto",
          fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
          lineHeight: "1.6"
        },
        ".cm-content": {
          padding: "12px 16px",
          caretColor: "#012b1b"
        },
        "&.cm-focused": {
          outline: "none"
        },
        ".cm-line": {
          color: "#012b1b"
        },
        ".cm-cursor, .cm-dropCursor": {
          borderLeftColor: "#012b1b",
          borderLeftWidth: "2px"
        },
        "&.cm-focused .cm-selectionBackground, ::selection": {
          backgroundColor: "rgba(1, 43, 27, 0.12)"
        },
        ".cm-gutters": {
          backgroundColor: "rgba(1, 43, 27, 0.03)",
          color: "#9aa39e",
          borderRight: "1px solid rgba(1, 43, 27, 0.08)",
          borderRadius: "0 0 0 12px",
          fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace"
        },
        ".cm-gutterElement": {
          padding: "0 10px 0 12px"
        },
        ".cm-activeLineGutter": {
          backgroundColor: "rgba(1, 43, 27, 0.06)",
          color: "#012b1b",
          fontWeight: "bold"
        },
        ".cm-activeLine": {
          backgroundColor: "rgba(1, 43, 27, 0.03)"
        },
        ".cm-placeholder": {
          color: "#718096",
          fontStyle: "italic"
        }
      },
      { dark: false }
    );

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged && onChange) {
        onChange(update.state.doc.toString());
      }
      if (update.selectionSet || update.docChanged) {
        updateCursorPos(update.view);
      }
    });

    const startState = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        history(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        languageCompartment.of(getLanguageExtension(mode)),
        placeholderCompartment.of(cmPlaceholder(placeholder)),
        submitKeymap,
        updateListener,
        renderFlowTheme,
        EditorView.lineWrapping
      ]
    });

    const view = new EditorView({
      state: startState,
      parent: containerRef.current
    });

    viewRef.current = view;
    updateCursorPos(view);

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []); // Run once on mount

  // Dynamic language updates
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: languageCompartment.reconfigure(getLanguageExtension(mode))
      });
    }
  }, [mode]);

  // Dynamic placeholder updates
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: placeholderCompartment.reconfigure(cmPlaceholder(placeholder))
      });
    }
  }, [placeholder]);

  // Value prop sync (controlled component behavior)
  useEffect(() => {
    if (viewRef.current) {
      const currentVal = viewRef.current.state.doc.toString();
      if (value !== currentVal) {
        viewRef.current.dispatch({
          changes: { from: 0, to: currentVal.length, insert: value || "" }
        });
      }
    }
  }, [value]);

  // Handle Copy Button
  const handleCopy = async () => {
    const textToCopy = viewRef.current ? viewRef.current.state.doc.toString() : value;
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  // Handle Clear Button
  const handleClearClick = () => {
    const currentText = viewRef.current ? viewRef.current.state.doc.toString() : value;
    if (!currentText) return;

    if (!confirmingClear) {
      setConfirmingClear(true);
      if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
      clearTimeoutRef.current = setTimeout(() => setConfirmingClear(false), 3000);
    } else {
      setConfirmingClear(false);
      if (onChange) onChange("");
      if (viewRef.current) {
        viewRef.current.dispatch({
          changes: { from: 0, to: viewRef.current.state.doc.length, insert: "" }
        });
      }
    }
  };

  const charCount = value ? value.length : 0;

  return (
    <div
      className={`${styles.codeEditorContainer} ${className}`}
    >
      {/* Accessible textarea synced with CodeMirror for form integration and testing */}
      <textarea
        aria-label={ariaLabel}
        aria-describedby={shortcutHintId}
        aria-keyshortcuts="Control+Enter Meta+Enter"
        value={value}
        onChange={(e) => {
          if (onChange) onChange(e.target.value);
        }}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            if (onSubmit) onSubmit(value);
          }
        }}
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: 0,
          margin: "-1px",
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0
        }}
      />
      {/* Integrated Header */}
      <div className={styles.editorHeader}>
        <div className={styles.editorHeaderLeft}>
          <span className={styles.languageBadge}>
            {MODE_LABELS[mode] || mode.toUpperCase()}
          </span>
          <span className={styles.editorCursorInfo}>
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
          {charCount > 0 && (
            <span className={styles.editorCharCount}>
              {charCount.toLocaleString()} chars
            </span>
          )}
        </div>

        <div className={styles.editorHeaderRight}>
          <button
            type="button"
            className={`${styles.editorHeaderBtn}`}
            onClick={handleCopy}
            disabled={!charCount}
            title="Copy editor content to clipboard"
            aria-label="Copy editor content to clipboard"
          >
            {isCopied ? "✓ Copied!" : "📋 Copy"}
          </button>

          <button
            type="button"
            className={`${styles.editorHeaderBtn} ${confirmingClear ? styles.confirmingClearBtn : ""}`}
            onClick={handleClearClick}
            disabled={!charCount}
            title={confirmingClear ? "Click again to confirm clear" : "Clear editor content"}
            aria-label={confirmingClear ? "Confirm clear editor text" : "Clear editor text"}
          >
            {confirmingClear ? "⚠️ Confirm Clear?" : "🗑️ Clear"}
          </button>

          <button
            type="button"
            className={styles.editorHeaderBtn}
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse editor height" : "Expand editor height"}
            aria-label={isExpanded ? "Collapse editor height" : "Expand editor height"}
          >
            {isExpanded ? "↙ Expand" : "⤢ Expand"}
          </button>
        </div>
      </div>

      {/* CodeMirror Mounting Div */}
      <div
        ref={containerRef}
        aria-describedby={shortcutHintId}
        style={{
          height: isExpanded ? "500px" : "320px",
          transition: "height 0.2s ease"
        }}
      />
    </div>
  );
});
