async function replaceAsync(str, regex, asyncFn) {
  const promises = [];
  str.replace(regex, (match, ...args) => {
    promises.push(asyncFn(match, ...args));
  });
  const data = await Promise.all(promises);
  return str.replace(regex, () => data.shift());
}

async function fetchAsDataUrl(url) {
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
