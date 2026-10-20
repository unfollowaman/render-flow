import { forwardRef, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import styles from "../styles/Home.module.css";
import useReveal from "../hooks/useReveal";
import downloadIcon from "../assets/download-icon.png";

export const OutputCard = forwardRef(({ result, onReset, mode }, ref) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState("");
  const [revealRef, revealVisible] = useReveal();

  const imageRef = useRef(null);
  const closeBtnRef = useRef(null);
  const dialogRef = useRef(null);
  const wasFullscreenRef = useRef(false);

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

  useEffect(() => {
    if (isFullscreen) {
      wasFullscreenRef.current = true;
      closeBtnRef.current?.focus();
    } else if (wasFullscreenRef.current) {
      imageRef.current?.focus();
    }
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
    setDownloadStatus("PNG image downloaded successfully.");
    setTimeout(() => {
      setIsDownloaded(false);
      setDownloadStatus("");
    }, 2000);
  };

  return (
    <div
      className={`${styles.card} neu-card reveal${revealVisible ? ' is-visible' : ''}`}
      ref={(node) => {
        revealRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
    >
      <div role="status" aria-label="Output status" aria-live="polite" className="sr-only">
        {downloadStatus}
      </div>
      <div className={`${styles.cardHeader} reveal-item`} style={{ '--reveal-i': 0 }}>
        <h2 className={styles.cardTitle}>
          Preview
        </h2>
        <button
          className={styles.resetBtn}
          onClick={onReset}
          title="Reset preview and clear input"
          aria-label="Reset workspace output"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={styles.resetIcon}
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
          Reset
        </button>
      </div>

      <div className={`${styles.previewContainer} reveal-item`} style={{ '--reveal-i': 1 }}>
        <div className={styles.previewWrapper}>
          <div className={styles.checkerBg}>
            <img
              ref={imageRef}
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
            ref={dialogRef}
            className={styles.fullscreenOverlay}
            role="dialog"
            aria-modal="true"
            aria-label="Fullscreen image preview"
            onClick={() => setIsFullscreen(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                setIsFullscreen(false);
              } else if (e.key === "Tab" && dialogRef.current) {
                const focusables = dialogRef.current.querySelectorAll(
                  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                if (focusables.length > 0) {
                  const first = focusables[0];
                  const last = focusables[focusables.length - 1];
                  if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                  } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                  }
                }
              }
            }}
          >
            <button
              ref={closeBtnRef}
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

      <div className={`${styles.downloadRow} reveal-item`} style={{ '--reveal-i': 2 }}>
        <button
          className={styles.downloadBtn}
          onClick={handleDownload}
          title="Download rendered PNG"
        >
          <div className={styles.downloadBtnLeft}>
            <img src={downloadIcon} alt="" aria-hidden="true" className={styles.downloadIcon} />
            <span>{isDownloaded ? "✓ Downloaded!" : "Download PNG"}</span>
          </div>
          <span className={styles.convertBtnArrowBadge} aria-hidden="true">➔</span>
        </button>
      </div>
    </div>
  );
});

OutputCard.displayName = "OutputCard";
