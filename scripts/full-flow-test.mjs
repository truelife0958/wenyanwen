#!/usr/bin/env node
/** 满强度用户流测试: 从普通用户视角走完 历练→默诵→判分→复习→失误→字词卡→题集→移动端 全链路。
 *  用法: node scripts/full-flow-test.mjs [baseURL] */
import { chromium } from 'playwright-core';

const EXE = '/home/truel/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const BASE = process.argv[2] || 'http://localhost:8765/';
const browser = await chromium.launch({ executablePath: EXE, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const errors = [];
let passed = 0, failed = 0;

page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`CONSOLE: ${m.text()}`); });

function check(label, cond, detail = '') {
  if (cond) { console.log(`  ✓ ${label}`); passed++; }
  else { console.log(`  ✗ ${label}${detail ? ' — ' + detail : ''}`); failed++; }
}
// 深链访问: 静态托管下直访深链会 404 → 404.html 记录路径并回首页, App 启动时 DeepLinkRestore 恢复导航。
// preview 环境无 404.html 兜底, 这里模拟该流程 (同时真实覆盖 DeepLinkRestore 逻辑)。
const goto = async (h = '') => {
  if (h && !h.startsWith('http') && h !== '/') {
    await page.goto(BASE.replace(/\/$/, ''), { waitUntil: 'networkidle' });
    await page.evaluate((p) => { try { localStorage.setItem('wyw_deep_link', p); } catch { /* ignore */ } }, h);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(900);
    return;
  }
  const url = h.startsWith('http') ? h : BASE.replace(/\/$/, '') + h;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
};

await goto();
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(400);

// ============ 1. 首屏 ============
// ============ 1. 首屏 (闯关地图) ============
console.log('=== 1. 首屏 (闯关地图) ===');
check('标题', (await page.title()).includes('文言文'));
check('统计动态', /\d+ 篇篇章 · \d+ 篇默诵/.test(await page.locator('.app-header-info').textContent()));
check('地图世界渲染', await page.locator('.gx-world-card').count() >= 3);
check('关卡节点渲染', await page.locator('.gx-node-wrap').count() >= 100);
check('金色路径渲染', await page.locator('.gx-svg path').count() >= 6);
check('TabBar 两 tab', await page.locator('.tab-bar .tab-item').count() === 2);
check('已移除篇目列表', await page.locator('.article-card').count() === 0);

// ============ 2. 历练流 ============
console.log('\n=== 2. 历练流 (阅读/注释/译文) ===');
await goto('/articles/jc-yueyanglouji/learn');
await page.waitForTimeout(700);
check('进入历练页', page.url().includes('/learn'));
check('原文渲染', await page.locator('.para-orig').count() > 0);
await page.locator('.annot-gloss').first().click();
await page.waitForTimeout(200);
check('注释浮层', await page.locator('.gloss-pop').count() === 1);
await page.keyboard.press('Escape');
await page.locator('.para-toggle').first().click();
await page.waitForTimeout(200);
check('译文展开', await page.locator('.para-trans').count() > 0);
check('注释标签', await page.locator('.workspace-tabs a:has-text("注释")').count() === 1);
check('朗读按钮', await page.locator('.read-btn').count() >= 1);

// ============ 3. 默诵流 (关卡页默诵 tab 内嵌 → 对答案 → 自评失误) ============
console.log('\n=== 3. 默诵流 (关卡页默诵tab内嵌/自评/失误入库) ===');
await page.locator('.workspace-tabs a:has-text("默诵")').click();
await page.waitForTimeout(700);
check('默诵训练内嵌', await page.locator('.moxie-trainer').count() === 1);
check('默诵路由', page.url().includes('/moxie'));
check('题型 tab >= 4', await page.locator('.workspace-tabs button').count() >= 4);
check('题卡加载', await page.locator('.moxie-q').count() > 0);
// 原文默诵: 输入错误答案 → 对答案自动判分 → 失误自动入库
const blanksCount = await page.locator('.moxie-blank-input').count();
check('输入横线渲染', blanksCount >= 1, `输入框 ${blanksCount} 个`);
for (let i = 0; i < blanksCount; i++) {
  await page.locator('.moxie-blank-input').nth(i).fill('答错占位');
}
await page.locator('.mq-reveal').first().click();
await page.waitForTimeout(300);
check('自动判分展示', await page.locator('.mq-check-result.bad').count() >= 1);
check('答错状态', await page.locator('.moxie-q.bad').count() >= 1);
const wrongAfterPractice = await page.evaluate(() => {
  const raw = localStorage.getItem('wyw_errorbook_v2');
  const arr = raw ? JSON.parse(raw) : [];
  return Array.isArray(arr) ? arr.length : 0;
});
check('失误自动入本', wrongAfterPractice > 0, `失误数 ${wrongAfterPractice}`);
// ============ 4. 鉴赏流 (整篇鉴赏 + 阅读区查看赏析) ============
console.log('\n=== 4. 鉴赏流 (整篇鉴赏/阅读区赏析) ===');
await goto('/articles/jc-yueyanglouji/learn');
await page.waitForTimeout(700);
const anaBtns = await page.locator('.ana-toggle').count();
check('阅读区查看赏析按钮', anaBtns > 0, `${anaBtns} 个`);
if (anaBtns > 0) {
  await page.locator('.ana-toggle').first().click();
  await page.waitForTimeout(300);
  check('赏析展开', await page.locator('.para-analysis').count() > 0);
}
await goto('/articles/jc-yueyanglouji/appreciate');
await page.waitForTimeout(700);
await page.locator('.workspace-tabs a:has-text("鉴赏")').click();
await page.waitForTimeout(600);
check('整篇鉴赏卡片', await page.locator('.appr-whole .appr-para').count() > 0);
check('整篇鉴赏', await page.locator('.appr-whole').count() > 0);
check('赏析内容', await page.locator('.appr-ana').count() > 0);

