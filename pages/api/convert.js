import { chromium } from "playwright-core";
import chromiumBinary from "@sparticuz/chromium";

const RENDER_TIMEOUT_MS = 45_000;

async function waitForPageToRender(page, html) {
  await page.setContent(html, {
    waitUntil: "load",
    timeout: RENDER_TIMEOUT_MS,
  });
  await page.waitForLoadState("networkidle", { timeout: RENDER_TIMEOUT_MS });
}

function extractDimensions(html) {
  let bodyWidthMatch = null;
  let bodyHeightMatch = null;

  const lowerHtml = html.toLowerCase();
  let searchIndex = 0;

  // Quick check if there are any braces at all
  if (lowerHtml.indexOf('{') !== -1) {
    while (searchIndex < lowerHtml.length) {
      const bodyIdx = lowerHtml.indexOf('body', searchIndex);
      const htmlIdx = lowerHtml.indexOf('html', searchIndex);

      let targetIdx = -1;
      if (bodyIdx !== -1 && htmlIdx !== -1) {
        targetIdx = Math.min(bodyIdx, htmlIdx);
      } else if (bodyIdx !== -1) {
        targetIdx = bodyIdx;
      } else if (htmlIdx !== -1) {
        targetIdx = htmlIdx;
      } else {
        break;
      }

      const braceIdx = lowerHtml.indexOf('{', targetIdx);
      if (braceIdx === -1) break; // No more '{' in the rest of the string

      const closeBraceIdx = lowerHtml.indexOf('}', braceIdx);
      if (closeBraceIdx === -1) break; // No more '}' in the rest of the string

      const blockContent = html.substring(braceIdx + 1, closeBraceIdx);

      const wMatch = blockContent.match(/width:\s*(\d+)px/i);
      const hMatch = blockContent.match(/height:\s*(\d+)px/i);

      if (wMatch && !bodyWidthMatch) bodyWidthMatch = wMatch;
      if (hMatch && !bodyHeightMatch) bodyHeightMatch = hMatch;

      if (bodyWidthMatch && bodyHeightMatch) break;

      searchIndex = targetIdx + 4;
    }
  }

  const widthMatch = html.match(/width:\s*(\d+)px/i);
  const heightMatch = html.match(/height:\s*(\d+)px/i);

  let width = bodyWidthMatch ? parseInt(bodyWidthMatch[1]) : widthMatch ? parseInt(widthMatch[1]) : 1200;
  let height = bodyHeightMatch ? parseInt(bodyHeightMatch[1]) : heightMatch ? parseInt(heightMatch[1]) : 630;

  width = Math.min(Math.max(width, 100), 3840);
  height = Math.min(Math.max(height, 100), 2160);

  return { width, height };
}

let cachedBrowser = null;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { html } = req.body;

  if (!html || typeof html !== "string") {
    return res.status(400).json({ error: "Missing or invalid HTML content" });
  }

  let context = null;

  try {
    const { width, height } = extractDimensions(html);

    chromiumBinary.setGraphicsMode = false;

    if (!cachedBrowser || !cachedBrowser.isConnected()) {
      const executablePath = await chromiumBinary.executablePath();

      cachedBrowser = await chromium.launch({
        executablePath,
        args: chromiumBinary.args,
        headless: typeof chromiumBinary.headless === 'string' ? true : chromiumBinary.headless !== false,
      });
    }

    const browser = cachedBrowser;
    context = await browser.newContext();

    const page = await context.newPage();

    await waitForPageToRender(page, html);

    const screenshot = await page.screenshot({
      type: "png",
      fullPage: false,
      clip: { x: 0, y: 0, width, height },
    });

    await context.close();
    context = null;

    const base64 = Buffer.from(screenshot).toString("base64");
    return res.status(200).json({
      image: `data:image/png;base64,${base64}`,
      width,
      height,
    });
  } catch (err) {
    if (context) {
      try {
        await context.close();
      } catch (_) {}
    }

    // In case of a fatal error with the browser, clear the cache
    if (cachedBrowser && !cachedBrowser.isConnected()) {
      cachedBrowser = null;
    }

    let errorMessage = err.message || "Unknown rendering error";
    if (err.message?.includes("timeout")) {
      errorMessage = "Timeout: Page took too long to load.";
    } else if (err.message?.includes("net::ERR")) {
      errorMessage = `Network error loading external resource: ${err.message}`;
    }

    return res.status(500).json({ error: errorMessage });
  }
}

export const config = {
  api: {
    bodyParser: { sizeLimit: "6mb" },
  },
};
