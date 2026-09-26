import { useState, useCallback, useRef } from 'react'
import DOMPurify from 'dompurify'
import { inlineResources } from './inlineResources'
import { createIsolatedIframe } from '../utils/createIsolatedIframe'

const BODY_WIDTH_REGEX = /(?:body|html)\s*(?:\/\*.*?\*\/\s*)*\{[^}]*?width:\s*(\d+)px/i
const BODY_HEIGHT_REGEX = /(?:body|html)\s*(?:\/\*.*?\*\/\s*)*\{[^}]*?height:\s*(\d+)px/i
const INLINE_WIDTH_REGEX = /<(?:body|html)[^>]*style="[^"]*width:\s*(\d+)px/i
const INLINE_HEIGHT_REGEX = /<(?:body|html)[^>]*style="[^"]*height:\s*(\d+)px/i

function extractDimensions(html) {
  const bodyWidthMatch = html.match(BODY_WIDTH_REGEX)
  const bodyHeightMatch = html.match(BODY_HEIGHT_REGEX)
  const inlineWidthMatch = html.match(INLINE_WIDTH_REGEX)
  const inlineHeightMatch = html.match(INLINE_HEIGHT_REGEX)

  const widthMatch = bodyWidthMatch?.[1] ?? inlineWidthMatch?.[1]
  const heightMatch = bodyHeightMatch?.[1] ?? inlineHeightMatch?.[1]

  const width = widthMatch ? parseInt(widthMatch, 10) : null
  const height = heightMatch ? parseInt(heightMatch, 10) : null

  return { width, height }
}

export async function waitForFontsAndImages(doc, timeoutMs = 5000) {
  let observer;

  const readinessPromise = (async () => {
    const promises = []

    // Wait for fonts
    if (doc.fonts && doc.fonts.ready) {
      promises.push(doc.fonts.ready)
    }

    // Wait for images
    const images = doc.images || []
    for (const img of images) {
      if (!img.complete) {
        promises.push(
          new Promise((resolve) => {
            img.addEventListener('load', resolve, { once: true })
            img.addEventListener('error', resolve, { once: true })
          })
        )
      }
    }

    await Promise.all(promises)

    // Mutation observer for post-paint DOM mutations
    await new Promise((resolve) => {
      let timer;
      const resetTimer = () => {
        clearTimeout(timer);
        timer = setTimeout(resolve, 400);
      };

      observer = new MutationObserver(() => {
        resetTimer();
      });

      observer.observe(doc.body || doc.documentElement, {
        childList: true,
        attributes: true,
        subtree: true
      });

      resetTimer();
    });
  })()

  // Race against timeout
  const timeoutPromise = new Promise((resolve) => setTimeout(resolve, timeoutMs))

  await Promise.race([readinessPromise, timeoutPromise])

  if (observer) {
    observer.disconnect();
  }
}

export function useHtmlToPngConversion({ outputRef }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [failedResources, setFailedResources] = useState([])
  const [htmlWarning, setHtmlWarning] = useState(null)
  const latestRequestIdRef = useRef(0)

  const handleReset = useCallback(() => {
    setResult(null)
    setError(null)
    setFailedResources([])
    setHtmlWarning(null)
  }, [])

  const handleConvert = useCallback(async (htmlToConvert, force = false) => {
    latestRequestIdRef.current += 1
    const myRequestId = latestRequestIdRef.current

    if (!htmlToConvert.trim()) {
      if (myRequestId === latestRequestIdRef.current) {
        setError('Please enter some HTML content first.')
      }
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)
    if (htmlToConvert.length > 500000 && !force) {
      if (myRequestId === latestRequestIdRef.current) {
        setHtmlWarning('Very large HTML may cause the browser tab to become unresponsive during conversion. Do you want to proceed?');
        setLoading(false);
      }
      return;
    }
    setHtmlWarning(null);


    // Create a hidden iframe to render the HTML in isolation
    const iframe = createIsolatedIframe()

    document.body.appendChild(iframe)

    try {
      // Inline external resources
      const { html: processedHtml, failedUrls } = await inlineResources(htmlToConvert)

      if (myRequestId !== latestRequestIdRef.current) return
      setFailedResources(failedUrls)

      // Sanitize HTML to prevent XSS before writing to isolated iframe
      const sanitizedHtml = DOMPurify.sanitize(processedHtml, {
        WHOLE_DOCUMENT: true,
        ADD_TAGS: ['style', 'link'],
        ADD_ATTR: ['style', 'rel', 'href'],
      })

      // Write HTML into iframe
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
      iframeDoc.open()
      iframeDoc.write(sanitizedHtml)
      iframeDoc.close()

      // Wait for iframe load
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('timeout: page took too long to load')), 30000)
        const onLoad = () => {
          clearTimeout(timeout)
          resolve()
        }
        if (iframe.contentDocument.readyState === 'complete') {
          clearTimeout(timeout)
          resolve()
        } else {
          iframe.addEventListener('load', onLoad, { once: true })
        }
      })

      // Wait explicitly for fonts and images in the iframe document
      await waitForFontsAndImages(iframe.contentDocument)

      const scrollWidth = iframe.contentDocument.documentElement.scrollWidth
      const scrollHeight = iframe.contentDocument.documentElement.scrollHeight

      const { width: explicitWidth, height: explicitHeight } = extractDimensions(htmlToConvert)

      const finalWidth = explicitWidth !== null ? explicitWidth : scrollWidth
      const finalHeight = explicitHeight !== null ? explicitHeight : scrollHeight

      const totalArea = finalWidth * finalHeight
      const MAX_AREA = 200000000
      if (totalArea > MAX_AREA) {
        throw new Error(`Dimensions too large: requested ${finalWidth}x${finalHeight} exceeds maximum supported area of ${MAX_AREA} total pixels.`)
      }

      iframe.style.width = finalWidth + 'px'
      iframe.style.height = finalHeight + 'px'

      // Capture with html-to-image (lazy loaded)
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(iframe.contentDocument.body, {
        width: finalWidth,
        height: finalHeight,
        style: {
          margin: '0',
          padding: '0',
        },
        backgroundColor: null,
      })

      if (myRequestId === latestRequestIdRef.current) {
        setResult({ image: dataUrl, width: finalWidth, height: finalHeight })
        setTimeout(() => {
          outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
      }
    } catch (err) {
      let message = 'Rendering failed. Try inlining external assets as data: URLs.'
      if (err.message?.toLowerCase().includes('timeout')) {
        message = 'Timeout: page took too long to render.'
      } else if (err.message?.includes('Dimensions too large')) {
        message = err.message
      }
      if (myRequestId === latestRequestIdRef.current) {
        setError(message)
      }
    } finally {
      document.body.removeChild(iframe)
      if (myRequestId === latestRequestIdRef.current) {
        setLoading(false)
      }
    }
  }, [outputRef])

  return { loading, result, error, failedResources, htmlWarning, setHtmlWarning, setError, handleConvert, handleReset }
}
