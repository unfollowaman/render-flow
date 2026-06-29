import styles from "../styles/Home.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerHighlights}>
        <div className={styles.footerBadge}>
          <span className={styles.footerBadgeDot} />
          CLIENT-SIDE RENDERING VIA DOM-TO-IMAGE
        </div>
        <div className={styles.footerBadge}>
          <span className={styles.footerBadgeDot} />
          100% PRIVATE - NO DATA LEAVES BROWSER
        </div>
        <div className={styles.footerBadge}>
          <span className={styles.footerBadgeDot} />
          FAST - NO SERVER, NO UPLOADS
        </div>
        <div className={styles.footerBadge}>
          <span className={styles.footerBadgeDot} />
          CSS3 + FLEXBOX + GRID SUPPORT
        </div>
        <div className={styles.footerBadge}>
          <span className={styles.footerBadgeDot} />
          LIGHTWEIGHT VITE + REACT APP
        </div>
        <div className={styles.footerBadge}>
          <span className={styles.footerBadgeDot} />
          ZERO BACKEND REQUIRED
        </div>
      </div>
      <div className={styles.footerInner}>
        <span>@unfollowaman</span>
      </div>
    </footer>
  );
}
