import { chromium } from 'playwright-core';
const EXE = '/home/truel/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const browser = await chromium.launch({ executablePath: EXE, headless: true });
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR:', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE:', m.text().slice(0, 300)); });
// 首页
await page.goto('http://localhost:8765/', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(400);
// 搜索岳阳楼记 → 学习页 → 默写 tab
await page.locator('.home-search-box input').fill('岳阳楼记');
await page.waitForTimeout(250);
await page.locator('.article-card').first().click();
await page.waitForTimeout(900);
console.log('URL1:', page.url());
await page.locator('.workspace-tabs a:has-text("默写")').click();
await page.waitForTimeout(900);
console.log('入口卡:', await page.locator('.moxie-entry-card').count());
await page.locator('.moxie-entry-card a').first().click();
await page.waitForTimeout(900);
console.log('URL2:', page.url());
// 判题答错
await page.locator('.mq-reveal').first().click();
await page.waitForTimeout(300);
await page.locator('.mq-judge-btn.bad').first().click();
await page.waitForTimeout(400);
const items = await page.evaluate(() => JSON.parse(localStorage.getItem('wyw_errorbook_v2') || '[]'));
console.log('错题条目:', items.length);
if (items.length) console.log('  qid:', items[0].qid, '| title:', items[0].title, '| type:', items[0].type);
// 去错题页
await page.goto('http://localhost:8765/', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.setItem('wyw_deep_link', '/moxie/errors'));
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
console.log('URL3:', page.url());
console.log('错题分组:', await page.locator('.moxie-err-group').count());
console.log('页面文本:', (await page.locator('body').innerText()).slice(0, 200));
await browser.close();
