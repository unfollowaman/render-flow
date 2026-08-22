import { describe, it, expect, vi, beforeEach } from 'vitest';
import { inlineResources } from './inlineResources';

describe('inlineResources', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('inlines images and CSS url() resources', async () => {
    const mockImageBlob = new Blob(['fake-image-data'], { type: 'image/png' });

    globalThis.fetch = vi.fn().mockImplementation((url) => {
      if (url.endsWith('.png')) {
        return Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(mockImageBlob),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const html = `
      <div>
        <img src="https://example.com/image.png" />
      </div>
    `;

    const { html: resultHtml, failedUrls } = await inlineResources(html);

    expect(failedUrls).toEqual([]);
    expect(resultHtml).toContain('data:image/png;base64,');
  });

  it('caches network calls for duplicate resources', async () => {
    let fetchCount = 0;
    const mockImageBlob = new Blob(['fake-image-data'], { type: 'image/png' });

    globalThis.fetch = vi.fn().mockImplementation((url) => {
      fetchCount++;
      if (url.endsWith('.png')) {
        return Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(mockImageBlob),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const uniqueUrl = `https://example.com/logo-${Date.now()}.png`;
    const html = `
      <div>
        <img src="${uniqueUrl}" />
        <img src="${uniqueUrl}" />
        <img src="${uniqueUrl}" />
        <div style="background-image: url('${uniqueUrl}')"></div>
      </div>
    `;

    const startTime = performance.now();
    const { html: resultHtml, failedUrls } = await inlineResources(html);
    const duration = performance.now() - startTime;

    expect(failedUrls).toEqual([]);
    console.log(`[Benchmark With Cache] fetch count for 4 duplicate URLs: ${fetchCount}, duration: ${duration.toFixed(2)}ms`);
    // With cache, fetchCount should be exactly 1 despite 4 references in the HTML
    expect(fetchCount).toBe(1);
  });

  it('benchmark performance with large number of elements', async () => {
    const mockImageBlob = new Blob(['fake-image-data'], { type: 'image/png' });

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockImageBlob),
    });

    const count = 10000;
    const imgTags = Array.from({ length: count }, (_, i) => `<img src="https://example.com/img${i}.png" />`).join('\n');

    const startTime = performance.now();
    const { failedUrls } = await inlineResources(imgTags);
    const duration = performance.now() - startTime;

    expect(failedUrls).toEqual([]);
    console.log(`[Benchmark replaceAsync] 10,000 replacements duration: ${duration.toFixed(2)}ms`);
  });

  describe('<link> tags processing', () => {
    it('inlines stylesheet <link> tags and nested url() assets', async () => {
      const cssContent = 'body { background: url("https://example.com/bg.png"); }';
      const mockBgBlob = new Blob(['bg-image-data'], { type: 'image/png' });

      globalThis.fetch = vi.fn().mockImplementation((url) => {
        if (url === 'https://example.com/style.css') {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(cssContent),
          });
        }
        if (url === 'https://example.com/bg.png') {
          return Promise.resolve({
            ok: true,
            blob: () => Promise.resolve(mockBgBlob),
          });
        }
        return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
      });

      const html = '<link rel="stylesheet" href="https://example.com/style.css">';
      const { html: resultHtml, failedUrls } = await inlineResources(html);

      expect(failedUrls).toEqual([]);
      expect(resultHtml).toContain('<style>body { background: url("data:image/png;base64,');
      expect(resultHtml).not.toContain('<link');
    });

    it('ignores non-stylesheet <link> tags', async () => {
      const html = '<link rel="icon" href="https://example.com/favicon.ico">';
      const { html: resultHtml, failedUrls } = await inlineResources(html);

      expect(failedUrls).toEqual([]);
      expect(resultHtml).toBe(html);
    });
  });

  describe('CSS url() quote variations and HTTP error handling', () => {
    it('preserves matching quotes for url() in style attributes and CSS blocks', async () => {
      const mockBlob = new Blob(['img-data'], { type: 'image/png' });
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      });

      const html = `
        <div style="background: url('https://example.com/single.png');"></div>
        <div style="background: url(&quot;https://example.com/escaped-double.png&quot;);"></div>
        <div style="background: url(&#39;https://example.com/escaped-single.png&#39;);"></div>
        <div style="background: url(https://example.com/unquoted.png);"></div>
      `;

      const { html: resultHtml, failedUrls } = await inlineResources(html);

      expect(failedUrls).toEqual([]);
      expect(resultHtml).toContain("url('data:image/png;base64,");
      expect(resultHtml).toContain('url(&quot;data:image/png;base64,');
      expect(resultHtml).toContain('url(&#39;data:image/png;base64,');
      expect(resultHtml).toContain('url(data:image/png;base64,');
    });

    it('captures failed URLs when fetch returns non-ok response or throws network errors', async () => {
      globalThis.fetch = vi.fn().mockImplementation((url) => {
        if (url === 'https://example.com/404.css') {
          return Promise.resolve({ ok: false, status: 404, statusText: 'Not Found' });
        }
        if (url === 'https://example.com/500.png') {
          return Promise.resolve({ ok: false, status: 500, statusText: 'Server Error' });
        }
        if (url === 'https://example.com/network-error.png') {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const html = `
        <link rel="stylesheet" href="https://example.com/404.css">
        <img src="https://example.com/500.png" />
        <div style="background: url('https://example.com/network-error.png');"></div>
      `;

      const { html: resultHtml, failedUrls } = await inlineResources(html);

      expect(failedUrls).toEqual([
        'https://example.com/404.css',
        'https://example.com/500.png',
        'https://example.com/network-error.png',
      ]);
      expect(resultHtml).toContain('https://example.com/404.css');
      expect(resultHtml).toContain('https://example.com/500.png');
      expect(resultHtml).toContain('https://example.com/network-error.png');
    });
  });

  describe('FileReader failures and cache eviction', () => {
    it('handles FileReader error and deletes failed entry from cache to allow retries', async () => {
      const originalFileReader = globalThis.FileReader;

      let fileReaderInstances = 0;
      class MockFileReader {
        constructor() {
          fileReaderInstances++;
          this.instanceId = fileReaderInstances;
        }

        readAsDataURL(blob) {
          setTimeout(() => {
            if (this.instanceId === 1) {
              if (typeof this.onerror === 'function') {
                this.onerror(new Error('FileReader mock error'));
              }
            } else {
              this.result = 'data:image/png;base64,retrysuccess';
              if (typeof this.onloadend === 'function') {
                this.onloadend();
              }
            }
          }, 0);
        }
      }

      globalThis.FileReader = MockFileReader;

      try {
        const url = 'https://example.com/retry-image.png';
        const mockBlob = new Blob(['retry-data'], { type: 'image/png' });
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          blob: () => Promise.resolve(mockBlob),
        });

        const html = `<img src="${url}" />`;

        // First attempt should fail due to FileReader error
        const result1 = await inlineResources(html);
        expect(result1.failedUrls).toEqual([url]);
        expect(result1.html).toBe(html);

        // Second attempt should retry fetch and FileReader, and succeed after cache eviction
        const result2 = await inlineResources(html);
        expect(result2.failedUrls).toEqual([]);
        expect(result2.html).toContain('src="data:image/png;base64,retrysuccess"');
      } finally {
        globalThis.FileReader = originalFileReader;
      }
    });
  });
});
