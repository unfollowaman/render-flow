import styles from "../styles/Home.module.css";

export function LoadingCard({ loadingStep }) {
  return (
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
  );
}
