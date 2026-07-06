import { useState, useEffect } from "react";
import styles from "../styles/Home.module.css";

const LOADING_STEPS = [
  "Preparing your HTML...",
  "Rendering in iframe sandbox...",
  "Capturing DOM snapshot...",
  "Converting to PNG...",
  "Finalising image...",
  "Almost done...",
];

function LoadingStepText() {
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIdx((idx) => Math.min(idx + 1, LOADING_STEPS.length - 1));
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return <p className={styles.loadingStep}>{LOADING_STEPS[stepIdx]}</p>;
}

export function LoadingCard() {
  return (
    <div className={`${styles.loaderCard} neu-card`}>
      <div className="neu-recessed" style={{ borderRadius: '10px', marginBottom: '20px' }}>
        <div className={styles.marioTrack} style={{ marginBottom: 0 }}>
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
      </div>
      <LoadingStepText />
      <p className={styles.loadingHint}>
        External assets (Google Fonts, CDN CSS/images) are being fetched…
      </p>
    </div>
  );
}
