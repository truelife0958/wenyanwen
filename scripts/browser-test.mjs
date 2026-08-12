#!/usr/bin/env node
/** 篇目中心浏览器回归测试 (匹配当前五标签工作区 UI)。
 *  覆盖: 首页(搜索/年级tab/推荐/任务) → 篇目五标签(学习/鉴赏/考点/注释/默写)
 *  → 默写模块 → 错题本 → 旧路由 → 移动端无溢出。
 *  用法: node scripts/browser-test.mjs [baseURL] */
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
  const url = hash.startsWith('http') ? hash : `${BASE.replace(/\/$/, '')}${hash}`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(450);
}

await goto();
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });

console.log('=== 1. 篇目首页 ===');
check('标题正确', (await page.title()).includes('文言文'));
check('顶部导航已移除', await page.locator('.app-nav').count() === 0);
check('头部统计动态', /\d+ 篇课文 · \d+ 篇默写/.test(await page.locator('.app-header-info').textContent()));
check('今日学习标题', await page.locator('.today-title').count() === 1);
check('今日推荐卡 1 张', await page.locator('.today-recommend .rec-card').count() === 1);
check('今日任务 2 项', await page.locator('.today-tasks .task-item').count() === 2);
check('快捷入口已移除', await page.locator('.home-entry-grid').count() === 0);
check('六个年级 tab', await page.locator('.grade-tabs .grade-tab').count() === 6);
check('篇目卡片渲染', await page.locator('.article-card').count() >= 15);
check('首页含 论语十二章', (await page.locator('.article-card .ac-title').allTextContents()).includes('论语十二章'));
check('必考徽章存在', await page.locator('.ac-badge:has-text("中考必考")').count() >= 1);
check('今日推荐卡圆角', await page.evaluate(() => { const el = document.querySelector('.rec-card'); return el ? parseFloat(getComputedStyle(el).borderRadius) >= 12 : false; }));

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
check('五个学习标签', await page.locator('.workspace-tabs a').count() === 5);
check('学习标签激活', (await page.locator('.workspace-tabs a.active').textContent()) === '学习');
check('原文段落渲染', await page.locator('.para-orig').count() > 0);
check('段落前无序号', await page.locator('.para-num').count() === 0);
check('译文折叠按钮', await page.locator('.para-toggle').count() > 0);
await page.locator('.para-toggle').first().click();
await page.waitForTimeout(200);
check('展开译文', await page.locator('.para-trans').count() > 0);
check('赏析按钮存在', await page.locator('.ana-toggle').count() > 0);
await page.locator('.ana-toggle').first().click();
await page.waitForTimeout(200);
check('赏析展开', await page.locator('.para-analysis').count() > 0);
check('注释字可交互', await page.locator('.annot-gloss').count() > 0);
check('注释角标存在', await page.locator('.annot-no').count() >= 1);
await page.locator('.annot-gloss').first().click();
await page.waitForTimeout(200);
check('注释浮层弹出', await page.locator('.gloss-pop').count() === 1);
await page.keyboard.press('Escape');
check('朗读按钮存在', await page.locator('.read-btn').count() >= 1);
check('朗读设置 3 件', await page.locator('.read-tools .rt-btn').count() === 3);
await page.locator('.read-tools .rt-btn').first().click();
await page.waitForTimeout(150);
check('语速循环切换', (await page.locator('.read-tools .rt-btn').first().textContent()).includes('语速'));
check('背诵星标存在', await page.locator('.recite-star').count() >= 1);
await page.locator('.recite-star').first().click();
await page.waitForTimeout(250);
check('背诵引导弹窗', await page.locator('.recite-guide').count() === 1);
await page.locator('.rg-close').click();

console.log('\n=== 3. 鉴赏/考点/注释/默写 四标签 ===');
await page.locator('.workspace-tabs a:has-text("鉴赏")').click();
await page.waitForTimeout(500);
check('鉴赏路由', page.url().includes('/appreciate'));
check('整篇鉴赏卡片', await page.locator('.appr-whole .appr-para').count() > 0);
await page.locator('.workspace-tabs a:has-text("考点")').click();
await page.waitForTimeout(500);
check('考点路由', page.url().includes('/exam'));
check('考点卡渲染', await page.locator('.exam-tab .appr-para').count() > 0);
check('重点/难点徽章', (await page.locator('.ep-level').count()) >= 1);
await page.locator('.workspace-tabs a:has-text("注释")').click();
await page.waitForTimeout(500);
check('注释路由', page.url().includes('/notes'));
check('注释卡渲染', await page.locator('.notes-tab .appr-para').count() > 0);
check('注释序号', await page.locator('.notes-tab .annot-no').count() >= 1);
await page.locator('.workspace-tabs a:has-text("默写")').click();
await page.waitForTimeout(500);
check('默写路由', page.url().includes('/moxie'));
check('默写入口卡', await page.locator('.moxie-entry-card').count() === 1);

