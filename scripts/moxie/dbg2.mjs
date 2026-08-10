import { chromium } from 'playwright-core';
const CHROME = '/home/truel/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto('http://localhost:8765/articles/jc-yueyanglouji/learn', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
const info = await page.evaluate(() => {
  const els = [...document.querySelectorAll('.annot-gloss')].slice(0, 5);
  return els.map(e => ({ text: e.textContent.slice(0, 20), cls: e.className, w: e.getBoundingClientRect().width, h: e.getBoundingClientRect().height }));
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
