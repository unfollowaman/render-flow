import { chromium } from 'playwright';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const devServer = spawn('pnpm', ['dev'], { stdio: 'pipe' });

await new Promise(resolve => setTimeout(resolve, 3000));

try {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 960 },
    recordVideo: { dir: '/home/jules/verification/videos/' }
  });
  const page = await context.newPage();

  await page.goto('http://localhost:5173/');

  // Switch to Notes mode
  await page.click('button:has-text("Notes Mode")');
  await page.waitForTimeout(500);

  // Click Generate
  await page.click('button:has-text("Generate")');
  await page.waitForTimeout(1000);

  const screenshotPath = '/home/jules/verification/screenshots/final_notes_verification.png';
  fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
  await page.screenshot({ path: screenshotPath, fullPage: true });

  await browser.close();
  console.log('Playwright verification screenshot saved to', screenshotPath);
} catch (e) {
  console.error('Playwright verification error:', e);
} finally {
  devServer.kill();
  try {
    const { execSync } = await import('child_process');
    execSync('kill $(lsof -t -i :5173) 2>/dev/null || true');
  } catch {}
}