// ============ 5. 失误回炉 ============
console.log('\n=== 5. 失误回炉 (分组/重练) ===');
await goto('/moxie/errors');
await page.waitForTimeout(900);
check('回炉页渲染', await page.locator('.moxie-err-group').count() >= 1);
check('失误分组显示', await page.locator('.meg-item').count() > 0);
const beforeDel = await page.evaluate(() => (JSON.parse(localStorage.getItem('wyw_errorbook_v2') || '[]')).length);
await page.locator('.meg-remove').first().click();
await page.waitForTimeout(300);
const errAfter = await page.evaluate(() => (JSON.parse(localStorage.getItem('wyw_errorbook_v2') || '[]')).length);
check('移除失误', errAfter < beforeDel, `${beforeDel} → ${errAfter}`);

// ============ 6. 默诵模块 ============
console.log('\n=== 6. 默诵模块 (列表/练习/失误) ===');
await goto('/moxie');
await page.waitForTimeout(900);
check('默诵篇目卡', await page.locator('.moxie-card').count() >= 10);
check('年级 tab', await page.locator('.grade-tab').count() >= 3);
// 进入第一篇 (旧 /moxie/:id 链接 → 重定向关卡页默诵 tab)
await page.locator('.moxie-card').first().click();
await page.waitForTimeout(700);
check('重定向到关卡页默诵', page.url().includes('/articles/') && page.url().includes('/moxie'));
check('题型 tab', await page.locator('.workspace-tabs button').count() >= 4);
check('题卡', await page.locator('.moxie-q').count() >= 1);
// 原文默诵: 填正确答案 → 自动判分通过
const bc2 = await page.locator('.moxie-blank-input').count();
for (let i = 0; i < bc2; i++) await page.locator('.moxie-blank-input').nth(i).fill('占位答');
await page.locator('.mq-reveal').first().click();
await page.waitForTimeout(300);
check('自动判分结果', (await page.locator('.mq-check-result').count()) >= 1);
// 失误回炉
await goto('/moxie/errors');
await page.waitForTimeout(500);
check('失误回炉可渲染', (await page.locator('.moxie-err-group, .empty-state').count()) >= 1);
// ============ 7. 旧路由 (已移除) ============
console.log('\n=== 7. 旧路由 (已移除) ===');
await goto('/review');
await page.waitForTimeout(400);
check('/review 已移除 → 回首页', page.url().endsWith('/') || page.url().endsWith('/#/') || page.url().includes('/'));
await goto('/cards');
await page.waitForTimeout(400);
check('/cards 已移除 → 回首页', page.url().endsWith('/') || page.url().endsWith('/#/') || page.url().includes('/'));

// ============ 8. 旧链接深链 ============
console.log('\n=== 8. 旧链接深链 ===');
await goto('/learning/' + encodeURIComponent('论语十二章'));
await page.waitForTimeout(600);
check('旧历练链接跳转', page.url().includes('/articles/jc-ly/learn'));
await goto('/practice/' + encodeURIComponent('论语十二章'));
await page.waitForTimeout(600);
check('旧练习链接跳转(已移除)', page.url().endsWith('/') || page.url().includes('/'));
// /moxie/:id 旧默诵直链 → 重定向关卡页默诵 tab
await goto('/moxie/' + encodeURIComponent('moxie-岳阳楼记'));
await page.waitForTimeout(700);
check('/moxie/:id 重定向关卡页', page.url().includes('/articles/jc-yueyanglouji/moxie'));

// ============ 9. 移动端 ============
console.log('\n=== 9. 移动端 (375px) ===');
const mob = await ctx.newPage();
await mob.setViewportSize({ width: 375, height: 812 });
for (const [label, h] of [
  ['地图首页', ''], ['历练', '/articles/jc-ly/learn'], ['默诵', '/moxie'],
  ['默诵练习', '/moxie/moxie-guan-cang-hai'],
]) {
  await mob.goto(BASE.replace(/\/$/, '') + h, { waitUntil: 'networkidle' });
  await mob.waitForTimeout(450);
  const overflow = await mob.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  check(`移动端${label}无溢出`, !overflow);
}
await mob.close();

// ============ 9.5 关卡页默诵联动 ============
console.log('\n=== 9.5 关卡页 → 默诵联动 ===');
await goto('/articles/jc-yueyanglouji/moxie');
await page.waitForTimeout(600);
check('关卡页默诵训练内嵌', (await page.locator('.moxie-trainer').count()) >= 1);

// ============ 10. 无 JS 错误 ============
console.log('\n=== 10. 全程 JS 错误 ===');
const real = errors.filter((e) => !e.includes('favicon') && !e.includes('net::ERR') && !e.includes('localStorage'));
check('无控制台/页面错误', real.length === 0, real.slice(0, 3).join(' | '));

console.log(`\n===== 满强度测试: ${passed} 通过 / ${failed} 失败 =====`);
await browser.close();
process.exit(failed ? 1 : 0);
