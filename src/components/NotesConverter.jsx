import { forwardRef, useImperativeHandle, useState, useEffect, useRef } from "react";
import { InputCard, ErrorCard } from "./";
import { A4Page } from "./A4Page";
import { useNotesToPngConversion } from "../hooks/useNotesToPngConversion";
import styles from "../styles/Home.module.css";
import downloadIcon from "../assets/download-icon.png";

const MAX_AREA = 200000000;

const NotesConverter = forwardRef(function NotesConverter(
  { inputRef, outputRef, mode, setMode, onReset },
  ref
) {
  const [exportError, setExportError] = useState(null);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [exportStatus, setExportStatus] = useState("");

  const pagesContainerRef = useRef(null);

  const {
    loading: notesLoading,
    result: notesResult,
    error: notesError,
    validationError: notesValidationError,
    validationSuccess: notesValidationSuccess,
    setError: setNotesError,
    validateJson: validateNotesJson,
    handleGenerate: handleNotesGenerate,
    handleReset: handleNotesReset,
  } = useNotesToPngConversion({
    outputRef,
  });

  useEffect(() => {
    setExportError(null);
  }, [notesResult]);

  useImperativeHandle(ref, () => ({
    handleReset: () => {
      setExportError(null);
      handleNotesReset();
    },
  }));

  const pages = notesResult?.pages || [];

  // PNG Export handler (exports all generated pages)
  const handleDownloadPng = async () => {
    if (!pagesContainerRef.current) return;
    setExportError(null);
    setIsExportingPng(true);
    setExportStatus("Exporting page(s) as PNG...");

    try {
      const pageEls = pagesContainerRef.current.querySelectorAll("[data-page-index]");
      if (!pageEls.length) return;

      const { toPng } = await import("html-to-image");

      for (let i = 0; i < pageEls.length; i += 1) {
        const pageEl = pageEls[i];
        const pixelRatio = 3; // 300 DPI high resolution for print quality A4
        const width = pageEl.offsetWidth || 794;
        const height = pageEl.offsetHeight || 1123;
        const totalArea = width * height * pixelRatio * pixelRatio;

        if (totalArea > MAX_AREA) {
          throw new Error(
            `Dimensions too large: requested export area of ${Math.round(
              totalArea
            )}px exceeds maximum supported limit of ${MAX_AREA} total pixels.`
          );
        }

        const dataUrl = await toPng(pageEl, {
          backgroundColor: "#FFFFFF",
          pixelRatio,
        });

        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `notes-page-${i + 1}-${Date.now()}.png`;
        link.click();
      }

      setIsDownloaded(true);
      setExportStatus("Page(s) exported as PNG successfully!");
      setTimeout(() => setIsDownloaded(false), 2000);
    } catch (err) {
      const errMsg = err.message || "Failed to export page(s) as PNG.";
      setExportError(errMsg);
      setExportStatus("Export failed.");
    } finally {
      setIsExportingPng(false);
    }
  };

  return (
    <>
      <InputCard
        ref={inputRef}
        mode={mode}
        setMode={setMode}
        notesLoading={notesLoading}
        notesValidationError={notesValidationError}
        notesValidationSuccess={notesValidationSuccess}
        setNotesError={setNotesError}
        validateNotesJson={validateNotesJson}
        handleNotesGenerate={handleNotesGenerate}
        handleNotesReset={handleNotesReset}
      />
      <div role="status" aria-label="Export status" aria-live="polite" className="sr-only">
        {exportStatus}
      </div>

      {notesError && <ErrorCard error={notesError} />}
      {exportError && <ErrorCard error={exportError} />}

      {notesResult && pages.length > 0 && (
        <div
          className={`${styles.card} neu-card no-print`}
          ref={outputRef}
          style={{
            marginTop: "24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "32px",
          }}
        >
          {/* Header with Title and Reset button matching OutputCard */}
          <div className={styles.cardHeader} style={{ width: "100%", marginBottom: "20px" }}>
            <h2 className={styles.cardTitle}>Preview</h2>
            {onReset && (
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
            )}
          </div>

          {/* Vertically Stacked Scrollable Container for Pages */}
          <div
            ref={pagesContainerRef}
            aria-label="Generated Notes Pages Preview"
            style={{
              width: "100%",
              maxHeight: "750px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "24px",
              padding: "16px 0",
              boxSizing: "border-box",
            }}
          >
            {pages.map((page, index) => (
              <div
                key={index}
                data-page-index={index}
                style={{
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                  borderRadius: "4px",
                  backgroundColor: "#ffffff",
                  flexShrink: 0,
                }}
              >
                <A4Page
                  data={{
                    chapter: notesResult.chapter,
                    items: page.items,
                    isOverflow: page.isOverflow,
                  }}
                />
              </div>
            ))}
          </div>

          {/* Download PNG Button Row (Placed Below the Container) */}
          <div
            className={`${styles.downloadRow} no-print`}
            style={{
              width: "100%",
              marginTop: "24px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <button
              type="button"
              className={styles.downloadBtn}
              disabled={isExportingPng}
              onClick={handleDownloadPng}
              title="Download PNG"
            >
              <div className={styles.downloadBtnLeft}>
                <img src={downloadIcon} alt="" aria-hidden="true" className={styles.downloadIcon} />
                <span>
                  {isExportingPng
                    ? "Exporting PNG..."
                    : isDownloaded
                    ? "✓ Downloaded!"
                    : "Download PNG"}
                </span>
              </div>
              <span className={styles.convertBtnArrowBadge} aria-hidden="true">
                ➔
              </span>
            </button>
          </div>
        </div>
      )}
    </>
  );
});

export default NotesConverter;
