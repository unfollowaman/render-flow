import { useState, useRef, useEffect } from "react";
import styles from "./styles/Home.module.css";

import { Header, Hero, Footer, InputCard, LoadingCard, ErrorCard, OutputCard } from "./components";
import { useMarioAnimation } from "./hooks/useMarioAnimation";
import { useHtmlToPngConversion } from "./hooks/useHtmlToPngConversion";

export default function App() {
  const [html, setHtml] = useState("");
  const outputRef = useRef(null);

  useEffect(() => {
    document.title = "HTML → PNG Converter";
  }, []);

  const { startMarioAnimation, stopMarioAnimation, marioSprite, loadingStep } = useMarioAnimation();

  const { loading, result, error, setError, handleConvert } = useHtmlToPngConversion({
    startMarioAnimation,
    stopMarioAnimation,
    outputRef,
    html,
  });

  return (
    <div className={styles.page}>
      {/* ── HEADER ─────────────────────────────────── */}
      <Header />

      {/* ── HERO ───────────────────────────────────── */}
      <Hero />

      {/* ── MAIN ───────────────────────────────────── */}
      <main className={styles.main}>
        <div className={styles.container}>

          {/* ── INPUT CARD ─────────────────────────── */}
          <InputCard
            html={html}
            setHtml={setHtml}
            loading={loading}
            handleConvert={handleConvert}
            marioSprite={marioSprite}
            setError={setError}
          />

          {/* ── LOADING STATE ──────────────────────── */}
          {loading && <LoadingCard loadingStep={loadingStep} />}

          {/* ── ERROR ──────────────────────────────── */}
          {error && <ErrorCard error={error} />}

          {/* ── OUTPUT ─────────────────────────────── */}
          {result && <OutputCard result={result} ref={outputRef} />}
        </div>
      </main>

      {/* ── FOOTER ─────────────────────────────────── */}
      <Footer />
    </div>
  );
}
