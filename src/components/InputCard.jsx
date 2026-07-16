import styles from "../styles/Home.module.css";
import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";

const MARIO_SPRITE_FRAMES = ["🏃", "🏃‍♂️", "🚶", "🚶‍♂️"];

function Mario() {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % MARIO_SPRITE_FRAMES.length);
    }, 150);
    return () => clearInterval(interval);
  }, []);

  return <span className={styles.marioRunner}>{MARIO_SPRITE_FRAMES[frame]}</span>;
}

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

export const InputCard = forwardRef(function InputCard({
  mode,
  setMode,
  loading,
  handleConvert,
  setError,
  mermaidLoading,
  setMermaidError,
  handleMermaidConvert,
  latexLoading,
  setLatexError,
  handleLatexConvert
}, ref) {
  const [html, setHtml] = useState("");
  const [mermaid, setMermaid] = useState("");
  const [latex, setLatex] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    resetHtml: () => {
      setHtml("");
    },
    resetMermaid: () => {
      setMermaid("");
    },
    resetLatex: () => {
      setLatex("");
    }
  }));

  const loadSample = () => {
    if (mode === "html") {
      setHtml(SAMPLE_HTML);
      setError(null);
    } else if (mode === "mermaid") {
      setMermaid(SAMPLE_MERMAID);
      setMermaidError(null);
    } else {
      setLatex(SAMPLE_LATEX);
      setLatexError(null);
    }
  };

  const handleFileUpload = (file) => {
    if (!file) return;
    if (!file.name.endsWith(".html") && file.type !== "text/html") {
      setError("Please upload a valid .html file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setHtml(e.target.result);
      setError(null);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (mode === "html") {
      const file = e.dataTransfer.files[0];
      handleFileUpload(file);
    }
  };

  return (
    <div className={`${styles.card} neu-card`}>
      {/* Mode Toggle */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          className={`${styles.sampleBtn} neu-raised`}
          style={{
            flex: 1,
            background: mode === "html" ? 'rgba(255,161,0,0.1)' : undefined,
            color: mode === "html" ? '#ffa100' : undefined,
            border: mode === "html" ? '1px solid rgba(255,161,0,0.3)' : undefined
          }}
          onClick={() => setMode("html")}
        >
          HTML Mode
        </button>
        <button
          className={`${styles.sampleBtn} neu-raised`}
          style={{
            flex: 1,
            background: mode === "mermaid" ? 'rgba(255,161,0,0.1)' : undefined,
            color: mode === "mermaid" ? '#ffa100' : undefined,
            border: mode === "mermaid" ? '1px solid rgba(255,161,0,0.3)' : undefined
          }}
          onClick={() => setMode("mermaid")}
        >
          Mermaid Mode
        </button>
        <button
          className={`${styles.sampleBtn} neu-raised`}
          style={{
            flex: 1,
            background: mode === "latex" ? 'rgba(255,161,0,0.1)' : undefined,
            color: mode === "latex" ? '#ffa100' : undefined,
            border: mode === "latex" ? '1px solid rgba(255,161,0,0.3)' : undefined
          }}
          onClick={() => setMode("latex")}
        >
          LaTeX Mode
        </button>
      </div>

      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>
          {mode === "html" ? "Input HTML" : mode === "mermaid" ? "Input Mermaid" : "Input LaTeX"}
        </h2>
        <button className={`${styles.sampleBtn} neu-raised`} onClick={loadSample}>
          Load sample ↗
        </button>
      </div>

      {/* Textarea */}
      <div className="neu-recessed" style={{ borderRadius: '12px' }}>
        <div
          className={`${styles.dropZone} ${dragOver ? styles.dropZoneActive : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {mode === "html" ? (
            <textarea
              className={styles.textarea}
              value={html}
              onChange={(e) => { setHtml(e.target.value); setError(null); }}
              placeholder={`Paste your HTML here…\n\nOr drag & drop a .html file\n\n<!-- Tip: include explicit width/height on body\n     for perfect viewport sizing -->`}
              spellCheck={false}
              style={{ background: 'transparent' }}
            />
          ) : mode === "mermaid" ? (
            <textarea
              className={styles.textarea}
              value={mermaid}
              onChange={(e) => { setMermaid(e.target.value); setMermaidError(null); }}
              placeholder={`Paste your Mermaid code here…`}
              spellCheck={false}
              style={{ background: 'transparent' }}
            />
          ) : (
            <textarea
              className={styles.textarea}
              value={latex}
              onChange={(e) => { setLatex(e.target.value); setLatexError(null); }}
              placeholder={`Paste your LaTeX math code here…`}
              spellCheck={false}
              style={{ background: 'transparent' }}
            />
          )}
          {mode === "html" && dragOver && (
            <div className={styles.dropOverlay}>
              <span>📂 Drop .html file here</span>
            </div>
          )}
        </div>
      </div>

      {/* File upload row */}
      {mode === "html" && (
        <div className={styles.uploadRow}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".html,text/html"
            style={{ display: "none" }}
            onChange={(e) => handleFileUpload(e.target.files?.[0])}
          />
          <button
            className={`${styles.uploadBtn} neu-raised`}
            onClick={() => fileInputRef.current?.click()}
          >
            <span>📁</span> Upload .html file
          </button>
          {html && (
            <span className={`${styles.charCount} neu-recessed`}>
              {html.length.toLocaleString()} chars
            </span>
          )}
          <span className={styles.uploadHint}>
            or drag & drop onto the editor above
          </span>
        </div>
      )}

      {/* Divider */}
      <div className={styles.divider} />

      {/* Convert button */}
      {mode === "html" ? (
        <button
          className={`${styles.convertBtn} ${loading ? styles.convertBtnLoading : ""}`}
          onClick={() => handleConvert(html)}
          disabled={loading || !html.trim()}
        >
          {loading ? (
            <>
              <Mario />
              Converting…
            </>
          ) : (
            <>
              Convert to PNG
            </>
          )}
        </button>
      ) : mode === "mermaid" ? (
        <button
          className={`${styles.convertBtn} ${mermaidLoading ? styles.convertBtnLoading : ""}`}
          onClick={() => handleMermaidConvert(mermaid)}
          disabled={mermaidLoading || !mermaid.trim()}
        >
          {mermaidLoading ? (
            <>
              <Mario />
              Converting…
            </>
          ) : (
            <>
              Convert to PNG
            </>
          )}
        </button>
      ) : (
        <button
          className={`${styles.convertBtn} ${latexLoading ? styles.convertBtnLoading : ""}`}
          onClick={() => handleLatexConvert(latex)}
          disabled={latexLoading || !latex.trim()}
        >
          {latexLoading ? (
            <>
              <Mario />
              Converting…
            </>
          ) : (
            <>
              Convert to PNG
            </>
          )}
        </button>
      )}
    </div>
  );
})
