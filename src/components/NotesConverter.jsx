import { forwardRef, useImperativeHandle, useState, useEffect, useRef } from "react";
import { InputCard, ErrorCard } from "./";
import { A4Page } from "./A4Page";
import { useNotesToPngConversion } from "../hooks/useNotesToPngConversion";
import styles from "../styles/Home.module.css";
import downloadIcon from "../assets/download-icon.png";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 1.5;
const DEFAULT_ZOOM = 1.0;
const ZOOM_STEP = 0.1;
const MAX_AREA = 200000000;

const NotesConverter = forwardRef(function NotesConverter(
  { inputRef, outputRef, mode, setMode, onReset },
  ref
) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [exportError, setExportError] = useState(null);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const pageRef = useRef(null);

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

  // Reset page index and zoom when notesResult changes
  useEffect(() => {
    setCurrentPageIndex(0);
    setZoom(DEFAULT_ZOOM);
    setExportError(null);
  }, [notesResult]);

  useImperativeHandle(ref, () => ({
    handleReset: () => {
      setCurrentPageIndex(0);
      setZoom(DEFAULT_ZOOM);
      setExportError(null);
      handleNotesReset();
    },
  }));

  const pages = notesResult?.pages || [];
  const totalPages = pages.length;
  const activePage = pages[currentPageIndex] || null;

  const pageData = activePage
    ? {
        chapter: notesResult.chapter,
        items: activePage.items,
        isOverflow: activePage.isOverflow,
      }
    : null;

  // PNG Export handler (current page)
  const handleDownloadPng = async () => {
    if (!pageRef.current) return;
    setExportError(null);
    setIsExportingPng(true);

    try {
      const pageEl = pageRef.current;
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

      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(pageEl, {
        backgroundColor: "#FFFFFF",
        pixelRatio,
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `notes-page-${currentPageIndex + 1}-${Date.now()}.png`;
      link.click();
    } catch (err) {
      setExportError(err.message || "Failed to export page as PNG.");
    } finally {
      setIsExportingPng(false);
    }
  };

  // Print / Export All as PDF handler
  const handlePrintAll = () => {
    setExportError(null);
    setIsPrinting(true);

    const handleAfterPrint = () => {
      setIsPrinting(false);
      window.removeEventListener("afterprint", handleAfterPrint);
    };

    window.addEventListener("afterprint", handleAfterPrint);

    // Wait for DOM paint and asset loading before calling window.print()
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();
      }, 150);
    });
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(MAX_ZOOM, Math.round((prev + ZOOM_STEP) * 10) / 10));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(MIN_ZOOM, Math.round((prev - ZOOM_STEP) * 10) / 10));
  };

  const handleZoomReset = () => {
    setZoom(DEFAULT_ZOOM);
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
      {notesError && <ErrorCard error={notesError} />}
      {exportError && <ErrorCard error={exportError} />}

      {notesResult && pageData && (
        <div
          className={`${styles.card} neu-card no-print`}
          ref={outputRef}
          style={{
            marginTop: "24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "32px",
            overflowX: "auto",
          }}
        >
          {/* Controls Bar */}
          <div
            className="no-print"
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: totalPages > 1 ? "space-between" : "flex-end",
              width: "100%",
              maxWidth: "210mm",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            {/* Page Navigation */}
            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <button
                  type="button"
                  className="neu-raised"
                  disabled={currentPageIndex === 0}
                  aria-label="Go to previous page"
                  onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "8px",
                    cursor: currentPageIndex === 0 ? "not-allowed" : "pointer",
                    opacity: currentPageIndex === 0 ? 0.5 : 1,
                    fontWeight: 600,
                    fontSize: "13px",
                  }}
                >
                  ← Previous
                </button>

                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#374151",
                    whiteSpace: "nowrap",
                  }}
                >
                  Page {currentPageIndex + 1} of {totalPages}
                </span>

                <button
                  type="button"
                  className="neu-raised"
                  disabled={currentPageIndex >= totalPages - 1}
                  aria-label="Go to next page"
                  onClick={() =>
                    setCurrentPageIndex((prev) => Math.min(totalPages - 1, prev + 1))
                  }
                  style={{
                    padding: "8px 14px",
                    borderRadius: "8px",
                    cursor: currentPageIndex >= totalPages - 1 ? "not-allowed" : "pointer",
                    opacity: currentPageIndex >= totalPages - 1 ? 0.5 : 1,
                    fontWeight: 600,
                    fontSize: "13px",
                  }}
                >
                  Next →
                </button>
              </div>
            )}

            {/* Zoom Controls */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <button
                type="button"
                className="neu-raised"
                disabled={zoom <= MIN_ZOOM}
                onClick={handleZoomOut}
                aria-label="Zoom out"
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  cursor: zoom <= MIN_ZOOM ? "not-allowed" : "pointer",
                  opacity: zoom <= MIN_ZOOM ? 0.5 : 1,
                  fontWeight: 700,
                  fontSize: "14px",
                }}
              >
                -
              </button>

              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#374151",
                  minWidth: "48px",
                  textAlign: "center",
                }}
              >
                {Math.round(zoom * 100)}%
              </span>

              <button
                type="button"
                className="neu-raised"
                disabled={zoom >= MAX_ZOOM}
                onClick={handleZoomIn}
                aria-label="Zoom in"
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  cursor: zoom >= MAX_ZOOM ? "not-allowed" : "pointer",
                  opacity: zoom >= MAX_ZOOM ? 0.5 : 1,
                  fontWeight: 700,
                  fontSize: "14px",
                }}
              >
                +
              </button>

              <button
                type="button"
                className="neu-raised"
                disabled={zoom === DEFAULT_ZOOM}
                onClick={handleZoomReset}
                style={{
                  padding: "6px 10px",
                  borderRadius: "6px",
                  cursor: zoom === DEFAULT_ZOOM ? "not-allowed" : "pointer",
                  opacity: zoom === DEFAULT_ZOOM ? 0.5 : 1,
                  fontWeight: 600,
                  fontSize: "12px",
                  marginLeft: "4px",
                }}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Export Action Buttons Row */}
          <div
            className={`${styles.downloadRow} no-print`}
            style={{
              width: "100%",
              maxWidth: "210mm",
              marginBottom: "24px",
              justifyContent: "flex-start",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              className={`${styles.downloadBtn} neu-raised`}
              disabled={isExportingPng}
              onClick={handleDownloadPng}
            >
              <img src={downloadIcon} alt="" aria-hidden="true" className={styles.downloadIcon} />
              {isExportingPng ? "Exporting PNG..." : "Download Page as PNG"}
            </button>

            <button
              type="button"
              className={`${styles.downloadBtn} neu-raised`}
              disabled={isPrinting}
              onClick={handlePrintAll}
            >
              Print / Export All Pages
            </button>
          </div>

          {/* Scaled Preview Wrapper */}
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              transform: `scale(${zoom})`,
              transformOrigin: "top center",
              transition: "transform 0.15s ease-out",
              marginBottom: zoom > 1 ? `${(zoom - 1) * 297}mm` : 0,
            }}
          >
            <div ref={pageRef}>
              <A4Page data={pageData} />
            </div>
          </div>
        </div>
      )}

      {/* Temporary Print Container for Exporting All Pages */}
      {isPrinting && notesResult && (
        <div className="print-only-container">
          {pages.map((p, index) => (
            <div key={index} className="print-page-wrapper">
              <A4Page
                data={{
                  chapter: notesResult.chapter,
                  items: p.items,
                  isOverflow: p.isOverflow,
                }}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
});

export default NotesConverter;
