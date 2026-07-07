import { useState, useCallback, useRef } from 'react'
import { inlineResources } from './inlineResources'

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
  const readinessPromise = (async () => {
    const promises = []

    // Wait for fonts
    if (doc.fonts && doc.fonts.ready) {
      promises.push(doc.fonts.ready)
    }

    // Wait for images
    const images = Array.from(doc.images || [])
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
  })()

  // Race against timeout
  const timeoutPromise = new Promise((resolve) => setTimeout(resolve, timeoutMs))

  await Promise.race([readinessPromise, timeoutPromise])
}

export function useHtmlToPngConversion({ outputRef }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [failedResources, setFailedResources] = useState([])
  const latestRequestIdRef = useRef(0)

  const handleReset = useCallback(() => {
    setResult(null)
    setError(null)
    setFailedResources([])
  }, [])

  const handleConvert = useCallback(async (htmlToConvert) => {
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

    // Create a hidden iframe to render the HTML in isolation
    const iframe = document.createElement('iframe')
    iframe.style.position = 'absolute'
    iframe.style.top = '-99999px'
    iframe.style.left = '-99999px'
    iframe.style.width = '9999px'
    iframe.style.height = '9999px'
    iframe.style.border = 'none'
    iframe.style.visibility = 'hidden'

    document.body.appendChild(iframe)

    try {
      // Inline external resources
      const { html: processedHtml, failedUrls } = await inlineResources(htmlToConvert)

      if (myRequestId !== latestRequestIdRef.current) return
      setFailedResources(failedUrls)

      // Write HTML into iframe
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
      iframeDoc.open()
      iframeDoc.write(processedHtml)
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

      iframe.style.width = finalWidth + 'px'
      iframe.style.height = finalHeight + 'px'

      // Capture with dom-to-image-more (lazy loaded)
      const domtoimage = (await import('dom-to-image-more')).default
      const dataUrl = await domtoimage.toPng(iframe.contentDocument.body, {
        width: finalWidth,
        height: finalHeight,
        style: {
          margin: '0',
          padding: '0',
        },
        bgcolor: null,
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

  return { loading, result, error, failedResources, setError, handleConvert, handleReset }
}
