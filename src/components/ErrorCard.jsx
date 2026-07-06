import styles from "../styles/Home.module.css";

export function ErrorCard({ error }) {
  return (
    <div className={`${styles.errorCard} neu-card`}>
      <div className={styles.errorIcon}>⚠</div>
      <div>
        <p className={styles.errorTitle}>Rendering failed</p>
        <p className={styles.errorMessage}>{error}</p>
      </div>
    </div>
  );
}
