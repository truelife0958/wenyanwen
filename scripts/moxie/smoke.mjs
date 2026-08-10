import { chromium } from 'playwright-core';
const CHROME = '/home/truel/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.split('\n')[0]));
page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text().split('\n')[0]); });

// 首页
await page.goto('http://localhost:8765/', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
console.log('首页标题:', await page.title());
console.log('TabBar:', await page.locator('.tab-item').allTextContents());
console.log('今日任务:', (await page.locator('.today-tasks').textContent())?.replace(/\s+/g,' ').trim().slice(0, 80));

// 默写页
await page.goto('http://localhost:8765/moxie', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
console.log('默写统计:', (await page.locator('.moxie-head').textContent())?.replace(/\s+/g,' ').trim().slice(0, 60));
const cards = await page.locator('.moxie-card').count();
console.log('默写篇目卡:', cards);

// 进入第一篇
if (cards > 0) {
  await page.locator('.moxie-card').first().click();
  await page.waitForTimeout(800);
  console.log('篇目页 URL:', page.url());
  const tabs = await page.locator('.workspace-tabs button').allTextContents();
  console.log('题型 tabs:', tabs.join(' | '));
  const qs = await page.locator('.moxie-q').count();
  console.log('题卡数:', qs);
  if (qs > 0) {
    await page.locator('.mq-reveal').first().click();
    await page.waitForTimeout(300);
    console.log('答案区:', await page.locator('.mq-answer').count());
    await page.locator('.mq-judge-btn.ok').first().click();
    await page.waitForTimeout(300);
    console.log('自评通过:', await page.locator('.moxie-q.ok').count());
  }
}
// 错题本
await page.goto('http://localhost:8765/moxie/errors', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
console.log('错题本:', (await page.locator('.moxie-errors').textContent())?.replace(/\s+/g,' ').trim().slice(0, 50));

// 学习页联动
await page.goto('http://localhost:8765/articles/jc-yueyanglouji/moxie', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
console.log('学习页默写tab:', (await page.locator('.moxie-entry-card').textContent())?.replace(/\s+/g,' ').trim().slice(0, 60));

console.log('JS错误:', errs.length ? errs.slice(0, 4) : '无');
await browser.close();
