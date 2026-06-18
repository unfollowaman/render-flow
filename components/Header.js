import styles from "../styles/Home.module.css";

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <div className={styles.logo}>
          <span className={styles.logoMushroom}>🍄</span>
          <span className={styles.logoText}>html2png</span>
        </div>
        <nav className={styles.nav}>
          <a href="https://github.com" target="_blank" rel="noopener">GitHub</a>
          <a href="https://app.netlify.com" target="_blank" rel="noopener">Deploy</a>
        </nav>
      </div>
    </header>
  );
}
