import { forwardRef, useState } from "react";
import styles from "../styles/Home.module.css";

export const OutputCard = forwardRef(({ result }, ref) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleDownload = () => {
    if (!result?.image) return;
    const link = document.createElement("a");
    link.href = result.image;
    link.download = `render-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className={styles.card} ref={ref}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>
          Preview
        </h2>
        <div className={styles.resultMeta}>
          {result.width} × {result.height}px
        </div>
      </div>

      <div className={styles.previewWrapper}>
        <div className={styles.checkerBg}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <img
            src={result.image}
            alt="Rendered HTML"
            className={styles.previewImage}
            style={{ maxWidth: "100%", cursor: "pointer" }}
            onClick={() => setIsFullscreen(true)}
          />
        </div>
      </div>

      {isFullscreen && (
        <div className={styles.fullscreenOverlay} onClick={() => setIsFullscreen(false)}>
          <img
            src={result.image}
            alt="Rendered HTML Fullscreen"
            className={styles.fullscreenImage}
          />
        </div>
      )}

      <div className={styles.downloadRow}>
        <button className={styles.downloadBtn} onClick={handleDownload}>
          <span>⬇</span> Download PNG
        </button>
        <span className={styles.downloadHint}>
          {result.width} × {result.height} · PNG · 1x scale
        </span>
      </div>
    </div>
  );
});

OutputCard.displayName = "OutputCard";
