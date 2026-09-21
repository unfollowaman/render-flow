import styles from "../styles/Home.module.css";
import { useRef, useState, forwardRef, useImperativeHandle } from "react";

const SAMPLE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Flowchart</title>

<style>
html, body{
    margin:0;
    padding:0;
    width:1200px;
    height:630px;
    background:#fff;
    font-family:Arial,sans-serif;
    overflow:hidden;
}

.canvas{
    position:relative;
    width:1200px;
    height:630px;
    background:#fff;
    overflow:hidden;
}

/* ---------- CONNECTORS ---------- */

.vline,
.hline{
    position:absolute;
    background:#000;
    z-index:0;
}

.vline{
    width:4px;
}

.hline{
    height:4px;
}

/* ---------- BOXES ---------- */

.box{
    position:absolute;
    display:flex;
    justify-content:center;
    align-items:center;
    text-align:center;
    box-sizing:border-box;
    border:4px solid #000;
    border-radius:24px;
    color:#000;
    font-weight:bold;
    z-index:1;
}

.main-q{
    width:600px;
    height:80px;
    left:300px;
    top:40px;
    background:#F30A49;
    font-size:32px;
    font-style:italic;
}

.decision-y1{
    width:120px;
    height:60px;
    left:290px;
    top:180px;
    background:#D8E9F0;
    font-size:22px;
}

.decision-n1{
    width:120px;
    height:60px;
    left:790px;
    top:180px;
    background:#D8E9F0;
    font-size:22px;
}

.sub-q{
    width:340px;
    height:100px;
    left:180px;
    top:280px;
    background:#34B3F1;
    font-size:24px;
    line-height:1.3;
    padding:8px;
}

.decision-y2{
    width:120px;
    height:60px;
    left:140px;
    top:440px;
    background:#D8E9F0;
    font-size:22px;
}

.decision-n2{
    width:120px;
    height:60px;
    left:440px;
    top:440px;
    background:#D8E9F0;
    font-size:22px;
}

.conclusion{
    width:900px;
    height:70px;
    left:150px;
    top:530px;
    background:#fff;
    font-size:32px;
    font-style:italic;
}
</style>
</head>

<body>

<div class="canvas">

    <!-- MAIN SPLIT -->
    <div class="vline" style="left:598px;top:120px;height:30px;"></div>
    <div class="hline" style="left:348px;top:148px;width:504px;"></div>
    <div class="vline" style="left:348px;top:150px;height:30px;"></div>
    <div class="vline" style="left:848px;top:150px;height:30px;"></div>

    <!-- YES -> SUB QUESTION -->
    <div class="vline" style="left:348px;top:240px;height:40px;"></div>

    <!-- SUB QUESTION SPLIT -->
    <div class="vline" style="left:348px;top:380px;height:30px;"></div>
    <div class="hline" style="left:198px;top:408px;width:304px;"></div>
    <div class="vline" style="left:198px;top:410px;height:30px;"></div>
    <div class="vline" style="left:498px;top:410px;height:30px;"></div>

    <!-- TO CONCLUSION -->
    <div class="vline" style="left:198px;top:500px;height:30px;"></div>
    <div class="vline" style="left:498px;top:500px;height:30px;"></div>
    <div class="vline" style="left:848px;top:240px;height:290px;"></div>

    <!-- BOXES -->
    <div class="box main-q">
        Do you have a problem in your life?
    </div>

    <div class="box decision-y1">
        YES
    </div>

    <div class="box decision-n1">
        NO
    </div>

    <div class="box sub-q">
        CAN YOU DO<br>
        SOMETHING<br>
        ABOUT IT?
    </div>

    <div class="box decision-y2">

    YES
    </div>

    <div class="box decision-n2">
        NO
    </div>

    <div class="box conclusion">
        Then don't worry.
    </div>

</div>

