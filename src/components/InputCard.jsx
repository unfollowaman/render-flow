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
<html>
<head>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      width: 1200px;
      height: 630px;
      background: #0f0f0f;
      font-family: 'Inter', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .card {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border: 1px solid rgba(255,161,0,0.3);
      border-radius: 24px;
      padding: 64px;
      max-width: 900px;
      text-align: center;
    }
    .tag {
      display: inline-block;
      background: #ffa100;
      color: #000;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      padding: 6px 16px;
      border-radius: 100px;
      margin-bottom: 32px;
    }
    h1 {
      color: #fff;
      font-size: 56px;
      font-weight: 900;
      line-height: 1.1;
      margin-bottom: 24px;
    }
    h1 span { color: #ffa100; }
    p {
      color: #8892b0;
      font-size: 20px;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="tag">✦ Open Graph Image</div>
    <h1>Turn HTML into<br><span>pixel-perfect</span> PNGs</h1>
    <p>Serverless rendering with headless Chromium.<br>Zero JavaScript. Full fidelity.</p>
  </div>
</body>
</html>`;

export const InputCard = forwardRef(function InputCard({ loading, handleConvert, setError }, ref) {
  const [html, setHtml] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    resetHtml: () => {
      setHtml("");
    }
  }));

  const loadSample = () => {
    setHtml(SAMPLE_HTML);
    setError(null);
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
    const file = e.dataTransfer.files[0];
    handleFileUpload(file);
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>
          Input HTML
        </h2>
        <button className={styles.sampleBtn} onClick={loadSample}>
          Load sample ↗
        </button>
      </div>

      {/* Textarea */}
      <div
        className={`${styles.dropZone} ${dragOver ? styles.dropZoneActive : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <textarea
          className={styles.textarea}
          value={html}
          onChange={(e) => { setHtml(e.target.value); setError(null); }}
          placeholder={`Paste your HTML here…\n\nOr drag & drop a .html file\n\n<!-- Tip: include explicit width/height on body\n     for perfect viewport sizing -->`}
          spellCheck={false}
        />
        {dragOver && (
          <div className={styles.dropOverlay}>
            <span>📂 Drop .html file here</span>
          </div>
        )}
      </div>

      {/* File upload row */}
      <div className={styles.uploadRow}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".html,text/html"
          style={{ display: "none" }}
          onChange={(e) => handleFileUpload(e.target.files?.[0])}
        />
        <button
          className={styles.uploadBtn}
          onClick={() => fileInputRef.current?.click()}
        >
          <span>📁</span> Upload .html file
        </button>
        {html && (
          <span className={styles.charCount}>
            {html.length.toLocaleString()} chars
          </span>
        )}
        <span className={styles.uploadHint}>
          or drag & drop onto the editor above
        </span>
      </div>

      {/* Divider */}
      <div className={styles.divider} />

      {/* Convert button */}
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
    </div>
  );
})
