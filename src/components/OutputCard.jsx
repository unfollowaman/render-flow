import { forwardRef, useState, useEffect } from "react";
import styles from "../styles/Home.module.css";
import downloadIcon from "../assets/download-icon.png";

export const OutputCard = forwardRef(({ result, onReset, mode }, ref) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  const baseAltText =
    mode === "mermaid"
      ? "Rendered Mermaid diagram"
      : mode === "latex"
      ? "Rendered LaTeX equation"
      : "Rendered HTML output";

  const handleDownload = () => {
    if (!result?.image) return;
    const link = document.createElement("a");
    link.href = result.image;
    link.download = `render-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className={`${styles.card} neu-card`} ref={ref}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>
          Preview
        </h2>
        <div className={`${styles.resultMeta} neu-recessed`}>
          {result.width} × {result.height}px
        </div>
      </div>

      <div className="neu-recessed" style={{ borderRadius: '12px', marginBottom: '20px' }}>
        <div className={styles.previewWrapper} style={{ marginBottom: 0 }}>
          <div className={styles.checkerBg}>
          <img
            src={result.image}
            alt={baseAltText}
            role="button"
            tabIndex={0}
            aria-label={`${baseAltText} - Click to enlarge`}
            className={styles.previewImage}
            style={{ maxWidth: "100%", cursor: "pointer" }}
            onClick={() => setIsFullscreen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsFullscreen(true);
              }
            }}
          />
          </div>
        </div>
      </div>

      {isFullscreen && (
        <div
          className={styles.fullscreenOverlay}
          role="button"
          tabIndex={0}
          aria-label="Close fullscreen preview"
          onClick={() => setIsFullscreen(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
              e.preventDefault();
              setIsFullscreen(false);
            }
          }}
        >
          <img
            src={result.image}
            alt={`${baseAltText} (fullscreen view)`}
            className={styles.fullscreenImage}
          />
        </div>
      )}

      <div className={styles.downloadRow}>
        <button className={`${styles.downloadBtn} neu-raised`} onClick={handleDownload}>
          <img src={downloadIcon} alt="" aria-hidden="true" className={styles.downloadIcon} /> Download PNG
        </button>
        <span className={styles.downloadHint}>
          {result.width} × {result.height} · PNG · 1x scale
        </span>
        <button className={`${styles.resetBtn} neu-raised`} onClick={onReset}>
          Reset
        </button>
      </div>
    </div>
  );
});

OutputCard.displayName = "OutputCard";
