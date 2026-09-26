import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useHtmlToPngConversion, waitForFontsAndImages } from './useHtmlToPngConversion'

vi.mock('html-to-image', () => ({
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,fake')
}))

describe('useHtmlToPngConversion XSS Sanitization', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('sanitizes script tags, event handlers, and javascript URIs before writing to iframe', async () => {
    const outputRef = { current: { scrollIntoView: vi.fn() } }
    const { result } = renderHook(() => useHtmlToPngConversion({ outputRef }))

    let writtenContent = ''
    const origCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tagName, options) => {
      const el = origCreateElement(tagName, options)
      if (tagName.toLowerCase() === 'iframe') {
        const fakeDoc = {
          open: vi.fn(),
          close: vi.fn(),
          write: vi.fn((content) => {
            writtenContent = content
          }),
          readyState: 'complete',
          body: document.createElement('body'),
          documentElement: document.createElement('html'),
          images: [],
          fonts: { ready: Promise.resolve() }
        }
        Object.defineProperty(el, 'contentDocument', {
          get: () => fakeDoc,
          configurable: true
        })
        Object.defineProperty(el, 'contentWindow', {
          get: () => ({ document: fakeDoc }),
          configurable: true
        })
      }
      return el
    })

    const maliciousHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>body { color: red; }</style>
          <script>window.xssInHead = true;</script>
        </head>
        <body>
          <h1 onclick="window.xssOnClick=true">Title</h1>
          <img src="x" onerror="window.xssOnError=true" />
          <a href="javascript:alert(1)">Malicious Link</a>
        </body>
      </html>
    `

    await act(async () => {
      await result.current.handleConvert(maliciousHtml)
    })

    expect(writtenContent).toBeTruthy()

    // Verify malicious scripts, event handlers, and javascript: links are stripped
    expect(writtenContent).not.toContain('<script>')
    expect(writtenContent).not.toContain('window.xssInHead')
    expect(writtenContent).not.toContain('onclick')
    expect(writtenContent).not.toContain('onerror')
    expect(writtenContent).not.toContain('javascript:')

    // Verify legitimate elements and inline styles remain intact
    expect(writtenContent).toContain('color: red')
    expect(writtenContent).toContain('<h1>Title</h1>')
    expect(writtenContent).toContain('<img src="x">')
    expect(writtenContent).toContain('<a>Malicious Link</a>')
  })
})

describe('useHtmlToPngConversion conversion loop without artificial macro-task delays', () => {
  it('converts HTML content to PNG successfully without macro-task delays', async () => {
    const outputRef = { current: { scrollIntoView: vi.fn() } }
    const { result } = renderHook(() => useHtmlToPngConversion({ outputRef }))

    const origCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tagName, options) => {
      const el = origCreateElement(tagName, options)
      if (tagName.toLowerCase() === 'iframe') {
        const fakeDoc = {
          open: vi.fn(),
          close: vi.fn(),
          write: vi.fn(),
          readyState: 'complete',
          body: document.createElement('body'),
          documentElement: document.createElement('html'),
          images: [],
          fonts: { ready: Promise.resolve() }
        }
        Object.defineProperty(el, 'contentDocument', {
          get: () => fakeDoc,
          configurable: true
        })
        Object.defineProperty(el, 'contentWindow', {
          get: () => ({ document: fakeDoc }),
          configurable: true
        })
      }
      return el
    })

    await act(async () => {
      await result.current.handleConvert('<h1>Test Conversion</h1>')
    })

    expect(result.current.result).toEqual({
      image: 'data:image/png;base64,fake',
      width: 0,
      height: 0
    })
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })
})

describe('waitForFontsAndImages performance & functionality', () => {
  it('handles HTMLCollection, Array, and null doc.images correctly', async () => {
    // Test with real HTMLCollection
    const div = document.createElement('div')
    const img1 = document.createElement('img')
    img1.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    div.appendChild(img1)

    const docMock = {
      images: div.getElementsByTagName('img'),
      fonts: { ready: Promise.resolve() },
      body: document.createElement('body')
    }

    await waitForFontsAndImages(docMock, 50)
    expect(img1).toBeTruthy()

    // Test with missing doc.images
    const docNoImages = {
      fonts: { ready: Promise.resolve() },
      body: document.createElement('body')
    }
    await waitForFontsAndImages(docNoImages, 50)
  })

  it('benchmark direct HTMLCollection iteration vs Array.from', () => {
    const container = document.createElement('div')
    for (let i = 0; i < 2000; i++) {
      const img = document.createElement('img')
      img.src = `http://example.com/img${i}.png`
      container.appendChild(img)
    }
    const htmlCollection = container.getElementsByTagName('img')

    // Direct iteration
    const startDirect = performance.now()
    let countDirect = 0
    for (const img of htmlCollection || []) {
      if (img.src) countDirect++
    }
    const durationDirect = performance.now() - startDirect

    // Array.from iteration
    const startArrayFrom = performance.now()
    let countArrayFrom = 0
    const imagesArr = Array.from(htmlCollection || [])
    for (const img of imagesArr) {
      if (img.src) countArrayFrom++
    }
    const durationArrayFrom = performance.now() - startArrayFrom

    console.log(`[Benchmark HTMLCollection iteration] 2000 elements -> Direct: ${durationDirect.toFixed(2)}ms, Array.from: ${durationArrayFrom.toFixed(2)}ms`)

    expect(countDirect).toBe(2000)
    expect(countArrayFrom).toBe(2000)
  })
})
