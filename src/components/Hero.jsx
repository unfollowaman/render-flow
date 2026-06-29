import styles from "../styles/Home.module.css";

// Pre-computed array for the decorative pixel grid to prevent allocations on every render
const PIXEL_GRID_CELLS = Array.from({ length: 64 });

export function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroContent}>
        <h1 className={styles.heroTitle}>
          HTML to PNG
          <br />
          <span className={styles.heroAccent}>Converter</span>
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
      <div className={styles.pixelGrid} aria-hidden="true">
        {PIXEL_GRID_CELLS.map((_, i) => (
          <div key={i} className={styles.pixelCell} />
        ))}
      </div>
    </section>
  );
}
