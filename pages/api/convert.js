import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

chromium.setGraphicsMode = false;

// Extract width/height from HTML content
function extractDimensions(html) {
  const widthMatch =
    html.match(/width:\s*(\d+)px/i) ||
    html.match(/width['":\s]+(\d+)/i) ||
    html.match(/<meta[^>]+viewport[^>]+width=(\d+)/i);
  const heightMatch =
    html.match(/height:\s*(\d+)px/i) ||
    html.match(/height['":\s]+(\d+)/i);

  // Try to find explicit body/html dimensions
  const bodyWidthMatch = html.match(
    /(?:body|html)[^{]*\{[^}]*width:\s*(\d+)px/i
  );
  const bodyHeightMatch = html.match(
    /(?:body|html)[^{]*\{[^}]*height:\s*(\d+)px/i
  );

  let width = 1200;
  let height = 630;

  if (bodyWidthMatch) width = parseInt(bodyWidthMatch[1]);
  else if (widthMatch) width = parseInt(widthMatch[1]);

  if (bodyHeightMatch) height = parseInt(bodyHeightMatch[1]);
  else if (heightMatch) height = parseInt(heightMatch[1]);

  // Clamp to sane values
  width = Math.min(Math.max(width, 100), 3840);
  height = Math.min(Math.max(height, 100), 2160);

  return { width, height };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { html } = req.body;

  if (!html || typeof html !== "string") {
    return res.status(400).json({ error: "Missing or invalid HTML content" });
  }

  if (html.length > 5_000_000) {
    return res
      .status(413)
      .json({ error: "HTML content too large (max 5MB)" });
  }

  let browser = null;

  try {
    const { width, height } = extractDimensions(html);

    const isLocal = process.env.NODE_ENV === "development";

    browser = await puppeteer.launch({
  args: chromium.args,
  executablePath: await chromium.executablePath(),
  headless: chromium.headless,
  defaultViewport: {
    width: width,
    height: height,
  },
});

    const page = await browser.newPage();

    // Disable JavaScript execution inside the rendered HTML
    await page.setJavaScriptEnabled(false);

    // Set viewport based on extracted or default dimensions
    await page.setViewport({
      width,
      height,
      deviceScaleFactor: 1,
    });

    // Set a realistic user agent
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Allow external resources (Google Fonts, CDN assets, etc.)
    await page.setRequestInterception(false);

    // Load HTML content and wait for all network requests to settle
    await page.setContent(html, {
      waitUntil: ["load", "networkidle0"],
      timeout: 45000,
    });

    // Extra wait for fonts/images to render
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Capture screenshot
    const screenshotBuffer = await page.screenshot({
      type: "png",
      fullPage: false,
      clip: {
        x: 0,
        y: 0,
        width,
        height,
      },
    });

    await browser.close();
    browser = null;

    // Return PNG as base64
    const base64 = Buffer.from(screenshotBuffer).toString("base64");

    return res.status(200).json({
      image: `data:image/png;base64,${base64}`,
      width,
      height,
    });
  } catch (err) {
    if (browser) {
      try {
        await browser.close();
      } catch (_) {}
    }

    console.error("Conversion error:", err);

    let errorMessage = "Rendering failed";
    if (err.message?.includes("timeout")) {
      errorMessage =
        "Timeout: Page took too long to load. Check external resource URLs.";
    } else if (err.message?.includes("net::ERR")) {
      errorMessage = `Network error loading external resource: ${err.message}`;
    } else if (err.message?.includes("Navigation")) {
      errorMessage = "Failed to navigate to content. Check your HTML syntax.";
    } else {
      errorMessage = err.message || "Unknown rendering error";
    }

    return res.status(500).json({ error: errorMessage });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "6mb",
    },
  },
};

