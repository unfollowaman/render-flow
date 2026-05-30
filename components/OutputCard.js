import { forwardRef } from "react";
import styles from "../styles/Home.module.css";

export const OutputCard = forwardRef(({ result }, ref) => {
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
  );
});

OutputCard.displayName = "OutputCard";
