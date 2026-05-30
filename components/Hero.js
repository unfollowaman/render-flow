import styles from "../styles/Home.module.css";

// Pre-computed array for the decorative pixel grid to prevent allocations on every render
const PIXEL_GRID_CELLS = Array.from({ length: 64 });

export function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroContent}>
        <div className={styles.heroBadge}>
          <span className={styles.heroBadgeDot} />
          Pixel-perfect rendering via headless Chromium
        </div>
        <h1 className={styles.heroTitle}>
          HTML to PNG
          <br />
          <span className={styles.heroAccent}>Converter</span>
        </h1>
        <p className={styles.heroDesc}>
          Paste raw HTML. Get a flawless PNG back — fonts, images, and all
          external assets loaded. Powered by Puppeteer on Vercel.
        </p>
        <div className={styles.heroMeta}>
          <span>⚡ Serverless</span>
          <span>🎨 Full fidelity</span>
          <span>🔒 Stateless</span>
          <span>🌐 CDN assets supported</span>
        </div>
      </div>

      {/* Decorative pixel grid */}
      <div className={styles.pixelGrid} aria-hidden="true">
        {PIXEL_GRID_CELLS.map((_, i) => (
          <div key={i} className={styles.pixelCell} />
        ))}
      </div>
    </section>
  );
}
