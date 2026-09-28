import { useState } from "react";
import styles from "../styles/Home.module.css";

export function ErrorCard({ error }) {
  const [isCopied, setIsCopied] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");

  const handleCopy = async () => {
    if (!error) return;
    try {
      await navigator.clipboard.writeText(error);
      setIsCopied(true);
      setCopyStatus("Error message copied to clipboard.");
      setTimeout(() => {
        setIsCopied(false);
        setCopyStatus("");
      }, 2000);
    } catch (err) {
      console.error("Failed to copy error message:", err);
    }
  };

  return (
    <div className={`${styles.errorCard} neu-card`} role="alert" aria-live="assertive">
      <div role="status" aria-label="Copy error status" aria-live="polite" className="sr-only">
        {copyStatus}
      </div>
      <div className={styles.errorIcon} aria-hidden="true">⚠</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          <p className={styles.errorTitle}>Rendering failed</p>
          <button
            type="button"
            className="neu-raised"
            onClick={handleCopy}
            aria-label="Copy error details to clipboard"
            title="Copy error details to clipboard"
            style={{
              padding: "4px 10px",
              fontSize: "12px",
              fontWeight: 600,
              borderRadius: "6px",
              cursor: "pointer",
              color: isCopied ? "#16a34a" : "#742a2a",
              whiteSpace: "nowrap",
            }}
          >
            {isCopied ? "✓ Copied!" : "Copy error"}
          </button>
        </div>
        <p className={styles.errorMessage}>{error}</p>
      </div>
    </div>
  );
}
