import styles from "../styles/Home.module.css";
import logoIcon from "../assets/logo.svg";

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <div className={styles.logo}>
          <img src={logoIcon} alt="Logo" className={styles.logoIcon} />
          <span className={styles.logoText}>render-flow</span>
        </div>
        <nav className={styles.nav}>
          <a href="https://github.com" target="_blank" rel="noopener">GitHub</a>
          <a href="https://pages.github.com" target="_blank" rel="noopener">Deploy</a>
        </nav>
      </div>
    </header>
  );
}
