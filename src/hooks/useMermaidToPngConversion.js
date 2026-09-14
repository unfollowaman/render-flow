import { useState, useCallback, useRef } from 'react';
import { renderImageToPngBlobUrl } from '../utils/canvasToBlob.js';

let cachedStyleString = null;
let fontLoadingPromise = null;

export function arrayBufferToBase64(buffer) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([buffer]);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64 = dataUrl.substring(dataUrl.indexOf(',') + 1);
      resolve(base64);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(blob);
  });
}

async function loadFontsAndBuildStyleString() {
  if (cachedStyleString) {
    return cachedStyleString;
  }
  if (fontLoadingPromise) {
    return fontLoadingPromise;
  }


  fontLoadingPromise = (async () => {
    try {
      const base = import.meta.env.BASE_URL || '/';
      const cleanBase = base.endsWith('/') ? base : base + '/';

      const fontsToFetch = [
        {
          name: 'Arya',
          weight: 400,
          url: cleanBase + 'fonts/arya/Arya-Regular.woff2',
        },
        {
          name: 'Arya',
          weight: 700,
          url: cleanBase + 'fonts/arya/Arya-Bold.woff2',
        },
        {
          name: 'Playfair Display',
          weight: 400,
          url: cleanBase + 'fonts/playfair-display/PlayfairDisplay-Regular.woff2',
        },
        {
          name: 'Playfair Display',
          weight: 700,
          url: cleanBase + 'fonts/playfair-display/PlayfairDisplay-Bold.woff2',
        },
      ];

      const fetchPromises = fontsToFetch.map(async (font) => {
        const response = await fetch(font.url);
        if (!response.ok) {
          throw new Error(`Failed to fetch font from ${font.url}`);
        }
        const buffer = await response.arrayBuffer();
        const base64 = await arrayBufferToBase64(buffer);
        return {
          ...font,
          base64,
        };
      });

      const loadedFonts = await Promise.all(fetchPromises);

      let styleString = '';
      loadedFonts.forEach((font) => {
        styleString += `
@font-face {
  font-family: '${font.name}';
  src: url('data:font/woff2;base64,${font.base64}') format('woff2');
  font-weight: ${font.weight};
  font-style: normal;
}
`;
      });

      styleString += `
.hi {
  font-family: 'Arya', sans-serif;
}
.en {
  font-family: 'Playfair Display', serif;
}
`;

      cachedStyleString = styleString;
      return cachedStyleString;
    } catch (err) {
      fontLoadingPromise = null;
      throw err;
    }
  })();

  return fontLoadingPromise;
}

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

    let resultObjectUrl = null;

    try {
      // Step 1: Wait for custom fonts to load (Arya, Playfair Display)
      const waitForCustomFonts = async (timeoutMs = 5000) => {
        if (!document.fonts) return;

        const fontPromise = (async () => {
          // First wait for general document.fonts.ready
          if (document.fonts.ready) {
            await document.fonts.ready;
          }

          // Specifically load/check each weight (400 and 700) for Arya and Playfair Display
          const fontSpecs = [
            '400 12px "Arya"',
            '700 12px "Arya"',
            '400 12px "Playfair Display"',
            '700 12px "Playfair Display"'
          ];

          const loadPromises = fontSpecs.map(async (spec) => {
            try {
              if (!document.fonts.check(spec)) {
                await document.fonts.load(spec);
              }
            } catch (e) {
              // Ignore font load errors for specific specimens so diagram conversion can proceed with fallback typography
              console.warn(`Failed to load font specimen "${spec}":`, e);
            }
          });

          await Promise.all(loadPromises);
        })();

        const timeoutPromise = new Promise((resolve) => setTimeout(resolve, timeoutMs));
        await Promise.race([fontPromise, timeoutPromise]);
      };

      await waitForCustomFonts();

      if (myRequestId !== latestRequestIdRef.current) return;

      const embeddedStyleString = await loadFontsAndBuildStyleString();

      if (myRequestId !== latestRequestIdRef.current) return;

      // Step 2: Dynamic import and initialize
      const mermaidModule = await import('mermaid');
      const mermaid = mermaidModule.default || mermaidModule;
      // Initialize with htmlLabels: false to prevent Canvas tainting from <foreignObject> tags on Chrome.
      mermaid.initialize({ startOnLoad: false, htmlLabels: true, securityLevel: 'strict' });

      // Step 3: Render SVG
      const uniqueId = 'mermaid-' + crypto.randomUUID();
      let svg;
      try {
        const renderResult = await mermaid.render(uniqueId, mermaidCodeString);
        svg = renderResult.svg;
      } catch (renderError) {
        throw new Error('Invalid Mermaid syntax.');
      }

      if (myRequestId !== latestRequestIdRef.current) return;

      // Step 4: Parse SVG string
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svg, 'image/svg+xml');
      const svgElement = svgDoc.documentElement;

      // Inject style element as the first child of <svg>
      const styleElement = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'style');
      styleElement.textContent = embeddedStyleString;
      svgElement.insertBefore(styleElement, svgElement.firstChild);

      // Apply padding-right adjustment to <foreignObject> children containing italic elements <i>
      const foreignObjects = svgDoc.querySelectorAll('foreignObject');
      foreignObjects.forEach((fo) => {
        if (fo.querySelector('i')) {
          const firstDiv = fo.querySelector('div');
          if (firstDiv) {
            const currentStyle = firstDiv.getAttribute('style') || '';
            firstDiv.setAttribute('style', currentStyle + (currentStyle.endsWith(';') ? '' : ';') + ' padding-right: 8px !important;');
          }
        }
      });

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

      // Serialize the updated svgDoc back to string
      const serializer = new XMLSerializer();
      const updatedSvgString = serializer.serializeToString(svgDoc);

      // Step 4: Create object URL
      // Re-applying the blob logic since I accidentally deleted it when investigating the taint issue.
      const base64Svg = btoa(unescape(encodeURIComponent(updatedSvgString)));
      const dataUri = 'data:image/svg+xml;base64,' + base64Svg;

      // Step 5: Load Image and wait for fonts
      const img = new Image();

      const imageLoadPromise = new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Failed to load SVG into image.'));
      });

      img.src = dataUri;
      await imageLoadPromise;

      const fontReadinessPromise = (async () => {
        if (document.fonts && document.fonts.ready) {
          await document.fonts.ready;
        }
      })();
      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 5000));
      await Promise.race([fontReadinessPromise, timeoutPromise]);

      if (myRequestId !== latestRequestIdRef.current) return;

      // Step 6: Convert to blob and object URL
      const renderResult = await renderImageToPngBlobUrl(
        img,
        intrinsicWidth,
        intrinsicHeight,
        'Diagram is too large to render (exceeds maximum canvas size). Try simplifying the diagram or reducing the number of nodes.'
      );

      resultObjectUrl = renderResult.resultObjectUrl;
      const finalWidth = renderResult.finalWidth;
      const finalHeight = renderResult.finalHeight;

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

  return { loading, result, error, setError, handleConvert, handleReset };
}
