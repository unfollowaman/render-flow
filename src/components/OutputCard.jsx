import { forwardRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "../styles/Home.module.css";
import downloadIcon from "../assets/download-icon.png";

export const OutputCard = forwardRef(({ result, onReset, mode }, ref) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

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
    setIsDownloaded(true);
    setTimeout(() => setIsDownloaded(false), 2000);
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

      {isFullscreen &&
        createPortal(
          <div
            className={styles.fullscreenOverlay}
            role="button"
            tabIndex={0}
            aria-label="Close preview overlay"
            onClick={() => setIsFullscreen(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
                e.preventDefault();
                setIsFullscreen(false);
              }
            }}
          >
            <button
              type="button"
              aria-label="Close fullscreen preview"
              onClick={(e) => {
                e.stopPropagation();
                setIsFullscreen(false);
              }}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                background: "rgba(0, 0, 0, 0.7)",
                color: "#ffffff",
                border: "1px solid rgba(255, 255, 255, 0.4)",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                fontSize: "20px",
                fontWeight: "bold",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1001,
              }}
            >
              ✕
            </button>
            <img
              src={result.image}
              alt={`${baseAltText} (fullscreen view)`}
              className={styles.fullscreenImage}
            />
          </div>,
          document.body
        )}

      <div className={styles.downloadRow}>
        <button className={`${styles.downloadBtn} neu-raised`} onClick={handleDownload}>
          <img src={downloadIcon} alt="" aria-hidden="true" className={styles.downloadIcon} />
          {isDownloaded ? "✓ Downloaded!" : "Download PNG"}
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
