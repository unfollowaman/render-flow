import { describe, it, expect, vi, beforeEach } from 'vitest';
import { inlineResources, isBlockedUrl, isPrivateOrLoopbackHost } from './inlineResources';

describe('inlineResources Security & Functionality', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('isPrivateOrLoopbackHost & isBlockedUrl SSRF prevention', () => {
    it('blocks loopback hostnames and IP addresses', () => {
      expect(isPrivateOrLoopbackHost('localhost')).toBe(true);
      expect(isPrivateOrLoopbackHost('sub.localhost')).toBe(true);
      expect(isPrivateOrLoopbackHost('127.0.0.1')).toBe(true);
      expect(isPrivateOrLoopbackHost('127.0.0.2')).toBe(true);
      expect(isPrivateOrLoopbackHost('0.0.0.0')).toBe(true);
      expect(isPrivateOrLoopbackHost('[::1]')).toBe(true);
      expect(isPrivateOrLoopbackHost('[::]')).toBe(true);
    });

    it('blocks private IPv4 address spaces', () => {
      expect(isPrivateOrLoopbackHost('10.0.0.1')).toBe(true);
      expect(isPrivateOrLoopbackHost('10.255.255.255')).toBe(true);
      expect(isPrivateOrLoopbackHost('172.16.0.1')).toBe(true);
      expect(isPrivateOrLoopbackHost('172.31.255.255')).toBe(true);
      expect(isPrivateOrLoopbackHost('192.168.1.1')).toBe(true);
    });

    it('blocks cloud metadata, link-local, and reserved IPv4/IPv6 addresses', () => {
      expect(isPrivateOrLoopbackHost('169.254.169.254')).toBe(true); // AWS/GCP Metadata
      expect(isPrivateOrLoopbackHost('[fe80::1]')).toBe(true); // IPv6 link-local
      expect(isPrivateOrLoopbackHost('[fc00::1]')).toBe(true); // IPv6 unique local
      expect(isPrivateOrLoopbackHost('[fd00::1]')).toBe(true);
      expect(isPrivateOrLoopbackHost('[::ffff:127.0.0.1]')).toBe(true); // IPv4-mapped IPv6 loopback
      expect(isPrivateOrLoopbackHost('[::ffff:7f00:1]')).toBe(true); // Hex IPv4-mapped IPv6 loopback
    });

    it('blocks local TLDs and domain suffixes', () => {
      expect(isPrivateOrLoopbackHost('service.local')).toBe(true);
      expect(isPrivateOrLoopbackHost('app.internal')).toBe(true);
      expect(isPrivateOrLoopbackHost('device.lan')).toBe(true);
      expect(isPrivateOrLoopbackHost('router.home.arpa')).toBe(true);
    });

    it('handles falsy and empty inputs safely', () => {
      expect(isPrivateOrLoopbackHost(null)).toBe(true);
      expect(isPrivateOrLoopbackHost(undefined)).toBe(true);
      expect(isPrivateOrLoopbackHost('')).toBe(true);
    });

    it('handles uppercase and mixed-case hostnames', () => {
      expect(isPrivateOrLoopbackHost('LOCALHOST')).toBe(true);
      expect(isPrivateOrLoopbackHost('Sub.Localhost')).toBe(true);
      expect(isPrivateOrLoopbackHost('SERVICE.LOCAL')).toBe(true);
      expect(isPrivateOrLoopbackHost('EXAMPLE.COM')).toBe(false);
      expect(isPrivateOrLoopbackHost('[FE80::1]')).toBe(true);
    });

    it('blocks invalid IPv4 addresses with octets > 255', () => {
      expect(isPrivateOrLoopbackHost('256.0.0.1')).toBe(true);
      expect(isPrivateOrLoopbackHost('192.168.1.300')).toBe(true);
      expect(isPrivateOrLoopbackHost('999.999.999.999')).toBe(true);
    });

    it('tests precise IPv4 private and reserved boundary ranges', () => {
      // 10.0.0.0/8
      expect(isPrivateOrLoopbackHost('9.255.255.255')).toBe(false);
      expect(isPrivateOrLoopbackHost('10.0.0.0')).toBe(true);
      expect(isPrivateOrLoopbackHost('10.255.255.255')).toBe(true);
      expect(isPrivateOrLoopbackHost('11.0.0.0')).toBe(false);

      // 172.16.0.0/12
      expect(isPrivateOrLoopbackHost('172.15.255.255')).toBe(false);
      expect(isPrivateOrLoopbackHost('172.16.0.0')).toBe(true);
      expect(isPrivateOrLoopbackHost('172.31.255.255')).toBe(true);
      expect(isPrivateOrLoopbackHost('172.32.0.0')).toBe(false);

      // 192.168.0.0/16
      expect(isPrivateOrLoopbackHost('192.167.255.255')).toBe(false);
      expect(isPrivateOrLoopbackHost('192.168.0.0')).toBe(true);
      expect(isPrivateOrLoopbackHost('192.168.255.255')).toBe(true);
      expect(isPrivateOrLoopbackHost('192.169.0.0')).toBe(false);

      // CGNAT 100.64.0.0/10
      expect(isPrivateOrLoopbackHost('100.63.255.255')).toBe(false);
      expect(isPrivateOrLoopbackHost('100.64.0.0')).toBe(true);
      expect(isPrivateOrLoopbackHost('100.127.255.255')).toBe(true);
      expect(isPrivateOrLoopbackHost('100.128.0.0')).toBe(false);

      // Documentation / Benchmarking ranges
      expect(isPrivateOrLoopbackHost('192.0.0.1')).toBe(true);
      expect(isPrivateOrLoopbackHost('192.0.2.1')).toBe(true);
      expect(isPrivateOrLoopbackHost('198.51.100.1')).toBe(true);
      expect(isPrivateOrLoopbackHost('203.0.113.1')).toBe(true);

      // Multicast and reserved
      expect(isPrivateOrLoopbackHost('224.0.0.1')).toBe(true);
      expect(isPrivateOrLoopbackHost('239.255.255.255')).toBe(true);
      expect(isPrivateOrLoopbackHost('255.255.255.255')).toBe(true);
    });

    it('handles IPv6 edge cases and IPv4-mapped IPv6 formats', () => {
      // Unspecified and loopback
      expect(isPrivateOrLoopbackHost('::')).toBe(true);
      expect(isPrivateOrLoopbackHost('0:0:0:0:0:0:0:0')).toBe(true);
      expect(isPrivateOrLoopbackHost('0:0:0:0:0:0:0:1')).toBe(true);

      // Link-local prefixes
      expect(isPrivateOrLoopbackHost('fe80::1')).toBe(true);
      expect(isPrivateOrLoopbackHost('fe90::1')).toBe(true);
      expect(isPrivateOrLoopbackHost('fea0::1')).toBe(true);
      expect(isPrivateOrLoopbackHost('feb0::1')).toBe(true);

      // IPv4-mapped IPv6 dotted quad
      expect(isPrivateOrLoopbackHost('::ffff:10.0.0.1')).toBe(true);
      expect(isPrivateOrLoopbackHost('::ffff:8.8.8.8')).toBe(false);
      expect(isPrivateOrLoopbackHost('0:0:0:0:0:ffff:192.168.1.1')).toBe(true);
      expect(isPrivateOrLoopbackHost('0:0:0:0:0:ffff:8.8.8.8')).toBe(false);

      // IPv4-mapped IPv6 hex
      expect(isPrivateOrLoopbackHost('::ffff:0a00:0001')).toBe(true); // 10.0.0.1
      expect(isPrivateOrLoopbackHost('::ffff:0808:0808')).toBe(false); // 8.8.8.8
      expect(isPrivateOrLoopbackHost('0:0:0:0:0:ffff:0a00:0001')).toBe(true);
    });

    it('allows public domain names and public IP addresses', () => {
      expect(isPrivateOrLoopbackHost('example.com')).toBe(false);
      expect(isBlockedUrl('https://example.com/logo.png')).toBe(false);
      expect(isBlockedUrl('http://172.32.0.1/style.css')).toBe(false);
      expect(isBlockedUrl('https://8.8.8.8/dns')).toBe(false);
    });

    it('blocks invalid schemes/protocols and invalid URLs', () => {
      expect(isBlockedUrl('file:///etc/passwd')).toBe(true);
      expect(isBlockedUrl('javascript:alert(1)')).toBe(true);
      expect(isBlockedUrl('ftp://example.com/file')).toBe(true);
      expect(isBlockedUrl('not a url')).toBe(true);
    });
  });

  it('prevents inlineResources from fetching loopback/private IP resources', async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;

    const html = `
      <link rel="stylesheet" href="http://127.0.0.1/style.css">
      <img src="http://169.254.169.254/latest/meta-data/" />
      <div style="background: url('http://localhost:8080/secret.png');"></div>
    `;

    const { html: resultHtml, failedUrls } = await inlineResources(html);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(failedUrls).toEqual([
      'http://127.0.0.1/style.css',
      'http://169.254.169.254/latest/meta-data/',
      'http://localhost:8080/secret.png',
    ]);
    expect(resultHtml).toContain('http://127.0.0.1/style.css');
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