console.log('\n=== 4. 默写模块 ===');
await page.locator('.moxie-entry-card a').first().click();
await page.waitForTimeout(700);
check('进入默写篇目页', page.url().includes('/moxie/'));
check('题型 tab >= 4', await page.locator('.workspace-tabs button').count() >= 4);
check('题卡加载', await page.locator('.moxie-q').count() > 0);
const blanks = await page.locator('.moxie-blank-input').count();
check('输入横线渲染', blanks >= 1, `输入框 ${blanks} 个`);
for (let i = 0; i < blanks; i++) await page.locator('.moxie-blank-input').nth(i).fill('答错占位');
await page.locator('.mq-reveal').first().click();
await page.waitForTimeout(300);
check('自动判分展示', await page.locator('.mq-check-result.bad').count() >= 1);
check('答错状态', await page.locator('.moxie-q.bad').count() >= 1);

console.log('\n=== 5. 默写错题本 ===');
await goto('/moxie/errors');
check('错题页渲染', await page.locator('.moxie-err-group, .empty-state').count() >= 1);
const errCount = await page.evaluate(() => (JSON.parse(localStorage.getItem('wyw_errorbook_v2') || '[]')).length);
if (errCount > 0) {
  check('错题分组显示', await page.locator('.meg-item').count() > 0);
  const before = await page.evaluate(() => (JSON.parse(localStorage.getItem('wyw_errorbook_v2') || '[]')).length);
  await page.locator('.meg-remove').first().click();
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => (JSON.parse(localStorage.getItem('wyw_errorbook_v2') || '[]')).length);
  check('移除错题', after < before, `${before} → ${after}`);
} else {
  check('错题分组显示(空态)', await page.locator('.empty-state').count() === 1);
}

console.log('\n=== 6. 默写列表 ===');
await goto('/moxie');
check('默写篇目卡', await page.locator('.moxie-card').count() >= 10);
check('年级 tab', await page.locator('.grade-tab').count() >= 3);
check('统计区', await page.locator('.moxie-stats .moxie-stat').count() === 4);

console.log('\n=== 7. 旧路由与深链 ===');
await goto('/learning/' + encodeURIComponent('岳阳楼记'));
check('旧学习链接跳转', page.url().includes('/articles/jc-yueyanglouji/learn'));
await goto('/review');
check('/review 回首页', page.url().endsWith('/') || page.url().includes('/articles') === false && page.url().includes('/moxie') === false);
await goto('/cards');
check('/cards 回首页', !page.url().includes('/cards'));
await goto('/map');
check('闯关地图可渲染', await page.locator('.gx-world').count() >= 1);
await goto('/achievements');
check('成就墙可渲染', await page.locator('.gx-ach-card').count() >= 10);
await goto('/errors');
check('/errors 跳错题本', page.url().includes('/moxie/errors'));

console.log('\n=== 8. 移动端布局 ===');
const mobile = await context.newPage();
await mobile.setViewportSize({ width: 375, height: 812 });
for (const [hash, label] of [
  ['', '首页'],
  ['/articles/jc-yueyanglouji/learn', '学习'],
  ['/articles/jc-yueyanglouji/appreciate', '鉴赏'],
  ['/articles/jc-yueyanglouji/exam', '考点'],
  ['/articles/jc-yueyanglouji/notes', '注释'],
  ['/moxie', '默写列表'],
]) {
  await mobile.goto(`${BASE.replace(/\/$/, '')}${hash}`, { waitUntil: 'networkidle' });
  await mobile.waitForTimeout(400);
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  check(`移动端${label}无横向滚动`, !overflow);
}
await mobile.goto(`${BASE.replace(/\/$/, '')}/articles/jc-yueyanglouji/learn`, { waitUntil: 'networkidle' });
await mobile.waitForTimeout(400);
check('移动端五标签可访问', await mobile.locator('.workspace-tabs a').count() === 5);
await mobile.close();

console.log('\n=== 9. JavaScript 错误 ===');
const realErrors = errors.filter((error) => !error.includes('favicon') && !error.includes('net::ERR') && !error.includes('localStorage'));
check('全程无控制台或页面错误', realErrors.length === 0, realErrors.join(' | '));

console.log(`\n===== 结果: ${passed} 通过 / ${failed} 失败 =====`);
await browser.close();
process.exit(failed ? 1 : 0);
