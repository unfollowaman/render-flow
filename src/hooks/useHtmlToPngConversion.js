import { useState, useCallback } from 'react'
import domtoimage from 'dom-to-image-more'

function extractDimensions(html) {
  const bodyWidthMatch = html.match(/(?:body|html)[^{]{0,4096}\{[^}]{0,4096}width:\s*(\d+)px/i)
  const bodyHeightMatch = html.match(/(?:body|html)[^{]{0,4096}\{[^}]{0,4096}height:\s*(\d+)px/i)
  const widthMatch = html.match(/width:\s*(\d+)px/i)
  const heightMatch = html.match(/height:\s*(\d+)px/i)

  let width = parseInt(bodyWidthMatch?.[1] ?? widthMatch?.[1] ?? '1200', 10)
  let height = parseInt(bodyHeightMatch?.[1] ?? heightMatch?.[1] ?? '630', 10)

  width = Math.min(Math.max(width, 100), 3840)
  height = Math.min(Math.max(height, 100), 2160)

  return { width, height }
}

export function useHtmlToPngConversion({ startMarioAnimation, stopMarioAnimation, outputRef, html }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleConvert = useCallback(async () => {
    if (!html.trim()) {
      setError('Please enter some HTML content first.')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)
    startMarioAnimation()

    // Create a hidden iframe to render the HTML in isolation
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.top = '-99999px'
    iframe.style.left = '-99999px'
    iframe.style.border = 'none'
    iframe.style.visibility = 'hidden'

    const { width, height } = extractDimensions(html)
    iframe.style.width = width + 'px'
    iframe.style.height = height + 'px'

    document.body.appendChild(iframe)

    try {
      // Write HTML into iframe
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
      iframeDoc.open()
      iframeDoc.write(html)
      iframeDoc.close()

      // Wait for iframe load + extra settle time for fonts/images
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('timeout: page took too long to load')), 30000)
        const onLoad = () => {
          clearTimeout(timeout)
          // Extra settle time for fonts and images
          setTimeout(resolve, 1200)
        }
        if (iframe.contentDocument.readyState === 'complete') {
          clearTimeout(timeout)
          setTimeout(resolve, 1200)
        } else {
          iframe.addEventListener('load', onLoad, { once: true })
        }
      })

      // Capture with dom-to-image-more
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
      stopMarioAnimation()
      setLoading(false)
    }
  }, [html, startMarioAnimation, stopMarioAnimation, outputRef])

  return { loading, result, error, setError, handleConvert }
}
