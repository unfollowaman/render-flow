import styles from "../styles/Home.module.css";

const FOOTER_BADGES = [
  "CLIENT-SIDE RENDERING VIA DOM-TO-IMAGE",
  "100% PRIVATE - NO DATA LEAVES BROWSER",
  "FAST - NO SERVER, NO UPLOADS",
  "CSS3 + FLEXBOX + GRID SUPPORT",
  "LIGHTWEIGHT VITE + REACT APP",
  "ZERO BACKEND REQUIRED",
];

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerHighlightsWrapper}>
        <div className={styles.marqueeTrack}>
          {FOOTER_BADGES.map((badge, idx) => (
            <div key={`badge-1-${idx}`} className={styles.footerBadge}>
              <span className={styles.footerBadgeDot} />
              {badge}
            </div>
          ))}
        </div>
        <div className={styles.marqueeTrack}>
          {FOOTER_BADGES.map((badge, idx) => (
            <div key={`badge-2-${idx}`} className={styles.footerBadge}>
              <span className={styles.footerBadgeDot} />
              {badge}
            </div>
          ))}
        </div>
      </div>
      <div className={styles.footerInner}>
        <span>@unfollowaman</span>
      </div>
    </footer>
  );
}