</body>
</html>`;

const SAMPLE_MERMAID = `%%{init: {'theme': 'base', 'themeVariables': {'nodeSpacing': 20, 'rankSpacing': 25}}}%%
graph TD
    %% Node Definitions (Rounded Rectangles)
    Q1("Problem in life?")
    Y1("YES")
    N1("NO")
    Q2("Can you do<br>something?")
    Y2("YES")
    N2("NO")
    A("Don't worry.")

    %% Structural Connections
    Q1 --> Y1
    Q1 --> N1
    Y1 --> Q2
    Q2 --> Y2
    Q2 --> N2
    Y2 --> A
    N2 --> A
    N1 --> A

    %% Color Configurations and Sizing Controls
    style Q1 fill:#F30A49,stroke:#333,stroke-width:1px,color:#000000,font-weight:bold,font-size:10px
    style Y1 fill:#D8E9F0,stroke:#333,stroke-width:1px,color:#000000,font-weight:bold,font-size:10px
    style N1 fill:#D8E9F0,stroke:#333,stroke-width:1px,color:#000000,font-weight:bold,font-size:10px
    style Q2 fill:#34B3F1,stroke:#333,stroke-width:1px,color:#000000,font-weight:bold,font-size:10px
    style Y2 fill:#D8E9F0,stroke:#333,stroke-width:1px,color:#000000,font-weight:bold,font-size:10px
    style N2 fill:#D8E9F0,stroke:#333,stroke-width:1px,color:#000000,font-weight:bold,font-size:10px
    style A fill:#4CAF50,stroke:#333,stroke-width:1px,color:#000000,font-weight:bold,font-size:10px

    %% Global Link Styling
    linkStyle default stroke:#333,stroke-width:1px;`;

const SAMPLE_LATEX = "x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}";

const SAMPLE_NOTES = `{
  "chapter": { "title": "Chapter 1: Mechanics", "subtitle": "Kinematics & Newton's Laws" },
  "pages": [
    {
      "items": [
        {
          "type": "question",
          "number": 1,
          "question": [ { "type": "text", "content": "What is Newton's Second Law of Motion?" } ],
          "solution": [ { "type": "text", "content": "Newton's Second Law states that force equals mass times acceleration (F = ma)." } ]
        },
        {
          "type": "question",
          "number": 2,
          "question": [ { "type": "text", "content": "Define momentum." } ],
          "solution": [ { "type": "text", "content": "Momentum is the product of an object's mass and its velocity (p = mv)." } ]
        }
      ]
    }
  ]
}`;

const MODE_CONFIGS = {
  html: {
    mode: "html",
    label: "HTML Mode",
    cardTitle: "Input HTML",
    ariaLabel: "Input HTML",
    placeholder: `Paste your HTML here…\n\nOr drag & drop a .html file\n\n<!-- Tip: include explicit width/height on body\n     for perfect viewport sizing -->`,
    sampleText: SAMPLE_HTML,
    hasFileUpload: true
  },
  mermaid: {
    mode: "mermaid",
    label: "Mermaid Mode",
    cardTitle: "Input Mermaid",
    ariaLabel: "Input Mermaid",
    placeholder: `Paste your Mermaid code here…`,
    sampleText: SAMPLE_MERMAID,
    hasFileUpload: false
  },
  latex: {
    mode: "latex",
    label: "LaTeX Mode",
    cardTitle: "Input LaTeX",
    ariaLabel: "Input LaTeX",
    placeholder: `Paste your LaTeX math code here…`,
    sampleText: SAMPLE_LATEX,
    hasFileUpload: false
  },
  notes: {
    mode: "notes",
    label: "Notes Mode",
    cardTitle: "Input Notes JSON",
    ariaLabel: "Input Notes JSON",
    placeholder: `Paste your Notes JSON here…`,
    sampleText: SAMPLE_NOTES,
    hasFileUpload: false
  }
};

