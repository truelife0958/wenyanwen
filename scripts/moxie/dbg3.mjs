import { chromium } from 'playwright-core';
const CHROME = '/home/truel/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto('http://localhost:8765/articles/jc-yueyanglouji/learn', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
const info = await page.evaluate(() => {
  const el = document.querySelector('.annot-gloss');
  const cs = getComputedStyle(el);
  const orig = document.querySelector('.para-orig');
  const cs2 = orig ? getComputedStyle(orig) : null;
  return {
    gloss: { fontSize: cs.fontSize, lineHeight: cs.lineHeight, display: cs.display, color: cs.color },
    paraOrig: cs2 ? { fontSize: cs2.fontSize, lineHeight: cs2.lineHeight } : null,
    readerScale: orig ? orig.closest('.article-body')?.style.getPropertyValue('--reader-scale') : null,
    fSizeMd: getComputedStyle(document.documentElement).getPropertyValue('--f-size-md'),
  };
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
