import { useEffect, useRef, useState } from "react";
import styles from "../styles/Home.module.css";

// Pre-computed array for the decorative pixel grid to prevent allocations on every render
const PIXEL_GRID_CELLS = Array.from({ length: 256 });

const PILLS = [
  "⚡ Instant results",
  "🎨 HTML, Mermaid & LaTeX",
  "🔒 Stays on your device",
  "🌐 Just open and use"
];

export function Hero() {
  const containerRef = useRef(null);
  const pillRefs = useRef([]);
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const calculatePositions = () => {
      if (!isMounted) return;
      const container = containerRef.current;
      if (!container) return;

      const containerWidth = container.offsetWidth || window.innerWidth;
      const containerHeight = container.offsetHeight || 260; // fallback height

      const newPositions = [];
      const maxAttempts = 100;

      for (let i = 0; i < PILLS.length; i++) {
        const pill = pillRefs.current[i];
        if (!pill) continue;

        const width = pill.offsetWidth || 150;
        const height = pill.offsetHeight || 30;
        let x = 0, y = 0;
        let collision = true;
        let attempts = 0;

        while (collision && attempts < maxAttempts) {
          x = Math.random() * Math.max(0, containerWidth - width);
          y = Math.random() * Math.max(0, containerHeight - height);

          collision = false;
          for (let j = 0; j < newPositions.length; j++) {
            const pos = newPositions[j];
            const pWidth = pillRefs.current[j] ? pillRefs.current[j].offsetWidth || 150 : 150;
            const pHeight = pillRefs.current[j] ? pillRefs.current[j].offsetHeight || 30 : 30;

            const padding = 15;
            if (
              x < pos.x + pWidth + padding &&
              x + width + padding > pos.x &&
              y < pos.y + pHeight + padding &&
              y + height + padding > pos.y
            ) {
              collision = true;
              break;
            }
          }
          attempts++;
        }

        newPositions.push({ x, y, delay: Math.random() * -4 });
      }

      setPositions(newPositions);
    };

    const timer = setTimeout(() => {
      calculatePositions();
    }, 50);

    const handleResize = () => {
      calculatePositions();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      isMounted = false;
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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
          Paste your HTML, Mermaid diagram, or LaTeX. Get back a clean PNG in seconds — rendered right there in your browser tab. That's the whole process.
        </p>
        <div className={styles.heroMeta} ref={containerRef}>
          {PILLS.map((text, i) => (
            <span
              key={i}
              ref={(el) => (pillRefs.current[i] = el)}
              className={styles.heroPill}
              style={
                positions[i]
                  ? {
                      left: `${positions[i].x}px`,
                      top: `${positions[i].y}px`,
                      opacity: 1,
                      animationDelay: `${positions[i].delay}s`,
                    }
                  : { opacity: 0 }
              }
            >
              {text}
            </span>
          ))}
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
