import { useState, useCallback } from 'react'

const BODY_WIDTH_REGEX = /(?:body|html)[^{]{0,4096}\{[^}]{0,4096}width:\s*(\d+)px/i
const BODY_HEIGHT_REGEX = /(?:body|html)[^{]{0,4096}\{[^}]{0,4096}height:\s*(\d+)px/i
const WIDTH_REGEX = /width:\s*(\d+)px/i
const HEIGHT_REGEX = /height:\s*(\d+)px/i

function extractDimensions(html) {
  const bodyWidthMatch = html.match(BODY_WIDTH_REGEX)
  const bodyHeightMatch = html.match(BODY_HEIGHT_REGEX)
  const widthMatch = html.match(WIDTH_REGEX)
  const heightMatch = html.match(HEIGHT_REGEX)

  let width = parseInt(bodyWidthMatch?.[1] ?? widthMatch?.[1] ?? '1200', 10)
  let height = parseInt(bodyHeightMatch?.[1] ?? heightMatch?.[1] ?? '630', 10)

  width = Math.min(Math.max(width, 100), 3840)
  height = Math.min(Math.max(height, 100), 2160)

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

  const handleReset = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  const handleConvert = useCallback(async (htmlToConvert) => {
    if (!htmlToConvert.trim()) {
      setError('Please enter some HTML content first.')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    // Create a hidden iframe to render the HTML in isolation
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.top = '-99999px'
    iframe.style.left = '-99999px'
    iframe.style.border = 'none'
    iframe.style.visibility = 'hidden'

    const { width, height } = extractDimensions(htmlToConvert)
    iframe.style.width = width + 'px'
    iframe.style.height = height + 'px'

    document.body.appendChild(iframe)

    try {
      // Write HTML into iframe
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
      iframeDoc.open()
      iframeDoc.write(htmlToConvert)
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

      // Capture with dom-to-image-more (lazy loaded)
      const domtoimage = (await import('dom-to-image-more')).default
      const dataUrl = await domtoimage.toPng(iframe.contentDocument.body, {
        width,
        height,
        style: {
          margin: '0',
          padding: '0',
        },
        bgcolor: null,
      })

      setResult({ image: dataUrl, width, height })
      setTimeout(() => {
        outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (err) {
      let message = 'Rendering failed. Try inlining external assets as data: URLs.'
      if (err.message?.toLowerCase().includes('timeout')) {
        message = 'Timeout: page took too long to render.'
      }
      setError(message)
    } finally {
      document.body.removeChild(iframe)
      setLoading(false)
    }
  }, [outputRef])

  return { loading, result, error, setError, handleConvert, handleReset }
}
