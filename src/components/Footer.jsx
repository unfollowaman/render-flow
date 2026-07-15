import styles from "../styles/Home.module.css";

const FOOTER_BADGES = [
  "YOUR CODE STAYS ON YOUR DEVICE, ALWAYS",
  "ONE TOOL FOR HTML, MERMAID, AND LATEX",
  "NOTHING TO INSTALL, NOTHING TO CONFIGURE",
  "FROM CODE TO IMAGE FASTER THAN A PAGE REFRESH",
  "FREE, AND IT STAYS THAT WAY",
  "BUILT FOR PEOPLE WHO'D RATHER BE CODING",
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
