import styles from "../styles/Home.module.css";

// Pre-computed array for the decorative pixel grid to prevent allocations on every render
const PIXEL_GRID_CELLS = Array.from({ length: 256 });

export function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroContent}>
        <h1 className={styles.heroTitle}>
          Render Flow
          <br />
          <span className={styles.heroConverterLine}>
            <span className={styles.heroWordRoller} aria-label="Mermaid HTML LaTeX">
              <span>Mermaid</span>
              <span>HTML</span>
              <span>LaTeX</span>
            </span>
            <span className={styles.heroStaticText}>
              <span>Code to Image</span>
              <span className={styles.heroStaticUnderline} aria-hidden="true" />
            </span>
          </span>
        </h1>
        <p className={styles.heroDesc}>
          Paste raw HTML. Get a PNG back — rendered entirely in your browser. No server, no uploads, no waiting.
        </p>
        <div className={styles.heroMeta}>
          <span>⚡ Client-side</span>
          <span>🎨 CSS3 + Flexbox + Grid</span>
          <span>🔒 Nothing leaves your browser</span>
          <span>🌐 No server needed</span>
        </div>
      </div>

      {/* Decorative pixel grid */}
      <div className={styles.pixelGridWrapper} aria-hidden="true">
        <div className={styles.pixelGrid}>
          {PIXEL_GRID_CELLS.map((_, i) => (
            <div key={`grid1-${i}`} className={styles.pixelCell} />
          ))}
        </div>
        <div className={styles.pixelGrid}>
          {PIXEL_GRID_CELLS.map((_, i) => (
            <div key={`grid2-${i}`} className={styles.pixelCell} />
          ))}
        </div>
      </div>
    </section>
  );
}
