import { useState, useCallback, useRef } from 'react';

export function useMermaidToPngConversion({ outputRef }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const latestRequestIdRef = useRef(0);

  const handleReset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  const handleConvert = useCallback(async (mermaidCodeString) => {
    latestRequestIdRef.current += 1;
    const myRequestId = latestRequestIdRef.current;

    if (!mermaidCodeString.trim()) {
      if (myRequestId === latestRequestIdRef.current) {
        setError('Please enter some Mermaid code first.');
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
      const mermaidModule = await import('mermaid');
      const mermaid = mermaidModule.default || mermaidModule;
      // Initialize with htmlLabels: false to prevent Canvas tainting from <foreignObject> tags on Chrome.
      mermaid.initialize({ startOnLoad: false, htmlLabels: false });

      // Step 2: Render SVG
      const uniqueId = 'mermaid-' + crypto.randomUUID();
      let svg;
      try {
        const renderResult = await mermaid.render(uniqueId, mermaidCodeString);
        svg = renderResult.svg;
      } catch (renderError) {
        throw new Error('Invalid Mermaid syntax.');
      }

      if (myRequestId !== latestRequestIdRef.current) return;

      // Step 3: Parse SVG string
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svg, 'image/svg+xml');
      const svgElement = svgDoc.documentElement;

      // Chrome taints canvases when drawing SVGs containing <foreignObject> loaded via ObjectURLs.
      // Mermaid uses <foreignObject> for HTML labels by default.
      // Stripping them out prevents the taint, but removes label text.
      // Alternatively, we can force Mermaid to not use HTML labels.

      let intrinsicWidth = null;
      let intrinsicHeight = null;

      const viewBox = svgElement.getAttribute('viewBox');
      if (viewBox) {
        const parts = viewBox.split(/\s+|,/);
        if (parts.length >= 4) {
          intrinsicWidth = parseFloat(parts[2]);
          intrinsicHeight = parseFloat(parts[3]);
        }
      }

      if (!intrinsicWidth || !intrinsicHeight) {
        const widthAttr = svgElement.getAttribute('width');
        const heightAttr = svgElement.getAttribute('height');

        if (widthAttr && heightAttr) {
          intrinsicWidth = parseFloat(widthAttr);
          intrinsicHeight = parseFloat(heightAttr);
        }
      }

      if (!intrinsicWidth || !intrinsicHeight || isNaN(intrinsicWidth) || isNaN(intrinsicHeight)) {
        throw new Error('Unable to determine dimensions from Mermaid SVG.');
      }

      // Step 4: Create object URL
      // Re-applying the blob logic since I accidentally deleted it when investigating the taint issue.
      const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      objectUrl = URL.createObjectURL(svgBlob);

      // Step 5: Load Image and wait for fonts
      const img = new Image();

      const imageLoadPromise = new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Failed to load SVG into image.'));
      });

      img.src = objectUrl;
      await imageLoadPromise;

      const fontReadinessPromise = (async () => {
        if (document.fonts && document.fonts.ready) {
          await document.fonts.ready;
        }
      })();
      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 5000));
      await Promise.race([fontReadinessPromise, timeoutPromise]);

      if (myRequestId !== latestRequestIdRef.current) return;

      // Step 6: Create canvas and draw
      const canvas = document.createElement('canvas');
      const DPI_SCALE = 2;
      const finalWidth = intrinsicWidth * DPI_SCALE;
      const finalHeight = intrinsicHeight * DPI_SCALE;

      canvas.width = finalWidth;
      canvas.height = finalHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context.');
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
