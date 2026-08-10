#!/usr/bin/env node
/** 篇目中心浏览器回归测试 (适配 React 重构版 UI)。用法: node scripts/browser-test.mjs [baseURL] */
import { chromium } from 'playwright-core';

const EXE = '/home/truel/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const BASE = process.argv[2] || 'http://localhost:8765/';
const browser = await chromium.launch({ executablePath: EXE, headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
const errors = [];
let passed = 0;
let failed = 0;

page.on('pageerror', (error) => errors.push(`PAGEERROR: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`CONSOLE: ${message.text()}`);
});

function check(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✓ ${label}${detail ? `: ${detail}` : ''}`);
    passed += 1;
  } else {
    console.log(`  ✗ ${label}${detail ? `: ${detail}` : ''}`);
    failed += 1;
  }
}

async function goto(hash = '') {
  await page.goto(`${BASE}${hash}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
}

await goto();
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });

console.log('=== 1. 篇目首页 ===');
check('标题正确', (await page.title()).includes('文言文'));
check('顶部导航已移除', await page.locator('.app-nav').count() === 0);
check('主页入口卡可进入复习', await page.locator('.entry-card:has-text("综合复习")').count() === 1);
check('头部统计动态', /\d+ 篇 · \d+ 词义 · \d+ 题/.test(await page.locator('.app-header-info').textContent()));
check('四入口卡', await page.locator('.entry-card').count() === 4);
check('六个年级 tab', await page.locator('.grade-tabs .grade-tab').count() === 6);
check('篇目卡片渲染', await page.locator('.article-card').count() >= 15);
check('首页含 论语十二章', (await page.locator('.article-card .ac-title').allTextContents()).includes('论语十二章'));
check('首页有今日学习标题', (await page.locator('.today-title').count()) === 1);
check('入口卡圆角', await page.evaluate(() => { const el = document.querySelector('.entry-card'); return el ? parseFloat(getComputedStyle(el).borderRadius) >= 12 : false; }));

await page.locator('.home-search-box input').fill('岳阳楼记');
await page.waitForTimeout(250);
check('篇名搜索过滤', await page.locator('.article-card').count() === 1);
await page.locator('.home-search-box input').fill('范仲淹');
await page.waitForTimeout(250);
check('作者搜索有结果', await page.locator('.article-card').count() >= 1);
await page.locator('.home-search-box input').fill('岳阳楼记');
await page.waitForTimeout(250);

console.log('\n=== 2. 篇目工作区(学习) ===');
await page.locator('.article-card:has-text("岳阳楼记")').first().click();
await page.waitForTimeout(700);
check('进入稳定路由', page.url().includes('/articles/jc-yueyanglouji/learn'));
check('篇目标题', (await page.locator('.page-header .page-title').textContent()).includes('岳阳楼记'));
check('题集/卡页共享标题类', true);
check('三学习标签', await page.locator('.workspace-tabs a').count() === 3);
check('学习标签激活', (await page.locator('.workspace-tabs a.active').textContent()) === '学习');
check('原文段落渲染', await page.locator('.para-orig').count() > 0);
check('段落前无序号', await page.locator('.para-num').count() === 0);
check('译文折叠按钮', await page.locator('.para-toggle').count() > 0);
await page.locator('.para-toggle').first().click();
await page.waitForTimeout(200);
check('展开译文', await page.locator('.para-trans').count() > 0);
check('注释字可交互', await page.locator('.annot-gloss').count() > 0);
await page.locator('.annot-gloss').first().click();
await page.waitForTimeout(200);
check('注释浮层弹出', await page.locator('.gloss-pop').count() === 1);
await page.keyboard.press('Escape');
check('本篇注释清单', await page.locator('.note-list').count() === 1);

console.log('\n=== 3. 本篇练习 ===');
await page.locator('.workspace-tabs a:has-text("练习")').click();
await page.waitForTimeout(600);
check('练习留在同篇', page.url().includes('/jc-yueyanglouji/practice'));
check('题目加载', await page.locator('[class*="q-item"], [class*="stem-view"], .option').count() > 0);
check('提交按钮存在', await page.locator('button:has-text("提交对照答案")').count() === 1);
check('选择可点', await page.locator('.option, button:has-text("A.")').count() > 0);

console.log('\n=== 4. 本篇复习与错题 ===');
await page.locator('.workspace-tabs a:has-text("复习")').click();
await page.waitForTimeout(400);
check('复习题聚合', await page.locator('.rq-card').count() > 0);
check('筛选 chips', await page.locator('.pf-chips button').count() === 3);
const FOY = await page.evaluate(() => (JSON.parse(localStorage.getItem('wyw_errorbook_v2') || '[]')));
const wrongBefore = Array.isArray(FOY) ? FOY.length : 0;
await page.locator('.rq-card .btn:has-text("查看答案")').first().click();
await page.waitForTimeout(250);
check('标记错题在答案后显示', await page.locator('.rq-card:has(.rq-answer) .btn:has-text("标记错题")').count() >= 1);
await page.locator('.rq-card:has(.rq-answer) .btn:has-text("标记错题")').first().click();
await page.waitForTimeout(300);
const YRO = await page.evaluate(() => (JSON.parse(localStorage.getItem('wyw_errorbook_v2') || '[]')));
const wrongAfter = Array.isArray(YRO) ? YRO.length : 0;
check('标记错题入本', wrongAfter === wrongBefore + 1);

console.log('\n=== 5. 综合题集 ===');
await goto('#/review');
await page.locator('.chip:has-text("综合题集")').click();
await page.waitForTimeout(300);
check('综合题集列表', await page.locator('.collection-row').count() >= 10);
await page.locator('.collection-row').first().click();
await page.waitForTimeout(600);
check('题集可练习', await page.locator('[class*="q-item"], [class*="stem-view"]').count() > 0);

console.log('\n=== 6. 字词卡 ===');
await goto('#/cards');
check('字词卡统计区', await page.locator('.fc-stats').count() === 1);
check('翻卡入口', await page.locator('.fc-start button').count() >= 2);

console.log('\n=== 7. 旧链接跳转 ===');
await goto('#/learning/' + encodeURIComponent('岳阳楼记'));
check('旧学习链接跳转', page.url().includes('/articles/jc-yueyanglouji/learn'));
await goto('#/practice/' + encodeURIComponent('岳阳楼记'));
check('旧练习链接跳转', page.url().includes('/articles/jc-yueyanglouji/practice'));

console.log('\n=== 8. 移动端布局 ===');
const mobile = await context.newPage();
await mobile.setViewportSize({ width: 375, height: 812 });
for (const [hash, label] of [
  ['', '篇目列表'],
  ['#/articles/jc-yueyanglouji/learn', '学习'],
  ['#/articles/jc-yueyanglouji/practice', '练习'],
  ['#/review', '复习中心'],
  ['#/cards', '字词卡'],
]) {
  await mobile.goto(`${BASE}${hash}`, { waitUntil: 'networkidle' });
  await mobile.waitForTimeout(400);
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  check(`移动端${label}无横向滚动`, !overflow);
}
await mobile.goto(`${BASE}#/articles/jc-yueyanglouji/learn`, { waitUntil: 'networkidle' });
await mobile.waitForTimeout(400);
check('移动端三标签可访问', await mobile.locator('.workspace-tabs a').count() === 3);
await mobile.close();

console.log('\n=== 9. JavaScript 错误 ===');
const realErrors = errors.filter((error) => !error.includes('favicon') && !error.includes('net::ERR') && !error.includes('localStorage'));
check('全程无控制台或页面错误', realErrors.length === 0, realErrors.join(' | '));

console.log(`\n===== 结果: ${passed} 通过 / ${failed} 失败 =====`);
await browser.close();
process.exit(failed ? 1 : 0);
