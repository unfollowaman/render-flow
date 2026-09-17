import React, { useEffect, useRef, useState, useId } from "react";
import styles from "./styles/Docs.module.css";
import { Header, Footer } from "./components";

function StaticMermaidDiagram({ chart, caption }) {
  const containerRef = useRef(null);
  const [svgHtml, setSvgHtml] = useState("");
  const uniqueId = "doc-mermaid-" + useId().replace(/:/g, "");

  useEffect(() => {
    let isCancelled = false;

    async function renderDiagram() {
      try {
        const mermaidModule = await import("mermaid");
        const mermaid = mermaidModule.default || mermaidModule;

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "base",
          themeVariables: {
            fontFamily: "'Montserrat', sans-serif",
            fontSize: "14px",
            primaryColor: "#f2f2f4",
            primaryTextColor: "#012b1b",
            primaryBorderColor: "#012b1b",
            lineColor: "#012b1b",
            secondaryColor: "#ffa100",
            tertiaryColor: "#e8e8ea",
            background: "transparent",
            mainBkg: "#f2f2f4",
            nodeBorder: "#012b1b",
            clusterBkg: "#e8e8ea",
            clusterBorder: "#012b1b",
            defaultLinkColor: "#012b1b",
            titleColor: "#012b1b",
            edgeLabelBackground: "#e8e8ea",
          },
        });

        const { svg } = await mermaid.render(uniqueId, chart);
        if (!isCancelled) {
          setSvgHtml(svg);
        }
      } catch (err) {
        console.error("Failed to render docs Mermaid diagram:", err);
      }
    }

    renderDiagram();

    return () => {
      isCancelled = true;
    };
  }, [chart, uniqueId]);

  return (
    <div className={styles.diagramContainer} ref={containerRef}>
      <div
        className={styles.diagramSvg}
        dangerouslySetInnerHTML={{ __html: svgHtml }}
      />
      {caption && <div className={styles.diagramCaption}>{caption}</div>}
    </div>
  );
}

