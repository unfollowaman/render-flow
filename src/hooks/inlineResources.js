// Performance optimization: Avoid dual string scanning passes (str.replace)
// by matching all occurrences in a single exec pass and constructing the result via slice string builder.
async function replaceAsync(str, regex, asyncFn) {
  const matches = [];
  const promises = [];

  const flags = regex.flags.includes('g') ? regex.flags : regex.flags + 'g';
  const rx = new RegExp(regex.source, flags);

  let match;
  while ((match = rx.exec(str)) !== null) {
    matches.push(match);
    const args = [...match];
    args.push(match.index, str);
    if (match.groups !== undefined) {
      args.push(match.groups);
    }
    promises.push(asyncFn(...args));

    // Guard against zero-width match infinite loop
    if (match.index === rx.lastIndex) {
      rx.lastIndex++;
    }

    // Break after first match if original regex was non-global
    if (!regex.flags.includes('g')) {
      break;
    }
  }

  if (matches.length === 0) {
    return str;
  }

  const replacements = await Promise.all(promises);

  let result = '';
  let lastIndex = 0;
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    result += str.slice(lastIndex, m.index) + replacements[i];
    lastIndex = m.index + m[0].length;
  }
  result += str.slice(lastIndex);

  return result;
}

export function isPrivateOrLoopbackHost(hostname) {
  if (!hostname) return true;
  let host = hostname.toLowerCase();
  if (host.startsWith('[') && host.endsWith(']')) {
    host = host.slice(1, -1);
  }

  // Check localhost and local TLDs
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.endsWith('.lan') ||
    host.endsWith('.home.arpa')
  ) {
    return true;
  }

  // IPv4 regex matching standard dotted quad
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = host.match(ipv4Regex);
  if (match) {
    const p = match.slice(1).map(Number);
    if (p.some((n) => n > 255)) return true; // Invalid IP, block
    if (p[0] === 127) return true; // 127.0.0.0/8 (Loopback)
    if (p[0] === 10) return true; // 10.0.0.0/8 (Private)
    if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return true; // 172.16.0.0/12 (Private)
    if (p[0] === 192 && p[1] === 168) return true; // 192.168.0.0/16 (Private)
    if (p[0] === 169 && p[1] === 254) return true; // 169.254.0.0/16 (Link-local / Cloud Metadata)
    if (p[0] === 0) return true; // 0.0.0.0/8 (Current network)
    if (p[0] === 100 && p[1] >= 64 && p[1] <= 127) return true; // 100.64.0.0/10 (CGNAT)
    if (p[0] === 192 && p[1] === 0 && p[2] === 0) return true; // 192.0.0.0/24
    if (p[0] === 192 && p[1] === 0 && p[2] === 2) return true; // 192.0.2.0/24
    if (p[0] === 198 && p[1] === 51 && p[2] === 100) return true; // 198.51.100.0/24
    if (p[0] === 203 && p[1] === 0 && p[2] === 113) return true; // 203.0.113.0/24
    if (p[0] >= 224) return true; // Multicast & Reserved
    return false;
  }

  // IPv6 checks
  if (host === '::1' || host === '::' || host === '0:0:0:0:0:0:0:1' || host === '0:0:0:0:0:0:0:0') return true;
  if (host.startsWith('fe8') || host.startsWith('fe9') || host.startsWith('fea') || host.startsWith('feb')) return true; // fe80::/10 link-local
  if (host.startsWith('fc') || host.startsWith('fd')) return true; // fc00::/7 unique local

  // IPv4-mapped IPv6 address: ::ffff:x.x.x.x or ::ffff:7f00:1 (hex format)
  if (host.startsWith('::ffff:') || host.startsWith('0:0:0:0:0:ffff:')) {
    const rest = host.replace(/^.*:ffff:/, '');
    if (rest.includes('.')) {
      return isPrivateOrLoopbackHost(rest);
    }
    const parts = rest.split(':');
    if (parts.length === 2) {
      const high = parseInt(parts[0], 16);
      const low = parseInt(parts[1], 16);
      if (!isNaN(high) && !isNaN(low)) {
        const ip = `${(high >> 8) & 255}.${high & 255}.${(low >> 8) & 255}.${low & 255}`;
        return isPrivateOrLoopbackHost(ip);
      }
    }
  }

  return false;
}

export function isBlockedUrl(urlString) {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return true;
    }
    return isPrivateOrLoopbackHost(parsed.hostname);
  } catch {
    return true;
  }
}

const dataUrlCache = new Map();

async function fetchAsDataUrl(url) {
  if (isBlockedUrl(url)) {
    throw new Error(`Blocked fetch attempt to restricted URL: ${url}`);
  }

  if (dataUrlCache.has(url)) {
    return dataUrlCache.get(url);
  }

  const promise = (async () => {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  })().catch((err) => {
    dataUrlCache.delete(url);
    throw err;
  });

  dataUrlCache.set(url, promise);
  return promise;
}

async function inlineCssUrls(text, failedUrls) {
  const urlRegex = /url\(\s*(["']|&quot;|&#39;)?(https?:\/\/[^"'\s)<>]+?)(?:["']|&quot;|&#39;)?\s*\)/gi;
  return await replaceAsync(text, urlRegex, async (match, quote, url) => {
    try {
      const dataUrl = await fetchAsDataUrl(url);
      // Data URIs don't strictly require quotes in CSS.
      // We return the original quote if one was used, else no quote,
      // to avoid breaking HTML attributes (e.g., style="...")
      const q = quote || '';
      return `url(${q}${dataUrl}${q})`;
    } catch (err) {
      failedUrls.push(url);
      return match;
    }
  });
}

export async function inlineResources(html) {
  const failedUrls = [];

  const linkRegex = /<link\s+([^>]+)>/gi;
  html = await replaceAsync(html, linkRegex, async (match) => {
    const relMatch = match.match(/\brel\s*=\s*(["']?)(stylesheet)\1/i);
    const hrefMatch = match.match(/\bhref\s*=\s*(["']?)(https?:\/\/[^"'\s>]+)\1/i);

    if (relMatch && hrefMatch) {
      const url = hrefMatch[2];
      if (isBlockedUrl(url)) {
        failedUrls.push(url);
        return match;
      }
      try {
        const response = await fetch(url, { mode: 'cors' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        let cssText = await response.text();
        cssText = await inlineCssUrls(cssText, failedUrls);
        return `<style>${cssText}</style>`;
      } catch (err) {
        failedUrls.push(url);
        return match;
      }
    }
    return match;
  });

  const imgRegex = /<img\s+([^>]+)>/gi;
  html = await replaceAsync(html, imgRegex, async (match) => {
    const srcMatch = match.match(/\bsrc\s*=\s*(["']?)(https?:\/\/[^"'\s>]+)\1/i);
    if (srcMatch) {
      const url = srcMatch[2];
      try {
        const dataUrl = await fetchAsDataUrl(url);
        return match.replace(srcMatch[0], `src="${dataUrl}"`);
      } catch (err) {
        failedUrls.push(url);
        return match;
      }
    }
    return match;
  });

  html = await inlineCssUrls(html, failedUrls);

  return { html, failedUrls };
}
