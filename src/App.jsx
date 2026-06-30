import { useState, useRef, useEffect } from "react";
import styles from "./styles/Home.module.css";

import { Header, Hero, Footer, InputCard, LoadingCard, ErrorCard, OutputCard } from "./components";
import { useHtmlToPngConversion } from "./hooks/useHtmlToPngConversion";

export default function App() {
  const outputRef = useRef(null);

  useEffect(() => {
    document.title = "HTML → PNG Converter";
  }, []);

  const { loading, result, error, setError, handleConvert } = useHtmlToPngConversion({
    outputRef,
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
            loading={loading}
            handleConvert={handleConvert}
            setError={setError}
          />

          {/* ── LOADING STATE ──────────────────────── */}
          {loading && <LoadingCard />}

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
