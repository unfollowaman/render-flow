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

async function safeDnsLookup(hostname, timeoutMs = 5000) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('DNS lookup timeout')), timeoutMs);
  });
  try {
    const result = await Promise.race([
      dns.lookup(hostname),
      timeoutPromise
    ]);
    return result;
  } finally {
    clearTimeout(timeoutId);
  }
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

if (process.env.VERCEL) {
  // @sparticuz/chromium checks this environment variable to determine if it should
  // extract the AWS Lambda native dependencies (libnss3.so, libnspr4.so, etc.).
  // Vercel serverless functions are AWS Lambda functions under the hood, but don't
  // necessarily expose these variables automatically.
  // We need to set it *before* importing/using the module heavily, or at least before executablePath().
  const match = process.version.match(/^v(\d+)/);
  if (match && parseInt(match[1], 10) >= 20) {
    process.env.AWS_LAMBDA_JS_RUNTIME = "nodejs20.x";
  } else {
    process.env.AWS_LAMBDA_JS_RUNTIME = "nodejs18.x";
  }
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
      const args = chromiumBinary.args.filter(
        (arg) => arg !== "--single-process" && arg !== "--in-process-gpu"
      );

      cachedBrowser = await chromium.launch({
        executablePath,
        args,
        headless: typeof chromiumBinary.headless === 'string' ? true : chromiumBinary.headless !== false,
      });
    }

    const browser = cachedBrowser;
    context = await browser.newContext({ javaScriptEnabled: false });

    context.setDefaultTimeout(RENDER_TIMEOUT_MS);
    const page = await context.newPage();

    await page.route("**/*", async (route) => {
      const request = route.request();
      let url;
      try {
        url = new URL(request.url());
      } catch (e) {
        try {
          await route.abort("blockedbyclient");
        } catch (_) {}
        return;
      }

      if (["http:", "https:"].includes(url.protocol)) {
        try {
          const lookup = await safeDnsLookup(url.hostname, 5000);
          if (isForbiddenIP(lookup.address)) {
            try {
              await route.abort("accessdenied");
            } catch (_) {}
            return;
          }
        } catch (err) {
          try {
            await route.abort("name_not_resolved");
          } catch (_) {}
            return;
        }
      } else if (url.protocol !== "data:") {
        try {
          await route.abort("accessdenied");
        } catch (_) {}
        return;
      }

      try {
        await route.continue();
      } catch (_) {}
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
    console.error("Conversion error:", err);

    if (context) {
      try {
        await context.close();
      } catch (_) {}
      context = null;
    }

    if (cachedBrowser) {
      try {
        if (!cachedBrowser.isConnected()) cachedBrowser = null;
      } catch (_) {
        cachedBrowser = null;
      }
    }

    let errorMessage = "An internal server error occurred.";
    if (err.message?.includes("timeout")) {
      errorMessage = "Timeout: Page took too long to load.";
    } else if (err.message?.includes("net::ERR")) {
      errorMessage = "Network error loading external resource.";
    }

    return res.status(500).json({ error: errorMessage });
  }
}

export const config = {
  api: {
    bodyParser: { sizeLimit: "6mb" },
  },
};
