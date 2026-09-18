import styles from "../styles/Home.module.css";
import logoIcon from "../assets/logo.svg";

export function Header({ activePage = "home" }) {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <a href="index.html" className={styles.logo}>
          <img src={logoIcon} alt="Logo" className={styles.logoIcon} />
          <span className={styles.logoText}>render-flow</span>
        </a>
        <nav className={styles.nav}>
          <a href="https://github.com" target="_blank" rel="noopener" aria-label="GitHub (opens in a new tab)">GitHub</a>
          <a
            href="docs.html"
            className={activePage === "docs" ? styles.navActive : undefined}
            aria-current={activePage === "docs" ? "page" : undefined}
          >
            Docs
          </a>
        </nav>
      </div>
    </header>
  );
}
