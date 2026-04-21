import Head from "next/head";
import { useState, useRef, useCallback } from "react";
import styles from "../styles/Home.module.css";

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

export default function Home() {
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [marioFrame, setMarioFrame] = useState(0);
  const [loadingStep, setLoadingStep] = useState("");
  const fileInputRef = useRef(null);
  const outputRef = useRef(null);
  const marioIntervalRef = useRef(null);

  const loadingSteps = [
    "Launching headless Chromium…",
    "Loading HTML content…",
    "Fetching external assets…",
    "Waiting for fonts & images…",
    "Rendering page…",
    "Capturing screenshot…",
  ];

  const startMarioAnimation = () => {
    let frame = 0;
    let step = 0;
    marioIntervalRef.current = setInterval(() => {
      frame = (frame + 1) % 4;
      setMarioFrame(frame);
    }, 150);

    let stepIdx = 0;
    setLoadingStep(loadingSteps[0]);
    const stepInterval = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, loadingSteps.length - 1);
      setLoadingStep(loadingSteps[stepIdx]);
    }, 1800);

    return stepInterval;
  };

  const stopMarioAnimation = (stepInterval) => {
    clearInterval(marioIntervalRef.current);
    clearInterval(stepInterval);
  };

  const handleConvert = useCallback(async () => {
    if (!html.trim()) {
      setError("Please enter some HTML content first.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const stepInterval = startMarioAnimation();

    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Server error: ${res.status}`);
      }

      setResult(data);
      setTimeout(() => {
        outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      setError(err.message);
    } finally {
      stopMarioAnimation(stepInterval);
      setLoading(false);
    }
  }, [html]);

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

  const handleDownload = () => {
    if (!result?.image) return;
    const link = document.createElement("a");
    link.href = result.image;
    link.download = `render-${Date.now()}.png`;
    link.click();
  };

  const loadSample = () => {
    setHtml(SAMPLE_HTML);
    setError(null);
  };

  // Mario pixel art frames
  const marioSprite = ["🏃", "🏃‍♂️", "🚶", "🚶‍♂️"][marioFrame];

  return (
    <>
      <Head>
        <title>HTML → PNG Converter</title>
        <meta name="description" content="Pixel-perfect HTML to PNG conversion using headless Chromium" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🍄</text></svg>" />
      </Head>

      <div className={styles.page}>
        {/* ── HEADER ─────────────────────────────────── */}
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <div className={styles.logo}>
              <span className={styles.logoMushroom}>🍄</span>
              <span className={styles.logoText}>html2png</span>
            </div>
            <nav className={styles.nav}>
              <a href="https://github.com" target="_blank" rel="noopener">GitHub</a>
              <a href="https://vercel.com" target="_blank" rel="noopener">Deploy</a>
            </nav>
          </div>
        </header>

        {/* ── HERO ───────────────────────────────────── */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span className={styles.heroBadgeDot} />
              Pixel-perfect rendering via headless Chromium
            </div>
            <h1 className={styles.heroTitle}>
              HTML to PNG
              <br />
              <span className={styles.heroAccent}>Converter</span>
            </h1>
            <p className={styles.heroDesc}>
              Paste raw HTML. Get a flawless PNG back — fonts, images, and all
              external assets loaded. Powered by Puppeteer on Vercel.
            </p>
            <div className={styles.heroMeta}>
              <span>⚡ Serverless</span>
              <span>🎨 Full fidelity</span>
              <span>🔒 Stateless</span>
              <span>🌐 CDN assets supported</span>
            </div>
          </div>

          {/* Decorative pixel grid */}
          <div className={styles.pixelGrid} aria-hidden="true">
            {Array.from({ length: 64 }).map((_, i) => (
              <div key={i} className={styles.pixelCell} />
            ))}
          </div>
        </section>

        {/* ── MAIN ───────────────────────────────────── */}
        <main className={styles.main}>
          <div className={styles.container}>

            {/* ── INPUT CARD ─────────────────────────── */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>
                  <span className={styles.stepBadge}>01</span>
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
                <span className={styles.uploadHint}>
                  or drag & drop onto the editor above
                </span>
                {html && (
                  <span className={styles.charCount}>
                    {html.length.toLocaleString()} chars
                  </span>
                )}
              </div>

              {/* Divider */}
              <div className={styles.divider} />

              {/* Convert button */}
              <button
                className={`${styles.convertBtn} ${loading ? styles.convertBtnLoading : ""}`}
                onClick={handleConvert}
                disabled={loading || !html.trim()}
              >
                {loading ? (
                  <>
                    <span className={styles.marioRunner}>{marioSprite}</span>
                    Converting…
                  </>
                ) : (
                  <>
                    <span>🚀</span> Convert to PNG
                  </>
                )}
              </button>
            </div>

            {/* ── LOADING STATE ──────────────────────── */}
            {loading && (
              <div className={styles.loaderCard}>
                <div className={styles.marioTrack}>
                  <div className={styles.marioWorld}>
                    {/* Pixel blocks */}
                    <span className={styles.block}>?</span>
                    <span className={styles.block}>?</span>
                    <span className={styles.block}>■</span>
                    <span className={styles.pipeLeft}>╓</span>
                    <span className={styles.pipeRight}>╖</span>
                  </div>
                  <div className={styles.progressTrack}>
                    <div className={styles.progressFill} />
                  </div>
                  <div className={styles.mario}>🍄</div>
                </div>
                <p className={styles.loadingStep}>{loadingStep}</p>
                <p className={styles.loadingHint}>
                  External assets (Google Fonts, CDN CSS/images) are being fetched…
                </p>
              </div>
            )}

            {/* ── ERROR ──────────────────────────────── */}
            {error && (
              <div className={styles.errorCard}>
                <div className={styles.errorIcon}>⚠</div>
                <div>
                  <p className={styles.errorTitle}>Rendering failed</p>
                  <p className={styles.errorMessage}>{error}</p>
                </div>
              </div>
            )}

            {/* ── OUTPUT ─────────────────────────────── */}
            {result && (
              <div className={styles.card} ref={outputRef}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>
                    <span className={styles.stepBadge}>02</span>
                    Preview
                  </h2>
                  <div className={styles.resultMeta}>
                    {result.width} × {result.height}px
                  </div>
                </div>

                <div className={styles.previewWrapper}>
                  <div className={styles.checkerBg}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={result.image}
                      alt="Rendered HTML"
                      className={styles.previewImage}
                      style={{ maxWidth: "100%" }}
                    />
                  </div>
                </div>

                <div className={styles.downloadRow}>
                  <button className={styles.downloadBtn} onClick={handleDownload}>
                    <span>⬇</span> Download PNG
                  </button>
                  <span className={styles.downloadHint}>
                    {result.width} × {result.height} · PNG · 1x scale
                  </span>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* ── FOOTER ─────────────────────────────────── */}
        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            <span>🍄 html2png — serverless HTML rendering</span>
            <span>Built with Next.js + Puppeteer + @sparticuz/chromium</span>
          </div>
        </footer>
      </div>
    </>
  );
    }
    
