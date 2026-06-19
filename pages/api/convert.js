import dns from "dns/promises";
import { chromium } from "playwright-core";

// Netlify free plan enforces a hard 10s function timeout. We reserve a safety
// margin for cold start, response serialization, and network overhead, and
// derive remaining budgets dynamically from a single shared clock.
const TOTAL_FUNCTION_BUDGET_MS = 9_000; // stay under Netlify's 10s hard kill
const SAFETY_MARGIN_MS = 500; // reserve for serialization/response overhead

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

const dnsCache = new Map();
const MAX_DNS_CACHE_SIZE = 1000;

async function safeDnsLookup(hostname, timeoutMs = 5000) {
  if (dnsCache.has(hostname)) {
    return dnsCache.get(hostname);
  }
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('DNS lookup timeout')), timeoutMs);
  });
  try {
    const result = await Promise.race([
      dns.lookup(hostname),
      timeoutPromise
    ]);
    if (dnsCache.size >= MAX_DNS_CACHE_SIZE) {
      const firstKey = dnsCache.keys().next().value;
      dnsCache.delete(firstKey);
    }
    dnsCache.set(hostname, result);
    return result;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function waitForPageToRender(page, html, budgetMs) {
  // Reserve roughly 70% of remaining budget for initial load,
  // 30% for networkidle, with sane minimums for both.
  const setContentTimeout = Math.max(1_500, Math.floor(budgetMs * 0.7));
  const networkIdleTimeout = Math.max(800, Math.floor(budgetMs * 0.3));

  await page.setContent(html, {
    waitUntil: "load",
    timeout: setContentTimeout,
  });
  await page.waitForLoadState("networkidle", { timeout: networkIdleTimeout }).catch(() => {});
}

function extractDimensions(html) {
  const bodyWidthMatch = html.match(/(?:body|html)[^{]{0,4096}\{[^}]{0,4096}width:\s*(\d+)px/i);
  const bodyHeightMatch = html.match(/(?:body|html)[^{]{0,4096}\{[^}]{0,4096}height:\s*(\d+)px/i);
  const widthMatch = html.match(/width:\s*(\d+)px/i);
  const heightMatch = html.match(/height:\s*(\d+)px/i);

  let width = parseInt(bodyWidthMatch?.[1] ?? widthMatch?.[1] ?? "1200", 10);
  let height = parseInt(bodyHeightMatch?.[1] ?? heightMatch?.[1] ?? "630", 10);

  // Netlify/Lambda enforces a hard 6MB response payload limit. Base64 encoding
  // adds ~33% overhead on top of the raw PNG, and the JSON wrapper adds a bit
  // more. Capping at 1920x1080 keeps worst-case dense screenshots well under
  // that ceiling while still covering common OG-image and social-card sizes.
  width = Math.min(Math.max(width, 100), 1920);
  height = Math.min(Math.max(height, 100), 1080);

  return { width, height };
}

let cachedBrowser = null;
let cachedExecutablePath = null;
let browserLaunchCount = 0;
const MAX_BROWSER_LAUNCHES = 5;

export default async function handler(req, res) {
  const requestStartTime = Date.now();

  function remainingBudget() {
    const elapsed = Date.now() - requestStartTime;
    return Math.max(0, TOTAL_FUNCTION_BUDGET_MS - SAFETY_MARGIN_MS - elapsed);
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { html } = req.body;

  // Note: if the request body exceeds the 4mb bodyParser limit above, Next.js
  // will reject the request before this handler runs, returning its own
  // "API resolved without sending a response" or 413-style error rather than
  // the custom 400 below. This is expected Next.js behavior, not a bug here.
  if (!html || typeof html !== "string") {
    return res.status(400).json({ error: "Missing or invalid HTML content" });
  }

  let context = null;

  try {
    if (process.env.VERCEL || process.env.NETLIFY || process.env.AWS_REGION || process.env.AWS_EXECUTION_ENV) {
      // Netlify and other serverless platforms run on AWS Lambda under the hood. @sparticuz/chromium checks AWS_LAMBDA_JS_RUNTIME to resolve native dependencies. Set it before executablePath() is called if not already defined.
      if (!process.env.AWS_LAMBDA_JS_RUNTIME) {
        const match = process.version.match(/^v(\d+)/);
        if (match && parseInt(match[1], 10) >= 20) {
          process.env.AWS_LAMBDA_JS_RUNTIME = "nodejs20.x";
        } else {
          process.env.AWS_LAMBDA_JS_RUNTIME = "nodejs18.x";
        }
      }
    }

    // Dynamically import to ensure AWS_LAMBDA_JS_RUNTIME is set before module evaluation
    const chromiumBinary = (await import("@sparticuz/chromium")).default;

    if (remainingBudget() < 2_000) {
      return res.status(503).json({
        error: "Server is too busy to process this request right now. Please try again."
      });
    }

    const { width, height } = extractDimensions(html);

    chromiumBinary.setGraphicsMode = false;

    let browser = cachedBrowser;
    let launchNeeded = !browser || !browser.isConnected();

    if (!launchNeeded) {
      try {
        context = await browser.newContext({ javaScriptEnabled: false });
      } catch (err) {
        console.warn("Cached browser failed to create context, relaunching...", err);
        try { await browser.close(); } catch (_) {}
        cachedBrowser = null;
        launchNeeded = true;
      }
    }

    if (launchNeeded) {
      const executablePath = process.env.CHROMIUM_EXECUTABLE_PATH
        || (cachedExecutablePath ?? (cachedExecutablePath = await chromiumBinary.executablePath()));
      const args = [
        ...chromiumBinary.args.filter(
          (arg) => arg !== "--single-process" && arg !== "--in-process-gpu"
        ),
        "--no-zygote",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--single-process",
      ];

      cachedBrowser = await chromium.launch({
        executablePath,
        args,
        headless: typeof chromiumBinary.headless === 'string' ? true : chromiumBinary.headless !== false,
      });
      browserLaunchCount++;
      if (browserLaunchCount >= MAX_BROWSER_LAUNCHES) {
        browserLaunchCount = 0;
        cachedExecutablePath = null;
      }
      browser = cachedBrowser;
      context = await browser.newContext({ javaScriptEnabled: false });
    }

    const budgetForRender = remainingBudget();
    context.setDefaultTimeout(budgetForRender);
    const page = await context.newPage();

    await page.route("**/*", async (route) => {
      let request;
      try {
        request = route.request();
      } catch (_) {
        return;
      }
      let url;
      try {
        url = new URL(request.url());
      } catch (e) {
        try {
          await route.abort("blockedbyclient");
        } catch (_) {}
        return;
      }

      if (url.protocol === "http:" || url.protocol === "https:") {
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

    await waitForPageToRender(page, html, remainingBudget());

    let screenshot;
    try {
      screenshot = await page.screenshot({
        type: "png",
        fullPage: false,
        clip: { x: 0, y: 0, width, height },
      });
    } finally {
      await context.close().catch(() => {});
      context = null;
    }

    const base64 = Buffer.from(screenshot).toString("base64");
    const payloadSizeBytes = Buffer.byteLength(base64, "utf8");
    const MAX_RESPONSE_BYTES = 5_500_000; // stay safely under Lambda's 6MB hard limit

    if (payloadSizeBytes > MAX_RESPONSE_BYTES) {
      return res.status(413).json({
        error: "Rendered image is too large to return. Try reducing the output dimensions or simplifying the page content.",
      });
    }

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
        if (!cachedBrowser.isConnected()) {
          await cachedBrowser.close().catch(() => {});
          cachedBrowser = null;
        }
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
    // Netlify/Lambda has a hard 6MB total request payload limit including
    // headers and routing overhead. Capping the parsed JSON body well below
    // that ensures legitimate requests aren't rejected at the gateway level
    // before they even reach this handler.
    bodyParser: { sizeLimit: "4mb" },
  },
};
