import { useState, useCallback, useRef } from 'react';
import { createIsolatedIframe } from '../utils/createIsolatedIframe';

export function useLatexToPngConversion({ outputRef }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [parseError, setParseError] = useState(null);
  const latestRequestIdRef = useRef(0);

  const handleReset = useCallback(() => {
    setParseError(null);
    setResult(null);
    setError(null);
  }, []);

  const handleConvert = useCallback(async (latexString) => {
    latestRequestIdRef.current += 1;
    const myRequestId = latestRequestIdRef.current;

    if (!latexString.trim()) {
      if (myRequestId === latestRequestIdRef.current) {
        setError('Please enter some LaTeX code first.');
      }
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setParseError(null);

    let resultObjectUrl = null;

    try {
      // Lazy load KaTeX and its CSS to avoid blocking initial render
      const [katexModule] = await Promise.all([
        import('katex'),
        import('katex/dist/katex.min.css')
      ]);
      const katex = katexModule.default || katexModule;

      if (myRequestId !== latestRequestIdRef.current) return;

      // Render KaTeX HTML
      let htmlContent;
      try {
        htmlContent = katex.renderToString(latexString, {
            displayMode: true,
            throwOnError: true,
            trust: false
        });
      } catch (renderError) {
        if (myRequestId === latestRequestIdRef.current) {
          setParseError(renderError.message || 'LaTeX could not be parsed.');
          setLoading(false);
        }
        return;
      }

      if (myRequestId !== latestRequestIdRef.current) return;

      // Create offscreen container via isolated iframe to prevent html-to-image from
      // traversing cross-origin stylesheets (like Google Fonts) and throwing SecurityErrors.
      const iframe = createIsolatedIframe();

      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
        </head>
        <body style="margin: 0; padding: 0;">
          <div id="latex-container" style="display: inline-block; margin: 0; padding: 0;">
            ${htmlContent}
          </div>
        </body>
        </html>
      `);
      iframeDoc.close();

      const container = iframeDoc.getElementById('latex-container');

      // Copy local styles into iframe, avoiding Google Fonts
      const loadPromises = [];
      const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
      styles.forEach(el => {
        if (el.tagName.toLowerCase() === 'link' && el.href.includes('fonts.googleapis.com')) return;

        const clone = el.cloneNode(true);
        if (clone.tagName.toLowerCase() === 'link') {
          loadPromises.push(new Promise((resolve) => {
            clone.onload = resolve;
            clone.onerror = resolve; // Ignore errors, just move on
          }));
        }
        iframeDoc.head.appendChild(clone);
      });

      if (loadPromises.length > 0) {
        // Wait for all stylesheet links to load, with a 2-second timeout
        await Promise.race([
          Promise.all(loadPromises),
          new Promise(resolve => setTimeout(resolve, 2000))
        ]);
      }

      // Wait a tick for fonts/layout
      await new Promise(resolve => setTimeout(resolve, 0));
      if (iframeDoc.fonts && iframeDoc.fonts.ready) {
         await iframeDoc.fonts.ready;
      }

      const rect = container.getBoundingClientRect();
      let intrinsicWidth = Math.ceil(rect.width);
      let intrinsicHeight = Math.ceil(rect.height);

      if (!intrinsicWidth || !intrinsicHeight || isNaN(intrinsicWidth) || isNaN(intrinsicHeight)) {
        intrinsicWidth = 800;
        intrinsicHeight = 200;
      }

      if (myRequestId !== latestRequestIdRef.current) {
         document.body.removeChild(iframe);
         return;
      }

      const DPI_SCALE = 2; // Matches previous behavior via canvasToBlob
      const finalWidth = intrinsicWidth * DPI_SCALE;
      const finalHeight = intrinsicHeight * DPI_SCALE;

      if (finalWidth * finalHeight > 200000000) {
          document.body.removeChild(iframe);
          throw new Error('Formula is too large to render (exceeds maximum canvas size). Try simplifying the expression or breaking it into smaller parts.');
      }

      // Use html-to-image
      let blob;
      try {
          const { toBlob } = await import('html-to-image');
          blob = await toBlob(container, {
              width: intrinsicWidth,
              height: intrinsicHeight,
              style: {
                  margin: '0',
                  padding: '0'
              },
              backgroundColor: '#ffffff',
              pixelRatio: DPI_SCALE
          });
      } finally {
          document.body.removeChild(iframe);
      }

      if (!blob) {
          throw new Error('Failed to create PNG blob.');
      }

      resultObjectUrl = URL.createObjectURL(blob);

      if (myRequestId === latestRequestIdRef.current) {
        setResult({ image: resultObjectUrl, width: finalWidth, height: finalHeight });
        setTimeout(() => {
          outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } catch (err) {
      if (myRequestId === latestRequestIdRef.current) {
        setError(err.message || 'An error occurred during conversion.');
      }
    } finally {
      if (myRequestId === latestRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [outputRef]);

  return { loading, result, error, parseError, setError, handleConvert, handleReset };
}
