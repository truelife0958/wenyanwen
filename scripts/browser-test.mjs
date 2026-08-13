#!/usr/bin/env node
/** 浏览器回归测试 (匹配当前地图首页 + 五标签工作区 UI)。
 *  覆盖: 闯关地图首页(画布/节点/路径/TabBar) → 篇目五标签(历练/鉴赏/考点/注释/默诵)
 *  → 默诵模块 → 失误回炉 → 旧路由 → 移动端无溢出。
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

console.log('=== 1. 闯关地图首页 ===');
check('标题正确', (await page.title()).includes('文言文'));
check('头部统计动态', /\d+ 篇篇章 · \d+ 篇默诵/.test(await page.locator('.app-header-info').textContent()));
check('地图世界渲染', await page.locator('.gx-world-col').count() >= 3);
check('世界导航条', await page.locator('.gx-nav-btn').count() >= 6);
check('横向滚动容器', await page.locator('.gx-map-h').count() === 1);
check('玩家旗帜定位', await page.locator('.gx-player-token').count() === 1);
check('关卡节点渲染', await page.locator('.gx-node-wrap').count() >= 100);
check('金色路径渲染', await page.locator('.gx-svg path').count() >= 6);
check('路径流动光效', await page.locator('.gx-path-flow').count() >= 6);
check('地图头部标题', (await page.locator('.gx-ach-head h2').textContent()).includes('闯关地图'));
check('成就入口', await page.locator('.gx-cta:has-text("成就")').count() === 1);
check('已移除篇目列表', await page.locator('.article-card').count() === 0);
check('已移除今日历练', await page.locator('.today-title').count() === 0);
check('已移除搜索框', await page.locator('.home-search-box').count() === 0);
check('已移除推荐卡', await page.locator('.rec-card').count() === 0);
check('TabBar 两 tab', await page.locator('.tab-bar .tab-item').count() === 2);
const tabTexts = await page.locator('.tab-bar .tab-item span').allTextContents();
check('TabBar 地图/成就', JSON.stringify(tabTexts) === JSON.stringify(['地图', '成就']));
// 地图点击未通关关卡 → 历练 tab (分流)
await page.locator('.gx-node.playable').first().click();
await page.waitForTimeout(900);
check('地图进历练tab', page.url().includes('/articles/') && page.url().endsWith('/learn'));
check('动画讲解入口', await page.locator('.lec-start').count() === 1);
// 讲解模式: 逐句/译文/控制条 (观沧海通用断言)
await page.locator('.lec-start').click();
await page.waitForTimeout(600);
check('讲解模式打开', await page.locator('.lec-overlay').count() === 1);
check('逐句列表', await page.locator('.lec-sentence').count() > 5);
check('当前句高亮', await page.locator('.lec-sentence.active').count() === 1);
check('译文显示', (await page.locator('.lec-trans-text').textContent()).length > 0);
check('控制条', await page.locator('.lec-controls .lec-btn').count() >= 3);
await page.locator('.lec-close').click();
await page.waitForTimeout(300);
check('关闭讲解', await page.locator('.lec-overlay').count() === 0);

console.log('\n=== 2. 篇目工作区(历练) ===');
await goto('/articles/jc-yueyanglouji/learn');
await page.waitForTimeout(700);
check('进入稳定路由', page.url().includes('/articles/jc-yueyanglouji/learn'));
check('篇目标题', (await page.locator('.page-header .page-title').textContent()).includes('岳阳楼记'));
check('五个历练标签', await page.locator('.workspace-tabs a').count() === 5);
check('历练标签激活', (await page.locator('.workspace-tabs a.active').textContent()) === '历练');
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
check('诵读引导弹窗', await page.locator('.recite-guide').count() === 1);
await page.locator('.rg-close').click();

// 讲解模式内容卡 (岳阳楼记: 有词义题/背诵句/鉴赏/练习)
await page.locator('.lec-start').click();
await page.waitForTimeout(700);
check('重点字词卡', await page.locator('.ink-word-card').count() > 0);
check('重点句卡', await page.locator('.ink-key-card').count() > 0);
check('鉴赏卡', await page.locator('.ink-analysis-card').count() > 0);
check('随堂练习卡', await page.locator('.ink-practice-card').count() === 1);
await page.locator('.ink-practice-card').click();
await page.waitForTimeout(400);
const pInputs = await page.locator('.ink-p-input').count();
check('练习输入框', pInputs > 0, `${pInputs} 个`);
if (pInputs > 0) {
  await page.locator('.ink-p-input').first().fill('错答占位');
  await page.locator('.ink-p-check').first().click();
  await page.waitForTimeout(400);
  check('练习判分展示', await page.locator('.ink-p-result').count() > 0);
}
await page.locator('.lec-close').click();
await page.waitForTimeout(300);
check('关闭讲解', await page.locator('.lec-overlay').count() === 0);

console.log('\n=== 3. 鉴赏/考点/注释/默诵 四标签 ===');
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
await page.locator('.workspace-tabs a:has-text("默诵")').click();
await page.waitForTimeout(500);
check('默诵路由', page.url().includes('/articles/') && page.url().includes('/moxie'));
check('默诵训练内嵌', await page.locator('.moxie-trainer').count() === 1);

console.log('\n=== 4. 默诵模块 (关卡页内嵌做题) ===');
check('题型 tab >= 4', await page.locator('.workspace-tabs button').count() >= 4);
check('题卡加载', await page.locator('.moxie-q').count() > 0);
const blanks = await page.locator('.moxie-blank-input').count();
check('输入横线渲染', blanks >= 1, `输入框 ${blanks} 个`);
for (let i = 0; i < blanks; i++) await page.locator('.moxie-blank-input').nth(i).fill('答错占位');
await page.locator('.mq-reveal').first().click();
await page.waitForTimeout(300);
check('自动判分展示', await page.locator('.mq-check-result.bad').count() >= 1);
check('答错状态', await page.locator('.moxie-q.bad').count() >= 1);

console.log('\n=== 5. 失误回炉 ===');
await goto('/moxie/errors');
check('回炉页渲染', await page.locator('.moxie-err-group, .empty-state').count() >= 1);
const errCount = await page.evaluate(() => (JSON.parse(localStorage.getItem('wyw_errorbook_v2') || '[]')).length);
if (errCount > 0) {
  check('失误分组显示', await page.locator('.meg-item').count() > 0);
  const before = await page.evaluate(() => (JSON.parse(localStorage.getItem('wyw_errorbook_v2') || '[]')).length);
  await page.locator('.meg-remove').first().click();
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => (JSON.parse(localStorage.getItem('wyw_errorbook_v2') || '[]')).length);
  check('移除失误', after < before, `${before} → ${after}`);
} else {
  check('失误分组显示(空态)', await page.locator('.empty-state').count() === 1);
}

console.log('\n=== 6. 默诵列表 ===');
await goto('/moxie');
check('默诵篇目卡', await page.locator('.moxie-card').count() >= 10);
check('年级 tab', await page.locator('.grade-tab').count() >= 3);
check('统计区', await page.locator('.moxie-stats .moxie-stat').count() === 4);

console.log('\n=== 7. 旧路由与深链 ===');
await goto('/map');
check('/map 重定向首页', page.url().endsWith('/'));
check('首页地图渲染', await page.locator('.gx-world-col').count() >= 1);
await goto('/learning/' + encodeURIComponent('岳阳楼记'));
check('旧历练链接跳转', page.url().includes('/articles/jc-yueyanglouji/learn'));
await goto('/moxie/' + encodeURIComponent('moxie-岳阳楼记'));
check('/moxie/:id 重定向关卡页', page.url().includes('/articles/jc-yueyanglouji/moxie'));
await goto('/review');
check('/review 回首页', page.url().endsWith('/') || page.url().includes('/articles') === false && page.url().includes('/moxie') === false);
await goto('/cards');
check('/cards 回首页', !page.url().includes('/cards'));
await goto('/achievements');
check('成就墙可渲染', await page.locator('.gx-ach-card').count() >= 10);
await goto('/errors');
check('/errors 跳失误回炉', page.url().includes('/moxie/errors'));

console.log('\n=== 8. 移动端布局 ===');
const mobile = await context.newPage();
await mobile.setViewportSize({ width: 375, height: 812 });
for (const [hash, label] of [
  ['', '地图首页'],
  ['/articles/jc-yueyanglouji/learn', '历练'],
  ['/articles/jc-yueyanglouji/appreciate', '鉴赏'],
  ['/articles/jc-yueyanglouji/exam', '考点'],
  ['/articles/jc-yueyanglouji/notes', '注释'],
  ['/moxie', '默诵列表'],
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
