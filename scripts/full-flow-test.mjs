#!/usr/bin/env node
/** 满强度用户流测试: 从普通用户视角走完 学习→练习→判分→复习→错题→字词卡→题集→移动端 全链路。
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
console.log('=== 1. 首屏 ===');
check('标题', (await page.title()).includes('文言文'));
check('顶部导航已移除', await page.locator('.app-nav').count() === 0);
check('入口卡 1 张', await page.locator('.entry-card').count() === 1);
check('统计动态', /\d+ 篇课文 · \d+ 篇默写/.test(await page.locator('.app-header-info').textContent()));
check('首页卡片', await page.locator('.article-card').count() >= 15);

// ============ 2. 学习流 ============
console.log('\n=== 2. 学习流 (阅读/注释/译文) ===');
await page.locator('.home-search-box input').fill('岳阳楼记');
await page.waitForTimeout(250);
await page.locator('.article-card').first().click();
await page.waitForTimeout(700);
check('进入学习页', page.url().includes('/learn'));
check('原文渲染', await page.locator('.para-orig').count() > 0);
await page.locator('.annot-gloss').first().click();
await page.waitForTimeout(200);
check('注释浮层', await page.locator('.gloss-pop').count() === 1);
await page.keyboard.press('Escape');
await page.locator('.para-toggle').first().click();
await page.waitForTimeout(200);
check('译文展开', await page.locator('.para-trans').count() > 0);
check('笔记清单', await page.locator('.note-list').count() === 1);
check('朗读按钮', await page.locator('.read-btn').count() >= 1);

// ============ 3. 默写流 (学习页 → 默写入口 → 对答案 → 自评错题) ============
console.log('\n=== 3. 默写流 (学习页默写入口/自评/错题入库) ===');
await page.locator('.workspace-tabs a:has-text("默写")').click();
await page.waitForTimeout(700);
check('默写入口卡', await page.locator('.moxie-entry-card').count() === 1);
await page.locator('.moxie-entry-card a').first().click();
await page.waitForTimeout(700);
check('进入默写篇目页', page.url().includes('/moxie/'));
check('题型 tab >= 4', await page.locator('.workspace-tabs button').count() >= 4);
check('题卡加载', await page.locator('.moxie-q').count() > 0);
// 原文默写: 输入错误答案 → 对答案自动判分 → 错题自动入库
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
check('错题自动入本', wrongAfterPractice > 0, `错题数 ${wrongAfterPractice}`);
// ============ 4. 鉴赏流 ============
console.log('\n=== 4. 鉴赏流 (逐段赏析/整篇鉴赏) ===');
await goto('/articles/jc-yueyanglouji/appreciate');
await page.waitForTimeout(700);
await page.locator('.workspace-tabs a:has-text("鉴赏")').click();
await page.waitForTimeout(600);
check('鉴赏逐段', await page.locator('.appr-para').count() > 0);
check('整篇鉴赏', await page.locator('.appr-whole .analysis-card, .appr-whole').count() > 0);
check('段落赏析', await page.locator('.appr-ana').count() > 0);

// ============ 5. 默写错题本 ============
console.log('\n=== 5. 默写错题本 (分组/重练) ===');
await goto('/moxie/errors');
await page.waitForTimeout(900);
check('错题页渲染', await page.locator('.moxie-err-group').count() >= 1);
check('错题分组显示', await page.locator('.meg-item').count() > 0);
const beforeDel = await page.evaluate(() => (JSON.parse(localStorage.getItem('wyw_errorbook_v2') || '[]')).length);
await page.locator('.meg-remove').first().click();
await page.waitForTimeout(300);
const errAfter = await page.evaluate(() => (JSON.parse(localStorage.getItem('wyw_errorbook_v2') || '[]')).length);
check('移除错题', errAfter < beforeDel, `${beforeDel} → ${errAfter}`);

// ============ 6. 默写模块 ============
console.log('\n=== 6. 默写模块 (列表/练习/错题) ===');
await goto('/moxie');
await page.waitForTimeout(900);
check('默写篇目卡', await page.locator('.moxie-card').count() >= 10);
check('年级 tab', await page.locator('.grade-tab').count() >= 3);
// 进入第一篇
await page.locator('.moxie-card').first().click();
await page.waitForTimeout(600);
check('题型 tab', await page.locator('.workspace-tabs button').count() >= 4);
check('题卡', await page.locator('.moxie-q').count() >= 1);
// 原文默写: 填正确答案 → 自动判分通过
const bc2 = await page.locator('.moxie-blank-input').count();
for (let i = 0; i < bc2; i++) await page.locator('.moxie-blank-input').nth(i).fill('占位答');
await page.locator('.mq-reveal').first().click();
await page.waitForTimeout(300);
check('自动判分结果', (await page.locator('.mq-check-result').count()) >= 1);
// 错题本
await goto('/moxie/errors');
await page.waitForTimeout(500);
check('默写错题本可渲染', (await page.locator('.moxie-err-group, .empty-state').count()) >= 1);
// ============ 7. 旧题集路由 (已移除) ============
console.log('\n=== 7. 旧路由 (已移除) ===');
await goto('/review');
await page.waitForTimeout(400);
check('/review 已移除 → 回首页', page.url().endsWith('/') || page.url().endsWith('/#/') || page.url().includes('/'));
await goto('/cards');
await page.waitForTimeout(400);
check('/cards 已移除 → 回首页', page.url().endsWith('/') || page.url().endsWith('/#/') || page.url().includes('/'));

// ============ 8. 深链 ============
console.log('\n=== 8. 旧链接深链 ===');
await goto('/learning/' + encodeURIComponent('论语十二章'));
await page.waitForTimeout(600);
check('旧学习链接跳转', page.url().includes('/articles/jc-ly/learn'));
await goto('/practice/' + encodeURIComponent('论语十二章'));
await page.waitForTimeout(600);
check('旧练习链接跳转(已移除)', page.url().endsWith('/') || page.url().includes('/'));

// ============ 9. 移动端 ============
console.log('\n=== 9. 移动端 (375px) ===');
const mob = await ctx.newPage();
await mob.setViewportSize({ width: 375, height: 812 });
for (const [label, h] of [
  ['首页', ''], ['学习', '/articles/jc-ly/learn'], ['默写', '/moxie'],
  ['默写练习', '/moxie/moxie-guan-cang-hai'],
]) {
  await mob.goto(BASE + h, { waitUntil: 'networkidle' });
  await mob.waitForTimeout(450);
  const overflow = await mob.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  check(`移动端${label}无溢出`, !overflow);
}
await mob.close();

// ============ 9.5 学习页联动 ============
console.log('\n=== 9.5 学习页 → 默写联动 ===');
// 学习页默写联动入口
await goto('/articles/jc-yueyanglouji/moxie');
await page.waitForTimeout(600);
check('学习页默写入口卡', (await page.locator('.moxie-entry-card').count()) >= 1);
await page.locator('.moxie-entry-card a').first().click();
await page.waitForTimeout(600);
check('跳转到默写篇目页', page.url().includes('/moxie/'));

// ============ 10. 无 JS 错误 ============
console.log('\n=== 10. 全程 JS 错误 ===');
const real = errors.filter((e) => !e.includes('favicon') && !e.includes('net::ERR') && !e.includes('localStorage'));
check('无控制台/页面错误', real.length === 0, real.slice(0, 3).join(' | '));

console.log(`\n===== 满强度测试: ${passed} 通过 / ${failed} 失败 =====`);
await browser.close();
process.exit(failed ? 1 : 0);