const Workspace = forwardRef(function Workspace({
  modeConfig,
  isVisible,
  loading,
  parseError,
  failedResources,
  htmlWarning,
  setHtmlWarning,
  handleConvert,
  setError
}, ref) {
  const [value, setValue] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const fileInputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    reset: () => {
      setValue("");
    },
    loadSample: () => {
      setValue(modeConfig.sampleText);
      setError(null);
    }
  }));

  const handleFileUpload = (file) => {
    if (!file) return;
    if (!file.name.endsWith(".html") && file.type !== "text/html") {
      setError("Please upload a valid .html file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setValue(e.target.result);
      setError(null);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (modeConfig.hasFileUpload) {
      const file = e.dataTransfer.files[0];
      handleFileUpload(file);
    }
  };

  const handleClear = () => {
    setValue("");
    setError(null);
    if (setHtmlWarning) setHtmlWarning(null);
  };

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (!isVisible) return null;

  return (
    <div className={styles.workspace}>
      <div className="neu-recessed" style={{ borderRadius: '12px' }}>
        <div
          className={`${styles.dropZone} ${dragOver ? styles.dropZoneActive : ""}`}
          onDragOver={(e) => {
            if (modeConfig.hasFileUpload) {
              e.preventDefault();
              setDragOver(true);
            }
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <textarea
            aria-label={modeConfig.ariaLabel}
            aria-keyshortcuts="Control+Enter Meta+Enter"
            className={styles.textarea}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
              if (setHtmlWarning) setHtmlWarning(null);
            }}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                if (!loading && value.trim()) {
                  handleConvert(value);
                }
              }
            }}
            placeholder={modeConfig.placeholder}
            spellCheck={false}
            style={{ background: 'transparent' }}
          />
          {dragOver && (
            <div className={styles.dropOverlay}>
              <span>📂 Drop .html file here</span>
            </div>
          )}
          {parseError && (
            <div style={{ color: 'red', marginTop: '8px', padding: '0 12px' }}>
              {parseError}
            </div>
          )}
        </div>
      </div>

      {failedResources && failedResources.length > 0 && (
        <div style={{ color: '#ffa100', fontSize: '14px' }}>
          Notice: {failedResources.length} external resource{failedResources.length > 1 ? 's' : ''} failed to load (likely due to CORS).
        </div>
      )}

      {modeConfig.hasFileUpload ? (
        <div className={styles.uploadRow}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".html,text/html"
            style={{ display: "none" }}
            onChange={(e) => handleFileUpload(e.target.files?.[0])}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              className={`${styles.uploadBtn} neu-raised`}
              onClick={() => fileInputRef.current?.click()}
              title="Upload .html file from your computer"
            >
              <span>📁</span> Upload .html file
            </button>
            {value && (
              <>
                <span className={`${styles.charCount} neu-recessed`}>
                  {value.length.toLocaleString()} chars
                </span>
                <button
                  type="button"
                  aria-label="Copy input text to clipboard"
                  title="Copy input text to clipboard"
                  className={`${styles.sampleBtn} neu-raised`}
                  style={{ padding: '4px 8px', fontSize: '12px' }}
                  onClick={handleCopy}
                >
                  {isCopied ? "✓ Copied!" : "Copy"}
                </button>
                <button
                  type="button"
                  aria-label="Clear input text"
                  title="Clear input text"
                  className={`${styles.sampleBtn} neu-raised`}
                  style={{ color: '#e53e3e', padding: '4px 8px', fontSize: '12px' }}
                  onClick={handleClear}
                >
                  Clear
                </button>
              </>
            )}
          </div>
          <span className={styles.uploadHint}>
            or drag & drop onto the editor above
          </span>
        </div>
      ) : (
        value && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginTop: '4px' }}>
            <span className={`${styles.charCount} neu-recessed`}>
              {value.length.toLocaleString()} chars
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                aria-label="Copy input text to clipboard"
                title="Copy input text to clipboard"
                className={`${styles.sampleBtn} neu-raised`}
                style={{ padding: '4px 8px', fontSize: '12px' }}
                onClick={handleCopy}
              >
                {isCopied ? "✓ Copied!" : "Copy"}
              </button>
              <button
                type="button"
                aria-label="Clear input text"
                title="Clear input text"
                className={`${styles.sampleBtn} neu-raised`}
                style={{ color: '#e53e3e', padding: '4px 8px', fontSize: '12px' }}
                onClick={handleClear}
              >
                Clear
              </button>
            </div>
          </div>
        )
      )}

      {htmlWarning && (
        <div style={{ color: '#F30A49', fontSize: '14px', border: '1px solid #F30A49', padding: '8px', borderRadius: '4px' }}>
          {htmlWarning}
          <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
            <button
               onClick={() => { setHtmlWarning(null); handleConvert(value, true); }}
               style={{ padding: '4px 8px', cursor: 'pointer' }}>Proceed anyway</button>
            <button
               onClick={() => setHtmlWarning(null)}
               style={{ padding: '4px 8px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      <button
        className={`${styles.convertBtn} ${loading ? styles.convertBtnLoading : ""}`}
        onClick={() => handleConvert(value)}
        disabled={loading || !value.trim()}
        aria-keyshortcuts="Control+Enter Meta+Enter"
        title={
          loading
            ? "Converting…"
            : !value.trim()
            ? "Enter code or load sample to convert (Ctrl+Enter or ⌘+Enter)"
            : "Convert to PNG (Ctrl+Enter or ⌘+Enter)"
        }
      >
        {loading ? "Converting…" : "Convert to PNG"}
      </button>
    </div>
  );
});

const NotesWorkspace = forwardRef(function NotesWorkspace({
  modeConfig,
  isVisible,
  loading,
  validationError,
  validationSuccess,
  setNotesError,
  validateNotesJson,
  handleNotesGenerate,
  handleNotesReset
}, ref) {
  const [value, setValue] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const fileInputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    reset: () => {
      setValue("");
      handleNotesReset?.();
    },
    loadSample: () => {
      setValue(modeConfig.sampleText);
      setNotesError?.(null);
    }
  }));

  if (!isVisible) return null;

  const handleFileUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setValue(e.target.result || "");
      handleNotesReset?.();
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
    setValue("");
    handleNotesReset?.();
  };

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className={styles.workspace}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          handleFileUpload(file);
          e.target.value = "";
        }}
      />

      <div className="neu-recessed" style={{ borderRadius: '12px' }}>
        <div className={styles.dropZone}>
          <textarea
            aria-label={modeConfig.ariaLabel}
            aria-keyshortcuts="Control+Enter Meta+Enter"
            className={styles.textarea}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
            }}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                if (!loading && value.trim()) {
                  handleNotesGenerate(value);
                }
              }
            }}
            placeholder={modeConfig.placeholder}
            spellCheck={false}
            style={{ background: 'transparent' }}
          />
        </div>
      </div>

      {/* Action Buttons Row */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          className={`${styles.uploadBtn} neu-raised`}
          onClick={() => fileInputRef.current?.click()}
          title="Upload .json file from your computer"
        >
          <span>📁</span> Load JSON
        </button>

        <button
          type="button"
          className={`${styles.sampleBtn} neu-raised`}
          onClick={() => validateNotesJson(value)}
          title="Validate JSON structure against schema"
        >
          Validate
        </button>

        {value && (
          <button
            type="button"
            aria-label="Copy notes input text to clipboard"
            title="Copy notes input text to clipboard"
            className={`${styles.sampleBtn} neu-raised`}
            onClick={handleCopy}
          >
            {isCopied ? "✓ Copied!" : "Copy"}
          </button>
        )}

        <button
          type="button"
          aria-label="Clear notes input text"
          title="Clear notes input text"
          className={`${styles.sampleBtn} neu-raised`}
          style={{ color: '#e53e3e' }}
          onClick={handleClear}
        >
          Clear
        </button>

        <button
          type="button"
          className={`${styles.convertBtn}`}
          style={{ flex: '1 1 200px', height: '48px', margin: 0 }}
          onClick={() => handleNotesGenerate(value)}
          disabled={loading || !value.trim()}
          aria-keyshortcuts="Control+Enter Meta+Enter"
          title={
            loading
              ? "Generating…"
              : !value.trim()
              ? "Enter JSON or load sample to generate (Ctrl+Enter or ⌘+Enter)"
              : "Generate (Ctrl+Enter or ⌘+Enter)"
          }
        >
          {loading ? "Generating…" : "Generate"}
        </button>
      </div>

      {/* Inline Feedback Messages */}
      {validationSuccess && (
        <div style={{ color: '#16A34A', fontSize: '14px', fontWeight: '600', padding: '4px 8px' }}>
          ✓ {validationSuccess}
        </div>
      )}
      {validationError && (
        <div style={{ color: '#e53e3e', fontSize: '14px', fontWeight: '500', padding: '4px 8px' }}>
          ⚠️ {validationError}
        </div>
      )}
    </div>
  );
});

