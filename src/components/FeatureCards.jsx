import { memo } from "react";
import styles from "../styles/FeatureCards.module.css";
import useReveal from "../hooks/useReveal";

const FEATURE_LIST = [
  {
    mode: "html",
    title: "HTML to Image",
    description: "Render your HTML code into a high-quality image.",
    cta: "Try HTML Renderer",
    svg: "htmltoimage-svg.svg",
  },
  {
    mode: "latex",
    title: "LaTeX to Image",
    description: "Convert LaTeX equations into crisp images.",
    cta: "Try LaTeX Renderer",
    svg: "latextoimage-svg.svg",
  },
  {
    mode: "mermaid",
    title: "Mermaid to Image",
    description: "Turn Mermaid code into clear, professional diagrams.",
    cta: "Try Mermaid Renderer",
    svg: "mermaidtoimage-svg.svg",
  },
  {
    mode: "notes",
    title: "Notes Mode",
    description: "Convert JSON into beautiful, styled notes.",
    cta: "Try Notes Mode",
    svg: "jsontoimage-svg.svg",
  },
];

const basePath = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");

export const FeatureCards = memo(function FeatureCards({ onSelectMode }) {
  const [sectionRef, isVisible] = useReveal({ threshold: 0.1 });

  return (
    <section
      ref={sectionRef}
      className={`${styles.section} reveal-group${isVisible ? " is-visible" : ""}`}
      aria-label="Features and Conversion Tools"
    >
      <div className={styles.grid}>
        {FEATURE_LIST.map((feature, idx) => (
          <article
            key={feature.mode}
            className={`${styles.card} reveal-tile`}
            style={{ "--reveal-i": idx }}
            onClick={() => onSelectMode?.(feature.mode)}
          >
            {/* SVG Illustration Viewport */}
            <div className={styles.illustrationViewport}>
              <img
                src={`${basePath}/card-svgs/${feature.svg}`}
                alt=""
                aria-hidden="true"
                className={styles.svgImage}
                loading="lazy"
                decoding="async"
              />
            </div>

            {/* Feature Title */}
            <h3 className={styles.cardTitle}>{feature.title}</h3>

            {/* Feature Description */}
            <p className={styles.cardDescription}>{feature.description}</p>

            {/* Pill CTA Button */}
            <button
              type="button"
              className={styles.cardCta}
              onClick={(e) => {
                e.stopPropagation();
                onSelectMode?.(feature.mode);
              }}
              aria-label={`${feature.cta} for ${feature.title}`}
            >
              <span className={styles.ctaLabel}>{feature.cta}</span>
              <span className={styles.arrowBadge} aria-hidden="true">
                <span className={styles.arrowIconWrapper}>
                  {/* Base dark arrow */}
                  <svg
                    className={`${styles.arrowIcon} ${styles.arrowBase}`}
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#012b1b"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                  {/* Active white arrow revealed seamlessly from left to right */}
                  <svg
                    className={`${styles.arrowIcon} ${styles.arrowActive}`}
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </span>
              </span>
            </button>
          </article>
        ))}
      </div>
    </section>
  );
});

export default FeatureCards;
