import { chromium } from 'playwright-core';
const EXE = '/home/truel/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const browser = await chromium.launch({ executablePath: EXE, headless: true });
const page = await browser.newPage();
page.on('response', (r) => { if (r.status() >= 400) console.log('HTTP', r.status(), r.url()); });
await page.goto('http://localhost:8765/articles/jc-yueyanglouji/appreciate', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
console.log('URL:', page.url());
await browser.close();