export default function DocsApp() {
  const handleMobileNavChange = (e) => {
    const hash = e.target.value;
    if (hash) {
      window.location.hash = hash;
    }
  };

  return (
    <div className={styles.page}>
      {/* ── HEADER ─────────────────────────────────── */}
      <Header activePage="docs" />

      {/* ── MAIN CONTENT ───────────────────────────── */}
      <main className={styles.main}>
        <div className={styles.container}>
          {/* ── DESKTOP STICKY SIDEBAR TOC ───────────── */}
          <aside className={styles.sidebar} aria-label="Table of contents">
            <div className={styles.tocGroup}>
              <div className={styles.tocLabel}>GETTING STARTED</div>
              <ul className={styles.tocList}>
                <li>
                  <a href="#overview" className={styles.tocLink}>Overview</a>
                </li>
                <li>
                  <a href="#using-each-mode" className={styles.tocLink}>Using each mode</a>
                </li>
              </ul>
            </div>

            <div className={styles.tocGroup}>
              <div className={styles.tocLabel}>ARCHITECTURE</div>
              <ul className={styles.tocList}>
                <li>
                  <a href="#how-it-works" className={styles.tocLink}>How it works</a>
                </li>
                <li>
                  <a href="#render-pipelines" className={styles.tocLink}>Render pipelines</a>
                </li>
                <li>
                  <a href="#privacy-security" className={styles.tocLink}>Privacy & security</a>
                </li>
              </ul>
            </div>

            <div className={styles.tocGroup}>
              <div className={styles.tocLabel}>ABOUT</div>
              <ul className={styles.tocList}>
                <li>
                  <a href="#credits-stack" className={styles.tocLink}>Credits & stack</a>
                </li>
              </ul>
            </div>
          </aside>

          {/* ── MOBILE TOC DROPDOWN ──────────────────── */}
          <div className={styles.mobileToc}>
            <select
              className={styles.mobileSelect}
              onChange={handleMobileNavChange}
              aria-label="Table of contents"
              defaultValue=""
            >
              <option value="" disabled>Jump to section...</option>
              <optgroup label="GETTING STARTED">
                <option value="#overview">Overview</option>
                <option value="#using-each-mode">Using each mode</option>
              </optgroup>
              <optgroup label="ARCHITECTURE">
                <option value="#how-it-works">How it works</option>
                <option value="#render-pipelines">Render pipelines</option>
                <option value="#privacy-security">Privacy & security</option>
              </optgroup>
              <optgroup label="ABOUT">
                <option value="#credits-stack">Credits & stack</option>
              </optgroup>
            </select>
          </div>

          {/* ── CONTENT COLUMN ───────────────────────── */}
          <article className={styles.content}>
            {/* Page Header */}
            <header className={styles.header}>
              <div className={styles.kicker}>DOCUMENTATION</div>
              <h1 className={styles.title}>Render Flow Docs</h1>
              <p className={styles.subhead}>
                How the tool works, how each mode behaves, and what happens to your code once you hit convert.
              </p>
            </header>

            {/* Overview Section */}
            <section id="overview" className={styles.section}>
              <h2 className={styles.sectionTitle}>Overview</h2>
              <p className={styles.paragraph}>
                Render Flow turns HTML, Mermaid diagrams, and LaTeX into clean PNG images. There's no server behind it — every conversion happens inside your browser tab, using your device's own rendering engine.
              </p>
              <p className={styles.smallNote}>
                Four modes are available: HTML, Mermaid, LaTeX, and Notes <span className={styles.badge}>IN DEVELOPMENT</span>.
              </p>
              <StaticMermaidDiagram
                chart={`flowchart TD\n    A["Paste code"] --> B["Render Flow processes it in your browser"]\n    B --> C["PNG delivered"]`}
                caption="Every mode follows this same shape — only step 2 differs."
              />
            </section>

            {/* Using each mode Section */}
            <section id="using-each-mode" className={styles.section}>
              <h2 className={styles.sectionTitle}>Using each mode</h2>

              <h3 className={styles.subSectionTitle}>HTML Mode</h3>
              <p className={styles.paragraph}>
                Paste any HTML, or drop a <code className={styles.inlineCode}>.html</code> file. Include explicit <code className={styles.inlineCode}>width</code> and <code className={styles.inlineCode}>height</code> on the <code className={styles.inlineCode}>body</code> — without it, Render Flow has to guess the canvas size.
              </p>
              <StaticMermaidDiagram
                chart={`flowchart TD\n    A["Paste HTML"] --> B["Extract width/height from body"]\n    B --> C["Write into hidden iframe"]\n    C --> D["Wait for fonts and images to load"]\n    D --> E["html-to-image captures the iframe"]\n    E --> F["PNG delivered"]`}
              />

              <h3 className={styles.subSectionTitle}>Mermaid Mode</h3>
              <p className={styles.paragraph}>
                Paste standard Mermaid syntax. Diagrams render with embedded fonts, so text stays sharp in the exported PNG.
              </p>
              <StaticMermaidDiagram
                chart={`flowchart TD\n    A["Paste Mermaid syntax"] --> B["mermaid.js builds an SVG"]\n    B --> C["Fonts embedded inline in the SVG"]\n    C --> D["SVG rasterized to canvas"]\n    D --> E["PNG delivered"]`}
              />

              <h3 className={styles.subSectionTitle}>LaTeX Mode</h3>
              <p className={styles.paragraph}>
                Paste LaTeX math. It's rendered with KaTeX, so most common packages and symbols are supported.
              </p>
              <StaticMermaidDiagram
                chart={`flowchart TD\n    A["Paste LaTeX"] --> B["KaTeX typesets the math"]\n    B --> C["Isolated from page stylesheets"]\n    C --> D["Rendered to canvas"]\n    D --> E["PNG delivered"]`}
              />

              <h3 className={styles.subSectionTitle}>
                Notes Mode <span className={styles.badge}>IN DEVELOPMENT</span>
              </h3>
              <p className={styles.paragraph}>
                Converts structured JSON — questions, solutions, diagrams — into paginated, print-ready study notes. Still being built; expect rough edges.
              </p>
            </section>

            {/* How it works Section */}
            <section id="how-it-works" className={styles.section}>
              <h2 className={styles.sectionTitle}>How it works</h2>
              <p className={styles.paragraph}>
                When you hit Convert to PNG, your code never leaves your device. Render Flow builds the output entirely in memory, using a hidden, isolated iframe as a sandbox — the same technique browsers use to keep ads or embeds from interfering with the rest of a page.
              </p>
              <p className={styles.paragraph}>
                An iframe provides structural isolation without needing a server-side sandbox: any malicious or broken code executed during rendering can only affect your own browser tab, never a remote server, because no server exists. Every conversion is completely stateless, with no background caching layer or persistent storage between runs.
              </p>
              <div className={styles.callout}>
                Nothing is uploaded, cached, or stored. Refresh the tab and it's gone — every conversion starts clean.
              </div>
            </section>

            {/* Render pipelines Section */}
            <section id="render-pipelines" className={styles.section}>
              <h2 className={styles.sectionTitle}>Render pipelines</h2>
              <p className={styles.paragraph}>
                Each mode uses a purpose-built library rather than one generic renderer:
              </p>
              <ul className={styles.list}>
                <li>
                  <strong>HTML</strong> — <code className={styles.inlineCode}>html-to-image</code> renders the sandboxed iframe's contents directly to a PNG data URL. Target dimensions are read from explicit width and height properties on the body element before writing to the iframe, ensuring canvas sizing is known up front rather than inferred post-render.
                </li>
                <li>
                  <strong>Mermaid</strong> — <code className={styles.inlineCode}>mermaid.js</code> builds an SVG, which is then rasterized to canvas and exported as PNG. Custom fonts are base64-encoded and embedded inline directly inside the SVG's own <code className={styles.inlineCode}>&lt;style&gt;</code> block before rasterization so exported text does not rely on local system fonts.
                </li>
                <li>
                  <strong>LaTeX</strong> — KaTeX typesets the math, isolated from the page's own stylesheets to avoid font-loading conflicts. Rendering takes place in a container separated from global page styles, eliminating cross-origin font-loading errors that surfaced during development.
                </li>
              </ul>
              <p className={styles.paragraph}>
                A size guardrail caps any single conversion's canvas at 200 million pixels before creation, to prevent a runaway render from crashing the tab.
              </p>
            </section>

            {/* Privacy & security Section */}
            <section id="privacy-security" className={styles.section}>
              <h2 className={styles.sectionTitle}>Privacy & security</h2>
              <p className={styles.paragraph}>
                Isolation here is structural, not a backend policy: your HTML runs inside a hidden iframe on your own machine, so anything unusual in the code can only affect your own browser tab — never a server, and never anyone else's session.
              </p>
              <p className={styles.paragraph}>
                This isolation is designed to protect your browser tab from your own pasted code. It is not a claim about defending against network-level attacks or multi-user threats, since there is no network layer or multi-user interaction involved in the first place.
              </p>
            </section>

            {/* Credits & stack Section */}
            <section id="credits-stack" className={styles.section}>
              <h2 className={styles.sectionTitle}>Credits & stack</h2>
              <p className={styles.paragraph}>
                Built with Vite and React. Hosted on GitHub Pages.
              </p>
              <p className={styles.smallNote}>
                Made by <a href="https://x.com/unfollowaman" target="_blank" rel="noopener" className={styles.link}>@unfollowaman</a>. Source on <a href="https://github.com/unfollowaman/render-flow" target="_blank" rel="noopener" className={styles.link}>GitHub</a>.
              </p>
            </section>
          </article>
        </div>
      </main>

      {/* ── FOOTER ─────────────────────────────────── */}
      <Footer />
    </div>
  );
}
