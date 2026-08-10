import { chromium } from 'playwright-core';
const CHROME = '/home/truel/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('console', async m => {
  if (m.text().includes('unique "key"')) {
    for (const a of m.args()) {
      const v = await a.jsonValue().catch(() => '<<unserializable>>');
      console.log('ARG:', JSON.stringify(v).slice(0, 500));
    }
  }
});
await page.goto('http://localhost:8765/moxie/moxie-%E8%A7%82%E6%B2%A7%E6%B5%B7', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await browser.close();
