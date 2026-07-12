import { useState, useCallback, useRef } from 'react';

export function useLatexToPngConversion({ outputRef }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const latestRequestIdRef = useRef(0);

  const handleReset = useCallback(() => {
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

    let objectUrl = null;
    let resultObjectUrl = null;

    try {
      // Step 1: Dynamic import and initialize
      if (!window.MathJax) {
        window.MathJax = {
          tex: { packages: { '[-]': ['require', 'autoload'] } },
          options: {
            enableMenu: false,
            enableAssistiveMml: false,
            enableSpeech: false,
            enableBraille: false,
            menuOptions: {
              settings: { assistiveMml: false }
            }
          },
          startup: { typeset: false }
        };
      }

      await import('mathjax/es5/tex-svg.js');

      if (window.MathJax.startup && window.MathJax.startup.promise) {
        await window.MathJax.startup.promise;
      }
      if (!window.MathJax.tex2svgPromise) {
        throw new Error("MathJax tex2svgPromise is not available. MathJax failed to load.");
      }

      if (myRequestId !== latestRequestIdRef.current) return;

      // Step 2: Render SVG
      let svgElement;
      try {
        const container = await window.MathJax.tex2svgPromise(latexString, { display: true });
        svgElement = container.querySelector('svg');
        if (!svgElement) {
          throw new Error('Failed to find SVG element in MathJax output.');
        }
      } catch (renderError) {
        throw new Error('Invalid LaTeX syntax.');
      }

      if (myRequestId !== latestRequestIdRef.current) return;

      // Step 3: Extract dimensions
      let intrinsicWidth = null;
      let intrinsicHeight = null;

      // Add xmlns if missing before serializing
      if (!svgElement.getAttribute('xmlns')) {
         svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      }

      let serializer = new XMLSerializer();
      let tempSvgString = serializer.serializeToString(svgElement);

      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(tempSvgString, 'image/svg+xml');
      const parsedSvgElement = svgDoc.documentElement;

      const widthAttr = parsedSvgElement.getAttribute('width');
      const heightAttr = parsedSvgElement.getAttribute('height');

      const exToPx = 12; // Approximation: 1ex ~ 12px

      if (widthAttr && widthAttr.endsWith('ex') && heightAttr && heightAttr.endsWith('ex')) {
        intrinsicWidth = parseFloat(widthAttr) * exToPx;
        intrinsicHeight = parseFloat(heightAttr) * exToPx;
      } else {
        const viewBox = parsedSvgElement.getAttribute('viewBox');
        if (viewBox) {
          const parts = viewBox.split(/\s+|,/);
          if (parts.length >= 4) {
            intrinsicWidth = parseFloat(parts[2]) * (exToPx / 1000);
            intrinsicHeight = parseFloat(parts[3]) * (exToPx / 1000);
          }
        }
      }

      if (!intrinsicWidth || !intrinsicHeight || isNaN(intrinsicWidth) || isNaN(intrinsicHeight)) {
        intrinsicWidth = 800;
        intrinsicHeight = 200;
      }

      svgElement.setAttribute('width', intrinsicWidth + 'px');
      svgElement.setAttribute('height', intrinsicHeight + 'px');

      serializer = new XMLSerializer();
      const finalSvgString = serializer.serializeToString(svgElement);

      // Step 4: Create object URL
      const svgBlob = new Blob([finalSvgString], { type: 'image/svg+xml;charset=utf-8' });
      objectUrl = URL.createObjectURL(svgBlob);

      // Step 5: Load Image
      const img = new Image();

      const imageLoadPromise = new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Failed to load SVG into image.'));
      });

      img.src = objectUrl;
      await imageLoadPromise;

      if (myRequestId !== latestRequestIdRef.current) return;

      // Step 6: Create canvas and draw
      const canvas = document.createElement('canvas');
      const DPI_SCALE = 2; // Matches Mermaid pipeline
      const finalWidth = intrinsicWidth * DPI_SCALE;
      const finalHeight = intrinsicHeight * DPI_SCALE;

      canvas.width = finalWidth;
      canvas.height = finalHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context.');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, finalWidth, finalHeight);
      ctx.drawImage(img, 0, 0, finalWidth, finalHeight);

      // Step 8: Revoke SVG object URL
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;

      // Step 7: Create PNG blob
      const pngBlob = await new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create PNG blob.'));
          }
        }, 'image/png');
      });

      resultObjectUrl = URL.createObjectURL(pngBlob);

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
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      if (myRequestId === latestRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [outputRef]);

  return { loading, result, error, setError, handleConvert, handleReset };
}
