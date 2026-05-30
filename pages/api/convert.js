import dns from "dns/promises";
import { chromium } from "playwright-core";
import chromiumBinary from "@sparticuz/chromium";

const RENDER_TIMEOUT_MS = 45_000;

function isForbiddenIP(ip) {
  if (!ip) return false;
  if (ip.startsWith("127.")) return true;
  if (ip.startsWith("10.")) return true;
  if (ip.startsWith("192.168.")) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return true;
  if (ip.startsWith("169.254.")) return true;
  if (ip === "::1") return true;
  if (ip.toLowerCase().startsWith("fc")) return true; // fc00::/7 (fc00... to fd...)
  if (ip.toLowerCase().startsWith("fd")) return true;
  if (ip.toLowerCase().startsWith("fe80")) return true;
  if (ip === "0.0.0.0" || ip === "::") return true;
  if (ip.toLowerCase().startsWith("::ffff:")) {
    const ipv4 = ip.split(":").pop();
    return isForbiddenIP(ipv4);
  }
  return false;
}


async function waitForPageToRender(page, html) {
  await page.setContent(html, {
    waitUntil: "load",
    timeout: RENDER_TIMEOUT_MS,
  });
  await page.waitForLoadState("networkidle", { timeout: RENDER_TIMEOUT_MS });
}

function extractDimensions(html) {
  const bodyWidthMatch = html.match(/(?:body|html)[^{]{0,4096}\{[^}]{0,4096}width:\s*(\d+)px/i);
  const bodyHeightMatch = html.match(/(?:body|html)[^{]{0,4096}\{[^}]{0,4096}height:\s*(\d+)px/i);
  const widthMatch = html.match(/width:\s*(\d+)px/i);
  const heightMatch = html.match(/height:\s*(\d+)px/i);

  let width = parseInt(bodyWidthMatch?.[1] ?? widthMatch?.[1] ?? "1200", 10);
  let height = parseInt(bodyHeightMatch?.[1] ?? heightMatch?.[1] ?? "630", 10);

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
    context = await browser.newContext({ javaScriptEnabled: false });


    const page = await context.newPage();

    await page.route("**/*", async (route) => {
      const request = route.request();
      let url;
      try {
        url = new URL(request.url());
      } catch (e) {
        return route.abort("blockedbyclient");
      }

      if (["http:", "https:"].includes(url.protocol)) {
        try {
          const lookup = await dns.lookup(url.hostname);
          if (isForbiddenIP(lookup.address)) {
            return route.abort("accessdenied");
          }
        } catch (err) {
          return route.abort("name_not_resolved");
        }
      } else if (url.protocol !== "data:") {
        return route.abort("accessdenied");
      }

      route.continue();
    });


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