export const InputCard = forwardRef(function InputCard({
  mode,
  setMode,
  loading,
  failedResources,
  htmlWarning,
  setHtmlWarning,
  handleConvert,
  setError,
  mermaidLoading,
  setMermaidError,
  handleMermaidConvert,
  latexLoading,
  latexParseError,
  setLatexError,
  handleLatexConvert,
  notesLoading,
  notesValidationError,
  notesValidationSuccess,
  setNotesError,
  validateNotesJson,
  handleNotesGenerate,
  handleNotesReset
}, ref) {
  const htmlRef = useRef(null);
  const mermaidRef = useRef(null);
  const latexRef = useRef(null);
  const notesRef = useRef(null);
  const cardRef = useRef(null);

  useImperativeHandle(ref, () => ({
    resetHtml: () => {
      htmlRef.current?.reset();
    },
    resetMermaid: () => {
      mermaidRef.current?.reset();
    },
    resetLatex: () => {
      latexRef.current?.reset();
    },
    resetNotes: () => {
      notesRef.current?.reset();
    },
    scrollToInput: () => {
      cardRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }));

  const loadSample = () => {
    if (mode === "html") {
      htmlRef.current?.loadSample();
    } else if (mode === "mermaid") {
      mermaidRef.current?.loadSample();
    } else if (mode === "latex") {
      latexRef.current?.loadSample();
    } else if (mode === "notes") {
      notesRef.current?.loadSample();
    }
  };

  return (
    <div className={`${styles.card} neu-card`} ref={cardRef}>
      {/* Mode Toggle */}
      <div role="tablist" aria-label="Input mode selector" className={styles.modeSelector}>
        {Object.values(MODE_CONFIGS).map((cfg) => (
          <button
            key={cfg.mode}
            role="tab"
            aria-selected={mode === cfg.mode}
            className={`${styles.sampleBtn} ${mode === cfg.mode ? "neu-recessed" : "neu-raised"}`}
            style={{
              flex: 1,
              width: '100%',
              background: mode === cfg.mode ? 'rgba(255,161,0,0.1)' : undefined,
              color: mode === cfg.mode ? '#ffa100' : undefined,
              border: mode === cfg.mode ? '1px solid rgba(255,161,0,0.3)' : undefined
            }}
            onClick={() => setMode(cfg.mode)}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>
          {MODE_CONFIGS[mode].cardTitle}
        </h2>
        <button
          className={`${styles.sampleBtn} neu-raised`}
          onClick={loadSample}
          title="Load sample code into editor"
        >
          Load sample ↗
        </button>
      </div>

      {/* Workspaces */}
      <Workspace
        ref={htmlRef}
        modeConfig={MODE_CONFIGS.html}
        isVisible={mode === "html"}
        loading={loading}
        failedResources={failedResources}
        htmlWarning={htmlWarning}
        setHtmlWarning={setHtmlWarning}
        handleConvert={handleConvert}
        setError={setError}
      />
      <Workspace
        ref={mermaidRef}
        modeConfig={MODE_CONFIGS.mermaid}
        isVisible={mode === "mermaid"}
        loading={mermaidLoading}
        handleConvert={handleMermaidConvert}
        setError={setMermaidError}
      />
      <Workspace
        ref={latexRef}
        modeConfig={MODE_CONFIGS.latex}
        isVisible={mode === "latex"}
        loading={latexLoading}
        parseError={latexParseError}
        handleConvert={handleLatexConvert}
        setError={setLatexError}
      />
      <NotesWorkspace
        ref={notesRef}
        modeConfig={MODE_CONFIGS.notes}
        isVisible={mode === "notes"}
        loading={notesLoading}
        validationError={notesValidationError}
        validationSuccess={notesValidationSuccess}
        setNotesError={setNotesError}
        validateNotesJson={validateNotesJson}
        handleNotesGenerate={handleNotesGenerate}
        handleNotesReset={handleNotesReset}
      />
    </div>
  );
});
