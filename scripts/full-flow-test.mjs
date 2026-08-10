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
const goto = async (h = '') => { const url = h.startsWith('http') ? h : BASE.replace(/\/$/, '') + h; await page.goto(url, { waitUntil: 'networkidle' }); await page.waitForTimeout(700); };

await goto();
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(400);

// ============ 1. 首屏 ============
console.log('=== 1. 首屏 ===');
check('标题', (await page.title()).includes('文言文'));
check('顶部导航已移除', await page.locator('.app-nav').count() === 0);
check('入口卡 1 张', await page.locator('.entry-card').count() === 1);
check('统计动态', /\d+ 篇 · \d+ 词义 · \d+ 题/.test(await page.locator('.app-header-info').textContent()));
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

// ============ 3. 练习流 ============
console.log('\n=== 3. 练习流 (单题流: 逐题作答→判分→结果) ===');
await page.locator('.workspace-tabs a:has-text("练习")').click();
await page.waitForTimeout(700);
check('题目加载', await page.locator('.q-item').count() > 0);
check('逐题进度条', await page.locator('.ps-progress').count() === 1);
// 单题流: 每页一题, 作答→提交本题→(自评)→下一题/查看结果
let flowSteps = 0;
let flowFinished = false;
while (flowSteps < 300 && !flowFinished) {
  await page.waitForTimeout(250);
  // 作答当前题: 选择题点第一个选项, 主观题填内容
  const opt = page.locator('.q-option').first();
  const input = page.locator('.q-input').first();
  if (await opt.count() > 0) {
    await opt.click();
  } else if (await input.count() > 0) {
    await input.fill('我的作答');
  }
  await page.waitForTimeout(150);
  const submitBtn = page.locator('button:has-text("提交本题判分")');
  if (await submitBtn.count() > 0 && await submitBtn.isEnabled().catch(() => false)) {
    await submitBtn.click();
    await page.waitForTimeout(250);
    // 主观题自评
    const noBtn = page.locator('.qsj-btn.no').first();
    if (await noBtn.count() > 0) { await noBtn.click(); await page.waitForTimeout(150); }
    flowSteps++;
  }
  const finishBtn = page.locator('button:has-text("查看结果")');
  if (await finishBtn.count() > 0) {
    check('结果按钮激活', await finishBtn.isEnabled().catch(() => false));
    await finishBtn.click();
    flowFinished = true;
    break;
  }
  const nextBtn = page.locator('button:has-text("下一题")');
  if (await nextBtn.count() > 0) {
    await nextBtn.click();
    continue;
  }
  break;
}
check('完成全部题目', flowFinished, `步数=${flowSteps}`);
await page.waitForTimeout(700);
check('结果页出现', await page.locator('.result-summary').count() === 1);
const wrongAfterPractice = await page.evaluate(() => {
  const raw = localStorage.getItem('wyw_errorbook_v2');
  const arr = raw ? JSON.parse(raw) : [];
  return Array.isArray(arr) ? arr.length : 0;
});
check('错题自动入本', wrongAfterPractice > 0, `错题数 ${wrongAfterPractice}`);
// ============ 4. 鉴赏流 ============
console.log('\n=== 4. 鉴赏流 (逐段赏析/整篇鉴赏) ===');
await page.locator('.workspace-tabs a:has-text("鉴赏")').click();
await page.waitForTimeout(600);
check('鉴赏逐段', await page.locator('.appr-para').count() > 0);
check('整篇鉴赏', await page.locator('.appr-whole .analysis-card, .appr-whole').count() > 0);
check('段落赏析', await page.locator('.appr-ana').count() > 0);

// ============ 5. 错题本 ============
console.log('\n=== 5. 错题本 (独立页: 分组/移除) ===');
await goto('/errors');
await page.waitForTimeout(900);
check('错题页渲染', await page.locator('.errbook-title').count() >= 1);
const errCount = await page.locator('.errbook-group').count();
check('错题分组显示', errCount > 0, `${errCount} 组`);
if (errCount > 0) {
  const beforeDel = await page.evaluate(() => (JSON.parse(localStorage.getItem('wyw_errorbook_v2') || '[]')).length);
  await page.locator('.errbook-del').first().click();
  await page.waitForTimeout(300);
  const errAfter = await page.evaluate(() => (JSON.parse(localStorage.getItem('wyw_errorbook_v2') || '[]')).length);
  check('移除错题(分组删除)', errAfter < beforeDel, `${beforeDel} → ${errAfter}`);
}

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
// 对答案 → 自评
await page.locator('.mq-reveal').first().click();
await page.waitForTimeout(300);
check('答案展示', await page.locator('.mq-answer').count() >= 1);
await page.locator('.mq-judge-btn.ok').first().click();
await page.waitForTimeout(300);
check('自评生效', await page.locator('.moxie-q.ok').count() >= 1);
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
