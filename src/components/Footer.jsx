import styles from "../styles/Home.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <span>🍄 html2png — serverless HTML rendering</span>
        <span>Built with Vite + React + dom-to-image-more</span>
      </div>
    </footer>
  );
}
