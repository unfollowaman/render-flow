import Head from "next/head";
import { useState, useRef } from "react";
import styles from "../styles/Home.module.css";

import { Header, Hero, Footer, InputCard, LoadingCard, ErrorCard, OutputCard } from "../components";
import { useMarioAnimation } from "../hooks/useMarioAnimation";
import { useHtmlToPngConversion } from "../hooks/useHtmlToPngConversion";

export default function Home() {
  const [html, setHtml] = useState("");
  const outputRef = useRef(null);

  const { startMarioAnimation, stopMarioAnimation, marioSprite, loadingStep } = useMarioAnimation();

  const { loading, result, error, setError, handleConvert } = useHtmlToPngConversion({
    startMarioAnimation,
    stopMarioAnimation,
    outputRef,
    html,
  });

  return (
    <>
      <Head>
        <title>HTML → PNG Converter</title>
        <meta name="description" content="Pixel-perfect HTML to PNG conversion using headless Chromium" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🍄</text></svg>" />
      </Head>

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
    </>
  );
}
