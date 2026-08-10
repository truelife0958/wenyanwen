import { chromium } from 'playwright-core';
const CHROME = '/home/truel/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') console.log('[' + m.type() + ']', m.text().slice(0, 600)); });
// 逐个页面触发
for (const url of ['/', '/moxie', '/moxie/moxie-%E8%A7%82%E6%B2%A7%E6%B5%B7', '/articles/jc-yueyanglouji/moxie', '/moxie/errors']) {
  await page.goto('http://localhost:8765' + url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  if (url.includes('moxie-%E8%A7%82')) {
    await page.locator('.mq-reveal').first().click().catch(() => {});
    await page.waitForTimeout(300);
  }
  console.log('---', url);
}
await browser.close();
