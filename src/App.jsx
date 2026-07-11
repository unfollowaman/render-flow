import { useRef, useEffect } from "react";
import styles from "./styles/Home.module.css";

import { Header, Hero, Footer, InputCard, LoadingCard, ErrorCard, OutputCard } from "./components";
import { useHtmlToPngConversion } from "./hooks/useHtmlToPngConversion";
import { useMermaidToPngConversion } from "./hooks/useMermaidToPngConversion";

import { useState } from "react";

export default function App() {
  const outputRef = useRef(null);
  const inputRef = useRef(null);
  const [mode, setMode] = useState("html");

  useEffect(() => {
    document.title = "HTML → PNG Converter";
  }, []);

  const { loading, result, error, setError, handleConvert, handleReset } = useHtmlToPngConversion({
    outputRef,
  });

  const {
    loading: mermaidLoading,
    result: mermaidResult,
    error: mermaidError,
    setError: setMermaidError,
    handleConvert: handleMermaidConvert,
    handleReset: handleMermaidReset
  } = useMermaidToPngConversion({
    outputRef,
  });

  const onReset = () => {
    inputRef.current?.resetHtml();
    inputRef.current?.resetMermaid();
    handleReset();
    handleMermaidReset();
  };

  const activeLoading = mode === "html" ? loading : mermaidLoading;
  const activeError = mode === "html" ? error : mermaidError;
  const activeResult = mode === "html" ? result : mermaidResult;

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
            ref={inputRef}
            mode={mode}
            setMode={setMode}
            loading={loading}
            handleConvert={handleConvert}
            setError={setError}
            mermaidLoading={mermaidLoading}
            setMermaidError={setMermaidError}
            handleMermaidConvert={handleMermaidConvert}
          />

          {/* ── LOADING STATE ──────────────────────── */}
          {activeLoading && <LoadingCard />}

          {/* ── ERROR ──────────────────────────────── */}
          {activeError && <ErrorCard error={activeError} />}

          {/* ── OUTPUT ─────────────────────────────── */}
          {activeResult && <OutputCard result={activeResult} ref={outputRef} onReset={onReset} />}
        </div>
      </main>

      {/* ── FOOTER ─────────────────────────────────── */}
      <Footer />
    </div>
  );
}
