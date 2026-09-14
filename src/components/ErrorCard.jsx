import styles from "../styles/Home.module.css";

export function ErrorCard({ error }) {
  return (
    <div className={`${styles.errorCard} neu-card`} role="alert" aria-live="assertive">
      <div className={styles.errorIcon} aria-hidden="true">⚠</div>
      <div>
        <p className={styles.errorTitle}>Rendering failed</p>
        <p className={styles.errorMessage}>{error}</p>
      </div>
    </div>
  );
}
