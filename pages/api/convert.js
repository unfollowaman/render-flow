import { chromium } from "playwright-core";
import chromiumBinary from "@sparticuz/chromium";

function extractDimensions(html) {
  const bodyWidthMatch = html.match(/(?:body|html)[^{]*\{[^}]*width:\s*(\d+)px/i);
  const bodyHeightMatch = html.match(/(?:body|html)[^{]*\{[^}]*height:\s*(\d+)px/i);
  const widthMatch = html.match(/width:\s*(\d+)px/i);
  const heightMatch = html.match(/height:\s*(\d+)px/i);

  let width = bodyWidthMatch ? parseInt(bodyWidthMatch[1]) : widthMatch ? parseInt(widthMatch[1]) : 1200;
  let height = bodyHeightMatch ? parseInt(bodyHeightMatch[1]) : heightMatch ? parseInt(heightMatch[1]) : 630;

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

  let browser = null;

  try {
    const { width, height } = extractDimensions(html);
    chromiumBinary.setGraphicsMode = false;
    const executablePath = await chromiumBinary.executablePath();

    browser = await chromium.launch({
      executablePath,
      args: chromiumBinary.args,
      headless: chromiumBinary.headless,
    });

    const page = await browser.newPage();
    await page.setViewportSize({ width, height });
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
    );

    await page.setContent(html, {
      waitUntil: "load",
      timeout: 45000,
    });
    await page.waitForLoadState("networkidle", { timeout: 45000 });

    await new Promise((r) => setTimeout(r, 800));

    const screenshot = await page.screenshot({
      type: "png",
      fullPage: false,
      clip: { x: 0, y: 0, width, height },
    });

    await browser.close();
    browser = null;

    const base64 = Buffer.from(screenshot).toString("base64");
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
