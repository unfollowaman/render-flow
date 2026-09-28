import { useState } from "react";
import styles from "../styles/Home.module.css";

export function ErrorCard({ error }) {
  const [isCopied, setIsCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const handleCopy = async () => {
    if (!error) return;
    try {
      await navigator.clipboard.writeText(String(error));
      setIsCopied(true);
      setStatusMessage("Error details copied to clipboard.");
      setTimeout(() => {
        setIsCopied(false);
        setStatusMessage("");
      }, 2000);
    } catch (err) {
      console.error("Failed to copy error details:", err);
    }
  };

  return (
    <div className={`${styles.errorCard} neu-card`} role="alert" aria-live="assertive">
      <div role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </div>
      <div className={styles.errorIcon} aria-hidden="true">⚠</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "5px" }}>
          <p className={styles.errorTitle} style={{ margin: 0 }}>Rendering failed</p>
          {error && (
            <button
              type="button"
              className={`${styles.sampleBtn} neu-raised`}
              style={{ padding: "4px 8px", fontSize: "12px", flexShrink: 0 }}
              onClick={handleCopy}
              aria-label="Copy error details to clipboard"
              title="Copy error details to clipboard"
            >
              {isCopied ? "✓ Copied!" : "Copy error"}
            </button>
          )}
        </div>
        <p className={styles.errorMessage}>{error}</p>
      </div>
    </div>
  );
}
