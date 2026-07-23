import styles from "../styles/Home.module.css";

const FOOTER_BADGES = [
  "YOUR CODE STAYS ON YOUR DEVICE, ALWAYS",
  "ONE TOOL FOR HTML, MERMAID, AND LATEX",
  "NOTHING TO INSTALL, NOTHING TO CONFIGURE",
  "FROM CODE TO IMAGE FASTER THAN A PAGE REFRESH",
  "FREE, AND IT STAYS THAT WAY",
  "BUILT FOR PEOPLE WHO'D RATHER BE CODING",
];

const SOCIAL_LINKS = [
  {
    label: "Github",
    href: "https://github.com/unfollowaman",
    icon: "https://img.icons8.com/fluency/48/github.png",
  },
  {
    label: "Twitter",
    href: "https://x.com/unfollowaman",
    icon: "https://img.icons8.com/ios/50/twitterx--v2.png",
  },
  {
    label: "Gmail",
    href: "mailto:unfollowaman@gmail.com",
    icon: "https://img.icons8.com/color/48/gmail-new.png",
  },
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
      <div className={styles.footerSocialShell}>
        <div className={styles.footerSocialRow} aria-label="Social links">
          {SOCIAL_LINKS.map(({ label, href, icon }) => (
            <a
              key={label}
              className={`${styles.footerSocialLink} neu-raised`}
              href={href}
              target={href.startsWith("mailto:") ? undefined : "_blank"}
              rel={href.startsWith("mailto:") ? undefined : "noopener"}
              aria-label={label}
            >
              <img src={icon} alt="" className={styles.footerSocialIcon} />
              <span>{label}</span>
            </a>
          ))}
        </div>
        <div className={styles.footerHandle}>@unfollowaman</div>
      </div>
    </footer>
  );
}
